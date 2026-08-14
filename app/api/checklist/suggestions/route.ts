import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const { city, country, duration, startDate, tripTypes, existingItems } = await req.json() as {
    city:          string
    country:       string
    duration:      number
    startDate:     string
    tripTypes:     string[]
    existingItems: string[]
  }

  const anthropic = new Anthropic()

  const activityDesc = tripTypes.length > 0
    ? tripTypes.join(', ')
    : 'general sightseeing'

  const existingDesc = existingItems.length > 0
    ? existingItems.slice(0, 40).join(', ')
    : 'none'

  const prompt = `You are a travel packing expert. Generate a comprehensive packing list for a ${duration}-day trip to ${city || country}, ${country}.

Consider:
- Climate and weather for ${startDate || 'the trip dates'} in ${country}
- Trip duration (${duration} days)
- Activities planned: ${activityDesc}
- Do NOT include these already-packed items: ${existingDesc}

Return ONLY a valid JSON array with exactly this structure:
[
  {
    "name": "item name (concise, e.g. Sunscreen SPF 50)",
    "category": "documents or packing or custom",
    "priority": "essential or recommended or optional",
    "reason": "one short sentence why this is needed for this specific trip"
  }
]

Rules:
- category must be exactly one of: documents, packing, custom
- priority must be exactly one of: essential, recommended, optional
- Group essentials first
- Return 30-40 items covering: documents, clothing, toiletries, electronics, health/medications, money/cards, destination-specific items
- "documents" category: passport, visas, insurance, bookings
- "packing" category: clothing, toiletries, electronics, health items
- "custom" category: destination-specific or activity-specific items
- Respond ONLY with the JSON array — no markdown, no explanation`

  type RawSuggestion = { name?: string; category?: string; priority?: string; reason?: string }

  async function requestSuggestions(): Promise<RawSuggestion[]> {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw   = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const clean = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      return JSON.parse(clean) as RawSuggestion[]
    } catch (parseErr) {
      console.error('[ChecklistSuggestions] JSON parse failed. Raw model output:', raw)
      throw parseErr
    }
  }

  try {
    let suggestions: RawSuggestion[]
    try {
      suggestions = await requestSuggestions()
    } catch (err) {
      // Only retry a malformed/truncated JSON response — API/network errors
      // shouldn't be blindly retried.
      if (!(err instanceof SyntaxError)) throw err
      suggestions = await requestSuggestions()
    }

    // Validate and sanitise
    const valid = suggestions
      .filter((s): s is Required<RawSuggestion> =>
        !!s.name && !!s.category && !!s.priority &&
        ['documents', 'packing', 'custom'].includes(s.category) &&
        ['essential', 'recommended', 'optional'].includes(s.priority)
      )
      .map(s => ({
        name:     String(s.name).trim(),
        category: s.category as 'documents' | 'packing' | 'custom',
        priority: s.priority as 'essential' | 'recommended' | 'optional',
        reason:   s.reason ? String(s.reason).trim() : '',
      }))

    return NextResponse.json({ suggestions: valid })
  } catch (err) {
    console.error('[ChecklistSuggestions] Error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
