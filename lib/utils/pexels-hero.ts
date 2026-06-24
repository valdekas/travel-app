interface PexelsPhoto {
  src: { large2x: string; large: string; original: string }
}

interface PexelsResponse {
  photos: PexelsPhoto[]
}

/**
 * Fetches a high-quality landscape travel photo from Pexels for the given
 * city/country. Server-side only — PEXELS_API_KEY must never be exposed to
 * the client. Returns the photo URL or null on any failure.
 */
export async function fetchPexelsHeroImage(
  city: string,
  country: string,
): Promise<string | null> {
  if (!process.env.PEXELS_API_KEY) return null
  try {
    const query = encodeURIComponent(`${city} ${country} travel landmark`)
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } },
    )
    if (!res.ok) return null
    const data = await res.json() as PexelsResponse
    const photos = data.photos ?? []
    if (photos.length === 0) return null
    return photos[0].src.large2x ?? photos[0].src.large ?? null
  } catch {
    return null
  }
}
