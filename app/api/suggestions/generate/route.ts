import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SUGGESTION_CATEGORIES } from '@/lib/types'
import { searchTripAdvisorPlace } from '@/lib/utils/tripadvisor'

const CATEGORIES = SUGGESTION_CATEGORIES.map(c => c.key)

const CATEGORY_FOCUS: Record<string, string> = {
  Restaurants:      'Include a mix of iconic local institutions, Michelin-recommended or Michelin-listed spots, and neighborhood favorites with thousands of reviews. Prioritise places that appear in Time Out, Condé Nast Traveler, or Lonely Planet food guides for this city.',
  Attractions:      'Include UNESCO World Heritage sites, major landmarks, and must-see spots that appear in every travel guide for this city. Prioritise places with the highest visitor numbers and review counts.',
  Viewpoints:       'Include panoramic spots featured heavily in travel photography, Instagram, and city guide "best views" lists. These should be well-signposted, accessible locations known to most tourists.',
  Museums:          'Include the most visited and renowned cultural, art, and history institutions. Prioritise places with permanent world-class collections that draw international visitors.',
  Bars:             'Focus on hotel rooftop bars, well-known cocktail lounges, celebrated hotel bars, and bars that appear in major city guides like Time Out and Condé Nast. Include a mix of upscale hotel bars, iconic venues with a long history, and rooftop bars with strong review counts — avoid overly niche or underground venues that may not be indexed in major travel databases.',
  'Parks & Nature': 'Include the most famous parks, botanical gardens, waterfronts, and natural landmarks that are go-to recreational spots for both locals and tourists. Prioritise places with high foot traffic and many reviews.',
}

function buildPrompt(category: string, destination: string): string {
  const isFood = category === 'Restaurants' || category === 'Bars'
  const categoryFocus = CATEGORY_FOCUS[category] ?? ''
  return `You are a travel expert. Suggest exactly 15 ${category} in ${destination} that are:
- Well-known and established (not new, obscure, or recently opened)
- Highly rated and frequently reviewed on TripAdvisor, Google Maps, and major travel platforms
- Actually located in the city itself (not nearby towns, suburbs, or day-trip destinations)
- Popular among both locals and tourists, with a strong and consistent reputation
- Likely to appear in major travel guides (Lonely Planet, Michelin, Time Out, Condé Nast Traveler)

${categoryFocus}

Focus on places with thousands of reviews and a strong online presence — these are the places travelers actually visit, photograph, and write about. Avoid small, niche, or hard-to-find venues that are unlikely to appear in travel databases.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.
Each item must have exactly these fields:
- name: string (exact, well-known place name as it appears on TripAdvisor/Google Maps)
- emoji: string (one relevant emoji)
- description: string (1–2 sentences about what it is)
- whyVisit: string (one compelling sentence tourists love)
- priceRange: string (exactly one of: "Free", "$", "$$", "$$$", "$$$$")
- bestTimeToVisit: string (e.g. "Morning", "Evening", "Weekends", "Year-round")
- mustTry: ${isFood ? 'string (the single most iconic dish or drink)' : 'null'}
- tip: string (one practical insider tip)

Example:
[{"name":"Example Place","emoji":"🍕","description":"A beloved spot known for its exceptional food.","whyVisit":"Locals consider it unmissable.","priceRange":"$$","bestTimeToVisit":"Evening","mustTry":${isFood ? '"Signature dish name"' : 'null'},"tip":"Book ahead on weekends."}]`
}

interface ClaudeItem {
  name: string
  emoji?: string
  description?: string
  whyVisit?: string
  priceRange?: string
  bestTimeToVisit?: string
  mustTry?: string | null
  tip?: string
}

async function generateForCategory(
  anthropic: Anthropic,
  category: string,
  destination: string,
): Promise<ClaudeItem[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: buildPrompt(category, destination) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')
    const items = JSON.parse(clean)
    return Array.isArray(items) ? items.slice(0, 15) : []
  } catch (error) {
    console.error(`[Suggestions] Failed to generate ${category} for ${destination}:`, error)
    return []
  }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { tripId, city, country, duration } = await req.json()
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })

  // Verify trip belongs to this user
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // FIX 2: Check per-category — only regenerate categories that are missing entirely
  const { data: existingRows } = await supabase
    .from('trip_suggestions')
    .select('category')
    .eq('trip_id', tripId)

  const existingCategories = new Set((existingRows ?? []).map((r: { category: string }) => r.category))
  const missingCategories = CATEGORIES.filter(cat => !existingCategories.has(cat))

  if (missingCategories.length === 0) {
    return NextResponse.json({ success: true, cached: true })
  }

  console.log(`[Suggestions] Trip ${tripId} — generating missing categories:`, missingCategories)

  const destination = city ? `${city}, ${country}` : country
  const durationNote = duration ? ` (${duration}-day trip)` : ''
  const fullDestination = `${destination}${durationNote}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Step 1: Generate only missing categories in parallel via Claude
  const results = await Promise.all(
    missingCategories.map(cat => generateForCategory(anthropic, cat, fullDestination))
  )

  // Step 2: Flatten into base rows, track generated counts per category
  type BaseRow = {
    trip_id: string
    user_id: string
    category: string
    name: string
    description: string | null
    why_visit: string | null
    price_range: string | null
    best_time_to_visit: string | null
    must_try: string | null
    tip: string | null
    emoji: string | null
  }

  const baseRows: BaseRow[] = []
  const generatedCounts: Record<string, number> = {}

  missingCategories.forEach((cat, idx) => {
    const items = results[idx]
    generatedCounts[cat] = items.length
    for (const item of items) {
      if (!item.name) continue
      baseRows.push({
        trip_id:            tripId,
        user_id:            user.id,
        category:           cat,
        name:               item.name,
        description:        item.description ?? null,
        why_visit:          item.whyVisit ?? null,
        price_range:        item.priceRange ?? null,
        best_time_to_visit: item.bestTimeToVisit ?? null,
        must_try:           item.mustTry ?? null,
        tip:                item.tip ?? null,
        emoji:              item.emoji ?? null,
      })
    }
  })

  if (baseRows.length === 0) {
    return NextResponse.json({ success: false, count: 0 })
  }

  // Step 3: Enrich sequentially with 100 ms delay to respect TripAdvisor rate limits
  type EnrichedRow = BaseRow & {
    ta_location_id: string | null
    address: string | null
    lat: number | null
    lng: number | null
    rating: number | null
    reviews_count: number | null
    photo_url: string | null
    google_maps_url: string | null
    website: string | null
    phone: string | null
    price_level: string | null
  }

  const enrichedRows: EnrichedRow[] = []
  for (const row of baseRows) {
    await delay(100)
    const ta = await searchTripAdvisorPlace(row.name, city ?? '', country ?? '')
    enrichedRows.push({
      ...row,
      ta_location_id: ta?.ta_location_id ?? null,
      address:        ta?.address        ?? null,
      lat:            ta?.lat            ?? null,
      lng:            ta?.lng            ?? null,
      rating:         ta?.rating         ?? null,
      reviews_count:  ta?.reviews_count  ?? null,
      photo_url:      ta?.photo_url      ?? null,
      google_maps_url:ta?.google_maps_url ?? null,
      website:        ta?.website        ?? null,
      phone:          ta?.phone          ?? null,
      price_level:    ta?.price_level    ?? null,
    })
  }

  // Log per-category generation + enrichment stats
  for (const cat of missingCategories) {
    const catRows = enrichedRows.filter(r => r.category === cat)
    const withPhoto = catRows.filter(r => r.photo_url).length
    console.log(`[Suggestions] ${cat}: generated ${generatedCounts[cat]} items, enriched ${withPhoto} with TA data`)
  }

  const { error } = await supabase.from('trip_suggestions').insert(enrichedRows)
  if (error) {
    console.error('[/api/suggestions/generate] insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: enrichedRows.length, regenerated: missingCategories })
}
