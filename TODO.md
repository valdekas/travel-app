# 📋 Travel Planner – TODO

Last Updated: 2026-06-24

---

## 🚨 Current Focus

DO NOT START NEW FEATURES UNTIL ALL ITEMS IN "Current Sprint" ARE COMPLETED.

# 🔥 Current Sprint (Highest Priority)

## Calendar

* [x] View switcher — Month / 3 Months / 6 Months / Year (default 3 Months)
* [x] Navigation — Previous / Today / Next (advances by view count)
* [x] Premium calendar grid — gap-px border, soft rounded-xl per month, polished typography
* [x] Trip date range bars — continuous colored bars with `rounded-l` start, `rounded-r` end, flat middle; week-boundary wrapping
* [x] Trip colors — 9-color deterministic palette assigned by sorted trip index, consistent across views
* [x] Sidebar — Featured Next/Active trip card with colored accent bar + flag + days countdown; Upcoming list with flags + dates + countdown badges; Deadlines; Legend
* [x] Day click — highlight selected day, show day's trips in Selected Day sidebar panel with clear (×)
* [x] Year view — 12 compact mini-calendars in 4×3 grid, trip dots instead of bars
* [x] 6-month view — 2-column desktop grid
* [x] Mobile agenda view — `md:hidden` list of trips per month with Active/Nd badges; large touch targets
* [x] Empty state — plane icon + "Plan Your First Trip" CTA button
* [x] Sidebar responsive — sticky right column on lg+; stacked below calendar on smaller screens

## World Map

* [ ] Improve map colors (less dark, more vibrant)
* [ ] Reduce marker size when zooming in
* [ ] Adaptive marker scaling
* [ ] Improve zoom & pan smoothness
* [ ] State/Province support (USA first)

## Pre-Mobile Readiness (low-effort, also fix web bugs)

* [x] Create `supabase/migrations/011_avatars_storage.sql` — avatars bucket is referenced in `account-settings.tsx` but has no migration; upload silently fails without it
* [x] Refactor `uploadJournalPhoto` / `deleteJournalPhoto` in `lib/utils/journal-photos.ts` to accept a Supabase client parameter instead of calling `createClient()` internally — removes the only tight coupling to the browser-only client factory

## Trip Details

* [x] Auto-create itinerary days on trip creation — bulk insert one day per date (capped at 30) when start_date + end_date are set; silent skip if dates missing
* [x] Fix expiring Google Places hero images — download and store in Supabase Storage (`trip-heroes` bucket) at trip creation; self-healing onError fallback updates DB for existing trips
* [x] Fix hero image storage: switched from broken server-side route (Google URLs return 403 from Node.js) to client-side download; then discovered CORS also blocks client-side fetch of Google URLs
* [x] Replace Google Places hero images with Pexels API — permanent URLs, no CORS issues; fire-and-forget POST `/api/trips/pexels-hero` after trip creation; gradient placeholder for missing/broken images; `PEXELS_API_KEY` server-side only
* [x] Google Places hero image via server-side Places Details API — migration 015 adds `place_id` to trips; `place_id` saved on autocomplete select; `/api/trips/fetch-hero` downloads photo server-side via `photo_reference` and uploads to Supabase Storage; Pexels removed as fallback; old `/api/trips/hero` stub removed
* [x] Remove Pexels API — produced irrelevant images (e.g. cars for Miami); hero pipeline is now Google Places → gradient placeholder only; `pexels-hero.ts` and `/api/trips/pexels-hero` route deleted
* [x] Fix hero image loading order — gradient placeholder shown immediately for new trips (no jarring Unsplash→real photo swap); cover_photo not pre-filled in INSERT; gradient redesigned (indigo/blue, destination initial + city label); trip cards use same gradient when cover_photo is null
* [x] Fix hero image editing — "Use destination image" calls fetch-hero API (not static lookup); "Reset to auto" re-fetches in background when place_id exists; change-photo dialog preview shows gradient instead of wrong Unsplash fallback; destination PlacesAutocomplete in edit dialog updates place_id
* [x] Fix destination field UX in edit dialog — typing manually clears place_id; status hint (✓ confirmed / select from dropdown); button disabled when no place_id; success toast clarifies save is required
* [x] Currency preference — user_settings.currency now pre-fills the currency dropdown when creating a new trip; existing trips keep their own saved currency
* [ ] Create `trip-heroes` Storage bucket in Supabase Dashboard (migration 013 never applied — manual step required)
* [ ] Apply migration 015 (`place_id` column) in Supabase Dashboard or via CLI
* [x] Custom hero image upload — Upload photo button in Edit Trip dialog + Create Trip form; floating "Change photo" button on trip hero (hover desktop, always mobile); validates type/size, uploads to trip-heroes bucket, graceful failure handling
* [x] Date range picker — replace two separate date inputs with single inline calendar; two months on desktop, one on mobile; nights counter; react-day-picker v10 mode="range"
* [ ] Polish Hero section
* [ ] Add weather widget (placeholder — no API yet)
* [x] Add Trip Readiness widget to Overview tab
* [x] Improve Overview cards — Budget-style left-border accents, icon pills, trip notes card
* [x] Itinerary stat card: show X/Y days planned (days with activities / total days)
* [x] Fix Trip Readiness scoring — itinerary/budget/places were binary flags; now proportional
* [x] Fix Trip Readiness budget score — now measures budgetPlanned/tripBudget ratio, not existence
* [x] Fix Trip Readiness itinerary score — now uses daysWithActivities/tripDuration, not total days created
* [x] Replace all native confirm() dialogs — new ConfirmDialog component used across Itinerary, Checklist, Places, Budget
* [x] Fix Dashboard "Countries Visited" count — mirrors World Map formula exactly: union(visitedCountryCodes, resolveA2(tripCompleted)) — no partial inflation
* [ ] Better spacing and alignment

## AI Suggestions Tab

* [x] DB migration `014_trip_suggestions.sql` — `trip_suggestions` table with RLS + index
* [x] Background generation API `/api/suggestions/generate` — calls Claude Haiku for all 6 categories in parallel (15 per category), stores in DB; fire-and-forget from trip creation
* [x] Trip creation fires generation — after INSERT, fires `fetch('/api/suggestions/generate', ...)` with no await
* [x] "Suggestions" tab added to trip detail navigation (between Places and Itinerary)
* [x] Suggestions page (`/trips/[id]/suggestions`) — server component fetching suggestions + itinerary days
* [x] Suggestions content UI — category filter tabs (All + 6 categories, sticky, horizontal scroll mobile), All view collapses to 5 with "Show all N" expand, single-category view shows full 2-col grid; cards with emoji/name/description/price/mustTry/tip/whyVisit, "+ Places" and "+ Itinerary" actions, day picker dialog, added ✓ badges, skeleton loading state (tabs disabled + 6 skeleton cards), auto-polls every 5s until suggestions appear
* [x] TripAdvisor enrichment — replaced Foursquare with TripAdvisor Content API; real photo, address, rating (1-5 scale + review count), coordinates, Google Maps link, website, price_level; sequential requests with 100ms delay; migration 017 swaps fsq_place_id → ta_location_id + price_level; card shows TA link, reviews count, TA price_level preferred over AI price_range; UI filters to enriched-only (photo_url + rating both non-null); tab counts reflect enriched count; zero-count tabs grayed/disabled; Claude prompt upgraded to request well-known places with strong TripAdvisor presence; generation reliability: error logging, per-category cache guard (regenerates only missing categories), Bars prompt tuned for TA-indexed venues
* [x] Fix stale added_to_itinerary / added_to_places badges — deleting from Itinerary/Places tab now resets the flag in trip_suggestions by name match; Suggestions tab cross-checks flags on mount and auto-clears any that no longer exist
* [x] Replace Claude AI with TripAdvisor direct search in ✨ Suggestions panels (Places + Itinerary) — new `/api/suggestions/search` route; result cards show real photos, ratings, addresses, and branded Maps/Web/TA links; 24h localStorage cache with `ta_` prefix; graceful no-results state
* [x] Fix accidental day deletion UX — delete button moved into ⋯ overflow dropdown; confirm dialog shows exact activity count; button gap increased to 8px on mobile
* [x] Fix stale day list in Suggestions day picker — days re-fetched from DB each time the day picker dialog opens (suggestions-content) or the ✨ Suggestions panel opens (itinerary-suggestions-panel); loading skeleton shown while fetching; handleAdd queries live order_index from DB
* [x] Complete stale-days fix — both suggestions-content and itinerary-suggestions-panel now also re-fetch days on mount, so the list is fresh immediately when the user navigates to the Suggestions tab
* [x] Fix itinerary day renumbering after deletion — remaining days are renumbered sequentially from 1 in both DB and local state; day dates are preserved
* [x] Fix itinerary day date calculation — addDay and deleteDay now anchor dates to trip.start_date + (dayNumber - 1); deleting days no longer causes dates to drift beyond trip end; fallback to last-day+1 when no start_date
* [x] ✨ Auto-schedule — per-day Claude-powered activity ordering + Google Maps travel times; preview dialog before applying; travel time connectors between cards; drag-and-drop clears stale times with re-run hint
* [x] Fix: save lat/lng + location fields when adding activities from Suggestions tab and ✨ Suggestions panels so auto-schedule can compute travel times
* [x] Fix TA Suggestions search to use location-based nearby search — Google Geocoding resolves area/city to lat/lng; TA nearby_search with 5km (area) or 20km (city) radius; falls back to text search if nearby returns 0; panels now send tripLat/tripLng as fallback coords

## Places

* [x] Drag & Drop ordering — handle-only, per-group (To Visit / Visited), persisted to DB
* [x] Edit Place — pencil button per row, pre-filled modal, Google Places autocomplete, preserves coords when only editing notes/cost
* [x] Mobile overflow menu (⋮) — Edit, Open in Maps, Delete
* [x] AI Suggestions — ✨ button opens panel; category-first three-step flow (6 categories → optional area refinement → 15 city/area-specific results); Google Places autocomplete biased to trip coordinates; area pill with clear (×); skip option; area included in cache key; checkbox selection; bulk insert into locations table
* [x] Fix destination display name — `extractPlace()` now uses `place.name` first (e.g. "Mallorca" not "Balearic Islands"); falls back to locality → admin_area_level_2 → admin_area_level_1
* [ ] Better Place cards
* [ ] Improve mobile layout

## Itinerary

* [x] AI Suggestions — ✨ button (shown when days exist); category-first three-step flow (6 activity categories → optional area refinement → 15 city/area-specific results); Google Places autocomplete biased to trip coordinates; area pill with clear (×); skip option; area included in cache key; checkbox selection; day selector (auto if 1 day, dropdown if multiple); bulk insert into itinerary_items
* [x] Drag & Drop activities — handle-only, per-day, persisted
* [x] Mobile DnD discoverability — handle always visible on mobile, DragHint banner (once per device)
* [x] Activity detail expand — click card body to expand full description/address; chevron indicator; inline Edit + Maps shortcuts; `line-clamp-2` compact preview; full text on mobile (no truncation when expanded)
* [x] Chronological insert — new activities with a start_time slot into the correct position by time instead of always appending; DnD manual order unaffected
* [x] Day collapse/expand — click day header to toggle activity list; all start expanded; chevron rotates; UI-only, no DB
* [x] Day completed toggle — `CheckCircle2` button marks day done; emerald header + circle + dimmed text; persisted to `itinerary_days.is_completed`; optimistic UI with rollback; 44px touch targets on mobile
* [ ] Travel time between activities
* [ ] Activity photos
* [ ] Timeline polish

## Budget

* [x] Polish summary cards — colored accents, over-budget warning, progress bar
* [x] Polish charts — custom tooltips, soft grid, theme-aware colors
* [x] Polish category cards — color progress bars, over-budget state, spent/remaining display
* [x] Polish expense rows — card style, paid badge toggle, edit action, amounts/date/notes
* [x] Edit expense dialog
* [x] Polished empty state

## Journal

* [x] Timeline layout — entries grouped by date, Day N labels, chronological order
* [x] Improved entry cards — mood emoji, preview, photo count, favorite star, location chip
* [x] MoodPicker — premium 5-emoji card grid, scale animation, 44px touch targets
* [x] LocationPicker — custom Dialog; sections: No location / Trip destination / Saved places; preview card with badge, address, Maps link
* [x] TripDayBadge — auto "Day N" or "Before trip" badge from entry date + trip start date
* [x] Photos — camera icon placeholder; URL input in collapsible "Add via URL" section; preview grid
* [x] Form structure — Title → Date&Time → Mood → Linked Location → Journal Entry → Photos → More Options
* [x] More Options — weather ("Auto-filled in future" placeholder) + favorite toggle
* [x] Photos — Supabase Storage upload (gallery + camera), progress thumbnails, URL fallback
* [x] Photos editor — URL inputs with previews, remove button, grid display in detail view
* [x] Favorites — star toggle, optimistic UI + Supabase persist
* [x] Search — filter by title, content, location name
* [x] Edit functionality — pre-filled dialog, full field editing
* [x] Google Places link — 📍 Opens in Google Maps when google_maps_link is set
* [x] Linked Location fix — nested Dialog bug fixed (inline list); linked_to_trip DB column persists trip destination across reloads; resolveLocation() unifies display for both trip destination and saved places
* [x] Desktop split panel — left timeline, right detail view
* [x] Mobile detail dialog — tap card → full-screen Dialog with all details
* [x] Time field support — time stored and displayed on cards/detail
* [x] DB migration — `time TEXT`, `is_favorite BOOLEAN` added to journal_entries (007)
* [x] DB migration — `linked_to_trip BOOLEAN` added to journal_entries (009)

## Checklist

* [x] Drag & Drop — handle-only, per-category, persisted to DB
* [x] Better animations — lift, shadow, scale, smooth reposition
* [x] Mobile DnD discoverability — handle always visible on mobile

## Settings

* [x] Account page
* [x] Subscription page
* [x] Notifications
* [x] Appearance
* [x] Language selector
* [x] Privacy page
* [x] Mobile responsive layout — iOS-style hub + back navigation

---

# 🟡 Polish Before Release

* [x] Landing page redesign — premium dark theme; hero with rotating city photos, world map, dashboard showcase, phone feature carousel, pricing, footer
* [x] Landing page phone showcase — fixed gap + scroll-reset bug by replacing scroll-driven sticky section with normal-height auto-advancing carousel (click resets interval)
* [ ] Check all desktop pages
* [ ] Check all mobile pages
* [ ] Remove UI inconsistencies
* [ ] Improve animations
* [ ] Improve loading states
* [ ] Improve empty states
* [ ] Verify dark mode
* [ ] Verify responsive layout

---

# 🟢 Future Features

* [ ] AI Travel Assistant
* [ ] AI Itinerary Suggestions
* [ ] Google Calendar Sync
* [ ] Weather Forecast
* [ ] Currency Converter
* [ ] Travel Statistics
* [ ] Achievement System
* [ ] Push Notifications
* [ ] Offline Mode

---

# ❄️ Parking Lot (Ideas)

Ideas that should NOT be implemented yet.

* [ ] Mobile App (after web app)
* [ ] Apple Watch
* [ ] Wear OS
* [ ] Social features
* [ ] Shared trips
* [ ] Public profiles

---

# ✅ Done This Sprint

* [x] Bug fix — Hero image missing on trip cards: switched card from `<img>` to `<Image>` (Next.js optimizer/caching), replaced DOM-mutation onError with React state three-level fallback (cover_photo → country image → global fallback)
* [x] Bug fix — "Planning" badge shown on completed/active trips: all 5 status-display sites now use getEffectiveStatus() — Dashboard Recent Trips, trip detail Planning pill, My Trips Planning filter, Search badges, Command Palette badge
* [x] Bug fix — Google OAuth redirectTo now uses NEXT_PUBLIC_SITE_URL env var (falls back to location.origin for local dev), ensuring production always redirects to travel365.live regardless of IP vs domain access
* [x] Bug fix — Google OAuth bad_oauth_state + post-login landing page: middleware now redirects raw-IP access to production domain (prevents PKCE cookie domain mismatch), /auth/callback excluded from auth-route session redirect (allows exchangeCodeForSession to always run), callback uses NEXT_PUBLIC_SITE_URL as redirect base (prevents localhost redirect behind Nginx), OAuth errors now surface as toast on login page
* [x] Bug fix — Google OAuth PKCE code_verifier wiped by middleware: middleware now returns early for /auth/callback before creating the Supabase client, preventing getUser() from clearing the code_verifier cookie before exchangeCodeForSession runs
* [x] Dashboard empty state — premium onboarding experience: greeting with time-of-day + user name, decorative world map (react-simple-maps, no interactions, pulsing glow), 5 feature cards grid (2-col mobile / 5-col desktop), staggered fade-in animations; normal dashboard unaffected
* [x] Bug fix — World Map tooltip/fill used raw trip.status instead of getEffectiveStatus(): date-completed trips now correctly show as visited in country tooltip and map highlight (both CountryTooltip and tripVisitedCodes memo)
* [x] Bug fix — Places tab handleReorder logic inversion: reordering within "To Visit" no longer corrupts the "Visited" group and vice versa
* [x] Global Travel Journal redesign — replaced basic 20-entry list with a premium memories hub: featured memory hero card (auto-picks best photo), 2-col memory grid, stats bar (entries/trips/photos/favorites), search + filter pills (All/Favorites/With Photos), "Memories by Trip" section, beautiful gradient placeholders for entries without photos, polished empty state; now fetches all entries (no 20-item cap)

* [x] Google Places Autocomplete
* [x] Automatic destination images
* [x] Automatic country detection
* [x] Google Maps integration
* [x] Hero redesign
* [x] Trip image improvements
* [x] Settings page structure
* [x] Remove Priority field
* [x] Dashboard Polish – Phase 1 (hero card, stats cards, staggered animations, hover effects)
* [x] Dashboard Travel Map header (user-friendly summary, pluralization, empty state)
* [x] Dashboard Travel Map legend (Partly visited label, tooltips)
* [x] Dashboard Polish – Phase 2 (travel quotes constants, quick actions, recent trips)
* [x] Dashboard Polish – Phase 3 (Travel Insights): Travel Statistics card, Trip Readiness widget, Next Trip Insights card, Recent Activity widget, Achievements section, improved empty states
* [x] Budget % consistency fix — standardised spent/total_budget formula across Dashboard Insights, Overview card, and Budget tab
* [x] Dashboard Achievements data source fix — unified with Visited Countries canonical tier system via shared lib/utils/achievements.ts
* [x] Visited Countries — Continents counter now includes partial visits (continent counts if any country is full or partial)
* [x] My Travel Map — header subtitle and stats bar both use visited continent count (full+partial), stats bar relabeled "Continents Visited"
* [x] Visited Countries – Improve system: flag-forward cards, continent on all cards, "Regions • States • Islands" label, Greece/Portugal islands, Spain/Italy island details
* [x] Trip status logic — `getEffectiveStatus()` derives Upcoming/Active/Completed from dates; My Trips filter, trip hero badge, dashboard active/completed counts all updated; Cancelled remains manual-only
* [x] Two-dimensional planning flag — `is_planning` boolean (DB: `010_is_planning.sql`); Planning pill in trip hero confirms a trip; filter shows Planning AND date-derived state simultaneously; toggle also in edit dialog
* [x] My Trips sort order — trips now sorted by `start_date ASC` (soonest first), no-date trips appended by `created_at DESC`; matches Dashboard order
* [x] Command palette (⌘K) — full-text search across trips, places, wishlist, checklist, journal with recent history and keyboard navigation
* [x] Settings hub — account, appearance, language, notifications, privacy, subscription; iOS-style mobile hub
* [x] UI primitives — FlagImg, CountrySelect, PlacesAutocomplete, DragHint
* [x] Shared shell/nav polish — sidebar, topbar, dashboard-shell updated to new design system
* [x] Landing page redesign — animated SVG globe, feature cards, destinations gallery, testimonials, Framer Motion scroll-reveal
