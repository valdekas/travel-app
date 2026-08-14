-- Enforce one budget_items row per itinerary_item_id at the database level.
-- itinerary_item_id is nullable — most budget rows are manually-added
-- expenses with no linked itinerary item — so this must stay a partial
-- index that only constrains the rows that do reference one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_items_itinerary_item_id_unique
  ON budget_items (itinerary_item_id)
  WHERE itinerary_item_id IS NOT NULL;
