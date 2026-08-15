// TripAdvisor Content API enrichment utility (server-side only — never expose key to client)
// Free tier: 5 000 calls/month. A verified match costs up to 5 calls (search +
// up to 3x details while scanning candidates + 1 photos call for the winner);
// a fully-rejected suggestion costs up to 4 (search + 3x details, no photos).
// Sequential requests with 100 ms delay are used to avoid burst-rate rejection.

import { resolveA2 } from './country-codes'

const TA_API_KEY = process.env.TRIPADVISOR_API_KEY
const TA_BASE     = 'https://api.content.tripadvisor.com/api/v1'

// A candidate is only accepted if it's plausibly the right place — see
// isGeographicMatch(). This is what stops enrichment from attaching data for
// a same-named venue in a different country (e.g. a Lithuanian trip getting
// "Giraffe Manor" in Nairobi for a suggestion named "Pilviškiai Manor").
const MAX_DISTANCE_KM = 50
const MAX_CANDIDATES  = 3
const DELAY_MS        = 100

// TA's `category` request param ('hotels' | 'attractions' | 'restaurants' | 'geos')
// and a location's own `details.category.key` share the same vocabulary.
// Requesting a specific category keeps geo entities (a town/region matched as
// if it were a venue — TripAdvisor does this when it has no confident business
// match) out of the candidate pool in the first place; excludeTypes is a
// details-level backstop in case one leaks through anyway.
const CATEGORY_TA_MAP: Record<string, { taCategory: string; excludeTypes: string[] }> = {
  Restaurants:      { taCategory: 'restaurants', excludeTypes: ['attraction', 'hotel', 'geos'] },
  Bars:             { taCategory: 'restaurants', excludeTypes: ['attraction', 'hotel', 'geos'] },
  Attractions:      { taCategory: 'attractions', excludeTypes: ['restaurant', 'hotel', 'geos'] },
  Viewpoints:       { taCategory: 'attractions', excludeTypes: ['restaurant', 'hotel', 'geos'] },
  Museums:          { taCategory: 'attractions', excludeTypes: ['restaurant', 'hotel', 'geos'] },
  'Parks & Nature': { taCategory: 'attractions', excludeTypes: ['restaurant', 'hotel', 'geos'] },
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Verifies a TA details result is plausibly in the right place before we
// trust its rating/photo/address. Prefers an actual distance check (accurate
// regardless of country-name formatting); falls back to comparing ISO2
// country codes — via resolveA2, not a raw string compare — when
// coordinates aren't available on one side. trips.country can be a
// localized name (e.g. "Мальта" for a Russian-locale browser, since Google
// Places returns country long_name in the requesting browser's language),
// which would never string-match TripAdvisor's English address_obj.country
// and would silently reject every candidate; resolving both sides to ISO2
// first is immune to that. Fails safe (rejects) if neither coordinates nor
// a resolvable country are available on both sides — an unverifiable match
// must not be attached.
function isGeographicMatch(
  details: { latitude?: string; longitude?: string; address_obj?: { country?: string } },
  tripCountryCode: string | null,
  tripCountryName: string,
  tripLat: number | null,
  tripLng: number | null,
): { ok: boolean; reason?: string } {
  const candLat = details.latitude  ? parseFloat(details.latitude)  : null
  const candLng = details.longitude ? parseFloat(details.longitude) : null

  if (tripLat != null && tripLng != null && candLat != null && candLng != null) {
    const distanceKm = haversineKm(tripLat, tripLng, candLat, candLng)
    if (distanceKm > MAX_DISTANCE_KM) {
      return { ok: false, reason: `too far (${distanceKm.toFixed(0)}km away, max ${MAX_DISTANCE_KM}km)` }
    }
    return { ok: true }
  }

  const candCountryName = details.address_obj?.country?.trim()
  const tripISO2 = resolveA2(tripCountryCode ?? undefined, tripCountryName)
  const candISO2 = resolveA2(undefined, candCountryName)

  if (tripISO2 && candISO2) {
    if (tripISO2 !== candISO2) {
      return { ok: false, reason: `wrong country (got "${candCountryName}" [${candISO2}], expected [${tripISO2}])` }
    }
    return { ok: true }
  }

  return { ok: false, reason: 'no geographic data available to verify against (missing trip or candidate coordinates/country)' }
}

export interface TripAdvisorPlace {
  ta_location_id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  rating: number | null
  reviews_count: number | null
  photo_url: string | null
  google_maps_url: string
  website: string | null
  phone: string | null
  price_level: string | null
}

export async function searchTripAdvisorPlace({
  name,
  city,
  country,
  countryCode,
  category,
  tripLat,
  tripLng,
}: {
  name:        string
  city:        string
  country:     string
  countryCode: string | null
  category:    string
  tripLat:     number | null
  tripLng:     number | null
}): Promise<TripAdvisorPlace | null> {
  if (!TA_API_KEY) return null

  const mapping = CATEGORY_TA_MAP[category]
  const logCtx = `"${name}" (${city}, ${country})`

  try {
    // Step 1: Search for the location — biased by category and, when
    // available, the trip's own coordinates (latLong is a ranking hint, not
    // a hard filter, so a downstream geographic check is still required).
    const params = new URLSearchParams({
      searchQuery: `${name} ${city}, ${country}`,
      language:    'en',
      key:         TA_API_KEY,
    })
    if (mapping) params.set('category', mapping.taCategory)
    if (tripLat != null && tripLng != null) params.set('latLong', `${tripLat},${tripLng}`)

    const searchRes = await fetch(`${TA_BASE}/location/search?${params}`, { headers: { Accept: 'application/json' } })
    if (!searchRes.ok) {
      console.error(`[TA] Search request failed (${searchRes.status}) for ${logCtx}`)
      return null
    }
    const searchData = await searchRes.json()
    const candidates: Array<{ location_id: string; name: string }> = (searchData.data ?? []).slice(0, MAX_CANDIDATES)

    if (candidates.length === 0) {
      console.log(`[TA] Rejected ${logCtx} — reason: no candidates returned`)
      return null
    }

    // Step 2: Scan candidates in ranked order; accept the first one that's
    // both the right kind of place and plausibly in the right location.
    for (const candidate of candidates) {
      const locationId = candidate.location_id
      await delay(DELAY_MS)

      const detailsRes = await fetch(
        `${TA_BASE}/location/${locationId}/details?language=en&currency=EUR&key=${TA_API_KEY}`,
        { headers: { Accept: 'application/json' } },
      )
      if (!detailsRes.ok) continue
      const details = await detailsRes.json()

      const detailsCatKey: string = details.category?.key ?? ''
      if (mapping && mapping.excludeTypes.includes(detailsCatKey)) {
        console.log(`[TA] Rejected "${details.name}" for ${logCtx} — reason: wrong type ("${detailsCatKey}")`)
        continue
      }

      const geo = isGeographicMatch(details, countryCode, country, tripLat, tripLng)
      if (!geo.ok) {
        console.log(`[TA] Rejected "${details.name}" for ${logCtx} — reason: ${geo.reason}`)
        continue
      }

      // Step 3: Verified — now spend the photos call.
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
            photo.images?.large?.url ??
            photo.images?.medium?.url ??
            photo.images?.original?.url ??
            null
        }
      }

      const lat = details.latitude  ? parseFloat(details.latitude)  : null
      const lng = details.longitude ? parseFloat(details.longitude) : null

      const google_maps_url =
        lat != null && lng != null
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`

      console.log(`[TA] Matched "${details.name}" for ${logCtx}`)

      return {
        ta_location_id: locationId,
        name:           details.name                        ?? name,
        address:        details.address_obj?.address_string ?? '',
        lat,
        lng,
        rating:         details.rating      ? parseFloat(details.rating)      : null,
        reviews_count:  details.num_reviews ? parseInt(details.num_reviews)   : null,
        photo_url,
        google_maps_url,
        website:        details.website     ?? null,
        phone:          details.phone       ?? null,
        price_level:    details.price_level ?? null,
      }
    }

    console.log(`[TA] Rejected ${logCtx} — reason: no candidates passed verification (tried ${candidates.length})`)
    return null
  } catch (err) {
    console.error(`[TA] Error enriching ${logCtx}:`, err)
    return null
  }
}
