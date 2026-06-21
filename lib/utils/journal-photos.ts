import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET = 'journal-photos'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif',  'image/webp',
  'image/heic', 'image/heif',
]

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    return 'Unsupported file type. Please use JPEG, PNG, WebP, GIF, or HEIC.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
  }
  return null
}

/**
 * Uploads a photo to Supabase Storage and returns the public URL.
 * Path: {userId}/{tripId}/{timestamp}_{random}.{ext}
 */
export async function uploadJournalPhoto(
  supabase: SupabaseClient,
  file: File,
  userId: string,
  tripId: string,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase().replace('jpg', 'jpeg') ?? 'jpeg'
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const storagePath = `${userId}/${tripId}/${uniqueName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * Returns true when the URL belongs to our journal-photos bucket.
 * Used to decide whether to attempt storage deletion.
 */
export function isJournalStorageUrl(url: string): boolean {
  return url.includes(`/storage/v1/object/public/${BUCKET}/`)
}

/**
 * Deletes a photo from Supabase Storage.
 * No-ops silently for external URLs (URL-pasted photos).
 */
export async function deleteJournalPhoto(supabase: SupabaseClient, url: string, userId: string): Promise<void> {
  if (!isJournalStorageUrl(url)) return

  const marker = `/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return

  const storagePath = url.slice(idx + marker.length)

  // Only delete if the path starts with this user's ID (safety check)
  if (!storagePath.startsWith(`${userId}/`)) return

  await supabase.storage.from(BUCKET).remove([storagePath])
}
