import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

interface ActivityInput {
  id:            string
  name:          string
  category:      string
  start_time:    string | null
  location_name: string | null
  lat:           number | null
  lng:           number | null
}

interface OptimizedActivity {
  id: string
}

interface TravelTime {
  fromId:   string
  toId:     string
  duration: string
  distance: string
  mode:     string
}

async function getDirections(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  mode: 'walking' | 'driving' | 'transit',
): Promise<{ duration: string; distance: string; durationSeconds: number } | null> {
  if (!GOOGLE_API_KEY) return null
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&mode=${mode}` +
      `&key=${GOOGLE_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const leg = data.routes?.[0]?.legs?.[0]
    if (!leg) return null
    return {
      duration:        leg.duration?.text ?? '',
      distance:        leg.distance?.text ?? '',
      durationSeconds: leg.duration?.value ?? 0,
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { activities, city, country, travelTimesOnly } = await req.json() as {
    dayId:           string
    tripId:          string
    activities:      ActivityInput[]
    city:            string
    country:         string
    travelTimesOnly?: boolean
  }

  if (!activities || activities.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 activities' }, { status: 400 })
  }

  console.log('[AutoSchedule] Activities received:', activities.length)
  console.log('[AutoSchedule] Activities with coords:', activities.filter(a => a.lat && a.lng).length)

  // ── Step 1: order optimisation (skipped when travelTimesOnly) ──────────────

  let optimizedOrder: OptimizedActivity[] = []

  if (travelTimesOnly) {
    // Keep activities in the received order — no reordering needed
    optimizedOrder = activities.map(a => ({ id: a.id }))
  } else {
    const anthropic = new Anthropic()

    const activityList = activities.map(a => ({
      id:       a.id,
      name:     a.name,
      category: a.category,
      location: a.location_name ?? null,
    }))

    const prompt = `You are a travel expert. Optimise the visiting order of these activities for a single day in ${city}, ${country}.

Rules:
- Museums and attractions: morning
- Lunch (restaurants): midday
- More attractions: afternoon
- Dinner: evening
- Bars and nightlife: late evening
- Group geographically close activities together to minimise travel
- Avoid backtracking

Activities to order:
${JSON.stringify(activityList, null, 2)}

Return ONLY a valid JSON array of the activity IDs in optimal order — no markdown, no code fences, no explanation.
Format: ["uuid1", "uuid2", "uuid3"]
Include ALL ${activities.length} activity IDs exactly once.`

    try {
      const message = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages:   [{ role: 'user', content: prompt }],
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const clean = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      const ids: string[] = JSON.parse(clean)
      optimizedOrder = ids.map(id => ({ id }))

      // Safety: ensure every activity ID is present (Claude might drop one)
      const returnedIds = new Set(optimizedOrder.map(o => o.id))
      for (const a of activities) {
        if (!returnedIds.has(a.id)) {
          optimizedOrder.push({ id: a.id })
        }
      }
    } catch {
      // Fallback: keep original order
      optimizedOrder = activities.map(a => ({ id: a.id }))
    }
  }

  // ── Step 2: Google Maps travel times for consecutive pairs ───────────────────

  const travelTimes: TravelTime[] = []

  for (let i = 0; i < optimizedOrder.length - 1; i++) {
    const fromId = optimizedOrder[i].id
    const toId   = optimizedOrder[i + 1].id
    const from   = activities.find(a => a.id === fromId)
    const to     = activities.find(a => a.id === toId)

    if (from?.lat == null || from?.lng == null || to?.lat == null || to?.lng == null) continue

    const walking = await getDirections(from.lat, from.lng, to.lat, to.lng, 'walking')
    if (!walking) continue

    if (walking.durationSeconds > 1200) {
      // > 20 mins walking — prefer transit, fall back to driving
      const transit = await getDirections(from.lat, from.lng, to.lat, to.lng, 'transit')
      if (transit) {
        travelTimes.push({ fromId, toId, duration: transit.duration, distance: transit.distance, mode: 'transit' })
        continue
      }
      const driving = await getDirections(from.lat, from.lng, to.lat, to.lng, 'driving')
      if (driving) {
        travelTimes.push({ fromId, toId, duration: driving.duration, distance: driving.distance, mode: 'driving' })
        continue
      }
    }

    travelTimes.push({ fromId, toId, duration: walking.duration, distance: walking.distance, mode: 'walking' })
  }

  console.log('[AutoSchedule] Travel times computed:', travelTimes.length)

  return NextResponse.json({ optimizedOrder, travelTimes })
}
