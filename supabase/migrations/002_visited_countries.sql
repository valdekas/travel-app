-- ============================================================
-- VISITED COUNTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS visited_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  continent TEXT NOT NULL,
  region TEXT,
  visit_count INTEGER DEFAULT 1,
  first_visit_date DATE,
  last_visit_date DATE,
  notes TEXT,
  favorite_city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, country_code)
);

ALTER TABLE visited_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own visited countries" ON visited_countries
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_visited_countries_updated_at
  BEFORE UPDATE ON visited_countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
