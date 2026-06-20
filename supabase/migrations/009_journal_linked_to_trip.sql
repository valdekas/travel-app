-- Persist the "Trip destination" choice on journal entries.
-- Without this column, selecting "Trip destination" saved location_id = null,
-- which is indistinguishable from "No location" on reload.

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS linked_to_trip BOOLEAN NOT NULL DEFAULT FALSE;
