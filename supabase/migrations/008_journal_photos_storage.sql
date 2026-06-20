-- Journal Photos — Supabase Storage bucket + RLS policies
-- Bucket is public so photo URLs work directly in journal_entries.photos TEXT[]
-- Upload/delete is restricted to the authenticated owner by folder path.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-photos',
  'journal-photos',
  true,
  10485760,   -- 10 MB per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif',  'image/webp',
    'image/heic', 'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Remove any stale policies before (re-)creating them
DROP POLICY IF EXISTS "journal_photos_insert"  ON storage.objects;
DROP POLICY IF EXISTS "journal_photos_select"  ON storage.objects;
DROP POLICY IF EXISTS "journal_photos_delete"  ON storage.objects;

-- Authenticated users may upload only to their own user-ID folder.
-- Storage path: {userId}/{tripId}/{filename}
CREATE POLICY "journal_photos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'journal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read — any URL from this bucket is readable without auth.
CREATE POLICY "journal_photos_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-photos');

-- Users may only delete their own photos.
CREATE POLICY "journal_photos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'journal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
