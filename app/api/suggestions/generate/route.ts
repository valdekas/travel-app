import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createApiClient } from '@/lib/supabase/server'
import { SUGGESTION_CATEGORIES } from '@/lib/types'
import { searchTripAdvisorPlace } from '@/lib/utils/tripadvisor'

const CATEGORIES = SUGGESTION_CATEGORIES.map(c => c.key)

const CATEGORY_FOCUS: Record<string, string> = {
  Restaurants:      'Favor well-established local institutions and standout spots for the local cuisine. In a major city that means places known well beyond locals; in a small town, the best genuinely popular local restaurants are the right answer.',
  Attractions:      'Favor landmarks and must-see spots for this specific place — major monuments and sites in a big city, or the town\'s defining sight(s) in a smaller one. Only list places you are reasonably confident actually exist there.',
  Viewpoints:       'Favor scenic spots people actually go to for a view — a famous overlook in a big city, or simply the best vantage point available in a smaller town.',
  Museums:          'Favor the most notable cultural, art, or history institutions this place actually has. Many small towns have none worth listing — that\'s fine, list fewer or none.',
  Bars:             'Favor bars with real character and a solid local reputation — celebrated cocktail spots or hotel bars in a big city, or simply the town\'s best bar in a smaller one.',
  'Parks & Nature': 'Favor parks, gardens, waterfronts, or natural landmarks genuinely worth visiting here, at whatever scale exists locally.',
}

function buildPrompt(category: string, destination: string): string {
  const isFood = category === 'Restaurants' || category === 'Bars'
  const categoryFocus = CATEGORY_FOCUS[category] ?? ''
  return `You are a local travel expert. List the best ${category} actually in or immediately around ${destination} — real, currently-operating places you are confident exist.

- Prioritise well-established, genuinely popular places over new or obscure ones
- Stay within ${destination} itself, not other towns or day-trip destinations
- ${destination} may be a small place — that's fine. List the best options that genuinely exist there, even if that means fewer than 15, or a mix of everyday local spots rather than internationally famous ones
- Never invent a place, and never pad the list to hit a target count — a short, honest list beats a padded one
- If you cannot confidently name any real ${category} for ${destination}, return an empty JSON array \`[]\` — do not write an explanation, apology, or any text instead

${categoryFocus}

Return up to 15 places, fewer if that's all you can confidently support. Return ONLY a valid JSON array — no markdown, no code fences, no explanation, no text before or after the array.
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

// 'ok'    — at least one item generated
// 'empty' — model responded (possibly with `[]`, possibly with a refusal/malformed
//           reply) but no usable items came out of it — not a hard failure
// 'error' — the Anthropic request itself failed (network, auth, rate limit, etc.)
type GenerationStatus = 'ok' | 'empty' | 'error'

async function generateForCategory(
  anthropic: Anthropic,
  category: string,
  destination: string,
): Promise<{ items: ClaudeItem[]; status: GenerationStatus }> {
  let text: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: buildPrompt(category, destination) }],
    })
    text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  } catch (error) {
    console.error(`[Suggestions] API error generating ${category} for ${destination}:`, error)
    return { items: [], status: 'error' }
  }

  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(clean)
  } catch (error) {
    console.error(`[Suggestions] Failed to parse ${category} for ${destination}:`, error, '\nRaw output:', text)
    return { items: [], status: 'empty' }
  }

  const items = Array.isArray(parsed) ? parsed.slice(0, 15) : []
  return { items, status: items.length > 0 ? 'ok' : 'empty' }
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { supabase, user } = await createApiClient(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { tripId, city, country, duration } = await req.json()
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })

  // Verify trip belongs to this user. lat/lng/country come from here (not the
  // request body) so TripAdvisor enrichment is verified against the trip's
  // actual stored location, not whatever the client happened to send.
  const { data: trip } = await supabase
    .from('trips')
    .select('id, lat, lng, country')
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
  const categoryGenStatus: Record<string, GenerationStatus> = {}

  missingCategories.forEach((cat, idx) => {
    const { items, status } = results[idx]
    generatedCounts[cat] = items.length
    categoryGenStatus[cat] = status
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

  // A category only reads as "ok" once it has a suggestion that survives the
  // client's display filter (photo + rating) — that's the bar users actually
  // see against. Short of that it's 'no_results' (we tried, found nothing
  // verifiable) unless the Claude request itself hard-failed ('error').
  function buildCategoriesReport(enriched: EnrichedRow[]) {
    const report: Record<string, { status: 'ok' | 'no_results' | 'error'; count: number }> = {}
    for (const cat of missingCategories) {
      const visibleCount = enriched.filter(r => r.category === cat && r.photo_url && r.rating != null).length
      report[cat] = {
        status: visibleCount > 0 ? 'ok' : categoryGenStatus[cat] === 'error' ? 'error' : 'no_results',
        count:  visibleCount,
      }
    }
    return report
  }

  if (baseRows.length === 0) {
    const categories = buildCategoriesReport([])
    const overallStatus = Object.values(categoryGenStatus).every(s => s === 'error') ? 'error' : 'no_results'
    return NextResponse.json({ success: false, count: 0, status: overallStatus, categories })
  }

  const enrichedRows: EnrichedRow[] = []
  for (const row of baseRows) {
    await delay(100)
    const ta = await searchTripAdvisorPlace({
      name:     row.name,
      city:     city ?? '',
      country:  trip.country ?? country ?? '',
      category: row.category,
      tripLat:  trip.lat ?? null,
      tripLng:  trip.lng ?? null,
    })
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

  const categories = buildCategoriesReport(enrichedRows)
  const statuses = Object.values(categories).map(c => c.status)
  const overallStatus =
    statuses.every(s => s === 'ok')       ? 'complete' :
    statuses.some(s => s === 'ok')        ? 'partial'  :
    statuses.every(s => s === 'error')    ? 'error'    :
    'no_results'

  return NextResponse.json({
    success:     true,
    count:       enrichedRows.length,
    regenerated: missingCategories,
    status:      overallStatus,
    categories,
  })
}
