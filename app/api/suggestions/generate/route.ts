import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SUGGESTION_CATEGORIES } from '@/lib/types'

const CATEGORIES = SUGGESTION_CATEGORIES.map(c => c.key)

function buildPrompt(category: string, destination: string): string {
  const isFood = category === 'Restaurants' || category === 'Bars'
  return `You are a travel expert. List exactly 5 of the best ${category} in ${destination}.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.
Each item must have exactly these fields:
- name: string (specific, real place name)
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
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(category, destination) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')
    const items = JSON.parse(clean)
    return Array.isArray(items) ? items.slice(0, 5) : []
  } catch {
    return []
  }
}

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

  // Skip if suggestions already exist for this trip
  const { count } = await supabase
    .from('trip_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
  if (count && count > 0) {
    return NextResponse.json({ success: true, count, cached: true })
  }

  const destination = city ? `${city}, ${country}` : country
  const durationNote = duration ? ` (${duration}-day trip)` : ''
  const fullDestination = `${destination}${durationNote}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Generate all 6 categories in parallel
  const results = await Promise.all(
    CATEGORIES.map(cat => generateForCategory(anthropic, cat, fullDestination))
  )

  // Build rows for insert
  const rows: {
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
  }[] = []

  CATEGORIES.forEach((cat, idx) => {
    for (const item of results[idx]) {
      if (!item.name) continue
      rows.push({
        trip_id:           tripId,
        user_id:           user.id,
        category:          cat,
        name:              item.name,
        description:       item.description ?? null,
        why_visit:         item.whyVisit ?? null,
        price_range:       item.priceRange ?? null,
        best_time_to_visit:item.bestTimeToVisit ?? null,
        must_try:          item.mustTry ?? null,
        tip:               item.tip ?? null,
        emoji:             item.emoji ?? null,
      })
    }
  })

  if (rows.length === 0) {
    return NextResponse.json({ success: false, count: 0 })
  }

  const { error } = await supabase.from('trip_suggestions').insert(rows)
  if (error) {
    console.error('[/api/suggestions/generate] insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: rows.length })
}
