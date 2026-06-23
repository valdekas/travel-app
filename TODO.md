# 📋 Travel Planner – TODO

Last Updated: 2026-06-21

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

## Places

* [x] Drag & Drop ordering — handle-only, per-group (To Visit / Visited), persisted to DB
* [x] Edit Place — pencil button per row, pre-filled modal, Google Places autocomplete, preserves coords when only editing notes/cost
* [x] Mobile overflow menu (⋮) — Edit, Open in Maps, Delete
* [x] AI Suggestions — ✨ button opens panel; Claude suggests 8–10 city-specific places; checkbox selection; bulk insert into locations table; extractCity() uses city→region→country priority
* [ ] Better Place cards
* [ ] Improve mobile layout

## Itinerary

* [x] AI Suggestions — ✨ button (shown when days exist); Claude suggests 8–10 activities; checkbox selection; day selector (auto if 1 day, dropdown if multiple); bulk insert into itinerary_items
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
