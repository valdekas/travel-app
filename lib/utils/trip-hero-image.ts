import type { SupabaseClient } from '@supabase/supabase-js'

const HERO_MAX_SIZE      = 5 * 1024 * 1024 // 5 MB — matches bucket config
const HERO_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function validateHeroImageFile(file: File): string | null {
  if (!HERO_ALLOWED_TYPES.includes(file.type)) {
    return 'Unsupported format. Please use JPEG, PNG, or WebP.'
  }
  if (file.size > HERO_MAX_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`
  }
  return null
}

/**
 * Uploads a user-selected File to the trip-heroes bucket. Returns the
 * permanent public URL, or null on failure. Safe to call client-side.
 *
 * Path: {userId}/{tripId}/hero.{ext}  — upsert overwrites previous hero.
 */
export async function uploadCustomHeroImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  file: File,
  userId: string,
  tripId: string,
): Promise<string | null> {
  try {
    const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
    const path = `${userId}/${tripId}/hero.${ext}`
    const { error } = await supabase.storage
      .from('trip-heroes')
      .upload(path, file, { contentType: file.type, upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('trip-heroes').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}

/**
 * Downloads a Google Places photo URL in the BROWSER (where the session token
 * in the URL is still valid) and uploads the resulting blob to the trip-heroes
 * Supabase Storage bucket. Returns the permanent public URL, or null on any
 * failure. Must be called client-side — server-side fetch returns 403.
 *
 * Path: {userId}/{tripId}/hero.{ext}  — upsert so re-storing updates in place.
 */
export async function downloadAndUploadHeroImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  googleUrl: string,
  userId: string,
  tripId: string,
): Promise<string | null> {
  try {
    const response = await fetch(googleUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
    const path = `${userId}/${tripId}/hero.${ext}`
    const { error } = await supabase.storage
      .from('trip-heroes')
      .upload(path, blob, { contentType: blob.type, upsert: true })
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
