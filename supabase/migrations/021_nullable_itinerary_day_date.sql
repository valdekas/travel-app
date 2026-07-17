-- Allow itinerary days to exist without a specific date
-- (needed when trip is created without known travel dates)
ALTER TABLE itinerary_days
  ALTER COLUMN date DROP NOT NULL;
