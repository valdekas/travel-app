-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  cover_photo TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS (hierarchical: country → region → city → place)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('region','city','attraction','restaurant','beach','viewpoint','hotel','activity','transport','other')),
  category TEXT,
  description TEXT,
  notes TEXT,
  estimated_visit_time INTEGER, -- minutes
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  visited BOOLEAN DEFAULT FALSE,
  google_maps_link TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  address TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('documents','packing','custom')),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date DATE,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITINERARY DAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  day_number INTEGER,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITINERARY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'activity' CHECK (type IN ('flight','transport','checkin','checkout','meal','activity','tour','event','rest','other')),
  cost DECIMAL(10,2) DEFAULT 0,
  confirmation_number TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('flights','hotels','food','activities','transport','shopping','other')),
  title TEXT NOT NULL,
  planned_amount DECIMAL(12,2) DEFAULT 0,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  date DATE,
  notes TEXT,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE,
  title TEXT,
  content TEXT,
  photos TEXT[] DEFAULT '{}',
  mood TEXT CHECK (mood IN ('amazing','great','good','okay','bad')),
  weather TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT,
  region TEXT,
  city TEXT,
  place_name TEXT NOT NULL,
  place_type TEXT DEFAULT 'attraction' CHECK (place_type IN ('attraction','restaurant','beach','viewpoint','hotel','activity','city','region','other')),
  description TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  google_maps_link TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  estimated_cost DECIMAL(10,2),
  converted_to_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Users can manage their own trips" ON trips FOR ALL USING (auth.uid() = user_id);

-- Locations policies
CREATE POLICY "Users can manage locations of their trips" ON locations FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Checklist policies
CREATE POLICY "Users can manage checklist of their trips" ON checklist_items FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Itinerary days policies
CREATE POLICY "Users can manage itinerary days of their trips" ON itinerary_days FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Itinerary items policies
CREATE POLICY "Users can manage itinerary items of their trips" ON itinerary_items FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Budget items policies
CREATE POLICY "Users can manage budget items of their trips" ON budget_items FOR ALL
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- Journal entries policies
CREATE POLICY "Users can manage their own journal entries" ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can manage their own wishlist" ON wishlist_items FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itinerary_items_updated_at BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wishlist_items_updated_at BEFORE UPDATE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
