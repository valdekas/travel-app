-- Add city, region, and destination coordinates to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS city   TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS lat    DECIMAL(10,7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS lng    DECIMAL(10,7);
