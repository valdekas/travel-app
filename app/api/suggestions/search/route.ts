import { NextRequest, NextResponse } from 'next/server'

const TA_API_KEY          = process.env.TRIPADVISOR_API_KEY
const GOOGLE_API_KEY      = process.env.GOOGLE_PLACES_API_KEY
const TA_BASE             = 'https://api.content.tripadvisor.com/api/v1'
const GOOGLE_GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'
const DELAY_MS            = 100
const MAX_RESULTS         = 10

// Maps panel category IDs → TA API category filter
const TA_CATEGORY_MAP: Record<string, string> = {
  'Restaurants':               'restaurants',
  'Attractions':               'attractions',
  'Viewpoints':                'attractions',
  'Museums':                   'attractions',
  'Bars':                      'restaurants',
  'Parks & Nature':            'attractions',
  'restaurants and dining':        'restaurants',
  'sightseeing and landmarks':     'attractions',
  'guided tours and experiences':  'attractions',
  'shopping and markets':          'attractions',
  'nature and outdoor activities': 'attractions',
  'nightlife and entertainment':   'restaurants',
}

// Text-search fallback query prefixes for categories that need disambiguation
const SEARCH_PREFIX_MAP: Record<string, string> = {
  'Viewpoints':                'viewpoints panoramic scenic',
  'Museums':                   'museums galleries',
  'Bars':                      'bars cocktails nightlife',
  'Parks & Nature':            'parks nature gardens',
  'guided tours and experiences':  'tours experiences',
  'shopping and markets':          'shopping markets',
  'nature and outdoor activities': 'parks nature outdoor',
  'nightlife and entertainment':   'bars nightlife entertainment',
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_API_KEY) return null
  try {
    const url  = `${GOOGLE_GEOCODE_BASE}?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
    const res  = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const loc  = data.results?.[0]?.geometry?.location
    if (!loc) return null
    return { lat: loc.lat, lng: loc.lng }
  } catch {
    return null
  }
}

async function nearbySearch(
  lat: number,
  lng: number,
  taCategory: string,
  radius: number,
): Promise<Array<{ location_id: string; name: string }>> {
  const url = `${TA_BASE}/location/nearby_search` +
    `?latLong=${lat},${lng}` +
    `&category=${taCategory}` +
    `&radius=${radius}` +
    `&radiusUnit=km` +
    `&language=en` +
    `&key=${TA_API_KEY}`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.error('[TA Search] Nearby search failed:', res.status, 'latLong:', lat, lng)
    return []
  }
  const data = await res.json()
  return ((data.data ?? []) as Array<{ location_id: string; name: string }>).slice(0, MAX_RESULTS)
}

async function textSearch(
  searchQuery: string,
  taCategory: string,
): Promise<Array<{ location_id: string; name: string }>> {
  const url = `${TA_BASE}/location/search` +
    `?searchQuery=${encodeURIComponent(searchQuery)}` +
    `&category=${taCategory}` +
    `&language=en` +
    `&key=${TA_API_KEY}`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.error('[TA Search] Text search failed:', res.status, 'query:', searchQuery)
    return []
  }
  const data = await res.json()
  return ((data.data ?? []) as Array<{ location_id: string; name: string }>).slice(0, MAX_RESULTS)
}

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

  const { category, city, country, area, tripLat, tripLng } = await req.json() as {
    category: string
    city:     string
    country:  string
    area?:    string | null
    tripLat?: number | null
    tripLng?: number | null
  }

  const taCategory = TA_CATEGORY_MAP[category] ?? 'attractions'

  // ── Step 1: Resolve coordinates ──────────────────────────────────────────────
  //
  // Priority:
  //   1. Geocode the specific area (if provided) — tight 5km radius
  //   2. Trip's own stored coordinates — city-wide 20km radius
  //   3. Geocode the city — city-wide 20km radius
  //   4. Text search fallback (no coordinates available)

  let coords: { lat: number; lng: number } | null = null
  let searchRadius = 20  // km — used for whole-city searches

  if (area) {
    coords = await geocode(`${area}, ${city}, ${country}`)
    if (coords) searchRadius = 5
    else console.warn('[TA Search] Area geocode failed for:', area, '— falling back to city coords')
  }

  if (!coords && tripLat != null && tripLng != null) {
    coords = { lat: tripLat, lng: tripLng }
  }

  if (!coords) {
    coords = await geocode(`${city}, ${country}`)
  }

  // ── Step 2: Search ────────────────────────────────────────────────────────────

  let locations: Array<{ location_id: string; name: string }> = []

  if (coords) {
    locations = await nearbySearch(coords.lat, coords.lng, taCategory, searchRadius)
    console.log(`[TA Search] Nearby ${taCategory} within ${searchRadius}km of ${coords.lat},${coords.lng} → ${locations.length} results`)
  }

  // Fallback: text search if nearby returned nothing
  if (locations.length === 0) {
    const prefix      = SEARCH_PREFIX_MAP[category] ?? ''
    const locationTerm = area ? `${area}, ${city}` : `${city}, ${country}`
    const searchQuery  = prefix ? `${prefix} ${locationTerm}` : locationTerm
    console.warn('[TA Search] Nearby returned 0 results, falling back to text search:', searchQuery)
    locations = await textSearch(searchQuery, taCategory)
  }

  if (locations.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // ── Step 3: Enrich each result (details + photos) ────────────────────────────

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
            photo.images?.large?.url    ??
            photo.images?.medium?.url   ??
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
