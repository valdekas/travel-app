ALTER TABLE budget_items
  ADD COLUMN IF NOT EXISTS itinerary_item_id UUID
  REFERENCES itinerary_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_budget_items_itinerary_item_id
  ON budget_items(itinerary_item_id);
