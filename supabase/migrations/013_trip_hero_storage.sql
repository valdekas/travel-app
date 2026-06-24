-- Trip hero images — Supabase Storage bucket + RLS policies
-- Bucket is public so hero URLs render in <img> tags without auth.
-- Upload/delete is restricted to the authenticated owner by folder path.
-- Path pattern: {userId}/{tripId}/hero.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-heroes',
  'trip-heroes',
  true,
  5242880,   -- 5 MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Remove any stale policies before (re-)creating them
DROP POLICY IF EXISTS "trip_heroes_insert" ON storage.objects;
DROP POLICY IF EXISTS "trip_heroes_select" ON storage.objects;
DROP POLICY IF EXISTS "trip_heroes_update" ON storage.objects;
DROP POLICY IF EXISTS "trip_heroes_delete" ON storage.objects;

-- Public read — hero URLs are embedded in <img>/<Image> tags without auth.
CREATE POLICY "trip_heroes_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-heroes');

-- Authenticated users may upload only to their own user-ID folder.
CREATE POLICY "trip_heroes_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trip-heroes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users may update (overwrite) only their own hero images.
CREATE POLICY "trip_heroes_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'trip-heroes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users may delete only their own hero images.
CREATE POLICY "trip_heroes_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trip-heroes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
