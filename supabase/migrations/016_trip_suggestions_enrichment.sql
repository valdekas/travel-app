-- Enrich trip_suggestions with Foursquare Places API data
ALTER TABLE trip_suggestions
  ADD COLUMN IF NOT EXISTS fsq_place_id    TEXT,
  ADD COLUMN IF NOT EXISTS address         TEXT,
  ADD COLUMN IF NOT EXISTS lat             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS rating          NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS reviews_count   INTEGER,
  ADD COLUMN IF NOT EXISTS photo_url       TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS website         TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS hours           TEXT;
