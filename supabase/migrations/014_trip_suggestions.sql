-- Trip suggestions: pre-generated AI recommendations stored per trip
CREATE TABLE trip_suggestions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category            TEXT         NOT NULL, -- 'Restaurants' | 'Attractions' | 'Viewpoints' | 'Museums' | 'Bars' | 'Parks & Nature'
  name                TEXT         NOT NULL,
  description         TEXT,
  why_visit           TEXT,
  price_range         TEXT,
  best_time_to_visit  TEXT,
  must_try            TEXT,
  tip                 TEXT,
  emoji               TEXT,
  added_to_places     BOOLEAN      NOT NULL DEFAULT FALSE,
  added_to_itinerary  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  DEFAULT now()
);

ALTER TABLE trip_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trip suggestions"
  ON trip_suggestions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_trip_suggestions_trip_id ON trip_suggestions(trip_id);
