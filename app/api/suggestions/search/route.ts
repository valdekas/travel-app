import { NextRequest, NextResponse } from 'next/server'

const TA_API_KEY          = process.env.TRIPADVISOR_API_KEY
const GOOGLE_API_KEY      = process.env.GOOGLE_PLACES_API_KEY
const TA_BASE             = 'https://api.content.tripadvisor.com/api/v1'
const GOOGLE_GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'
const DELAY_MS            = 100
const MAX_RESULTS         = 10

// ── Category mapping ──────────────────────────────────────────────────────────
//
// taCategory:    TA API accepts 'restaurants' | 'attractions' | 'hotels' | 'geos'
// subcategories: TA subcategory codes to narrow results within the main category
// excludeTypes:  TA details.category.key values to reject during post-filter
//   (prevents e.g. office buildings appearing in Parks & Nature)

interface CategoryMapping {
  taCategory:    string
  subcategories: string[] | null
  excludeTypes:  string[]
  searchPrefix:  string   // used by text-search fallback only
}

const CATEGORY_MAP: Record<string, CategoryMapping> = {
  // ── Places panel ────────────────────────────────────────────────────────────
  'Restaurants': {
    taCategory:    'restaurants',
    subcategories: null,
    excludeTypes:  ['attraction', 'hotel'],
    searchPrefix:  '',
  },
  'Bars': {
    taCategory:    'restaurants',
    subcategories: ['10591', '10592', '10593'],   // bars, nightlife, pubs
    excludeTypes:  ['attraction', 'hotel'],
    searchPrefix:  'bars cocktails nightlife',
  },
  'Attractions': {
    taCategory:    'attractions',
    subcategories: ['10008', '10009', '10010'],   // sights, landmarks, points of interest
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  '',
  },
  'Museums': {
    taCategory:    'attractions',
    subcategories: ['10013'],                     // museums
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'museums galleries',
  },
  'Viewpoints': {
    taCategory:    'attractions',
    subcategories: ['10009', '10010'],            // scenic lookouts, observation decks
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'viewpoints panoramic scenic',
  },
  'Parks & Nature': {
    taCategory:    'attractions',
    subcategories: ['10047', '10048', '10049'],   // parks, nature & wildlife, gardens
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'parks nature gardens',
  },

  // ── Itinerary panel ──────────────────────────────────────────────────────────
  'restaurants and dining': {
    taCategory:    'restaurants',
    subcategories: null,
    excludeTypes:  ['attraction', 'hotel'],
    searchPrefix:  '',
  },
  'sightseeing and landmarks': {
    taCategory:    'attractions',
    subcategories: ['10008', '10009', '10010'],
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  '',
  },
  'guided tours and experiences': {
    taCategory:    'attractions',
    subcategories: null,
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'tours experiences',
  },
  'shopping and markets': {
    taCategory:    'attractions',
    subcategories: null,
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'shopping markets',
  },
  'nature and outdoor activities': {
    taCategory:    'attractions',
    subcategories: ['10047', '10048', '10049'],
    excludeTypes:  ['restaurant', 'hotel'],
    searchPrefix:  'parks nature outdoor',
  },
  'nightlife and entertainment': {
    taCategory:    'restaurants',
    subcategories: ['10591', '10592', '10593'],
    excludeTypes:  ['attraction', 'hotel'],
    searchPrefix:  'bars nightlife entertainment',
  },
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
  mapping: CategoryMapping,
  radius: number,
): Promise<Array<{ location_id: string; name: string }>> {
  const params = new URLSearchParams({
    latLong:     `${lat},${lng}`,
    category:    mapping.taCategory,
    radius:      String(radius),
    radiusUnit:  'km',
    language:    'en',
    limit:       '15',
    key:         TA_API_KEY ?? '',
  })
  if (mapping.subcategories) {
    params.append('subcategory', mapping.subcategories.join(','))
  }

  const url = `${TA_BASE}/location/nearby_search?${params}`
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
  mapping: CategoryMapping,
): Promise<Array<{ location_id: string; name: string }>> {
  const params = new URLSearchParams({
    searchQuery,
    category:  mapping.taCategory,
    language:  'en',
    key:       TA_API_KEY ?? '',
  })
  if (mapping.subcategories) {
    params.append('subcategory', mapping.subcategories.join(','))
  }

  const url = `${TA_BASE}/location/search?${params}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.error('[TA Search] Text search failed:', res.status, 'query:', searchQuery)
    return []
  }
  const data = await res.json()
  return ((data.data ?? []) as Array<{ location_id: string; name: string }>).slice(0, MAX_RESULTS)
}

export interface TaSearchResult {
  ta_location_id:  string
  name:            string
  address:         string
  lat:             number | null
  lng:             number | null
  rating:          number | null
  reviews_count:   number | null
  photo_url:       string | null
  google_maps_url: string
  website:         string | null
  price_level:     string | null
  category:        string
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

  const mapping = CATEGORY_MAP[category] ?? {
    taCategory:    'attractions',
    subcategories: null,
    excludeTypes:  [],
    searchPrefix:  '',
  }

  // ── Step 1: Resolve coordinates ───────────────────────────────────────────────
  //
  // Priority:
  //   1. Geocode specific area (if provided) → 5km radius
  //   2. Trip's stored coordinates           → 20km radius
  //   3. Geocode city                        → 20km radius
  //   4. Text search fallback (no coords)

  let coords: { lat: number; lng: number } | null = null
  let searchRadius = 20

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
    locations = await nearbySearch(coords.lat, coords.lng, mapping, searchRadius)
    console.log(
      `[TA Search] Nearby ${mapping.taCategory}` +
      (mapping.subcategories ? ` [${mapping.subcategories.join(',')}]` : '') +
      ` within ${searchRadius}km of ${coords.lat},${coords.lng} → ${locations.length} results`,
    )
  }

  if (locations.length === 0) {
    const locationTerm = area ? `${area}, ${city}` : `${city}, ${country}`
    const searchQuery  = mapping.searchPrefix
      ? `${mapping.searchPrefix} ${locationTerm}`
      : locationTerm
    console.warn('[TA Search] Nearby returned 0 — text fallback:', searchQuery)
    locations = await textSearch(searchQuery, mapping)
  }

  if (locations.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // ── Step 3: Enrich + relevance-filter ────────────────────────────────────────

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

      // Relevance filter: skip results of the wrong place type
      const detailsCatKey: string = details.category?.key ?? ''
      if (mapping.excludeTypes.includes(detailsCatKey)) {
        console.log(`[TA Search] Skipping "${details.name}" — type "${detailsCatKey}" excluded for category "${category}"`)
        continue
      }

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
