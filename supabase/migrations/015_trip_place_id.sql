-- Add Google Place ID to trips for server-side Places Details API hero image fetching
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS place_id TEXT;
