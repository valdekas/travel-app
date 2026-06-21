-- Add is_planning flag to trips
-- Defaults TRUE so all existing trips remain in "Planning" state
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_planning BOOLEAN NOT NULL DEFAULT TRUE;
