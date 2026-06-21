-- Visited sub-regions (states, provinces, territories, regions)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS visited_regions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code     TEXT        NOT NULL,
  country_name     TEXT        NOT NULL,
  region_code      TEXT        NOT NULL,
  region_name      TEXT        NOT NULL,
  region_type      TEXT        NOT NULL DEFAULT 'region',
  first_visit_date DATE,
  last_visit_date  DATE,
  visit_count      INTEGER     NOT NULL DEFAULT 1,
  notes            TEXT,
  favorite_city    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, country_code, region_code)
);

ALTER TABLE visited_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own visited regions"
  ON visited_regions FOR ALL
  USING (auth.uid() = user_id);

-- Optional: auto-update updated_at
CREATE OR REPLACE FUNCTION update_visited_regions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER visited_regions_updated_at
  BEFORE UPDATE ON visited_regions
  FOR EACH ROW EXECUTE FUNCTION update_visited_regions_updated_at();
