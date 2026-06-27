-- Add travel time columns to itinerary_items
-- Populated by the auto-schedule API; cleared when user manually reorders via drag-and-drop

ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS travel_time_to_next     TEXT,
  ADD COLUMN IF NOT EXISTS travel_distance_to_next TEXT,
  ADD COLUMN IF NOT EXISTS travel_mode_to_next     TEXT;
