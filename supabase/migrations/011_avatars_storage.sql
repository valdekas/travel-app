-- Avatars — Supabase Storage bucket + RLS policies
-- Bucket is public so avatar URLs render in <img> tags without auth.
-- Upload/delete is restricted to the authenticated owner by folder path.
-- Path pattern: {userId}/avatar.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,   -- 2 MB per file (matches client-side validation in account-settings.tsx)
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif',  'image/webp',
    'image/heic', 'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Remove any stale policies before (re-)creating them
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

-- Authenticated users may upload only to their own user-ID folder.
-- Storage path: {userId}/avatar.{ext}
CREATE POLICY "avatars_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read — avatar URLs are embedded in <img> tags and must load without auth.
CREATE POLICY "avatars_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users may update (overwrite) only their own avatar.
CREATE POLICY "avatars_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users may delete only their own avatar.
CREATE POLICY "avatars_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
