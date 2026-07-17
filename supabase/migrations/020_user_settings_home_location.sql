ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS home_city    TEXT,
  ADD COLUMN IF NOT EXISTS home_country TEXT,
  ADD COLUMN IF NOT EXISTS home_airport TEXT; -- IATA code e.g. "DUB", "VNO", "LHR"
