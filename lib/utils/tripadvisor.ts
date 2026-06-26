// TripAdvisor Content API enrichment utility (server-side only — never expose key to client)
// Free tier: 5 000 calls/month. Each suggestion uses up to 3 calls (search + details + photos).
// Sequential requests with 100 ms delay are used to avoid burst-rate rejection.

const TA_API_KEY = process.env.TRIPADVISOR_API_KEY

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

export async function searchTripAdvisorPlace(
  name: string,
  city: string,
  country: string,
): Promise<TripAdvisorPlace | null> {
  if (!TA_API_KEY) return null

  try {
    // Step 1: Search for the location
    const searchRes = await fetch(
      `https://api.content.tripadvisor.com/api/v1/location/search?searchQuery=${encodeURIComponent(`${name} ${city}`)}&language=en&key=${TA_API_KEY}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const location = searchData.data?.[0]
    if (!location) return null

    const locationId: string = location.location_id

    // Step 2: Get full location details
    const detailsRes = await fetch(
      `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&currency=EUR&key=${TA_API_KEY}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!detailsRes.ok) return null
    const details = await detailsRes.json()

    // Step 3: Get photos (best available size)
    const photosRes = await fetch(
      `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?language=en&limit=1&key=${TA_API_KEY}`,
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
  } catch {
    return null
  }
}
