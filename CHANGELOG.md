# Changelog

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
