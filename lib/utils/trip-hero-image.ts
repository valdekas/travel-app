import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Downloads a Google Places photo URL server-side and uploads it to the
 * trip-heroes Supabase Storage bucket. Returns the permanent public URL, or
 * null on any failure (caller should fall back to the original Google URL).
 *
 * Path: {userId}/{tripId}/hero.{ext}  — upsert so re-storing updates in place.
 */
export async function downloadAndStoreHeroImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  googleImageUrl: string,
  userId: string,
  tripId: string,
): Promise<string | null> {
  try {
    const response = await fetch(googleImageUrl)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : 'jpg'

    const path = `${userId}/${tripId}/hero.${ext}`
    const { error } = await supabase.storage
      .from('trip-heroes')
      .upload(path, buffer, { contentType, upsert: true })

    if (error) return null

    const { data } = supabase.storage.from('trip-heroes').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}

/** Returns true for temporary Google Places / Maps photo URLs. */
export function isGooglePhotoUrl(url: string): boolean {
  return url.includes('maps.googleapis.com') || url.includes('googleusercontent.com')
}
