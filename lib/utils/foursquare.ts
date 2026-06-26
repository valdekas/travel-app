// Foursquare Places API enrichment utility (server-side only)
// Free tier: 1000 API calls/day. Each trip generates up to 90 suggestions,
// each requiring 1–2 FSQ calls → ~11–22 trips/day before hitting the limit.
// If FOURSQUARE_API_KEY is absent, all enrichment calls return null gracefully.

const FSQ_API_KEY = process.env.FOURSQUARE_API_KEY

export interface FoursquarePlace {
  fsq_id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  rating: number | null
  photo_url: string | null
  google_maps_url: string
  website: string | null
  phone: string | null
  hours: string | null
}

export async function searchFoursquarePlace(
  name: string,
  city: string,
  country: string,
): Promise<FoursquarePlace | null> {
  if (!FSQ_API_KEY) return null

  try {
    const searchParams = new URLSearchParams({
      query: name,
      near: `${city}, ${country}`,
      limit: '1',
      fields: 'fsq_id,name,location,geocodes,rating,photos,website,tel,hours',
    })

    const searchRes = await fetch(
      `https://api.foursquare.com/v3/places/search?${searchParams}`,
      {
        headers: {
          Authorization: FSQ_API_KEY,
          Accept: 'application/json',
        },
      },
    )

    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const place = searchData.results?.[0]
    if (!place) return null

    // Get photo URL — first try inline photos array, then a separate photos fetch
    let photo_url: string | null = null
    if (place.photos?.length > 0) {
      const p = place.photos[0]
      photo_url = `${p.prefix}800x600${p.suffix}`
    } else {
      const photosRes = await fetch(
        `https://api.foursquare.com/v3/places/${place.fsq_id}/photos?limit=1`,
        {
          headers: {
            Authorization: FSQ_API_KEY,
            Accept: 'application/json',
          },
        },
      )
      if (photosRes.ok) {
        const photos = await photosRes.json()
        if (photos?.[0]) {
          photo_url = `${photos[0].prefix}800x600${photos[0].suffix}`
        }
      }
    }

    const lat: number | null = place.geocodes?.main?.latitude ?? null
    const lng: number | null = place.geocodes?.main?.longitude ?? null

    const google_maps_url =
      lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`

    return {
      fsq_id:         place.fsq_id,
      name:           place.name,
      address:        place.location?.formatted_address ?? place.location?.address ?? '',
      lat,
      lng,
      rating:         place.rating != null ? Math.round(place.rating * 10) / 10 : null,
      photo_url,
      google_maps_url,
      website:        place.website ?? null,
      phone:          place.tel ?? null,
      hours:          place.hours?.display ?? null,
    }
  } catch {
    return null
  }
}
