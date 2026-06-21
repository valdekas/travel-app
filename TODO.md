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

## Trip Details

* [ ] Polish Hero section
* [ ] Add weather widget (placeholder — no API yet)
* [ ] Add Trip Readiness widget to Overview tab
* [ ] Improve Overview cards
* [ ] Better spacing and alignment

## Places

* [x] Drag & Drop ordering — handle-only, per-group (To Visit / Visited), persisted to DB
* [x] Edit Place — pencil button per row, pre-filled modal, Google Places autocomplete, preserves coords when only editing notes/cost
* [x] Mobile overflow menu (⋮) — Edit, Open in Maps, Delete
* [ ] Better Place cards
* [ ] Improve mobile layout

## Itinerary

* [x] Drag & Drop activities — handle-only, per-day, persisted
* [x] Mobile DnD discoverability — handle always visible on mobile, DragHint banner (once per device)
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
* [x] Command palette (⌘K) — full-text search across trips, places, wishlist, checklist, journal with recent history and keyboard navigation
* [x] Settings hub — account, appearance, language, notifications, privacy, subscription; iOS-style mobile hub
* [x] UI primitives — FlagImg, CountrySelect, PlacesAutocomplete, DragHint
* [x] Shared shell/nav polish — sidebar, topbar, dashboard-shell updated to new design system
* [x] Landing page redesign — animated SVG globe, feature cards, destinations gallery, testimonials, Framer Motion scroll-reveal
