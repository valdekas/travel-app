-- Add location fields to itinerary_items
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS location_name      TEXT,
  ADD COLUMN IF NOT EXISTS formatted_address  TEXT,
  ADD COLUMN IF NOT EXISTS city               TEXT,
  ADD COLUMN IF NOT EXISTS region             TEXT,
  ADD COLUMN IF NOT EXISTS country            TEXT,
  ADD COLUMN IF NOT EXISTS latitude           DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS longitude          DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS google_place_id    TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url    TEXT;

-- Extend type constraint to include new types (old types kept for backward compatibility)
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_type_check;
ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_type_check CHECK (
    type IN (
      'flight','transport','checkin','checkout','meal','activity','tour','event','rest','other',
      'hotel','restaurant','attraction','beach','viewpoint','car_rental','shopping'
    )
  );
