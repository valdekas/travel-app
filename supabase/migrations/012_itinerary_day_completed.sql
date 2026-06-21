-- Mark individual itinerary days as completed (persisted, cross-device)
-- Completed days are visually distinguished but remain fully editable.
ALTER TABLE itinerary_days
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;
