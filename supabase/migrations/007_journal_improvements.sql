-- Add time and is_favorite columns to journal_entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS time TEXT,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
