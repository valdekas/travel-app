-- Replace Foursquare enrichment columns with TripAdvisor equivalents.
-- fsq_place_id is dropped in favour of ta_location_id; price_level is new.
-- All other enrichment columns (address, lat, lng, rating, reviews_count,
-- photo_url, google_maps_url, website, phone, hours) are kept as-is.

ALTER TABLE trip_suggestions
  DROP   COLUMN IF EXISTS fsq_place_id,
  ADD    COLUMN IF NOT EXISTS ta_location_id TEXT,
  ADD    COLUMN IF NOT EXISTS price_level    TEXT;
