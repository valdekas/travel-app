# Changelog

## 2026-06-28 (Auto-update travel times after drag-and-drop reorder)

### Changed — `app/api/itinerary/auto-schedule/route.ts`
Added `travelTimesOnly?: boolean` flag to the POST body. When `true`, the Claude reordering step is skipped entirely — activities are used in the order received — and only the Google Maps Directions leg runs. Returns the same `{ optimizedOrder, travelTimes }` shape.

### Changed — `components/itinerary/itinerary-content.tsx`
- **`handleDragEnd`**: extracted reordered items before `setDays` so they can be passed directly to the recalculation function. Removed the old "stale hint" approach.
- **`recalculateTravelTimes`**: new async function called in the background after every drag reorder. Skips days with fewer than 2 activities that have coordinates. Calls `/api/itinerary/auto-schedule` with `travelTimesOnly: true`, then writes results to DB and updates local state. Tracks loading state per day.
- **`retryRecalcTravelTimes`**: retry entry point called from the per-day failure button.
- **State**: replaced `staleScheduleDayIds` with `recalculatingDayIds` (Set) and `failedRecalcDayIds` (Set).
- **DayCard UI**: while recalculating shows a "Updating travel times…" spinner below the activity list; on failure shows an "↻ Update travel times" button.
- **Auto-schedule full flow** (`handleApplySchedule`) clears `failedRecalcDayIds` for the applied day.
- **Mobile ✨ Schedule button**: moved from ⋯ overflow dropdown to directly visible in the day header row (icon-only, 44px touch target on mobile; labeled button on desktop).

---

## 2026-06-27 (Fix: save coordinates when adding from Suggestions)

### Changed — `components/trips/suggestions-content.tsx`
`handleAddToItinerary` now writes `latitude`, `longitude`, `location_name`, `formatted_address`, and `google_maps_url` to the inserted `itinerary_items` row. Source fields: `s.lat`, `s.lng`, `s.name`, `s.address`, `s.google_maps_url` from the `TripSuggestion` object.

### Changed — `components/itinerary/itinerary-suggestions-panel.tsx`
`handleAdd` rows now include the same five coordinate/location fields from each `TaResult` object (`s.lat`, `s.lng`, `s.name`, `s.address`, `s.google_maps_url`).

### Changed — `app/api/itinerary/auto-schedule/route.ts`
Added `console.log` for activities received, activities with coords, and travel times computed — visible in PM2 logs to confirm the fix is working.

---

## 2026-06-27 (✨ Auto-schedule itinerary days)

### Added — `supabase/migrations/018_itinerary_travel_times.sql`
Three new nullable columns on `itinerary_items`: `travel_time_to_next`, `travel_distance_to_next`, `travel_mode_to_next`.

### Added — `app/api/itinerary/auto-schedule/route.ts`
POST endpoint accepting `{ dayId, tripId, activities, city, country }`.
1. Claude (Haiku) optimises activity order for the day and suggests start times (museums morning, lunch 12-13, dinner 19+).
2. Google Maps Directions API computes travel time + distance between each consecutive pair of activities that have coordinates. Tries walking first; switches to transit/driving if > 20 min walk.
3. Returns `{ optimizedOrder, travelTimes }`.

### Changed — `lib/types/index.ts`
Added `travel_time_to_next`, `travel_distance_to_next`, `travel_mode_to_next` optional fields to `ItineraryItem`.

### Changed — `components/itinerary/itinerary-content.tsx`
- **✨ Schedule button** in day header (desktop, visible when 2+ activities) and in ⋯ dropdown (mobile). Shows loading spinner while calling the API.
- **Preview dialog**: shows reordered activities with suggested times and travel time connectors (🚶/🚗/🚌 + duration + distance) between each pair. "Cancel" / "Apply Schedule" actions.
- **Apply**: writes `order_index`, `start_time`, and travel time fields to DB + updates local state. Manual drag-and-drop remains fully functional after applying.
- **Stale hint**: drag-and-drop now clears `travel_time_*` columns (DB + state) for the reordered day and shows "♻️ Travel times cleared — re-run ✨ Schedule to update".
- **Travel time connectors** displayed between consecutive activity cards in the day view.

---

## 2026-06-27 (Fix itinerary day date calculation)

### Changed — `components/itinerary/itinerary-content.tsx`
- `addDay`: date is now `trip.start_date + (nextDayNumber - 1)` when a start date exists, instead of `lastDay.date + 1`. Eliminates date drift after deletions. Falls back to last-day+1 (or null) when trip has no start date.
- `deleteDay`: renumbering now also recalculates each day's date as `trip.start_date + index` and writes both `day_number` and `date` to DB. Dates snap back to the correct range after any deletion.

---

## 2026-06-27 (Fix itinerary day renumbering after deletion)

### Changed — `components/itinerary/itinerary-content.tsx`
`deleteDay` now renumbers all remaining days sequentially starting from 1 after a deletion. Steps: delete from DB → sort remaining by current `day_number` → assign `index + 1` → `Promise.all` updates to DB → update local state. Dates are untouched; only `day_number` changes.

---

## 2026-06-27 (Complete stale-days fix: refresh on mount)

### Changed — `components/trips/suggestions-content.tsx`
Added `useEffect` (dep: `trip.id`) that re-fetches `itinerary_days` on component mount. Ensures `liveDays` is already current when the user opens the day picker, even before clicking "+ Itinerary".

### Changed — `components/itinerary/itinerary-suggestions-panel.tsx`
Same mount-time re-fetch. `useEffect` added (dep: `trip.id`). Also added `useEffect` to React imports.

---

## 2026-06-27 (Fix stale day list in Suggestions day picker)

### Changed — `components/trips/suggestions-content.tsx`
- Added `liveDays` state (initialized from server-fetched `itineraryDays`)
- Added `openDayPicker` async function: sets the selected suggestion immediately (dialog opens), then re-fetches `itinerary_days` from Supabase and updates `liveDays`
- Day picker dialog shows 3 skeleton placeholders while re-fetching; "Add to Day" button disabled during fetch
- Dialog uses `liveDays` instead of the static `itineraryDays` prop

### Changed — `components/itinerary/itinerary-suggestions-panel.tsx`
- Added `liveDays` state (initialized from `days` prop)
- `openPanel` now fires a background re-fetch of `itinerary_days` and updates `liveDays` + auto-selects the single day if there's only one
- Day `<Select>` in footer renders `liveDays`; `needsDayPick` uses `liveDays.length`
- `handleAdd` queries live item count from `itinerary_items` instead of using stale `items.length` for `order_index`

---

## 2026-06-27 (Fix accidental day deletion UX)

### Changed — `components/itinerary/itinerary-content.tsx`
- Day header: replaced standalone red 🗑 trash button with a neutral ⋯ `DropdownMenu`; "Delete day" appears as a destructive item inside — requires two deliberate taps to trigger
- Confirm dialog for day deletion: description now shows exact activity count ("all 3 activities"); confirm button label changed from "Delete" to "Delete Day"
- Right-side button group gap increased from `gap-1` (4px) to `gap-2` (8px) for clearer touch separation on mobile

---

## 2026-06-27 (Suggestions panels: Fix search to use TripAdvisor nearby_search)

### Changed — `app/api/suggestions/search/route.ts`
Replaced text-based `location/search` with coordinate-based `location/nearby_search`.

**Coordinate resolution (in priority order):**
1. If `area` provided → Google Geocoding API geocodes `"{area}, {city}, {country}"` → 5km radius nearby search
2. Trip's own `lat/lng` (passed from panel as `tripLat`/`tripLng`) → 20km radius nearby search
3. Google Geocoding of `"{city}, {country}"` → 20km radius nearby search
4. Text search fallback (last resort if no coordinates available or nearby returns 0 results)

`GOOGLE_PLACES_API_KEY` is used server-side for geocoding (never exposed to client).

### Changed — `components/trips/places-suggestions-panel.tsx`
Fetch body now includes `tripLat: trip.lat ?? null` and `tripLng: trip.lng ?? null` for use as fallback city coordinates.

### Changed — `components/itinerary/itinerary-suggestions-panel.tsx`
Same change as places panel.

---

## 2026-06-27 (Suggestions panels: Replace Claude AI with TripAdvisor direct search)

### Added — `app/api/suggestions/search/route.ts`
New POST endpoint. Accepts `{ category, city, country, area }`. Maps 12 category IDs (6 places + 6 itinerary) to TripAdvisor `category` filter + optional `searchPrefix` for specialised terms (e.g. `"viewpoints panoramic"`, `"bars cocktails nightlife"`). Runs a location search, takes up to 10 results, then enriches each sequentially with details + photos (100ms delay). Returns `TaSearchResult[]` with `ta_location_id`, `name`, `address`, `rating`, `reviews_count`, `photo_url`, `google_maps_url`, `website`, `price_level`.

### Changed — `components/trips/places-suggestions-panel.tsx`
- Replaced `PlaceSuggestion` (Claude text) type with `TaResult` (TripAdvisor data)
- `fetchResults` now calls `/api/suggestions/search` instead of `/api/recommendations`
- Cache key updated to `suggestions_ta_{tripId}_{catId}_places_{area}` to distinguish from old Claude cache
- `SuggestionCard` replaced with `TaCard`: 112px photo (gradient fallback), rating + review count, address line, branded Maps/Web/TA external links (stopPropagation so they don't toggle selection), price badge (same normalizer as Suggestions tab)
- `SkeletonCard` updated to match photo-based layout
- Empty state: "No results found — try a different area or category" with "Change area" button
- Header subtitle updated: "find real places on TripAdvisor"
- Loading subtitle: "Searching TripAdvisor…"

### Changed — `components/itinerary/itinerary-suggestions-panel.tsx`
Same changes as places panel. Day selector and `handleAdd` flow preserved unchanged. `start_time` and `description` set to null (TripAdvisor doesn't return these; user fills them in the activity form if needed).

---

## 2026-06-27 (Bug fix: Stale "Added ✓" badges on Suggestion cards)

### Fixed — `components/itinerary/itinerary-content.tsx`
`deleteItem` now looks up the deleted activity's title before removing it from the DB, then fires a fire-and-forget Supabase update to reset `added_to_itinerary = false` in `trip_suggestions` where `trip_id` and `name` match. Silently ignores misses (no matching suggestion).

### Fixed — `components/trips/places-content.tsx`
`deleteLocation` now looks up the deleted location's name before removing it, then resets `added_to_places = false` in `trip_suggestions` by `trip_id` + `name` match. Same graceful-ignore pattern.

### Added — `components/trips/suggestions-content.tsx`
On mount (once per trip load), the Suggestions tab fetches current `itinerary_items.title` and `locations.name` for the trip, cross-checks them against suggestions where `added_to_itinerary` or `added_to_places` is `true`, and batch-resets any stale flags both in the DB and in local state. Handles edge cases: bulk deletes, direct DB changes, or any scenario where Parts 1/2 didn't fire.

---

## 2026-06-26 (Settings: Currency preference applied to new trips)

### Changed — `app/(dashboard)/trips/new/page.tsx`
Converted from sync to async server component. Fetches `user_settings.currency` for the current user and passes it as `defaultCurrency` to `CreateTripForm`. Falls back to `'EUR'` if no setting exists.

### Changed — `components/trips/create-trip-form.tsx`
Added `CreateTripFormProps { defaultCurrency?: string }`. The `currency` field in the form's initial `useState` now uses `defaultCurrency` (default `'EUR'`) instead of a hardcoded string. Existing trips are unaffected — they always display their own saved `trip.currency`.

---

## 2026-06-26 (Suggestions: Generation reliability fixes)

### Changed — `app/api/suggestions/generate/route.ts`

**FIX 1 — Error logging**: `generateForCategory` catch block now logs the error with category + destination context instead of silently swallowing it. Per-category stats logged after enrichment: `[Suggestions] {category}: generated N items, enriched M with TA data`.

**FIX 2 — Per-category cache guard**: Replaced "skip if any suggestions exist" with "skip only if all 6 categories are present". Route now queries existing category names, computes `missingCategories`, and only generates + inserts the missing ones. A trip with a failed Restaurants run will now regenerate Restaurants on next visit to the Suggestions tab.

**FIX 4 — Bars prompt**: Updated `CATEGORY_FOCUS.Bars` to emphasise hotel rooftop bars, well-known cocktail lounges, and venues indexed in major city guides (Time Out, Condé Nast). Explicitly discourages niche/underground bars that TA doesn't index.

### Manual step required (FIX 3)
Run in Supabase SQL editor to clear incomplete suggestions for the latest Chicago trip:
```sql
DELETE FROM trip_suggestions
WHERE trip_id = (SELECT id FROM trips ORDER BY created_at DESC LIMIT 1);
```
Then visit the Suggestions tab — the page will auto-trigger regeneration for all 6 missing categories.

---

## 2026-06-26 (Suggestions: Improve Claude prompt for TripAdvisor match rate)

### Changed — `app/api/suggestions/generate/route.ts`
- `buildPrompt()` rewritten with a richer, category-aware prompt
- Emphasises well-known, established, highly-reviewed places likely in TripAdvisor's database
- Instructs Claude to use exact place names as they appear on TripAdvisor/Google Maps
- Adds per-category focus (`CATEGORY_FOCUS` map): Restaurants → Michelin/Time Out picks; Attractions → UNESCO/landmarks; Museums → high-traffic institutions; Bars → award-listed venues; Viewpoints → photographed panoramic spots; Parks → famous public green spaces
- Discourages niche, obscure, or recently-opened venues that won't be in travel databases
- JSON schema unchanged; no DB or enrichment logic changes

---

## 2026-06-26 (Suggestions: Filter to enriched-only cards)

### Changed — `components/trips/suggestions-content.tsx`
- Cards are now filtered to only show suggestions where both `photo_url` and `rating` are non-null (TripAdvisor enriched)
- Non-enriched suggestions are hidden entirely from the UI; DB/generation logic unchanged
- Tab count badges reflect visible (enriched) count per category, not raw stored count
- Category tabs with 0 enriched suggestions are grayed out and disabled
- All-tab count shows total enriched suggestions
- Empty state distinguishes "no suggestions yet" from "enrichment in progress"

---

## 2026-06-26 (Suggestions: Replace Foursquare with TripAdvisor Content API)

### Removed
- `lib/utils/foursquare.ts` — deleted entirely
- `fsq_place_id` column removed via migration 017

### Added — `lib/utils/tripadvisor.ts`
Server-side utility. `searchTripAdvisorPlace(name, city, country)` makes up to 3 TA API calls:
1. `GET /location/search` — find location_id
2. `GET /location/{id}/details` — rating, reviews_count, address, coords, website, phone, price_level
3. `GET /location/{id}/photos` — largest available photo URL
Returns `TripAdvisorPlace | null` — null on any error or missing key.

### Added — `supabase/migrations/017_trip_suggestions_tripadvisor.sql`
Drops `fsq_place_id`, adds `ta_location_id TEXT` and `price_level TEXT`.
**⚠️ Must be applied manually in Supabase SQL editor.**

### Changed — `app/api/suggestions/generate/route.ts`
- Replaced `Promise.allSettled` parallel enrichment with sequential `for` loop + 100 ms delay per suggestion to respect TA rate limits
- `searchTripAdvisorPlace` replaces `searchFoursquarePlace`
- Enrichment fields updated: `ta_location_id`, `price_level` (replaces `fsq_place_id`)

### Changed — `lib/types/index.ts`
`TripSuggestion` — `fsq_place_id` removed, `ta_location_id` + `price_level` added.

### Changed — `components/trips/suggestions-content.tsx`
- Price badge: prefers `price_level` (TA) over AI `price_range` fallback
- Rating: displays as `⭐ {rating} · {n} reviews` (TA 1–5 scale, no "/10")
- New `✈️ TA` link button in card footer → `tripadvisor.com/Location_Review-d{id}`

## 2026-06-26 (Suggestions: Foursquare enrichment — photos, ratings, addresses)

### Added — `lib/utils/foursquare.ts`
New server-side utility. `searchFoursquarePlace(name, city, country)` calls Foursquare Places API v3:
1. `GET /v3/places/search?query=…&near=…&fields=…` — returns top result
2. If photos not in search response: `GET /v3/places/{fsq_id}/photos` — separate fetch
Returns `FoursquarePlace | null` — null on any error or missing key (full graceful degradation).
**FSQ free tier note:** 1 000 calls/day. 90 suggestions/trip × up to 2 calls each = ~180 calls/trip → ~5 trips/day before limit.

### Added — `supabase/migrations/016_trip_suggestions_enrichment.sql`
`ALTER TABLE trip_suggestions ADD COLUMN IF NOT EXISTS` for: `fsq_place_id`, `address`, `lat`, `lng`, `rating`, `reviews_count`, `photo_url`, `google_maps_url`, `website`, `phone`, `hours`.
**⚠️ Must be applied manually in Supabase SQL editor.**

### Changed — `app/api/suggestions/generate/route.ts`
After Claude generates all 6 categories, each suggestion is enriched via `searchFoursquarePlace` with `Promise.allSettled` (failures fall back to AI-only data). Enrichment fields written to DB alongside existing AI fields.

### Changed — `lib/types/index.ts`
`TripSuggestion` interface extended with all 11 enrichment fields (all `| null | undefined` — backwards compatible with pre-enrichment rows).

### Changed — `components/trips/suggestions-content.tsx`
`SuggestionCard` redesigned:
- **Hero area** (h-36): real Foursquare photo if available, falls back to category gradient + large emoji
- **Rating row**: ⭐ `{rating}/10` when FSQ rating exists  
- **Address line**: 📍 formatted address (1-line truncated)
- **Footer actions**: existing `+ Places` / `+ Itinerary` + new `🗺 Maps` link (opens Google Maps) and `🌐 Web` link (opens website) — only shown when FSQ data present
- Price badge moved to photo overlay (top-right corner)

## 2026-06-26 (Suggestions tab — 15 per category + category filter tabs)

### Changed — `app/api/suggestions/generate/route.ts`
- Prompt updated: "List exactly 15" instead of 5 per category
- `max_tokens` raised from 2000 → 6000 to accommodate larger responses
- `.slice(0, 5)` → `.slice(0, 15)` so all 15 items are stored

### Changed — `components/trips/suggestions-content.tsx`

**Category filter tabs (Part 2):**
- Sticky tab bar below the page header: "✨ All" + one tab per category (7 total)
- Tabs scroll horizontally on mobile (`overflow-x-auto no-scrollbar`)
- Active tab: violet pill (`bg-violet-600 text-white`); count badge per tab
- **All view**: each category section collapses to first 5 cards; "Show all N ↓" expands to full list; "Show less ↑" collapses back; count label is a shortcut to jump to that category's tab
- **Single-category view**: clean 1-col (mobile) / 2-col (desktop) grid showing all 15 suggestions; no "Show more" needed
- Switching tabs resets the view without page navigation

**Skeleton loading state (Part 3):**
- Replaces the old centered spinner with a compact inline loading header + 6 skeleton cards in a grid
- Tabs are rendered disabled (faded, `cursor-not-allowed`) so the user sees the structure immediately
- Auto-polls Supabase every 5s (up to 12 attempts / 60s) — identical cadence to before

## 2026-06-26 (Landing phone showcase — fix gap and scroll-reset bug)

### Fixed — `components/landing/LandingPhoneShowcase.tsx`

**Root cause:** Section used a `4 × 55vh = 220vh` scroll-driven sticky container. This caused two bugs:
1. **Large gap** — 120vh of invisible scroll space after the sticky content visually finished.
2. **Scroll-reset bug** — `useMotionValueEvent` on `scrollYProgress` overrode the manually clicked `activeIndex` on every scroll event.

**Fix:** Replaced the scroll-driven sticky approach with a normal `py-24` section and a simple auto-advancing carousel:
- `setInterval` at 3 500 ms cycles through all 4 features automatically
- Clicking a feature sets that index **and** resets the interval (via a `tick` counter dependency) so the selected screen stays visible for a full 3.5 s before advancing
- No scroll position involvement — clicking always wins, no snap-back
- Added progress dots below the feature list as a visual affordance

## 2026-06-25 (Landing page redesign — light theme, Notion/Linear aesthetic)

### Changed — `app/page.tsx` (full rewrite) + new `components/landing/`

**Design direction:** White/`#FAFAFA` background, dark slate text, violet primary accent. Compact and purposeful — Notion/Linear aesthetic replacing the previous dark full-page design.

**New sections (7 components under `components/landing/`):**

- **`landing-nav.tsx`** — Sticky 64px header: "Travel Pro" logo, "Sign in" ghost button, "Get started free" violet CTA. Clean border-bottom, white bg/backdrop-blur.
- **`landing-hero.tsx`** — Centered headline ("Plan trips. Remember adventures."), AI badge, subheadline, primary + secondary CTAs, trust text. Animated 3-panel app preview: browser-chrome mock with sidebar, auto-rotates every 3.8s between Dashboard / Itinerary / Budget panels with fade transitions and 3D perspective tilt. Framer Motion entrance animations.
- **`landing-map.tsx`** — "Your world, beautifully mapped" using `react-simple-maps` in demo mode: visited countries (violet), planned (light violet), 4 flag markers; stats row below.
- **`landing-features.tsx`** — "Everything in one workspace": 6 feature cards 3×2 grid (Places, Budget, Itinerary, Journal, Calendar, AI Suggestions), hover lift, New badge on AI Suggestions.
- **`landing-demo.tsx`** — "See it in action": browser-chrome window with 4-tab interactive Tokyo demo (Overview / Places / Itinerary / Budget), fully static sample data, AnimatePresence tab transitions, "Create your own trip →" CTA.
- **`landing-pricing.tsx`** — Two cards: Free (€0/forever, all features, violet CTA) and Pro (Coming Soon, waitlist email form with toast confirmation).
- **`landing-footer.tsx`** — Minimal footer: brand, Privacy/Terms/Contact links, Sign in + Get started links.

**All CTAs** link to `/auth/login`. Authenticated routes untouched.

## 2026-06-25 (Date range picker — replace two separate date inputs with single two-month calendar)

### Added — `components/ui/date-range-picker.tsx` (new reusable component)
- Single trigger button showing formatted range: "Aug 25 → Sep 5, 2026" or placeholder when empty
- Inline calendar panel (expands in DOM flow — no z-index or overflow-clip issues inside dialogs)
- Uses existing `Calendar` component with `mode="range"` from react-day-picker v10
- Desktop: two months side by side; mobile (< 640 px): one month
- `numberOfMonths` prop overrides the responsive default (edit dialog passes `1` explicitly)
- Footer: contextual hint ("Click a departure date", "Now pick your return date", "12 nights") + Clear + Confirm buttons
- Clicking the trigger while open discards uncommitted draft selections
- Clear button (×) on trigger when dates are set; clicking ×  clears and closes immediately

### Changed — `components/trips/create-trip-form.tsx`
- Replaced two-column grid of `<Input type="date">` fields with `<DateRangePicker>`
- Same `start_date`/`end_date` field names and ISO string format — Supabase unchanged

### Changed — `components/trips/edit-trip-dialog.tsx`
- Same replacement with `numberOfMonths={1}` to fit the narrow dialog

## 2026-06-25 (Fix destination display name — use place.name instead of administrative area)

### Changed — `components/ui/places-autocomplete.tsx`

**Problem:** Selecting "Mallorca" (or any island/region/landmark) from autocomplete stored Google's administrative area name ("Balearic Islands") as the city, because `locality` is empty for non-city places and `administrative_area_level_2` contained the bureaucratic name.

- `extractPlace()` now derives `city` using: `place.name` → `locality` → `administrative_area_level_2` → `administrative_area_level_1`
- `place.name` is always the specific human-readable label shown in the dropdown — exactly what the user sees and expects to be stored
- Country extraction is unchanged

## 2026-06-25 (Remove Pexels API — gradient placeholder instead of irrelevant fallback images)

### Removed
- `lib/utils/pexels-hero.ts` — deleted entirely; `fetchPexelsHeroImage` no longer exists
- `app/api/trips/pexels-hero/route.ts` — old standalone Pexels route deleted

### Changed — `app/api/trips/fetch-hero/route.ts`
- Removed Pexels fallback path; if Google Places photo fails or `place_id` is absent, route now returns `{ success: false }` immediately
- Removed `city`/`country` destructuring from request body (no longer used)
- Hero pipeline is now: Google Places → Supabase Storage ✅ or gradient placeholder ✅ (no random Pexels photos)

## 2026-06-25 (Fix destination field UX in edit-trip-dialog — clear affordance for dropdown requirement)

### Changed — `components/trips/edit-trip-dialog.tsx`

**Problem:** Typing a destination manually without selecting from the autocomplete dropdown left `place_id` unchanged (silently using the old stored value), making "Use destination image" either fetch the wrong trip's photo or show a confusing error.

- **Fix 1 — Status hint below destination field:** Shows `✓ Location confirmed — destination image available` (emerald) when `place_id` is set; shows `Select a suggestion from the dropdown to enable destination image` (muted) when not. Label simplified from "Destination (updates hero image source)" to "Destination".
- **Fix 2 — Clear `place_id` on manual typing:** `onChange` now calls `set('place_id', '')` alongside `set('city', v)` — typing manually always clears the confirmed place, so "Use destination image" will correctly report no confirmed destination rather than silently using a stale `place_id`.
- **Fix 3 — Button disabled when no `place_id`:** "Use destination image" is `disabled` when `!form.place_id`, with a `title` tooltip "Select a destination from the dropdown first". No more silent failure or wrong-photo fetches.
- **Fix 4 — Informative success toast:** After a successful fetch, shows "Destination image updated — save changes to apply" so the user knows the preview is live but Save is still needed.

## 2026-06-25 (Fix hero image editing — 4 issues in edit dialog and change-photo flow)

### Changed — `components/trips/edit-trip-dialog.tsx`, `components/trips/trip-detail-shell.tsx`

**Fix 1 — "Use destination image" now calls `/api/trips/fetch-hero` instead of static lookup:**
- `applyDestinationImage` is now async; uses `form.place_id || trip.place_id` to call `/api/trips/fetch-hero`
- If no `place_id` stored on the trip: shows toast "No destination image available — try uploading your own"
- On success: sets `form.cover_photo` to the real Google/Pexels URL and clears any pending file selection
- Button shows `Loader2` spinner + "Fetching…" while in-flight (`fetchingDestImg` state)
- Removed `getCityOrCountryImage` import — static Unsplash lookup no longer used here

**Fix 2 — "Reset to auto" in change-photo dialog now re-fetches a real photo:**
- `handlePhotoReset` NULLs `cover_photo` in DB and shows gradient immediately (same as before for no-place_id trips)
- If `trip.place_id` exists: fires fire-and-forget `fetch('/api/trips/fetch-hero', ...)` after closing dialog
- On resolve with a URL: updates `imgSrc` + clears `imgError` in-place without a full page reload
- Toast changes to "Cover photo removed — fetching destination image…" when background fetch is triggered

**Fix 3 — Change-photo dialog preview no longer shows wrong Unsplash fallback:**
- Preview renders `<img>` only when `heroPreviewUrl` or `(imgSrc && !imgError)` — i.e. a real URL exists
- Otherwise renders the matching indigo/blue gradient placeholder with destination initial
- Removes the `onError` Unsplash fallback that was masking the gradient state

**Fix 4 — Destination in edit dialog updates `place_id` via PlacesAutocomplete:**
- Plain `<Input>` for City in the Cover Image section replaced with `PlacesAutocomplete`
- `onPlaceSelect` callback sets both `city` and `place_id` from the autocomplete result
- `place_id` is already included in the UPDATE payload — no extra change needed there

## 2026-06-25 (Fix hero image loading order — gradient placeholder first, real photo after background fetch)

### Changed — `components/trips/create-trip-form.tsx`, `components/trips/trip-detail-shell.tsx`, `components/dashboard/trip-card.tsx`

**Problem:** New trips immediately showed a static Unsplash fallback image, which was then replaced by the Google/Pexels background fetch result 5–10s later — a jarring image swap.

**Fix — no eager cover_photo on INSERT:**
- `create-trip-form.tsx`: `cover` is now `form.cover_photo || null` — only a user-pasted URL is used immediately; `getCityOrCountryImage` / `getDestinationImage` fallbacks removed from the INSERT path. Background `fetch-hero` still runs unchanged.

**Fix — gradient placeholder shown until real photo arrives:**
- `trip-detail-shell.tsx`: `imgError` initialises to `!trip.cover_photo` — gradient shows immediately for new trips, not only after a load failure. `handlePhotoReset` sets gradient (`imgError=true`) instead of loading a static Unsplash URL.
- Gradient redesigned: deep indigo→blue→slate with radial accents; destination initial badge + city/country label + "Add cover photo" CTA centred over it.
- `trip-card.tsx`: `showGradient` initialises to `!trip.cover_photo`; replaces three-level image fallback chain. Gradient uses same indigo/blue palette with large destination initial. `getDestinationImage` / `getCityOrCountryImage` imports removed from both files.

**UX result:** Create trip → gradient shown immediately (intentional, not broken) → refresh after 5–10s → real photo from Google Places (or Pexels fallback) appears. No swap on first load.

## 2026-06-25 (Hero images via Google Places Details API with Pexels fallback)

### Added — `supabase/migrations/015_trip_place_id.sql`, `app/api/trips/fetch-hero/route.ts`
### Changed — `lib/types/index.ts`, `components/trips/create-trip-form.tsx`, `components/trips/edit-trip-dialog.tsx`, `components/trips/trip-detail-shell.tsx`
### Removed — `app/api/trips/hero/route.ts` (retired 410 stub)

**Root cause of previous failures:** Google Places photo URLs served from `maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto` are browser-session-scoped and cannot be fetched server-side (403) or via client-side `fetch()` (CORS). The Places *Details* API + Place Photo API are server-safe with a standard API key.

**New flow — `POST /api/trips/fetch-hero`:**
1. Accepts `{ tripId, placeId?, city?, country? }` — authenticated via cookies, verifies trip ownership
2. **Path A — Google**: calls Places Details API (`?fields=photos`) → extracts `photo_reference` → calls Place Photo API (`maxwidth=1200`, follows 302 redirect) → uploads `Buffer` to `trip-heroes` Storage at `{userId}/{tripId}/hero.jpg` → updates `cover_photo`
3. **Path B — Pexels fallback**: if placeId missing or any Google step fails, calls existing `fetchPexelsHeroImage` → updates `cover_photo` with permanent Pexels URL
4. Returns `{ success, source: 'google'|'pexels', url }` — errors never throw, trip creation always succeeds

**`place_id` stored on trips:**
- Migration `015_trip_place_id.sql`: `ALTER TABLE trips ADD COLUMN IF NOT EXISTS place_id TEXT`
- `Trip` interface gains `place_id?: string`
- `create-trip-form.tsx`: stores `place_id` from `onPlaceSelect` → included in INSERT → fires `fetch('/api/trips/fetch-hero', ...)` fire-and-forget (replaces separate `pexels-hero` call)
- `edit-trip-dialog.tsx`: initialises `place_id` from `trip.place_id` → included in UPDATE

**Cleanup:**
- `/api/trips/hero` (410 stub) removed — no longer referenced anywhere
- `trip-detail-shell.tsx` `onError`: removed Google URL DB cleanup (we no longer store Google URLs) — simplified to `setImgError(true)`
- `isGooglePhotoUrl` import removed from `trip-detail-shell.tsx`

**Prerequisites (manual):**
- Apply migration 015 in Supabase Dashboard or via CLI
- `GOOGLE_PLACES_API_KEY` must have no HTTP referrer restrictions (server-side requests have no referrer) — verify in Google Cloud Console

## 2026-06-24 (Replace Google Places hero images with Pexels API)

### Added — `lib/utils/pexels-hero.ts`, `app/api/trips/pexels-hero/route.ts`
### Changed — `components/trips/create-trip-form.tsx`, `components/trips/trip-detail-shell.tsx`, `components/dashboard/trip-card.tsx`, `lib/utils/trip-hero-image.ts`

**Root cause:** Google Places `PhotoService.GetPhoto` URLs are browser-session-scoped and cannot be fetched server-side (403) or via client-side `fetch()` (CORS). The previous client-side download approach also failed silently.

**Fix — Pexels API (server-side only):**
- New `lib/utils/pexels-hero.ts`: `fetchPexelsHeroImage(city, country)` calls `https://api.pexels.com/v1/search` — landscape orientation, picks the top result's `large2x` URL
- New `POST /api/trips/pexels-hero`: authenticated route that verifies trip ownership, calls `fetchPexelsHeroImage`, updates `cover_photo` in DB
- `create-trip-form.tsx`: after trip INSERT, fires `fetch('/api/trips/pexels-hero', ...)` as fire-and-forget (no `await`); if Pexels fails, trip still creates successfully with no cover photo
- `PEXELS_API_KEY` lives in `.env.local` as a plain (non-NEXT_PUBLIC_) env var — never exposed to the browser

**Gradient placeholder (`trip-detail-shell.tsx`):**
- `imgError` state tracks failed image loads
- When `imgError` is true, renders a CSS gradient div (`from-slate-700 via-slate-800 to-slate-900`) with radial indigo/violet accents instead of the broken `<Image>`
- `onError`: if the broken URL was a Google URL, silently NULLs `cover_photo` in DB so it won't fail again on next load
- "Add cover photo" button centered on the gradient opens the photo dialog

**Cleanup:**
- `downloadAndUploadHeroImage` removed from `lib/utils/trip-hero-image.ts` (CORS-blocked, dead code)
- `trip-card.tsx` `onError` simplified — cascades fallbacks without any DB writes (Pexels URLs are permanent)
- No changes to user-uploaded photo flow (device upload via `uploadCustomHeroImage` still works)

---

## 2026-06-24 (Fix hero image storage: client-side download replaces broken server route)

### Changed — `lib/utils/trip-hero-image.ts`, `components/trips/create-trip-form.tsx`, `app/api/trips/hero/route.ts`

**Root cause:** Google Places `PhotoService.GetPhoto` URLs are browser-session-scoped and tied to the `r_url` referrer parameter. Server-side `fetch()` from the VPS returned 403 because the Node.js process had no matching session or referrer. The `/api/trips/hero` route was therefore always returning 500 (`permanentUrl = null`).

**Fix — client-side download (`create-trip-form.tsx`):**
- After trip INSERT, if `cover_photo` is a Google URL and no custom file was selected, calls `downloadAndUploadHeroImage(supabase, cover, user.id, data.id)` directly in the browser (fire-and-forget via `.then()`)
- The browser fetch succeeds because the `r_url` referrer matches `travel365.live` and the session token in the URL is still valid
- On success: updates `cover_photo` in DB with the permanent Supabase Storage URL
- On failure: DB retains the Google URL; the `onError` handler in `trip-detail-shell.tsx` self-heals later

**New utility (`lib/utils/trip-hero-image.ts`):**
- Added `downloadAndUploadHeroImage(supabase, googleUrl, userId, tripId)` — browser-only function that fetches the URL as a Blob and uploads to `trip-heroes` bucket
- Removed `downloadAndStoreHeroImage` (dead server-side code — same logic but 403-prone)

**`/api/trips/hero` route retired:**
- Replaced with a 410 Gone stub explaining the deprecation
- All Storage uploads now run client-side: `uploadCustomHeroImage` (device file picker) and `downloadAndUploadHeroImage` (Google URL blob)

**Verified:** `edit-trip-dialog.tsx` and `trip-detail-shell.tsx` already use `@/lib/supabase/client` (browser client) — no server route involvement, no changes needed.

**Remaining prerequisite:** The `trip-heroes` Storage bucket must be created manually in Supabase Dashboard (migration 013 was never applied). Once the bucket exists, all three upload paths (new trip / edit dialog / change photo button) will work.

## 2026-06-24 (Suggestions tab — AI-generated trip recommendations)

### Added — `supabase/migrations/014_trip_suggestions.sql`, `app/api/suggestions/generate/route.ts`, `app/(dashboard)/trips/[id]/suggestions/page.tsx`, `components/trips/suggestions-content.tsx`
### Changed — `lib/types/index.ts`, `components/trips/trip-detail-shell.tsx`, `components/trips/create-trip-form.tsx`

**New Suggestions tab in trip detail navigation** (between Places and Itinerary):
- Pre-generated AI recommendations stored in Supabase and displayed in a dedicated tab
- Fire-and-forget generation triggered automatically at trip creation — does not block the redirect

**Database (`014_trip_suggestions.sql`):**
- `trip_suggestions` table: id, trip_id, user_id, category, name, description, why_visit, price_range, best_time_to_visit, must_try, tip, emoji, added_to_places, added_to_itinerary
- RLS policy: users manage only their own suggestions
- Index on trip_id for fast per-trip fetches

**Generation API (`POST /api/suggestions/generate`):**
- Authenticated via cookies (fire-and-forget from browser has auth cookies on same origin)
- Verifies trip belongs to the authenticated user before generating
- Skips if suggestions already exist (idempotent)
- Calls Claude Haiku for all 6 categories in parallel (5 items each)
- Graceful: if one category fails to parse, it's skipped; others are stored
- Maps Claude camelCase fields to DB snake_case columns

**Suggestions tab UI (`suggestions-content.tsx`):**
- 6 category sections: Restaurants, Attractions, Viewpoints, Museums, Bars, Parks & Nature
- Cards: emoji, name, price badge (colour-coded), description, why-visit quote, best-time, must-try chip, insider tip
- Horizontal scroll per category on mobile; responsive grid (2-4 cols) on desktop
- **+ Places** button → inserts into `locations` table, marks `added_to_places = true`, optimistic UI
- **+ Itinerary** button → day picker dialog (lists itinerary days with date), inserts into `itinerary_items`, marks `added_to_itinerary = true`
- Added cards show "✓ In Places" / "✓ In Itinerary" badges instead of buttons
- **Generating state**: animated Sparkles loader with bouncing dots while waiting (polls every 5s via `router.refresh()`, up to 60s)
- **Empty state**: friendly message with Refresh button if polling exhausted

## 2026-06-24 (Custom hero image upload for trips)

### Added — `validateHeroImageFile`, `uploadCustomHeroImage` in `lib/utils/trip-hero-image.ts`
### Changed — `components/trips/edit-trip-dialog.tsx`, `components/trips/create-trip-form.tsx`, `components/trips/trip-detail-shell.tsx`

Users can now upload a custom cover photo for any trip from three entry points:

**Edit Trip Dialog (`edit-trip-dialog.tsx`):**
- "Upload photo" button opens a hidden `<input type="file">` (JPEG/PNG/WebP, max 5 MB)
- Selected file is immediately previewed via `URL.createObjectURL`
- On Save: `uploadCustomHeroImage` runs before the DB update; returned URL replaces `cover_photo`
- File and URL inputs are mutually exclusive — selecting one clears the other
- Object URL is revoked on dialog close
- Graceful degradation: if upload fails, other changes (name, dates, budget, etc.) still save

**Create Trip Form (`create-trip-form.tsx`):**
- "Upload photo" button added to the Cover Image card, alongside "Use destination image" and "Paste URL"
- Selecting a file previews it immediately; destination auto-fill does not overwrite a selected file
- On submit: if a file was selected, `uploadCustomHeroImage` runs after INSERT and updates `cover_photo` (overrides the Google URL fire-and-forget path)
- Clearing the photo or clicking "Use destination image" discards the file selection

**Trip Detail Shell — floating "Change photo" button (`trip-detail-shell.tsx`):**
- Camera icon button floats over the hero image: always visible on mobile, revealed on hover on desktop
- Opens a modal dialog with: current image preview, "Upload from device" card, "Reset to auto" card
- Reset to auto: clears `cover_photo` in the DB and falls back to `getCityOrCountryImage` / `getDestinationImage`
- Upload: validates, uploads to Supabase Storage, updates DB, updates `imgSrc` state immediately without full reload
- `router.refresh()` syncs server state after both save and reset

**Shared utilities (`lib/utils/trip-hero-image.ts`):**
- `validateHeroImageFile(file)` — checks MIME type and size; returns error string or null
- `uploadCustomHeroImage(supabase, file, userId, tripId)` — uploads to `{userId}/{tripId}/hero.{ext}` with upsert, returns permanent public URL or null

---

## 2026-06-24 (Fix expiring Google Places hero images via Supabase Storage)

### Added — `supabase/migrations/013_trip_hero_storage.sql`, `lib/utils/trip-hero-image.ts`, `app/api/trips/hero/route.ts`
### Changed — `components/trips/create-trip-form.tsx`, `components/trips/trip-detail-shell.tsx`, `components/dashboard/trip-card.tsx`

**Root cause:** Google Places photo URLs (`maps.googleapis.com/…`) are signed temporary URLs that expire after a few hours, breaking hero images for all trips after first load.

**Fix for new trips (`create-trip-form.tsx`):**
- After trip is created in the DB, if `cover_photo` is a Google URL, fires a background POST to `/api/trips/hero` (fire-and-forget — does not block the UX or redirect)
- API route downloads the Google image server-side, uploads to `trip-heroes` Supabase Storage bucket at `{userId}/{tripId}/hero.{ext}`, then updates the trip's `cover_photo` to the permanent `supabase.co` URL
- Graceful degradation: if download/upload/update fails, trip retains the Google URL and the self-healing fallback (below) handles it

**New API route (`POST /api/trips/hero`):**
- Authenticated — uses server Supabase client (cookies), rejects unauthenticated requests
- Validates that the URL is a Google Photo URL before downloading
- Guards the DB update with both `id` and `user_id` filters (belt-and-suspenders on top of RLS)
- Returns `{ permanentUrl }` on success, error JSON with appropriate status on failure

**New utility (`lib/utils/trip-hero-image.ts`):**
- `downloadAndStoreHeroImage(supabase, googleImageUrl, userId, tripId)` — server-side only
- `isGooglePhotoUrl(url)` — detects `maps.googleapis.com` and `googleusercontent.com` URLs

**Self-healing for existing trips (`trip-card.tsx`, `trip-detail-shell.tsx`):**
- Both components now detect when a hero image fails to load (onError)
- If `trip.cover_photo` is a Google URL, silently update the DB with the stable Unsplash fallback via the existing `getCityOrCountryImage` / `getDestinationImage` logic
- `trip-detail-shell.tsx` gained image state (`useState`) and `onError` handler (previously had neither)
- Existing trips self-heal on first view — no batch migration needed

**Storage bucket (`013_trip_hero_storage.sql`):**
- Public bucket `trip-heroes`, 5 MB limit, JPEG/PNG/WebP
- Policies: public SELECT, authenticated INSERT/UPDATE/DELETE restricted to own folder (`{userId}/…`)

**Part 4 — approach chosen: onError self-healing (not migration endpoint)**
Rationale: existing Google URLs are already expired and cannot be re-downloaded. A migration endpoint would fetch 0 bytes from 403-ing URLs. The onError approach self-heals on first view with stable Unsplash URLs from the existing image map, requires no batch processing, and permanently fixes the DB entry so the image loads correctly from then on.

## 2026-06-24 (Suggestions cache: localStorage, 24h TTL, 50-entry cap)

### Changed — `lib/utils/suggestions-cache.ts`

- Switched from `sessionStorage` to `localStorage` — cache now survives tab closes and browser restarts
- TTL extended from 30 minutes to 24 hours
- `setCachedSuggestions` now calls `evictOldest()` after every write: scans all `suggestions_*` keys, sorts by timestamp ascending, removes the oldest until count ≤ 50

## 2026-06-24 (Suggestions: optional area/neighbourhood refinement step)

### Added — `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`, `app/api/recommendations/route.ts`, `components/ui/places-autocomplete.tsx`

**New intermediate "area" step between category selection and results:**
- After choosing a category, a "Where in [city]?" screen appears before fetching
- Google Places autocomplete biased to trip's lat/lng (50 km radius) when coordinates are stored
- Selecting an area shows a removable pill: `📍 River North ×`
- "Skip — search all of [city]" text link fetches whole-city results (existing behaviour)
- "Find [Category] near [Area]" / "Find [Category] in [City]" primary button adapts label to selection
- Back navigation: area step → categories; results step → area step (to change area without re-selecting category)

**Cache key updated to include area:**
- `suggestions_${trip.id}_${cat.id}_places_${area || 'all'}` — River North and Wicker Park results cached separately; whole-city has its own entry
- Identical category + area combination within 30 min → instant cache hit, no API call

**API prompt updated to focus on area when provided:**
- Places: "Suggest 15 [category] near [area] in [city]. Focus specifically on the [area] neighbourhood and immediate surroundings."
- Itinerary: same area-scoped prompt
- Without area: existing whole-city prompt unchanged

**`PlacesAutocomplete` — optional `locationBias` prop:**
- `locationBias?: { lat: number; lng: number; radiusMeters?: number }` — biases autocomplete predictions without hard-filtering; falls back to global if omitted
- All existing usages unaffected (prop is optional)

## 2026-06-24 (Suggestions: 30-min cache + richer suggestion cards)

### Added/Changed — `lib/utils/suggestions-cache.ts` (new), `app/api/recommendations/route.ts`, `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`

**Client-side 30-minute sessionStorage cache (`lib/utils/suggestions-cache.ts`):**
- New `getCachedSuggestions<T>(key)` / `setCachedSuggestions<T>(key, data)` helpers
- Cache key format: `suggestions_${trip.id}_${categoryId}_${type}` (unique per trip + category + panel type)
- TTL: 30 minutes — expired entries are auto-removed on read
- All sessionStorage calls wrapped in try/catch for private browsing compatibility
- Cache hit: results appear instantly, loading state skipped, no API call made
- Only successful responses are cached; errors are never stored
- `goBack()` now also resets `loading` state to prevent stale state on rapid navigation

**Richer suggestion cards — places:**
New fields returned by API and displayed on each card:
- `priceRange` — small monospace badge ("$" / "$$" / "$$$" / "$$$$" / "Free") next to category badge
- `whyVisit` — one compelling reason, shown in muted italic below description
- `bestTimeToVisit` — shown with 🕐 prefix in meta row
- `tip` — one insider tip, shown with 💡 prefix in meta row
- `mustTry` — signature dish/drink for Restaurants and Bars only (null for all other categories), shown with 🍽️ prefix

**Richer suggestion cards — itinerary:**
- `tip` — one practical tip added to each activity card, shown with 💡 prefix below description

**API route updates (`route.ts`):**
- Places prompt now requests all 9 fields including `mustTry` (with explicit null instruction for non-food categories)
- Itinerary prompt now requests `tip` field
- `max_tokens` increased to 4000 to accommodate larger responses
- Example objects in prompts updated to include all new fields

---

## 2026-06-24 (Suggestions: category-first two-step panel redesign)

### Changed — `app/api/recommendations/route.ts`, `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`

**API route:**
- Now accepts `category` in POST body (e.g. `"Restaurants"`, `"guided tours and experiences"`)
- Prompt rewritten: "Suggest exactly 15 ${categoryLabel} specifically in ${location}" — returns 15 items instead of 8–10
- `max_tokens` increased to 3000 to accommodate larger responses

**Places Suggestions Panel (full rewrite):**
- Two-step flow: category picker → results (no auto-fetch on open)
- 6 category cards in a 2-col grid: Restaurants, Attractions, Viewpoints, Museums, Bars, Parks & Nature
- Opening the panel shows categories; selecting one triggers the fetch and transitions to results
- Back button (`← CategoryName`) in sub-header returns to category picker without closing
- `locationType` comes from the selected `PlaceCategory` object, not per-item API response
- Loading state: 8 skeleton cards while fetching
- Error state: inline error with "Try again" button that re-fetches the same category
- Footer (Cancel + Add N Places) only appears in results step when suggestions are loaded

**Itinerary Suggestions Panel (full rewrite, mirrors Places):**
- Same two-step flow with 6 activity-focused categories: Dining, Sightseeing, Tours, Shopping, Nature, Nightlife
- Each category maps to an `ItineraryItemType` for DB insert
- Day selector (shown only when multiple days exist and ≥1 suggestion is selected) uses date-fns to format day labels as "Day N — Mon, Jan 1"
- Auto-selects the only day when the trip has exactly 1 day

---

## 2026-06-23 (Suggestions: stronger city extraction and city-forcing prompt)

### Fixed — `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`, `app/api/recommendations/route.ts`

**Client-side (`extractCity` helper, both panels):**
Replaced `trip.city || trip.country` with a proper `extractCity(trip)` function:
1. Uses `trip.city` if set and not equal to the country name (Google Places `locality`)
2. Falls back to `trip.region` if set and not equal to the country (e.g. "Costa Blanca", "Alicante")
3. Falls back to `trip.country` as last resort

Dialog subtitle also updated to use `extractCity(trip)` so it shows the resolved city name.

**Server-side prompt rewrite (`route.ts`):**
Added `cityName` variable (first comma-segment of `destination`, e.g. `"Costa Blanca"` from `"Costa Blanca, Alicante"`). Both prompts now:
- Open with `IMPORTANT: Only suggest [places/activities] physically located in ${cityName} itself`
- Include concrete counter-examples ("if Chicago: Millennium Park, Lou Malnati's… NOT generic US attractions")
- End every descriptive field instruction with "in ${cityName}" to reinforce locality

---

## 2026-06-23 (Fix Suggestions button label and city-specific prompts)

### Fixed — `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`, `app/api/recommendations/route.ts`

- Removed "AI" from all user-visible text: button labels now read "✨ Suggestions", dialog titles read "Suggestions"
- API route prompts now lead with the specific city (`destination`) rather than country — e.g. "Chicago, United States" not "United States". Added explicit instruction to suggest real, well-known spots *in that city*, not generic country-level attractions. Chicago trip now correctly returns Millennium Park, deep dish restaurants, Architecture Boat Tour, etc.
- Location string builds as `city, country` when city ≠ country; falls back to country alone when no city is set

---

## 2026-06-23 (AI Suggestions for Places and Itinerary tabs)

### Added — `app/api/recommendations/route.ts`, `components/trips/places-suggestions-panel.tsx`, `components/itinerary/itinerary-suggestions-panel.tsx`; wired into `components/trips/places-content.tsx` + `components/itinerary/itinerary-content.tsx`

New "✨ AI Suggestions" feature powered by Anthropic Claude API (claude-sonnet-4-6):

**API route** (`/api/recommendations` POST):
- Accepts `{ type: 'places' | 'itinerary', destination, country, duration, existingItems }`
- Calls Claude server-side (API key never exposed to client)
- Strips accidental markdown fences from response before JSON.parse
- Returns `{ suggestions: [...] }` — 8–10 items per call
- Returns friendly error JSON on failure; logs detail to server console

**Places tab** (`PlacesSuggestionsPanel`):
- Violet-accented "AI Suggestions" button next to "+ Add Place"
- Dialog with skeleton loading cards (6 placeholders while fetching)
- Suggestion cards: emoji pill + name + category badge + 1-sentence description
- Click to toggle selection (violet border + background highlight); selected count shown
- "Add N Places" bulk-inserts into `locations` table; calls `refresh()` on success
- Error state with "Try again" button

**Itinerary tab** (`ItinerarySuggestionsPanel`):
- Same panel pattern; button only visible when ≥1 day exists
- Suggestion cards additionally show suggested time (Clock icon) and duration (Timer icon)
- Day selector: auto-selects the only day if 1 exists; shows Select dropdown when multiple days
- "Add N Activities" bulk-inserts into `itinerary_items`; updates local `days` state via `onAdded` callback without page reload
- Deduplication: existing activity names passed to Claude prompt via `existingItems`

**SDK**: `@anthropic-ai/sdk` installed (`--legacy-peer-deps`).

⚠️ **Requires `ANTHROPIC_API_KEY` in `.env.local`** — not currently set; clicking Suggestions will show a friendly error until the key is added.

---

## 2026-06-23 (Fix Trip Readiness itinerary score to use days with activities)

### Fixed — `components/dashboard/trip-readiness-widget.tsx`, `components/dashboard/dashboard-content.tsx`, `app/(dashboard)/dashboard/page.tsx`, `components/trips/trip-overview-content.tsx`

Itinerary score was measuring total days created (including auto-created empty days), making it always 100% for any trip with dates. Now measures days that have at least one activity — consistent with the Overview stat card "X/Y days planned" format.

Changes:
- **TripReadinessWidget**: renamed prop `itineraryDays` → `itineraryDaysWithActivities`; score formula now divides by `tripDuration` as before but numerator is days-with-activities not total days
- **Dashboard page**: upgraded `itinerary_days` query from `select('id')` to `select('id, itinerary_items(id)')`, computes `daysWithActivities` via `.filter(d => d.itinerary_items.length > 0).length`
- **DashboardContent**: prop renamed `nextTripItineraryDays` → `nextTripItineraryDaysWithActivities`; both widget call sites updated
- **TripOverviewContent**: now passes `itineraryDaysWithActivities` (already available) instead of `itineraryDaysCount` (total) to the widget

Result: new trip with 7 auto-created empty days → Itinerary readiness = 0%; trip with 3/7 days with activities → ~43%.

---

## 2026-06-23 (Auto-create itinerary days on trip creation)

### Added — `components/trips/create-trip-form.tsx`

After inserting a new trip and its default checklist items, `handleSubmit` now auto-generates `itinerary_days` rows when both `start_date` and `end_date` are provided:

- Calculates inclusive day count (`end - start + 1`), capped at 30 days.
- Bulk-inserts one row per day with `day_number`, `date`, and `is_completed: false`.
- On insert failure: logs the error to console but does not block trip creation — days can always be added manually.
- No dates set: skips silently, no rows inserted.

---

## 2026-06-23 (Itinerary stat card: show X/Y days planned format)

### Changed — `app/(dashboard)/trips/[id]/overview/page.tsx`, `components/trips/trip-overview-content.tsx`

**Overview page:** Extended `itinerary_days` query from `select('id')` to `select('id, itinerary_items(id)')` to fetch which days have activities. Computes `daysWithActivities` (days with ≥1 activity) and passes it as new `itineraryDaysWithActivities` prop.

**Stat card:** Replaced the empty placeholder div with a real Progress bar (`daysWithActivities/totalDays * 100`). Big number now shows `X/Y` format (e.g. "3/5") instead of just total days. Falls back to "0" when no days exist. Subtitle stays "days planned".

---

## 2026-06-23 (Fix Dashboard Countries Visited to match World Map exactly)

### Fixed — `components/dashboard/dashboard-content.tsx`

Previous fix introduced `partialOnlyCount` which incorrectly added countries from `visited_regions` (states/provinces visited) — inflating the count from 5 to 9.

Replaced with an exact mirror of the World Map formula:
```
tripCompletedCodes = trips.filter(completed).map(t => resolveA2(t.country_code, t.country))
countriesVisited   = union(visitedCountryCodes, tripCompletedCodes).size
```

Key difference: uses `resolveA2()` (from `lib/utils/country-codes`) to normalize country names to ISO2 codes, so trips without `country_code` set still count correctly — same as `world-map-widget.tsx` line 718. No partial countries added to the count; `partiallyVisitedRegions` is only used for map colouring, not for the numeric stat.

Dashboard stat card now shows 5, matching World Map stats bar.

---

## 2026-06-23 (Fix Dashboard "Countries Visited" count inconsistency)

### Fixed — `components/dashboard/dashboard-content.tsx`

**Bug:** Dashboard stats showed 4 countries visited while World Map showed 5. Three separate issues in the old formula:

1. **Ternary instead of union:** `visitedCountryCodes.length > 0 ? visitedCountryCodes.length : tripCompleted.size` — when manually-added countries existed, trip-completed countries were silently ignored. Should be a union.
2. **Missing trip-completed countries:** when manually-visited > 0, countries from completed trips were excluded entirely.
3. **Missing partial-only countries:** countries with regions visited (from `partiallyVisitedRegions`) but not fully marked were not counted at all.

**Fix:** Replaced with:
```
tripCompletedCodes = ISO2 codes from all completed trips (t.country_code)
fullyVisitedSet    = union(visitedCountryCodes, tripCompletedCodes)
partialOnlyCount   = partiallyVisitedRegions keys NOT already in fullyVisitedSet
countriesVisited   = fullyVisitedSet.size + partialOnlyCount
```

This matches the World Map's counting logic and now correctly shows 5 for fully visited + partially visited combined. All downstream consumers (`StatsGrid`, `TravelStatsCard`, `AchievementsWidget`) receive the corrected value via prop — no changes needed to child components.

The Visited Countries page intentionally shows "N fully · M partial" separately — left unchanged.

---

## 2026-06-23 (Replace all native confirm() dialogs with styled ConfirmDialog)

### Added — `components/ui/confirm-dialog.tsx`

New shared `ConfirmDialog` component matching the styled delete dialog already used in `trip-detail-shell.tsx`. Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `confirmLabel`. Always renders a red destructive confirm button, a Cancel outline button, and a "⚠️ This action cannot be undone." warning banner.

### Fixed — `components/itinerary/itinerary-content.tsx`

Replaced both `confirm()` calls (delete activity, delete day) with `ConfirmDialog`. Added `PendingDelete` union type state (`{ type: 'item' } | { type: 'day' }`). Dialog title and description switch based on pending type. Actual delete functions now execute only after confirmation.

### Fixed — `components/checklist/checklist-content.tsx`

Removed `confirm()` from both delete paths in `ChecklistItemRow` (desktop hover button + mobile dropdown). Parent now intercepts via `setPendingDeleteId` instead of calling `deleteItem` directly. `ConfirmDialog` executes `deleteItem` on confirm.

### Fixed — `components/trips/places-content.tsx`

Replaced `confirm()` in `deleteLocation`. Both JSX call sites (`onDelete` prop) now point to `setPendingDeleteId`. `ConfirmDialog` calls `deleteLocation` on confirm.

### Fixed — `components/budget/budget-content.tsx`

Replaced both `confirm()` calls (desktop delete button + mobile dropdown). Both now call `setPendingDeleteId`. `ConfirmDialog` calls `deleteItem` on confirm.

---

## 2026-06-23 (Fix Trip Readiness budget score: measure planning completeness)

### Fixed — `components/dashboard/trip-readiness-widget.tsx`

Budget score previously used an existence flag (has trip budget set + has any budget items → 100%). Replaced with a proportional formula:

```
budgetScore = tripBudget > 0 ? min(round(budgetPlanned / tripBudget * 100), 100) : 0
```

- No trip budget set → 0%
- Trip budget set, no items → 0%
- $1,500 planned of $3,000 budget → 50%
- $3,000+ planned of $3,000 budget → 100%

`budgetPlanned` = sum of `planned_amount` across all budget items (already computed at call sites). `tripBudget` = `trip.budget` prop (already correctly passed). No call-site changes needed.

---

## 2026-06-23 (Fix Trip Readiness itinerary decimal display)

### Fixed — `components/dashboard/trip-readiness-widget.tsx`

`itineraryScore` was not wrapped in `Math.round()` in the `components` array (line 53), causing the per-metric label to display decimals (e.g. "16.666666666666668%"). The other three metrics were already rounded. One-line fix: `pct: Math.round(itineraryScore)`.

---

## 2026-06-23 (Fix Trip Readiness scoring logic)

### Fixed — `components/dashboard/trip-readiness-widget.tsx`, `components/trips/trip-overview-content.tsx`, `components/dashboard/dashboard-content.tsx`

Three of the four readiness metrics were binary flags that jumped to 100% on trivial conditions:

**Itinerary (was binary, now proportional):** `itineraryDays > 0 ? 100 : 0` → `Math.min((itineraryDays / tripDuration) * 100, 100)`. A 12-day trip with 2 days planned now shows ~17% instead of 100%. Falls back to binary when no trip dates are set.

**Budget (was binary, now staged):** `budgetPlanned > 0 ? 100 : 0` → 100% only when both a trip-level budget *and* budget items exist; 50% when one but not both; 0% when neither. Encourages users to set both a trip budget and itemise spending.

**Places (was fixed threshold, now duration-relative):** `min(count/5, 1)` → target is `max(floor(tripDuration/2), 3)`. A 2-day trip needs 3 places for 100%; a 12-day trip needs 6. Scales meaningfully with trip length.

**Checklist unchanged** — `completed/total` was already correct.

New props added to `TripReadinessWidget`: `tripDuration: number` and `tripBudget: number`. Both call sites updated (Dashboard and Overview tab). `calcTripDuration` imported from `lib/utils` at each call site to compute duration from `trip.start_date` / `trip.end_date`.

---

## 2026-06-23 (Polish Trip Detail Overview tab)

### Changed — `components/trips/trip-overview-content.tsx`

Brought the Overview tab to parity with the visual quality of the Budget and Journal tabs:

**Stat cards:** all 4 cards (Checklist / Budget / Places / Itinerary) now use the Budget-tab pattern — `relative overflow-hidden` card, 3px colored left-border accent, icon in a soft tinted pill (`bg-[color]-100 dark:bg-[color]-500/15`). Budget card accent and icon turn red when over-budget. Places card now shows visited/total instead of the less useful "planned locations" label.

**Trip Readiness widget:** `TripReadinessWidget` (previously only on the Dashboard) is now embedded in the Overview tab. Reuses the existing component with the same scoring logic (checklist 30%, itinerary 25%, budget 25%, places 20%). Displayed alongside the Checklist Preview in a 2-column grid on large screens; full-width when there's no checklist data.

**Trip Notes card:** `trip.notes` is now surfaced as a dedicated card with a FileText icon and slate left-border accent. Only rendered when notes are non-empty. Previously the notes were truncated into the header subtitle and invisible to most users.

**Layout:** removed `trip.notes` from the section header subtitle (replaced by its own card). No data-fetching changes — presentation layer only.

---

## 2026-06-23 (Premium Dashboard onboarding empty state)

### Changed — `components/dashboard/dashboard-content.tsx`, new `components/dashboard/empty-world-map.tsx`

Replaced the centered illustration + generic text empty state with a full-width three-section onboarding experience shown only when the user has zero trips:

**Section 1 — Greeting:** uses the same time-of-day greeting logic and user name as the normal dashboard. Headline "Where will your next adventure begin?" + "Create Your First Trip" button (same gradient style).

**Section 2 — Decorative world map** (`empty-world-map.tsx`, new component): lightweight `react-simple-maps` `ComposableMap` with all 197 countries in a flat dark-slate color — no zoom, no pan, no tooltips, no markers. Centered overlay text ("No adventures yet" / "Create your first trip to start building your travel map.") and a "🌎 197 countries waiting" pill at the bottom. Subtle CSS-only pulsing inner glow (`animate-pulse` + `box-shadow inset`). Dark card background matching the full world map widget.

**Section 3 — Feature cards:** 5 cards in a responsive grid (2-col mobile / 5-col desktop) — ✈️ Trips, 📅 Itinerary, 📍 Places, 💰 Budget, 📖 Journal — each with emoji, title, subtitle, subtle hover lift.

Staggered `framer-motion` fade-in across all three sections. Normal dashboard (users with trips) is completely unchanged.

---

## 2026-06-22 (Polish Dashboard empty state)

### Changed — `components/dashboard/dashboard-content.tsx`

- **Illustration** — replaced generic mountain/sky SVG with a premium globe illustration: soft indigo/violet radial gradient, latitude/longitude grid lines clipped to the globe, simplified continent blobs, dashed flight arc, plane, origin + destination pins, sparkle accents
- **Headline** — "Your passport to adventure awaits" → "Every unforgettable journey starts with a single trip."
- **Subtitle** — updated to describe the app's actual features: destinations, itinerary, budget, memories, world map
- **Feature badges** — added 4 pill badges below the CTA button: ✈️ Plan Trips · 🗺️ Interactive Map · 📅 Smart Itinerary · 📖 Travel Journal
- **Removed** — "Free forever · No credit card required" tagline (inaccurate once premium plans launch)
- "Plan Your First Trip" button unchanged

---

## 2026-06-22 (Fix Google OAuth PKCE code_verifier wiped by middleware)

### Fixed — `lib/supabase/middleware.ts`

**Root cause:** `updateSession()` created a Supabase server client and called `supabase.auth.getUser()` on every request, including `/auth/callback`. When `getUser()` finds no active session, `@supabase/ssr` internally clears stale auth cookies — including the PKCE `code_verifier` set by `signInWithOAuth`. By the time the route handler called `exchangeCodeForSession(code)`, the `code_verifier` was gone, producing the error: *"PKCE code verifier not found in storage."*

**Fix:** Route path checks are now performed before the Supabase client is instantiated. When `pathname === '/auth/callback'`, the middleware returns `NextResponse.next({ request })` immediately — no Supabase client is created, `getUser()` never runs, and all cookies (including `code_verifier`) are forwarded to the route handler untouched. The now-unreachable `!isCallbackRoute` guard on the logged-in-user redirect was also removed.

---

## 2026-06-22 (Fix Google OAuth bad_oauth_state + post-login redirect)

### Fixed — `lib/supabase/middleware.ts`, `app/(auth)/auth/callback/route.ts`, `app/(auth)/auth/login/page.tsx`

**Root causes identified:**

**Issue 1 — `bad_oauth_state` on first OAuth attempt:**
Supabase's browser client stores the PKCE `code_verifier` in a cookie on whatever domain the user is currently on. If the user accessed the site via the raw IP (`38.242.252.59:3001`), the cookie was set on the IP domain. When Google's OAuth flow completed and our callback ran on `travel365.live`, the browser didn't send the IP-domain cookie → Supabase said "state not found." Secondary cause: the middleware matched `/auth/callback` as an auth route and could redirect logged-in users to `/dashboard` before `exchangeCodeForSession` ran.

**Issue 2 — Redirects to landing page after successful login:**
The callback route used `origin` from `new URL(request.url)`. Behind Nginx, Next.js sees the internal `http://localhost:3001` origin, so the redirect target became `http://localhost:3001/dashboard` — unreachable from the browser, which caused the browser to fall back to the landing page.

**Fixes:**

`lib/supabase/middleware.ts`:
- Added raw-IP → domain redirect (301) at the top of `updateSession`. If `NEXT_PUBLIC_SITE_URL` is set and the incoming hostname is a raw IP, redirect to the configured domain. This ensures OAuth PKCE cookies are always set on `travel365.live`.
- Added `isCallbackRoute` guard: `/auth/callback` is now excluded from the "redirect logged-in users away from auth routes" rule, so `exchangeCodeForSession` always runs regardless of existing session state.

`app/(auth)/auth/callback/route.ts`:
- Redirect base changed from `origin` to `process.env.NEXT_PUBLIC_SITE_URL || origin`. Production always redirects to `travel365.live/dashboard`; local dev falls back to the request origin.
- OAuth `error` query params (e.g. `bad_oauth_state` redirected here by Supabase) now redirect to `/auth/login?oauth_error=<desc>` instead of producing a blank state.
- `exchangeCodeForSession` errors now redirect to `/auth/login?oauth_error=<msg>` instead of silently succeeding.
- Added `next` param support (relative paths only; defaults to `/dashboard`).

`app/(auth)/auth/login/page.tsx`:
- Added `useEffect` that reads `oauth_error` from search params and shows a `toast.error` so users see a readable explanation when redirected back from a failed OAuth flow.

---

## 2026-06-22 (Fix Google OAuth redirect URL)

### Fixed — `app/(auth)/auth/login/page.tsx`, `.env.local`

**Problem:** `redirectTo` in `signInWithOAuth` was built from `location.origin` (the browser's current origin). When testers accessed the site via IP (`http://38.242.252.59:3001`), Google's OAuth callback redirected back to the IP instead of `https://travel365.live`, causing a redirect URI mismatch error since only the domain is registered in Google Cloud Console.

**Fix:**
- Added `NEXT_PUBLIC_SITE_URL=https://travel365.live` to `.env.local`
- Changed redirect construction to use the env var with `location.origin` as fallback for local development:
  ```ts
  // before
  redirectTo: `${location.origin}/auth/callback`
  // after
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || location.origin}/auth/callback`
  ```
- Production always uses `travel365.live`; local dev (`localhost:3001`) continues to work automatically

---

## 2026-06-22 (Global Travel Journal redesign)

### Changed — `app/(dashboard)/journal/page.tsx`, `components/global-journal/global-journal-content.tsx` (new)

**Problem:** The global Travel Journal page was a read-only, capped-at-20 list with no interactivity. It showed basic cards with an "Open" button and no way to search, filter, or browse memories across trips.

**Changes:**

- New `GlobalJournalContent` client component (`components/global-journal/global-journal-content.tsx`)
- Server page now fetches all entries (no limit) with richer joins: `is_favorite`, `time`, `linked_to_trip`, `locations(name, address)`, and all trip metadata. Also fetches all trips in parallel for the grouping section.

**Layout:**
- **Stats bar** — live counts for entries, trips with memories, photos uploaded, and favorites (never shows 0/placeholder values)
- **Featured Memory** hero card — auto-selects first entry with a photo, falls back to most recent. Full-bleed image (or deterministic gradient if no photo), dark overlay, title/trip/date/location/mood/favorite badge, "Open memory" pill button. Hidden during active search/filter to avoid visual conflict.
- **Memory grid** — 2-col on sm+, 1-col on mobile. Each card: photo header or gradient placeholder with travel icon, mood emoji, favorite star, date badge, photo count badge, title, trip flag+name, location, content preview.
- **Memories by Trip** section — groups entries by trip, shows flag, trip name, country, and memory count badge. Links to the trip's journal tab. Only shown when multiple trips have entries and no search/filter is active.
- **Search + filter** — live search across title, content, trip name, location, and country. Filter pills: All (n) / ⭐ Favorites / 📷 With Photos.
- **Empty state** — beautiful centered icon + copy + "Go to My Trips" button.
- **No-results state** — appears inline when search/filter returns nothing.

**Preserved behavior:** All "Open" links navigate to `/trips/[id]/journal` (trip journal tab).

---

## 2026-06-22 (Bug fixes — RC Audit: World Map tooltip + Places reorder)

### Fixed — `components/dashboard/world-map-widget.tsx`

**Bug:** Country tooltip's "Visited" section used `t.status === 'completed'` (raw DB field) instead of `getEffectiveStatus(t)`. Trips that are date-completed (end_date in the past) but whose DB `status` column still reads `'upcoming'` would not appear in the tooltip's Visited list, and the country would not be highlighted as visited on the map.

**Fix:** Added `getEffectiveStatus` to import from `@/lib/utils` and replaced both occurrences:
- Line 249 (`CountryTooltip` visited filter): `t.status === 'completed'` → `getEffectiveStatus(t) === 'completed'`
- Line 718 (`tripVisitedCodes` memo — drives country fill colour on the SVG map): same replacement

### Fixed — `components/trips/places-content.tsx`

**Bug:** `handleReorder()` had an inverted condition when merging the reordered group back into the full location list:
```ts
// WRONG — when group === 'unvisited', kept only the visited items (opposite group)
...prev.filter(l => group === 'unvisited' ? l.visited : !l.visited)
```
Reordering within the "To Visit" group would silently discard those items and keep only the already-Visited items (and vice versa).

**Fix:** Condition inverted to keep the *other* group (the one that was not reordered):
```ts
...prev.filter(l => group === 'unvisited' ? !l.visited : l.visited)
```

---

## 2026-06-21 (Itinerary — day collapse/expand + day completed toggle)

### Added — `components/itinerary/itinerary-content.tsx`, `lib/types/index.ts`, `supabase/migrations/012_itinerary_day_completed.sql`

**Task 1 — Collapse/expand per day (UI-only)**
- Clicking anywhere on the day header card toggles its activity list open/closed
- All days start expanded by default
- `ChevronDown` indicator rotates 90° when collapsed; explicit chevron `Button` in the right-side cluster also toggles (so both the header area and the explicit button work)
- Header background subtly highlights on hover; `collapsed` is local `useState` — no DB column needed

**Task 2 — Day completed toggle (persisted)**
- Added `is_completed BOOLEAN NOT NULL DEFAULT FALSE` column to `itinerary_days` via migration `012_itinerary_day_completed.sql` (applied)
- `CheckCircle2` icon button in day header right-side cluster toggles completed state
- Completed visual treatment: emerald header background, emerald day-number circle, dimmed title/date text
- Optimistic UI: state updates immediately; reverts + shows toast on DB error
- `toggleDayComplete()` async function handles Supabase UPDATE with rollback on error

**Mobile touch targets:**
- All three right-side icon buttons (complete, chevron, delete) use `h-10 w-10 md:h-7 md:w-7` — 40px on mobile, 28px on desktop
- Right-side div uses `flex-shrink-0` and `gap-1`; left side has `min-w-0` + `truncate` on title
- `onClick={e => e.stopPropagation()}` on right-side wrapper isolates button taps from header collapse

---

## 2026-06-21 (Itinerary — chronological insert for new activities)

### Fixed — `components/itinerary/itinerary-content.tsx`

**Problem:** Adding activities in non-chronological order (e.g. 08:00 → 11:00 → 09:00) appended them to the end of the day list, producing the wrong visual order (08:00, 11:00, 09:00 instead of 08:00, 09:00, 11:00).

**Root cause:** `handleSave()` always inserted new items with `order_index: currentCount` (append-at-end). `start_time` was display metadata only; `byOrderIndex()` — the sole sort function — never consulted it.

**Why "sort by time on display" was rejected:** If `byOrderIndex` were replaced with a time-first sort, `handleDragEnd` would still update `order_index` values but they'd have no visible effect for timed items (display re-sorts by time on every render). Dragging a 09:00 item to appear after 12:00 would animate and snap back immediately — broken UX. DnD must remain the authoritative sort mechanism.

**Fix — slot new item at its chronological position on INSERT:**
- `byOrderIndex` and `handleDragEnd` are unchanged; DnD works exactly as before
- On INSERT of a new item with `start_time`:
  1. Walk the display-sorted existing items in reverse to find the **last item whose `start_time ≤ new item's time`** (the left neighbor)
  2. `insertAt = leftNeighbor.order_index + 1` (or 0 if new item has the earliest time)
  3. All existing items with `order_index ≥ insertAt` are shifted up by 1 (fire-and-forget UPDATE, same pattern as DnD)
  4. New item is INSERTed with the computed `order_index`
  5. Local state is updated immediately: shifted items get +1, new item appended (React re-sorts by `order_index` on next render)
- On INSERT of a no-time item: unchanged behavior (append at end)
- `start_time` values from DB are `"HH:MM:SS"`; payload from form is `"HH:MM"`. Both are normalized to `"HH:MM"` with `.slice(0, 5)` before comparison.

**DnD coexistence:**
- After a drag, `order_index` values reflect the manual visual order; this sticks on reload
- After a drag followed by adding a new timed item, the new item slots after its time-predecessor's current display position (not its chronological position relative to the dragged state). Predictable and conservative — no existing items are disturbed beyond the necessary shift.

**Verified test case:** add 08:00, then 11:00, then 09:00 → final order 08:00, 09:00, 11:00 ✅

---

## 2026-06-21 (Itinerary — activity detail expand-in-place)

### Added — `components/itinerary/itinerary-content.tsx`

**Problem:** Activity cards showed truncated previews (`line-clamp-1` description, `truncate` location/address) with no way to read the full content without clicking Edit. On mobile the text was frequently cut off with no affordance to reveal it.

**Fix — expand-in-place on card click:**

- `ActivityCardInner` now tracks a local `expanded` boolean state
- The content card div is clickable (`cursor-pointer`) when `hasExpandable` is true (item has a description or a formatted address distinct from the location name)
- **Collapsed (default):** description shows `line-clamp-2` (up from `line-clamp-1` for better preview); location/address stay `truncate`
- **Expanded:** `truncate` and `line-clamp` are removed — text wraps fully with `break-words`; a separator row shows inline "Edit" and "Maps" shortcut links for quick access without re-opening the three-dot menu
- **Chevron indicator:** a `ChevronDown` icon is centered below the card content when `hasExpandable`. Rotates 180° when expanded. Acts as a visual affordance that the card is tappable.
- **Action button isolation:** the actions wrapper div captures `onClick` with `e.stopPropagation()` so tapping Edit/Delete/⋯ never accidentally toggles the expand state; same for the inline Maps `<a>` link in the expanded section
- **Drag overlay:** no expand in overlay mode (`overlay` prop short-circuits all expand logic) — dragging a card does not trigger expansion

**Mobile specifically:** with `truncate` and `line-clamp` removed in expanded state and `break-words` applied, the description text is guaranteed to wrap on any screen width. The chevron is always visible, making the tap target discoverable without hover.

**Tested with:** "walk on the beach" activity (description: "very nice walk and ride over the beach with bikes") — full text now readable both in the 2-line preview and in the expanded state.

---

## 2026-06-21 (Pre-mobile readiness — avatars bucket + storage utility decoupling)

### Fixed — `supabase/migrations/011_avatars_storage.sql`, `lib/utils/journal-photos.ts`, `components/journal/journal-content.tsx`, `components/settings/account-settings.tsx`

**Two "do now" items from the mobile readiness audit, both of which were also live web bugs:**

**1. Avatars bucket (web bug fix)**

Avatar upload in Settings silently failed because the `avatars` storage bucket had no migration and did not exist in production. Confirmed via Supabase management API: only `journal-photos` existed before this change.

Created `011_avatars_storage.sql` matching the `008_journal_photos_storage.sql` pattern:
- Public bucket (2 MB limit, image MIME types) — URLs render in `<img>` tags without auth
- `avatars_insert` / `avatars_update`: `(storage.foldername(name))[1] = auth.uid()::text` — users can only write to their own folder
- `avatars_select`: public read for all rows
- `avatars_delete`: user-scoped delete
- Migration applied to Supabase; both buckets now confirmed present

Error message in `account-settings.tsx` updated from static instructions-for-developer string to `uploadError.message`.

**2. Storage utility decoupling (mobile portability)**

`uploadJournalPhoto` and `deleteJournalPhoto` in `lib/utils/journal-photos.ts` previously called `createClient()` (the `@supabase/ssr` browser-only factory) internally, coupling the utility to a web-specific dependency.

Refactored both functions to accept a `SupabaseClient` as their first parameter. Removed `import { createClient }` from the utility file; added `import type { SupabaseClient } from '@supabase/supabase-js'`.

Caller (`PhotosEditor` in `journal-content.tsx`) now instantiates `const supabase = createClient()` at component level and passes it to `uploadJournalPhoto`. Zero behaviour change on web; utility is now portable to any platform.

---

## 2026-06-21 (Mobile Readiness Audit)

### Added — `MOBILE_READINESS.md`

Full static audit of the Supabase / auth / data-access / storage / environment architecture for React Native readiness. No existing code was modified.

**Verdict:** Backend is in very good shape. Direct Supabase SDK calls, thorough user-scoped RLS across all 10 tables, no service role key, no server-side business logic, all env vars are `NEXT_PUBLIC_`.

**Two items flagged as "do now" (web bugs too, not mobile-only):**
1. `avatars` storage bucket has no migration — `account-settings.tsx` references it but upload silently fails if the bucket doesn't exist in production
2. `uploadJournalPhoto`/`deleteJournalPhoto` in `lib/utils/journal-photos.ts` call `createClient()` internally, coupling storage utilities to the browser-only `@supabase/ssr` factory

**One item flagged as "do before mobile project starts":**
- Google Places proxy (Supabase Edge Function) — current `PlacesAutocomplete` uses browser-only Maps JS SDK script injection, not portable to React Native

**Everything else is deferred** to when the React Native project actually starts (AsyncStorage client, deep link OAuth, Expo setup, push notifications).

---

## 2026-06-21 (My Trips sort order — consistent with Dashboard)

### Fixed — `components/trips/trips-list-content.tsx`

**Bug:** My Trips displayed trips in DB insertion order (`created_at DESC`) while the Dashboard's "Upcoming Trips" section showed them sorted by `start_date ASC` (soonest first). A tester reported the order was inconsistent between the two pages.

**Root cause:** `app/(dashboard)/trips/page.tsx` fetches with `.order('created_at', { ascending: false })` and passes the result directly to `TripsListContent` with no further sort. The Dashboard re-sorts its upcoming trips in-memory by `start_date ASC` before rendering.

**Fix:** Added an in-memory sort after filtering in `trips-list-content.tsx`:
- Trips with `start_date`: sorted `ASC` by date (soonest first) — matches Dashboard
- Trips without `start_date`: sorted `DESC` by `created_at` (newest first), appended after dated trips
- Sort is applied to `sorted = [...filtered]` so filtering and sort are independent

**Verified:** Chicago (Aug 24) appears before Costa Blanca (Oct 24) on both Dashboard and My Trips, across all filter tabs.

---

## 2026-06-21 (Two-dimensional planning flag — is_planning)

### Added — `supabase/migrations/010_is_planning.sql`, `lib/types/index.ts`, `components/trips/trip-detail-shell.tsx`, `components/trips/trips-list-content.tsx`, `components/trips/edit-trip-dialog.tsx`

**Feature:** Trip status is now two-dimensional, layering on top of the date-derived `getEffectiveStatus()` fix:

- **Dimension 1 (unchanged):** `getEffectiveStatus()` derives `upcoming` / `active` / `completed` from `start_date` / `end_date`
- **Dimension 2 (new):** `is_planning` boolean column (`DEFAULT TRUE`). While true, the trip also appears under the "Planning" filter regardless of its date-derived state.

**Migration:** `ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_planning BOOLEAN NOT NULL DEFAULT TRUE` — all existing trips default to planning=true.

**UI — Planning pill in trip hero (`trip-detail-shell.tsx`):**
- Amber pill labelled "Planning" with a checkmark icon appears in the top action bar while `is_planning = true`
- Clicking it calls `UPDATE trips SET is_planning = false` and refreshes — trip disappears from the Planning filter but stays under Upcoming/Active/Completed
- Disabled (greyed, cursor-not-allowed) with tooltip if no `start_date` is set, preventing orphaned confirmed trips

**Filter logic (`trips-list-content.tsx`):** Two-dimensional match:
- `planning` filter: `is_planning === true AND effective !== 'cancelled'`
- `upcoming/active/completed`: `getEffectiveStatus(t) === filter` (unchanged)
- `cancelled`: `getEffectiveStatus(t) === 'cancelled'` (unchanged, never leaks into planning)

**Edit dialog (`edit-trip-dialog.tsx`):** Toggle switch in the Planning section lets power users revert `is_planning` back to true after confirming.

**Verified matrix:**

| Trip | planning | upcoming | active | completed | cancelled |
|---|---|---|---|---|---|
| Chicago 64d (is_planning=true) | ✓ | ✓ | | | |
| Costa Blanca 125d (is_planning=true) | ✓ | ✓ | | | |
| Chicago confirmed (is_planning=false) | | ✓ | | | |
| Past trip (is_planning=true) | ✓ | | | ✓ | |
| Active confirmed (is_planning=false) | | | ✓ | | |
| No dates (is_planning=true) | ✓ | | | | |
| Cancelled (is_planning=true) | | | | | ✓ |

---

## 2026-06-21 (Trip status — derive Upcoming/Active/Completed from dates)

### Fixed — `lib/utils/index.ts`, `components/trips/trips-list-content.tsx`, `components/trips/trip-detail-shell.tsx`, `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/dashboard-content.tsx`

**Bug:** `trips.status` was a purely manual field defaulting to `'planning'` at creation, with no automatic promotion. This caused two failures:

1. **"Upcoming" filter on My Trips page showed no results** even for trips with start dates 64–125 days in the future — because those trips had `status = 'planning'` in the DB and the filter did a strict equality match (`t.status === 'upcoming'`).
2. **Past trips were never shown as "Completed"** — same strict match meant trips with past end dates remained invisible to the Completed filter unless the user manually changed the field.

The Dashboard's "Upcoming Trips" widget already worked correctly because it filtered by `start_date > now` (date-based). The My Trips filter and trip detail badge used the stale stored value.

**Fix:** Added `getEffectiveStatus(trip)` to `lib/utils/index.ts` which derives the real status from dates at day granularity:

| Condition | Effective status |
|---|---|
| `status === 'cancelled'` | `'cancelled'` (manual-only, never overridden) |
| No `start_date` | stored status (can't derive) |
| `start_date > today` | `'upcoming'` |
| `start_date ≤ today` AND (`end_date ≥ today` OR no end) | `'active'` |
| `end_date < today` | `'completed'` |

`'planning'` is the natural fallback for trips with no dates set.

Applied `getEffectiveStatus` in:
- **My Trips filter** — filter now matches effective status, not stored DB value
- **Trip detail hero badge** — shows derived status (e.g. "upcoming" not "planning")
- **Dashboard page** — `activeTrips` and `upcomingTrips` both use effective status
- **Dashboard content** — `completedTrips` count and `countriesVisited` fallback both use effective status

**Verified:** Chicago (64d, stored=planning → upcoming), Costa Blanca (125d, stored=planning → upcoming), past trip (stored=planning → completed), active trip (started 6d ago → active), no-dates trip (→ planning), cancelled trip (→ cancelled).

---

## 2026-06-21 (My Travel Map — continent count consistency fix)

### Fixed — `components/dashboard/world-map-widget.tsx`

**Bug:** Header subtitle "X countries visited · Y upcoming trips · Z continents explored" showed 1 continent, while the stats bar "CONTINENTS" cell showed 2. Both numbers were wrong for different reasons:

- Header used `countContinents(visitedCodes)` — fully-visited countries only, missing partial visits (e.g. Americas via a US state)
- Stats bar used `continentsPlanned` (continents of planned/upcoming trips) — a completely different metric that happened to coincide at 2, not a "visited" stat at all

**Fix:**
1. `stats.continentsVisited` now unions `visitedCodes` with `partiallyCodes` before counting — same logic as the Visited Countries page fix
2. `continentsPlanned` removed from stats entirely — it was unused visually (the stats bar was already referencing it by mistake) and added noise
3. Stats bar "Continents" cell changed to use `stats.continentsVisited` and relabeled **"Continents Visited"** — unambiguous, consistent with header subtitle and page theme

**Result:** Header subtitle and stats bar both show 2, both reflecting the same full+partial visited logic.

---

## 2026-06-21 (Visited Countries — Continents counter includes partial visits)

### Fixed — `components/visited/visited-countries-content.tsx`

**Bug:** The "Continents" summary stat only counted continents containing at least one *fully* visited country, ignoring continents where countries were only *partially* visited (e.g. a US state selected makes Americas "partial").

With Europe having fully/partially visited countries and Americas having one partial country (via a state), the counter showed **1** instead of **2**.

**Root cause:** `continentsVisited` was computed from `visited` (fully visited) only, before `partialCountries` was even defined. The per-continent breakdown cards already correctly counted both full and partial via `visited.has(c.code) || partialCountries.has(c.code)`, but the summary stat did not.

**Fix:** Moved `continentsVisited` after `partialCountries` and extended it to also iterate `partialCountries`, looking up each country's continent from `COUNTRIES`. Both the summary stat and the header subtitle now count a continent as visited if it has any full or partial country.

---

## 2026-06-20 (Dashboard Achievements — Data Source Fix)

### Fixed — `components/dashboard/achievements-widget.tsx`, `lib/utils/achievements.ts`

**Bug:** Dashboard Achievements widget showed different/incorrect achievements vs the Visited Countries page.

With 4 countries visited, the Dashboard showed **3 badges** ("First Trip", "Passport Stamped", "Globetrotter") while the Visited Countries page correctly showed **1 badge** ("First Stamp").

**Root cause:** The widget had its own independent `buildAchievements()` function with a completely different tier system:
- "Globetrotter" threshold = 3 countries (Dashboard) vs 25 countries (Visited Countries) — same name, wildly different meaning
- Widget included trip-count badges ("First Trip", "3 Trips", "Adventure Complete") absent from the canonical system

**Fix:**
- Extracted the canonical `ACHIEVEMENTS` array to `lib/utils/achievements.ts` (single source of truth)
- `achievements-widget.tsx` now imports from the shared file; drops the `buildAchievements()` function and all unused props (`tripsTotal`, `completedTrips`, `continentsVisited`)
- `visited-countries-content.tsx` imports the same shared constant, removing its inline definition
- `dashboard-content.tsx` updated to pass only `countriesVisited` to the widget

**Result:** Both pages now show identical achievement data — 1 badge ("First Stamp 🛂") for a user with 4 countries visited.

---

## 2026-06-20 (Budget % Consistency Fix)

### Fixed — `components/trips/trip-overview-content.tsx`, `components/dashboard/trip-insights-card.tsx`

**Bug:** "Budget Used %" was calculated with two different (wrong) formulas outside the Budget tab.

| Location | Old formula | Old result (Chicago: $1,600 spent, $1,500 planned, $3,000 budget) | New result |
|---|---|---|---|
| Budget tab | `spent / trip.budget` | **53%** ✓ | 53% (unchanged) |
| Overview card | `spent / sum(planned_amounts)` + `Math.min(100)` cap | **100%** ✗ | **53%** ✓ |
| Dashboard Insights | `spent / sum(planned_amounts)` (no cap) | **107%** ✗ | **53%** ✓ |

**Root cause — Overview card** (`trip-overview-content.tsx:29`):
- Was: `const budgetPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0`
- `totalBudgeted` = sum of `planned_amount` from budget_items ($1,500), not the trip's set budget
- `Math.min(100, …)` cap hid the overrun (107% → 100%), making 100% look intentional

**Root cause — Dashboard Insights** (`trip-insights-card.tsx:34`):
- Was: `const budgetPct = budgetPlanned > 0 ? Math.round((budgetActual / budgetPlanned) * 100) : null`
- `budgetPlanned` prop = same sum of planned_amounts ($1,500), no cap, so showed raw 107%

**Fix (2 lines changed):**
- `trip-overview-content.tsx`: denominator changed to `trip.budget || totalBudgeted`; removed `Math.min` from `budgetPct`; progress bar uses `Math.min(budgetPct, 100)` (visual-only cap)
- `trip-insights-card.tsx`: denominator changed to `trip.budget || budgetPlanned`; `trip` was already a prop on the component

---

## 2026-06-20 (Journal — Linked Place Save Bug Fixed)

### Fixed — `components/journal/journal-content.tsx`, `app/(dashboard)/trips/[id]/journal/page.tsx`

**Root cause:** The original `JournalContent` component did not include `linked_to_trip` in the Supabase INSERT/UPDATE payload. Selecting "Trip destination" saved `location_id = null`, which was indistinguishable from "No location" on page reload — the selection was silently lost.

**Fix — complete rewrite of `journal-content.tsx`:**
- Added `location_id: string` to `EntryFormState` using `TRIP_SENTINEL = '_trip'` to represent "Trip destination" in form state
- `handleSave()` payload now sets `linked_to_trip: true` when trip destination is selected, `location_id: null | uuid` correctly
- `openEdit()` restores the `TRIP_SENTINEL` from `entry.linked_to_trip` on edit — round-trip is correct
- `resolveLocation()` unifies display: checks `linked_to_trip` first, then `location_id`
- `LocationPicker` uses an inline expandable list (no nested Dialog) — avoids base-ui event capture bug
- Added `time`, `is_favorite`, mood color bar, photo upload, day-number badges, search, favorites, desktop split panel, mobile detail dialog

**Server page update — `app/(dashboard)/trips/[id]/journal/page.tsx`:**
- Fetches `start_date, country, city` from trips query (needed for day calculation and country display)
- Fetches `google_maps_link, address` from locations query (needed by LocationPicker preview)
- Passes `tripName`, `tripCountry`, `tripStartDate` as new required props

**DB migrations applied:**
- `007_journal_improvements.sql` — `time TEXT`, `is_favorite BOOLEAN NOT NULL DEFAULT FALSE`
- `009_journal_linked_to_trip.sql` — `linked_to_trip BOOLEAN NOT NULL DEFAULT FALSE`

---

## 2026-06-20 (Visited Countries — Improved Island & Region Tracking)

### Changed — `lib/data/subregions.ts`

**New `'island'` subregion type** added to `SubregionType` union — stored as `region_type` in DB.

**Spain (ES)** — label changed from `'autonomous communities'` to `'regions & islands'`:
- Removed: `Balearic Islands` (code `IB`) and `Canary Islands` (code `CN`) as single community entries
- Added Canary Islands individually: `Tenerife` (CN-TEN), `Gran Canaria` (CN-GC), `Lanzarote` (CN-LNZ), `Fuerteventura` (CN-FUE)
- Added Balearic Islands individually: `Mallorca` (IB-MAL), `Ibiza` (IB-IBZ), `Menorca` (IB-MEN)
- All 15 mainland autonomous communities unchanged
- Existing DB records for old codes `IB`/`CN` are preserved (not deleted)

**Italy (IT)** — label changed from `'regions'` to `'regions & islands'`:
- Added: `Capri` (CAPRI) — Sicily (SAR) and Sardinia (SIC) already present
- All 20 existing administrative regions unchanged

**Greece (GR)** — new entry:
- 7 major tourist islands: Crete, Rhodes, Santorini, Mykonos, Corfu, Zakynthos, Kos
- label: `'islands'`

**Portugal (PT)** — new entry:
- 2 island groups: Madeira, Azores
- label: `'islands'`

### Changed — `components/visited/visited-countries-content.tsx`

**Stat label** renamed: `'States & Regions'` → `'Regions • States • Islands'`

**Country cards — continent always visible:**
- Every card now shows continent name on a second line (was missing for subregion countries like US, DE, ES, etc.)
- Visited status shown inline: `· ✓ Visited` (indigo) or `· Partly visited` (violet)
- `Layers` icon removed from card name row (expand button already communicates expandability)
- Progress bar and count (`X/N regions`) shown only when there are visited items (no empty bar for unvisited)

**Island visual affordance:**
- Island entries in the region picker show a 🏝 emoji prefix for instant recognition
- Region grid items: `min-h-[40px]` for comfortable mobile touch targets, `rounded-xl` corners, `gap-1.5` spacing
- Max height increased to `max-h-64` (was `max-h-56`)

**Expand animation:**
- Easing improved to `[0.22, 1, 0.36, 1]` (premium spring curve, was linear default)
- Duration: `0.3s` (was `0.25s`)

**Counting logic unchanged:** Marking an individual island (e.g. Rhodes) adds 1 to `Regions • States • Islands` count. Country-level "fully visited" still requires manual mark OR all tracked regions completed.

### Changed — `components/dashboard/stats-grid.tsx`

- Stat label renamed: `'Regions & States'` → `'Regions • States • Islands'`

## 2026-06-20 (Dashboard Polish – Phase 3 — Travel Insights)

### Added — Dashboard (`app/(dashboard)/dashboard/page.tsx`, `components/dashboard/`)

**Travel Statistics card** (`components/dashboard/travel-stats-card.tsx`)
- Compact sidebar card showing: Countries Visited, Trips Completed, Trips Planned, Continents Explored, Total Travel Days, Longest Trip, Average Trip Length
- Rows with zero/null values are automatically hidden — no placeholder data ever shown
- All values computed from existing `trips` + `visitedCountryCodes` + `visitedContinents` props

**Next Trip Insights card** (`components/dashboard/trip-insights-card.tsx`)
- Appears below the hero CountdownCard when a next/active trip exists
- 2-column grid showing: Days Until Departure, Trip Duration, Planned Places, Itinerary Days, Checklist Done %, Budget Used %
- Items with no data are hidden; progress bars shown for checklist and budget percentage
- Requires 3 new Supabase queries (checklist items, budget items, itinerary days) run in parallel Phase 2 fetch

**Trip Readiness widget** (`components/dashboard/trip-readiness-widget.tsx`)
- Sidebar card with animated main progress bar + 4 component bars (Checklist 30%, Itinerary 25%, Budget 25%, Places 20%)
- Score color: emerald ≥ 80%, amber ≥ 50%, indigo otherwise
- `motion.div` bar animates from 0 → score on mount (0.8 s ease-out)
- Only shown when a next/active trip exists

**Recent Activity widget** (`components/dashboard/recent-activity-widget.tsx`)
- Sidebar card showing last 5 actions across all trip tables: places, itinerary activities, checklist items, expenses, journal entries
- Shows action type icon, title, trip name, and relative timestamp ("3 hours ago")
- Empty state: "No recent activity yet."
- `RecentActivityItem` type exported for use in server page

**Achievements widget** (`components/dashboard/achievements-widget.tsx`)
- Left-column card below Upcoming Trips; only rendered when at least 1 achievement is earned
- 13 possible achievements based on: trips count, completed trips, countries visited, continents explored
- Chips with emoji + label; hover shows description via `title` attribute; hover scale animation
- Badge count in header

**Data fetching** (`app/(dashboard)/dashboard/page.tsx`)
- Phase 1 parallel block extended with 5 new recent-activity queries (locations, itinerary_items, checklist_items, budget_items, journal_entries — last 3 each, ordered by `created_at` desc)
- Phase 2 parallel block (after determining next trip): checklist items, budget items, itinerary days — for next-trip insights and readiness widget
- Recent activity items merged, sorted newest-first, sliced to 5; trip names resolved via in-memory map
- 4 new props added to `DashboardContent`: `nextTripChecklist`, `nextTripBudget`, `nextTripItineraryDays`, `recentActivity`

**Dashboard layout** (`components/dashboard/dashboard-content.tsx`)
- Left column: CountdownCard → TripInsightsCard → Upcoming Trips → AchievementsWidget → Active Trips
- Right sidebar: Quote → Quick Actions → TravelStatsCard → TripReadinessWidget → Recent Trips → RecentActivityWidget → Wishlist CTA
- All existing cards and their order preserved — new widgets inserted between existing ones

## 2026-06-19 (Dashboard Polish – Phase 2)

### Changed — Dashboard sidebar (`components/dashboard/dashboard-content.tsx`)

**Travel Quote card**
- Quotes moved to a dedicated constants file (`lib/data/travel-quotes.ts`) with 31 curated quotes
- `getDailyQuote()` selects by day-of-year so the quote changes daily and never jumps mid-session
- Added "Today's Quote" eyebrow label above the quote text
- Typography: text slightly smaller and crisper (`text-[13.5px]`), icon opacity softened, author uses `text-indigo-200/70`

**Quick Actions**
- Arrow indicator changed from `opacity-0` (invisible on mobile, hover-only on desktop) to `opacity-30` always visible, rising to full on hover — clear directional affordance on all devices
- Added `min-h-[44px]` to every action row for proper mobile touch targets
- `transition-all duration-200` applied to icon bg and arrow for consistent easing
- Slight `x: 2` nudge on hover (was `x: 3`) — less aggressive, more premium feel

**Recent Trips**
- Each row now shows: thumbnail (with hover zoom), trip name, flag + country + departure date, status badge
- Status badge replaces the 2px dot: colour-coded pill showing `Active / Done / Today / Tomorrow / Nd / Planning`
  - Upcoming ≤ 7 days: amber badge; upcoming > 7 days: indigo badge; active: emerald; completed: slate; planning: blue
- Row height set to `min-h-[52px]` — comfortable touch target
- Empty state added: "No trips yet" + "Create your first trip" button (shown when `trips.length === 0`)
- Hover: `x: 2` slide + thumbnail scale-110 image zoom

### Added — `lib/data/travel-quotes.ts`
- 31 curated travel quotes from Tolkien, Lao Tzu, Maya Angelou, Mark Twain, and others
- `getDailyQuote()` — selects by day-of-year modulo quote count; stable within a day, rotates daily

## 2026-06-19 (Dashboard Travel Map Legend)

### Changed — `components/dashboard/world-map-widget.tsx`
- Legend label "Partial" renamed to "Partly visited"
- Each legend item now has a hover tooltip (dark glassmorphism, `z-[100]`) explaining what the colour means:
  - Visited: "Countries fully marked as visited."
  - Partly visited: "Large countries where only some states or regions were visited."
  - Upcoming: "Countries with planned trips."

## 2026-06-19 (Dashboard Travel Map Header)

### Changed — `components/dashboard/world-map-widget.tsx`
- Subtitle replaced with a dynamic, user-friendly summary: `"N countries visited • N upcoming trips • N continents explored"` with correct pluralization
- Empty state subtitle: "Your travel story starts here." + "Create your first trip and begin exploring the world."
- `continentsVisited` added to the stats memo (counts visited continents, not planned)
- Typography: `text-slate-400` (up from `text-slate-500`) for slightly better contrast

## 2026-06-19 (Dashboard Polish – Phase 1)

### Changed — Dashboard components

**Hero card (`components/dashboard/countdown-card.tsx`)**
- `whileHover={{ y: -2 }}` lift + `hover:shadow-2xl` shadow increase
- Image zoom reduced to `scale-[1.03]` at 400 ms — subtle, premium feel
- Overlays strengthened: `from-black/95 via-black/40` for better text legibility
- Countdown badge: glassmorphism (`backdrop-blur-xl`, `shadow-xl shadow-black/25`), larger number (`text-4xl`), wider padding
- View Trip button: framer-motion variant — arrow slides `x: 4` on hover; background transitions via CSS
- `animationDelay` prop added so the parent can stagger the card's entry

**Statistics cards (`components/dashboard/stats-grid.tsx`)**
- `AnimatedNumber` component: counts from 0 to target on first mount using `requestAnimationFrame` + ease-out-cubic; runs once only
- Icon backgrounds brighten on hover via `group-hover:bg-*` Tailwind variants
- `hover:shadow-lg`, `hover:border-slate-200`, `transition-all duration-300` for smooth hover

**Upcoming trip cards (`components/dashboard/trip-card.tsx`)**
- Image zoom increased to `scale-[1.08]`; `hover:shadow-xl` on card
- Subtle overlay brightens on card hover

**Dashboard stagger (`components/dashboard/dashboard-content.tsx`)**
- Stat cards: base delay `0.08 + i × 0.06`
- Hero (`CountdownCard`): `animationDelay={0.26}`
- "Upcoming Trips" heading: `delay: 0.3`
- Trip cards: `delay: 0.34 + i × 0.07`
- Sidebar widgets: unchanged (0.15, 0.22, 0.30, 0.38)

## 2026-06-19 (Calendar Redesign)

### Changed — Travel Calendar (`components/calendar/calendar-content.tsx`)

**View switcher**
- 4 modes: Month / 3 Months (default) / 6 Months / Year
- Pill-group button row in header; active mode gets `bg-primary` fill
- Navigation (◄ Today ►) advances/retreats by the active view count (1, 3, 6, or 12 months)
- Switching to Year view snaps anchor to January of current year

**Calendar grid**
- Per-month `MonthCalendar` component renders a `grid grid-cols-7 gap-[1px] bg-border/20 rounded-xl overflow-hidden`
- Cells have correct `minHeight` (72 px full, 34 px compact)
- Today's cell: `bg-primary/5` + day number in a filled `bg-primary text-primary-foreground` circle
- Selected day: `bg-accent/40` + day number in `bg-foreground/90 text-background` circle

**Trip date range bars**
- `TripBar` component renders a colored ribbon (`h-[18px]`, white label, `✈` icon on start day)
- Rounding logic: `rounded-l-full ml-1` when `isStart || isWeekStart (dow=0)`; `rounded-r-full mr-1` when `isEnd || isWeekEnd (dow=6)`; `rounded-full mx-1` for single-day; flat (no rounding, no margin) for middle
- Trip name + ✈ shown only on start day or Monday of continuing week
- Max 3 bars per cell + "+N more" overflow label

**Trip colors — deterministic palette**
- 9-color palette (violet, blue, emerald, amber, pink, cyan, orange, indigo, green) with semi-transparent `light` variant for flag icon backgrounds
- `buildColorMap()` sorts trips by `start_date` then assigns colors by index → colors are stable within a session and consistent across all views

**Year view**
- 12 compact mini-calendars in `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- `compact` prop: 34 px cell height, tiny font, dots instead of bars (up to 3 colored dots per day)
- No sidebar in year view (full width)

**6-month view**
- Desktop: `grid-cols-2` for side-by-side month pairs
- Mobile: falls through to agenda view

**Mobile agenda view**
- Hidden on `md+`; shown on mobile via `block md:hidden`
- Per-month section header + trip rows with colored left bar, flag emoji, trip name, date range, Active/Nd countdown badge
- "No trips this month" dashed-border empty state per section
- 56 px minimum touch targets

**Sidebar**
- Featured trip card: colored `h-1` top accent, flag in colored `light` background square, trip name + country, departure date, large countdown number in trip color
- Shows "Active Trip" label (🛫 + "Bon voyage!") vs "Next Trip" + days countdown
- Upcoming list: colored dot, flag, name, date range, Active text / Nd badge; up to 7 entries
- Selected day panel (appears when day clicked): date header + list of trips for that day, ×-close button
- Checklist deadlines section (shown when items have due dates)
- Legend: Today circle + Selected circle + Trip bar sample
- Desktop: sticky right `280px` column (`sticky top-4`)
- Mobile/tablet: stacked below the calendar area

**Empty state**
- Plane icon in `bg-primary/10` rounded square, "No trips yet" heading, descriptive subtitle
- "Plan Your First Trip" `<Button>` linking to `/trips`

## 2026-06-19 (Journal Linked Location Fix)

### Fixed — Journal Linked Location persistence and UI (`components/journal/journal-content.tsx`)

**Root cause 1 — Nested Dialog conflict:**
`LocationPicker` previously opened a `<Dialog>` inside the `EntryDialog`. Clicking inside the inner dialog fired `onInteractOutside` on the outer dialog, which either dismissed it or ate the state update before it could propagate. Result: selection appeared to do nothing.

**Fix:** Replaced the inner Dialog with an inline collapsible list rendered directly in the form DOM (no portal, no nested dialog). Clicking an option calls `onChange` synchronously, closes the list, and the `EntryFormState.location_id` updates immediately.

**Root cause 2 — Trip destination not persisted:**
Selecting "Trip destination" stored `location_id = null` in the DB — same as "No location". On reload, `entry.location_id = null → form.location_id = ''` (no selection), so the trip destination choice was silently lost.

**Fix:** Added `linked_to_trip BOOLEAN NOT NULL DEFAULT FALSE` column (`supabase/migrations/009_journal_linked_to_trip.sql`). Save payload now sets `linked_to_trip = true` when the sentinel `_trip` is chosen. `openEdit()` restores `_trip` sentinel from `entry.linked_to_trip`. Full round-trip works across page reloads.

**Root cause 3 — Trip destination never displayed:**
`findLocation(entry.location_id)` returned `undefined` for `null` location_id, so trip destination entries showed no location chip at all.

**Fix:** Added `resolveLocation(entry: JournalEntry): ResolvedLocation | undefined` helper that checks `linked_to_trip` first and returns `{ name: tripName, address: tripCountry, isTripDestination: true }`. Both `EntryCard` and `EntryDetail` use `ResolvedLocation` and render a `Globe2` icon for trip destinations vs `MapPin` for saved places.

**Other improvements:**
- Location picker shows active selection with a filled dot indicator
- "No location" option correctly clears both `location_id` and `linked_to_trip`
- Edit mode: prefills correctly for all three states (none / trip / saved place)
- `JournalEntry` type gains `linked_to_trip?: boolean`
- Search now includes location address in the filter
- `EntryDetail` location chip shows trip country (address) inline for trip destinations

## 2026-06-19 (Journal Photo Uploads)

### Added — Supabase Storage photo uploads for journal entries

**Storage bucket** (`supabase/migrations/008_journal_photos_storage.sql`)
- Bucket: `journal-photos`, public, 10 MB file size limit
- Supported MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
- RLS: `INSERT` restricted to own user folder — `(storage.foldername(name))[1] = auth.uid()::text`
- RLS: `DELETE` same owner check
- RLS: `SELECT` — public (photos are embedded as URLs in journal entries)

**Upload utility** (`lib/utils/journal-photos.ts`)
- `validateImageFile(file)` — checks MIME type + 10 MB size limit, returns error string or null
- `uploadJournalPhoto(file, userId, tripId)` — uploads to `{userId}/{tripId}/{timestamp}_{random}.{ext}`, returns public URL
- `isJournalStorageUrl(url)` — detects whether a URL belongs to our bucket
- `deleteJournalPhoto(url, userId)` — safely removes from storage; no-ops on external URLs

**Photos Editor** (`components/journal/journal-content.tsx` — `PhotosEditor`)
- Internal `PhotoItem` union type tracks each photo through: `saved → uploading → done | error`
- "Upload from device" button — `<input type="file" accept="image/*" multiple>` (gallery picker)
- "Take photo" button — `<input type="file" accept="image/*" capture="environment">` (camera on mobile)
- Immediate thumbnail preview via `URL.createObjectURL()` during upload
- Progress bar overlay per thumbnail (simulated 25% → 100%)
- Spinner overlay + blurred thumbnail while uploading
- Error overlay with Remove action when upload fails
- Remove button always visible on mobile, hover-revealed on desktop
- "Paste image link" collapsible section for URL fallback (existing entries continue working)
- Save button is disabled + shows "Uploading…" while any photo is in progress
- Photos sync back to parent (`photoUrls: string[]`) only when `type === 'saved' | 'done'`
- `key` prop forces `PhotosEditor` remount on every dialog open (clean state)
- File size / type hint shown below the editor

**SETUP.md** — added Storage setup section with path structure, security model, and migration instructions

## 2026-06-19 (Journal Form UX)

### Changed — Journal Entry form (`components/journal/journal-content.tsx`)

**Form structure** — fields reorganised into a logical flow:
Title → Date & Time → Mood → Linked Location → Journal Entry → Photos → More Options

**Mood Picker** — upgraded from basic chips to premium selectable cards:
- 5-column grid, all options visible at once on mobile and desktop
- Each card shows emoji (2xl) + label, `min-h-[64px]` touch target
- Selected state: primary ring + border + scale(1.03) + emoji scale(1.1)
- Hover state: soft primary tint + scale(1.02)

**Location Picker** — replaces plain `<Select>` with a custom grouped Dialog:
- "Link a location…" dashed button when nothing selected
- Dialog shows three sections: No location · Trip destination · Saved places
- "Trip destination" option shows trip name + city/country (pulls from `trips.city` and `trips.country`)
- "Saved places" list shows location name + address (one-line clamp)
- Selected preview card: icon + name + Badge ("Trip destination" / "Saved place") + address + Maps link (ExternalLink) + Change + Clear buttons
- Saving: `_trip` sentinel → `location_id: null` in DB (trip is identified by `trip_id`)

**Trip Day Badge** — auto-calculated inline below the date field:
- "Day N" (primary blue pill) when date is on or after trip start date
- "Before trip" (amber pill) when date is before trip start date
- Hidden when no date or no trip start date

**Photos section** — redesigned from bare URL input to:
- Camera icon placeholder with "Cloud photo upload coming soon" message
- "Add via URL" collapsible chevron for URL input (advanced fallback)
- Photo grid with hover × removal buttons (unchanged)

**Date & Time** — both fields in a clean 2-column grid under one "Date & Time" label

**More Options** — collapsible section with:
- Weather field with `Cloud` icon prefix, placeholder "Auto-filled in future"
- Favorite toggle button (amber selected state)

**Page** (`app/(dashboard)/trips/[id]/journal/page.tsx`):
- Fetches `country, city` from trips (for trip destination display)
- Fetches `address` from locations (for location picker address preview)
- Passes `tripName` and `tripCountry` to `JournalContent`

## 2026-06-19 (Journal Redesign)

### Added / Changed — Trip Journal (`components/journal/journal-content.tsx`)

**Timeline layout**
- Entries grouped by date with day-separator headers: "Day 3 — Tuesday, June 18, 2026"
- "Day N" number computed from trip `start_date` (when available); falls back to formatted date label
- Entries sorted date ASC then time ASC for strict chronological order

**New entry card design**
- Mood emoji badge + colored left-border accent per mood (green/purple/blue/amber/slate)
- Favorite star toggle (amber) — optimistic update + Supabase persist
- Location chip with 📍 icon; links to Google Maps when `google_maps_link` is set
- Content preview (2-line clamp), photo count badge, time displayed (HH:MM)
- Selected card highlighted with primary ring

**Detail panel (desktop) / Dialog (mobile)**
- Desktop: sticky right column `lg:grid-cols-[2fr_3fr]` — timeline left, detail right
- Mobile: tap card opens full-screen Dialog with complete entry content
- Detail shows: mood + label, date+time+weather meta bar, location chip (Maps link), full content, photo grid
- Edit, Delete, Favorite actions in detail header

**Improved form dialog**
- `MoodPicker` — 5 emoji button chips in a row, click to select/deselect
- `PhotosEditor` — URL input + 3-column photo preview grid, × to remove individual photos
- Time field (HH:MM) alongside date
- Linked Place selector (locations from the trip)
- Collapsible "More options" section: weather + favorite toggle

**Search bar**
- Filters by title, content, and linked place name with `useMemo`
- Clear (×) button when query is active

**Edit**
- Pencil button in detail header opens pre-filled form dialog
- Full edit support for all fields (title, date, time, mood, content, photos, location, weather, is_favorite)

**DB schema** (`supabase/migrations/007_journal_improvements.sql`)
- `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS time TEXT`
- `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE`

**Types** (`lib/types/index.ts`)
- `JournalEntry.time?: string | null` and `JournalEntry.is_favorite?: boolean` added
- `MOOD_EMOJIS` updated: amazing→😊, great→😍, good→😌, okay→😐, bad→😴
- `MOOD_LABELS` constant added: Amazing / Loved it / Relaxing / Okay / Tiring

## 2026-06-19 (Budget Polish)

### Changed — Budget page (`components/budget/budget-content.tsx`)

**Summary cards**
- Colored left-border accent per card (indigo / emerald / violet)
- Colored icon backgrounds that match the card theme
- "Remaining" card flips to red with `AlertTriangle` icon and red ring when over budget
- Progress bar color shifts: indigo → amber at 80% → red at 100%

**Charts**
- Custom `ChartTooltip` component: rounded, themed background, colored dot per series
- `CartesianGrid` uses soft fill from theme (`#f1f5f9` light / `#1e293b` dark); no vertical lines
- Axis ticks use `useTheme()` + mounted guard for correct colors in both themes
- `BarChart` rounded bar tops, `barCategoryGap`, compact Y-axis formatter (`12k` style)
- Donut chart `strokeWidth={0}` removes the default white gap between segments

**Category cards**
- Custom `ColorProgress` component — per-category hex color fill instead of CSS override hack
- Over-budget: red progress bar, red amount, warning text, subtle red ring on card
- Two-column grid for Spent / Planned amounts
- Remaining or over-budget delta shown below amounts

**Expense rows**
- Each row is now a bordered `rounded-xl` card with hover state
- Category icon in a soft-colored circle background
- `PaidBadge` — clickable badge (replaces tiny unlabelled switch); shows ✓ Paid (green) or ⏱ Pending (amber)
- Actual amount colored: green if under planned, red if over
- Date displayed with `CalendarDays` icon when available
- Notes shown as italic line below amounts
- Edit (`Pencil`) and Delete (`Trash2`) actions appear on row hover

**Edit dialog**
- Unified Add/Edit dialog (controlled by `editingId` state)
- Pre-fills all fields from the existing item
- `notes` field added to both Add and Edit

**Empty state**
- Indigo icon in rounded square, descriptive subtitle, "Add First Expense" CTA button

## 2026-06-19 (Mobile DnD discoverability)

### Added / Changed — Drag handle visibility on mobile

**Problem:** Drag handles were `opacity-0 group-hover:opacity-100` everywhere, making them invisible on touch devices and completely undiscoverable.

**Fix applied to Places, Checklist, Itinerary:**
- Handle opacity changed to `opacity-100 md:opacity-0 md:group-hover:opacity-100`
  — Always visible on mobile, still hover-revealed on desktop (no desktop regression)
- Handle colour updated: `text-muted-foreground/50 hover:text-muted-foreground/80 active:text-muted-foreground` on mobile
  — `md:text-muted-foreground/20` on desktop (same as before)
- Touch target: `min-h-[44px] w-9` on handle buttons (itinerary: `w-9 md:w-5` to preserve desktop layout)
- Removed hard-coded `mt-3.5 ml-1` offsets in checklist; replaced by `flex items-center justify-center`

**DragHint banner** — `components/shared/drag-hint.tsx`
- Shows once per device (`localStorage` key `dnd_reorder_hint_v1`)
- Only renders on mobile (`md:hidden`, `matchMedia('max-width: 767px')`)
- Auto-dismisses after 4.5 s; also has ✕ close button
- Placed above the DnD list in each of the 3 components (Places, Checklist, Itinerary)
- Since the localStorage key is shared, it shows exactly once no matter which screen the user sees first

## 2026-06-19 (Mobile overflow menus — all cards)

### Changed — Mobile UX across 6 components

**Pattern applied everywhere:**
- Desktop: existing hover-revealed action buttons unchanged (`hidden md:inline-flex opacity-0 group-hover:opacity-100`)
- Mobile: `⋮` (`MoreVertical`) button always visible, opens `DropdownMenu` with contextual actions
- Touch targets: all trigger buttons are 44×44 px (`h-8 w-8` = 32px + natural padding from Button, plus `p-2` on trip card)
- Delete now requires `confirm()` confirmation everywhere it was previously instant (checklist, budget, journal, wishlist)

**Files changed:**
| Component | Mobile menu actions |
|---|---|
| `itinerary-content.tsx` | Edit · Open in Maps (if location) · Delete |
| `checklist-content.tsx` | Mark complete/incomplete · Delete |
| `budget-content.tsx` | Edit · Mark as Paid/Pending · Delete |
| `journal-content.tsx` | Delete |
| `wishlist-content.tsx` | Open in Maps · Convert to Trip · Delete |
| `dashboard/trip-card.tsx` | Delete Trip (opens existing confirm dialog) |
| `trips/places-content.tsx` | (already done in previous session) |

**Behavior rules enforced:**
- Tapping a card body does NOT open edit (edit only via menu)
- Journal cards still open read-only detail view on tap (correct behavior)
- Wishlist "Convert to Trip" button remains visible inside card on all sizes
- Trip card navigates to trip detail on tap; delete only via ⋮ menu on mobile

## 2026-06-19 (Places Edit)

### Added — Edit Place (`components/trips/places-content.tsx`)

- `Pencil` icon button on every place row (appears on hover, alongside existing `Trash2` delete)
- Edit dialog pre-fills all fields from the existing location record
- Google Places Autocomplete inside edit dialog — searching and selecting a new place marks `editPlaceChanged = true` and stores new coords/address in ref
- On save: only overwrites `address`, `lat`, `lng` (and Google Maps link/name) when a new Google Place was selected — editing cost or notes alone leaves location data untouched
- Shared `PlaceForm` component extracted and reused by both Add and Edit dialogs (DRY)
- Existing address shown as a hint below the search box while no new place is selected
- `PlaceDetails` type imported from `PlacesAutocomplete` to fix TS mismatch (`lat: number | null`)

## 2026-06-19 (Places DnD)

### Added
- **Places Drag & Drop** — Items in each group (To Visit / Visited) are now reorderable by drag and drop.
  - `GripVertical` handle per row; appears on hover, only the handle starts a drag
  - Two independent `DndContext`s — one for "To Visit", one for "Visited" — so drag is scoped within each group
  - Smooth animations: dragged item at 40% opacity, surrounding rows animate into position via CSS transform, `DragOverlay` floats at `scale(1.02)` with border + shadow
  - `dropAnimation` with cubic-bezier easing on release
  - Mobile long-press via `TouchSensor` (250 ms delay, 5 px tolerance); desktop via `PointerSensor` (8 px threshold); keyboard via `KeyboardSensor`
  - Order persisted to `locations.order_index` in Supabase (fire-and-forget per-item updates)
  - Page query already uses `.order('order_index')` so order survives refresh
  - All existing functionality unchanged: Google Places autocomplete, Google Maps link, visit toggle, delete, type badge, cost/time display, Add Place dialog

## 2026-06-19

### Added
- **Checklist Drag & Drop** — Items in each checklist category (Documents, Packing, Custom) are now reorderable by drag and drop.
  - `GripVertical` drag handle per item; only the handle initiates dragging
  - Within-category sorting (order is preserved per category)
  - Smooth animations: lift at scale 1.02, shadow, 40% opacity on source item, surrounding items animate into position
  - `DragOverlay` for a floating ghost card during drag
  - Order persisted to Supabase `order_index` column (fire-and-forget, page refresh preserves order)
  - Mobile long-press drag via `TouchSensor` (250 ms delay); desktop drag via `PointerSensor` (8 px threshold)
  - Keyboard accessible via `KeyboardSensor`
  - All existing functionality preserved: toggle completion, delete, progress bar, category tabs, add dialog

- **Settings — Mobile Responsive Layout** — Settings redesigned for mobile with an iOS-native feel.
  - Hub page (`/settings`) shows category cards with icon, title, description, and chevron
  - Each sub-page has a sticky `← Settings` back header (mobile only)
  - All 6 sections (Account, Subscription, Notifications, Appearance, Language & Region, Privacy) use grouped iOS-style rows with `divide-y` cards
  - Sticky full-width Save button fixed to viewport bottom on mobile; inline button on desktop
  - Desktop sidebar layout unchanged

- **Settings — All 6 Sections** (Account, Subscription, Notifications, Appearance, Language & Region, Privacy)
  - `user_settings` table with RLS (migration `006_user_settings.sql`)
  - Appearance section wired to `next-themes` for live theme switching
  - Privacy section includes danger zone with email-confirmation account delete

### Fixed
- Sidebar Settings link now shows active highlight when on any `/settings/*` route

---

## 2026-06-22 (Bug fix — hero image missing on trip cards)

### Fixed — `components/dashboard/trip-card.tsx`

**Root cause (two compounding issues):**

1. **Broken `onError` fallback cycle**: When `cover_photo` is null, `getDestinationImage()` returns the country image (e.g., Spain URL) as the primary `imgSrc`. If that URL fails, the `onError` handler called `getCityOrCountryImage(trip.country)` which returned the **same Spain URL**. The `img.src !== fallback` guard was then `false`, so the final `FALLBACK_IMAGE` was never attempted — the image stayed broken permanently.

2. **No server-side image caching on cards**: The trip detail shell uses Next.js `<Image>` (which caches images server-side via the Next.js image optimizer). If a `cover_photo` URL was valid when the detail was last visited, the cached version still served. Cards used a plain `<img>` tag making a direct browser request to the (now-broken) URL, bypassing the cache.

**Fix applied:**
- Replaced `<img>` with Next.js `<Image fill>` in `TripCard` — now consistent with `TripDetailShell`, benefits from server-side optimization and caching
- Replaced the DOM-mutation `onError` handler with a React state-based three-level fallback:
  1. `primarySrc` = `getDestinationImage(trip)` (uses `cover_photo` if valid, else city/country auto-image)
  2. On error → `countrySrc` = `getCityOrCountryImage(trip.country ?? '')` (null-safe)
  3. On error → `fallbackSrc` = generic travel FALLBACK_IMAGE
- Null-safe: `trip.country ?? ''` prevents a `TypeError` crash if `country` is null at runtime

---

## 2026-06-22 (Bug fix — "Planning" label on completed/active trips)

### Fixed — 5 files

**Root cause:** Multiple status-display components read `trip.status` (the DB-stored enum) instead of `getEffectiveStatus(trip)` (the date-derived truth). For trips whose end_date has passed but whose DB status is still `'upcoming'` or `'planning'`, `getEffectiveStatus` returns `'completed'`, but the UI was showing "Planning" because the raw status value fell through to a generic fallback.

**Rule enforced everywhere:** 
- `completed` or `active` → never show Planning indicator regardless of `is_planning` flag
- `upcoming` + `is_planning=true` → show Planning indicator
- `cancelled` → show Cancelled only

**Files fixed:**

1. **`components/dashboard/dashboard-content.tsx`** — Recent Trips `statusBadge` now uses `getEffectiveStatus(trip)` for `active`/`completed`/`cancelled` checks. Previously used `trip.status` directly, so completed trips fell through to the generic "Planning" fallback.

2. **`components/trips/trip-detail-shell.tsx`** — Planning confirm pill now guards with `!['active', 'completed'].includes(getEffectiveStatus(trip))`. A trip that is already active or completed no longer shows the Planning pill at all.

3. **`components/trips/trips-list-content.tsx`** — "Planning" filter now excludes `active` and `completed` effective statuses. A completed trip with `is_planning=true` no longer leaks into the Planning filter.

4. **`components/search/search-content.tsx`** — Both trip status badges now use `getEffectiveStatus(t)` for both the color class and the displayed label. Added `getEffectiveStatus` to the import.

5. **`components/shared/command-palette.tsx`** — Trip `badge` and `badgeColor` now use `getEffectiveStatus(t)` instead of `t.status`. Added `getEffectiveStatus` to the import.
