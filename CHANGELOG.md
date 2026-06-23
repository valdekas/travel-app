# Changelog

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
