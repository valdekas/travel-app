import { NextRequest, NextResponse } from 'next/server'

const TA_API_KEY = process.env.TRIPADVISOR_API_KEY
const TA_BASE    = 'https://api.content.tripadvisor.com/api/v1'
const DELAY_MS   = 100
const MAX_RESULTS = 10

// Maps panel category IDs → TA API category + optional search term prefix
const TA_CATEGORY_MAP: Record<string, { taCategory: string; searchPrefix: string }> = {
  // Places panel categories
  'Restaurants':               { taCategory: 'restaurants', searchPrefix: '' },
  'Attractions':               { taCategory: 'attractions', searchPrefix: '' },
  'Viewpoints':                { taCategory: 'attractions', searchPrefix: 'viewpoints panoramic scenic' },
  'Museums':                   { taCategory: 'attractions', searchPrefix: 'museums galleries' },
  'Bars':                      { taCategory: 'restaurants', searchPrefix: 'bars cocktails nightlife' },
  'Parks & Nature':            { taCategory: 'attractions', searchPrefix: 'parks nature gardens' },
  // Itinerary panel categories
  'restaurants and dining':        { taCategory: 'restaurants', searchPrefix: '' },
  'sightseeing and landmarks':     { taCategory: 'attractions', searchPrefix: '' },
  'guided tours and experiences':  { taCategory: 'attractions', searchPrefix: 'tours experiences' },
  'shopping and markets':          { taCategory: 'attractions', searchPrefix: 'shopping markets' },
  'nature and outdoor activities': { taCategory: 'attractions', searchPrefix: 'parks nature outdoor' },
  'nightlife and entertainment':   { taCategory: 'restaurants', searchPrefix: 'bars nightlife entertainment' },
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }

export interface TaSearchResult {
  ta_location_id: string
  name:           string
  address:        string
  lat:            number | null
  lng:            number | null
  rating:         number | null
  reviews_count:  number | null
  photo_url:      string | null
  google_maps_url: string
  website:        string | null
  price_level:    string | null
  category:       string
}

export async function POST(req: NextRequest) {
  if (!TA_API_KEY) {
    return NextResponse.json({ error: 'TripAdvisor API key not configured' }, { status: 500 })
  }

  const { category, city, country, area } = await req.json() as {
    category: string
    city:     string
    country:  string
    area?:    string | null
  }

  const mapping = TA_CATEGORY_MAP[category] ?? { taCategory: 'attractions', searchPrefix: '' }

  const locationTerm = area ? `${area}, ${city}` : `${city}, ${country}`
  const searchQuery  = mapping.searchPrefix
    ? `${mapping.searchPrefix} ${locationTerm}`
    : locationTerm

  // Step 1: Location search
  const searchUrl = `${TA_BASE}/location/search?searchQuery=${encodeURIComponent(searchQuery)}&category=${mapping.taCategory}&language=en&key=${TA_API_KEY}`
  const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } })

  if (!searchRes.ok) {
    console.error('[TA Search] Location search failed:', searchRes.status, 'query:', searchQuery)
    return NextResponse.json({ results: [] })
  }

  const searchData = await searchRes.json()
  const locations  = (searchData.data ?? []).slice(0, MAX_RESULTS) as Array<{ location_id: string; name: string }>

  if (locations.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Step 2: Enrich each result sequentially (details + photos)
  const results: TaSearchResult[] = []

  for (const loc of locations) {
    const locationId = loc.location_id
    await delay(DELAY_MS)

    try {
      const detailsRes = await fetch(
        `${TA_BASE}/location/${locationId}/details?language=en&currency=EUR&key=${TA_API_KEY}`,
        { headers: { Accept: 'application/json' } },
      )
      if (!detailsRes.ok) continue
      const details = await detailsRes.json()

      await delay(DELAY_MS)

      const photosRes = await fetch(
        `${TA_BASE}/location/${locationId}/photos?language=en&limit=1&key=${TA_API_KEY}`,
        { headers: { Accept: 'application/json' } },
      )
      let photo_url: string | null = null
      if (photosRes.ok) {
        const photosData = await photosRes.json()
        const photo = photosData.data?.[0]
        if (photo) {
          photo_url =
            photo.images?.large?.url   ??
            photo.images?.medium?.url  ??
            photo.images?.original?.url ??
            null
        }
      }

      const lat = details.latitude  ? parseFloat(details.latitude)  : null
      const lng = details.longitude ? parseFloat(details.longitude) : null

      const google_maps_url =
        lat != null && lng != null
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.name ?? loc.name)}`

      results.push({
        ta_location_id: locationId,
        name:           details.name ?? loc.name,
        address:        details.address_obj?.address_string ?? '',
        lat,
        lng,
        rating:        details.rating      ? parseFloat(details.rating)    : null,
        reviews_count: details.num_reviews ? parseInt(details.num_reviews) : null,
        photo_url,
        google_maps_url,
        website:     details.website     ?? null,
        price_level: details.price_level ?? null,
        category,
      })
    } catch (err) {
      console.error(`[TA Search] Failed to enrich location ${locationId}:`, err)
    }
  }

  return NextResponse.json({ results })
}
