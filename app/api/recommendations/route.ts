import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { type, destination, country, duration, category, existingItems } = await req.json()

  const exclusions =
    existingItems?.length > 0
      ? `\nDo NOT suggest any of these already-added items: ${(existingItems as string[]).join(', ')}.`
      : ''

  const location = destination && destination !== country
    ? `${destination}, ${country}`
    : country
  const cityName = destination?.split(',')[0]?.trim() || country

  const categoryLabel = (category as string) || 'popular spots'

  let prompt: string

  if (type === 'places') {
    prompt = `You are a travel expert. Suggest exactly 15 ${categoryLabel} specifically in ${location}.

IMPORTANT:
- Focus ONLY on ${categoryLabel} — every single item must be a ${categoryLabel.toLowerCase()} physically located in ${cityName} itself.
- Do NOT suggest items in other cities, generic country-wide attractions, or anything outside ${cityName}.
- Use real, well-known, highly-rated places that a tourist visiting ${cityName} can actually go to.${exclusions}

Return exactly 15 items. Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation.
Each object must have exactly these fields:
- name: string (specific place name)
- category: string (short label, e.g. "Restaurant", "Museum", "Viewpoint")
- emoji: string (one relevant emoji)
- description: string (1-2 sentences about what the place is)
- whyVisit: string (one compelling reason why tourists love it)
- priceRange: string (exactly one of: "Free", "$", "$$", "$$$", "$$$$")
- bestTimeToVisit: string (e.g. "Morning", "Evening", "Weekends", "Year-round")
- mustTry: string | null (for Restaurants and Bars: the single most iconic dish or drink; for ALL other categories: use null)
- tip: string (one practical insider tip, e.g. "Book in advance", "Go at sunset for best photos", "Free on Tuesdays")

Example for Chicago Restaurants:
[{"name":"Lou Malnati's Pizzeria","category":"Restaurant","emoji":"🍕","description":"Chicago's most beloved deep dish pizza chain, serving buttery crust pies stuffed with sausage and vine-ripened tomatoes since 1971.","whyVisit":"Widely considered the gold standard of Chicago-style deep dish — a cult favourite among locals and visitors alike.","priceRange":"$$","bestTimeToVisit":"Lunch or dinner","mustTry":"Malnati Chicago Classic deep dish with sausage","tip":"Expect a 20-minute wait for deep dish — order thin crust if you're in a hurry"}]`
  } else {
    prompt = `You are a travel expert. Suggest exactly 15 ${categoryLabel} experiences specifically in ${location}.

IMPORTANT:
- Focus ONLY on ${categoryLabel} — every single item must be a ${categoryLabel.toLowerCase()} experience physically available in ${cityName} itself.
- Do NOT suggest activities in other cities or generic country-wide experiences.
- Use real, bookable, highly-rated activities that a tourist staying in ${cityName} can actually do.${exclusions}

Return exactly 15 items. Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation.
Each object must have exactly these fields:
- name: string (specific activity or venue name)
- category: string (short label, e.g. "tour", "restaurant", "activity")
- emoji: string (one relevant emoji)
- description: string (1-2 sentences describing the experience)
- suggestedTime: string (recommended start time, e.g. "09:00", "14:00", "19:30")
- duration: string (how long it takes, e.g. "1 hour", "2–3 hours", "Half day")
- tip: string (one practical tip, e.g. "Book ahead", "Wear comfortable shoes", "Best on weekdays to avoid crowds")

Example for Chicago Tours:
[{"name":"Chicago River Architecture Boat Tour","category":"tour","emoji":"🚢","description":"Cruise the Chicago River on a 90-minute tour to see 50+ landmark skyscrapers and learn why Chicago is the birthplace of modern architecture.","suggestedTime":"10:00","duration":"1.5 hours","tip":"Book tickets online in advance — summer tours sell out days ahead"}]`
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')
    const suggestions = JSON.parse(clean)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[/api/recommendations] error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions. Please try again.' }, { status: 500 })
  }
}
