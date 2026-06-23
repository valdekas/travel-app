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

  // Build a clear location string — city always leads
  const location = destination && destination !== country
    ? `${destination}, ${country}`
    : country

  let prompt: string

  if (type === 'places') {
    prompt = `You are a travel expert specialising in city-specific travel recommendations.

Suggest 8–10 must-visit places specifically in ${location} for a ${duration}-day trip. Focus on what makes ${destination || country} unique and unmissable — name real, well-known spots that are actually located in ${destination || country} itself, not generic country-level attractions.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (specific place name, e.g. "Millennium Park" not just "A Park")
- category: string (one of: Restaurant, Cafe, Museum, Viewpoint, Hotel, Bar, Park, Shopping, Attraction, Beach)
- description: string (exactly 1 sentence about why it's worth visiting, mentioning ${destination || country} where natural)
- emoji: string (one relevant emoji)

Example for Chicago:
[{"name":"Millennium Park","category":"Park","description":"Chicago's iconic 24-acre park home to the Cloud Gate sculpture and free Grant Park Music Festival concerts.","emoji":"🌿"}]`
  } else {
    prompt = `You are a travel expert specialising in city-specific travel itineraries.

Suggest 8–10 activities and experiences specifically available in ${location} for a ${duration}-day trip. Focus on what makes ${destination || country} unique — real places, restaurants, tours, and attractions that are actually in ${destination || country}, not generic country-level activities.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (specific activity or venue name)
- category: string (one of: attraction, restaurant, activity, tour, shopping, viewpoint, beach, hotel, transport, other)
- description: string (exactly 1 sentence describing the experience, mentioning ${destination || country} where natural)
- suggestedTime: string (recommended start time, e.g. "09:00", "14:00", "19:30")
- duration: string (how long it takes, e.g. "1 hour", "2–3 hours", "Half day")
- emoji: string (one relevant emoji)

Example for Chicago:
[{"name":"Chicago Architecture Boat Tour","category":"tour","description":"Cruise the Chicago River to see the city's legendary skyline and learn about its world-famous architectural history.","emoji":"🚢","suggestedTime":"10:00","duration":"1.5 hours"}]`
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
