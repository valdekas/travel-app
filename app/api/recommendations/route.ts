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

  let prompt: string

  if (type === 'places') {
    prompt = `You are a travel expert. Suggest 8–10 must-visit places in ${destination}, ${country} for a ${duration}-day trip.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (place name)
- category: string (one of: Restaurant, Cafe, Museum, Viewpoint, Hotel, Bar, Park, Shopping, Attraction, Beach)
- description: string (exactly 1 sentence about why it's worth visiting)
- emoji: string (one relevant emoji)

Example:
[{"name":"Millennium Park","category":"Park","description":"Iconic urban park home to the famous Cloud Gate sculpture and free summer concerts.","emoji":"🌿"}]`
  } else {
    prompt = `You are a travel expert. Suggest 8–10 activities and experiences for a ${duration}-day trip to ${destination}, ${country}.${exclusions}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation — just the raw JSON array.
Each object must have exactly these fields:
- name: string (activity name)
- category: string (one of: attraction, restaurant, activity, tour, shopping, viewpoint, beach, hotel, transport, other)
- description: string (exactly 1 sentence describing the experience)
- suggestedTime: string (recommended start time, e.g. "09:00", "14:00", "19:30")
- duration: string (how long it takes, e.g. "1 hour", "2–3 hours", "Half day")
- emoji: string (one relevant emoji)

Example:
[{"name":"Architecture Boat Tour","category":"tour","description":"See Chicago's iconic skyline from the Chicago River on this award-winning 90-minute tour.","emoji":"🚢","suggestedTime":"10:00","duration":"1.5 hours"}]`
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
