import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { type, destination, country, duration, existingItems } = await req.json()

  const exclusions =
    existingItems?.length > 0
      ? `\nDo NOT suggest any of these already-added items: ${(existingItems as string[]).join(', ')}.`
      : ''

  // Build location string and extract just the city name for prompt emphasis
  const location = destination && destination !== country
    ? `${destination}, ${country}`
    : country
  // cityName = first segment before any comma (handles "Costa Blanca, Alicante" → "Costa Blanca")
  const cityName = destination?.split(',')[0]?.trim() || country

  let prompt: string

  if (type === 'places') {
    prompt = `You are a travel expert. I need specific recommendations for a trip to ${location}.

IMPORTANT: Only suggest places that are physically located in ${cityName} itself — not in other cities, not country-wide attractions, not generic suggestions. Every single item must be something a visitor can actually go to while staying in ${cityName}.

For example:
- If the city is Chicago: Millennium Park, The Art Institute of Chicago, Lou Malnati's Pizzeria, Navy Pier, the 360 Chicago observation deck — NOT generic US attractions.
- If the city is Paris: the Eiffel Tower, Le Marais, Café de Flore, the Louvre — NOT generic French attractions.

Suggest 8–10 must-visit places specifically in ${cityName} for a ${duration}-day trip.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (specific venue or place name)
- category: string (one of: Restaurant, Cafe, Museum, Viewpoint, Hotel, Bar, Park, Shopping, Attraction, Beach)
- description: string (exactly 1 sentence about why it's worth visiting in ${cityName})
- emoji: string (one relevant emoji)

Example for Chicago:
[{"name":"Millennium Park","category":"Park","description":"Chicago's iconic 24-acre park is home to the Cloud Gate sculpture, Crown Fountain, and free summer concerts in the Jay Pritzker Pavilion.","emoji":"🌿"}]`
  } else {
    prompt = `You are a travel expert. I need a specific activity itinerary for a trip to ${location}.

IMPORTANT: Only suggest activities and experiences that are physically available in ${cityName} itself — not in other cities, not country-wide experiences, not generic suggestions. Every single item must be something a visitor can actually do while staying in ${cityName}.

For example:
- If the city is Chicago: an architecture boat tour on the Chicago River, deep dish pizza at Giordano's, visiting the Navy Pier, catching a Cubs game at Wrigley Field — NOT generic US activities.
- If the city is Barcelona: La Sagrada Família, tapas in El Born, the Gothic Quarter walking tour — NOT generic Spanish activities.

Suggest 8–10 activities and experiences specifically in ${cityName} for a ${duration}-day trip.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (specific activity or venue name)
- category: string (one of: attraction, restaurant, activity, tour, shopping, viewpoint, beach, hotel, transport, other)
- description: string (exactly 1 sentence describing the experience in ${cityName})
- suggestedTime: string (recommended start time, e.g. "09:00", "14:00", "19:30")
- duration: string (how long it takes, e.g. "1 hour", "2–3 hours", "Half day")
- emoji: string (one relevant emoji)

Example for Chicago:
[{"name":"Chicago River Architecture Boat Tour","category":"tour","description":"Cruise the Chicago River on a 90-minute tour to see 50+ landmark buildings and learn why Chicago is the birthplace of modern architecture.","emoji":"🚢","suggestedTime":"10:00","duration":"1.5 hours"}]`
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

    // Strip any accidental markdown fences Claude may add despite instructions
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')

    const suggestions = JSON.parse(clean)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[/api/recommendations] error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions. Please try again.' }, { status: 500 })
  }
}
