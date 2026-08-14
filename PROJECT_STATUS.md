# Travel Planner Pro — Project Status

> Last updated: 2026-06-18
> Build status: **PASSING** — all routes compile cleanly with zero TypeScript errors.

---

## Project Overview

Travel Planner Pro is a full-stack trip planning application built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI, and Supabase. It organises travel hierarchically: **Country → Region → City → Place**, with per-trip sections for itinerary, checklist, budget, and journal.

**Directory:** `/home/travel_planer_app`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| UI Components | ShadCN UI — **base-ui** (NOT radix-ui) |
| Database / Auth | Supabase (`@supabase/ssr`) — PostgreSQL + RLS |
| Charts | Recharts 3 |
| Drag & Drop | DnD Kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Date utilities | date-fns 4 |
| Theme | next-themes |
| Toasts | sonner |
| Runtime | Node.js / React 19 |

### Critical ShadCN / base-ui API Differences

This project uses **base-ui** not radix-ui. Several APIs differ from what most Next.js guides show:

- **No `asChild` prop.** Use `render={}` instead:
  ```tsx
  // WRONG (radix-ui style):
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>

  // CORRECT (base-ui style):
  <DialogTrigger render={<Button>Open</Button>} />
  ```
- **`Select.onValueChange` returns `string | null`**, not `string`. Always null-coalesce:
  ```tsx
  onValueChange={v => setState(v ?? 'default')}
  ```
- **`DropdownMenuItem` has no `asChild`.** Put links inside the item directly:
  ```tsx
  <DropdownMenuItem><a href="..." className="w-full">Link</a></DropdownMenuItem>
  ```

---

## Current Implementation Status

All core features are **complete and building successfully**.

### Completed Features

- [x] **Landing page** — dark gradient hero, feature highlights, CTA
- [x] **Authentication** — email/password login + register, Google OAuth, protected routes
- [x] **Dashboard** — greeting, 6-stat grid, countdown hero card (urgency colour: red ≤7d / amber ≤30d / violet), upcoming trips list, quick actions, wishlist preview
- [x] **Trip management** — list with status filter + search; create form (38 countries, dates, budget, currency, cover photo, notes); edit dialog; auto-seeds default checklist items on create
- [x] **Trip overview** — large countdown, 4 progress cards (checklist %, budget spend, places visited, itinerary days), checklist preview
- [x] **Places (location planner)** — recursive tree view (region → city → attraction/restaurant/etc.); add/delete locations; toggle visited; Google Maps links; parent selector in add dialog
- [x] **Itinerary** — day-by-day timeline; add days (auto-increments date); add activities per day; drag-and-drop reorder with DnD Kit (`useSortable`, `closestCenter`, `arrayMove`)
- [x] **Checklist** — three categories (Documents, Packing, Custom); per-category progress bars; overall progress bar; add/complete/delete items; priority, due date, notes fields
- [x] **Budget tracker** — category totals (flights/hotels/food/activities/transport/shopping/other); planned vs actual BarChart; spending breakdown PieChart; expense list with paid switch
- [x] **Travel journal (per-trip)** — entry list + detail panel; photo gallery (URL array); mood emoji; weather; linked location; add/delete entries
- [x] **Global journal** — all entries across trips, linked to trip name
- [x] **Wishlist** — grouped by country; priority; estimated cost; Google Maps link; convert-to-trip (placeholder action); add/delete
- [x] **Calendar** — custom monthly grid using `eachDayOfInterval`; trip spans rendered as coloured divs; next trip countdown sidebar
- [x] **Search** — full-text filter across trips, places, and wishlist; tabs (All/Trips/Places/Wishlist); status, priority, and location-type filters
- [x] **Dark / light mode** — system preference default, manual toggle in topbar; oklch-based violet/indigo theme variables
- [x] **Premium world map interactions** — custom pan/zoom hook using native Pointer Events API + requestAnimationFrame; inertia scrolling with exponential velocity decay (friction 0.91), 40-50% reduced pan sensitivity, log-scale smooth wheel zoom, pinch-zoom on mobile, double-click zoom, smooth animated reset; all at 60 FPS via direct SVG transform attributes (no React re-renders)
- [x] **Visited Countries — subregion tracking** — full state/region/province support for US (51), Canada (13), Australia (8), Brazil (27), India (36), Germany (16), Spain (17), Italy (20), UK (13), France (18); separate `visited_regions` DB table; country cards expand to show region picker with search, progress bar, and per-region toggles; counting rule: visiting one US state does NOT count the whole country; auto-marks country fully visited when last region is toggled; partial-visited countries shown in distinct colour on dashboard world map with tooltip listing visited regions; dashboard stats card shows "Regions & States" total

---

## File Structure

```
app/
├── layout.tsx                        Root layout — ThemeProvider, Toaster, Geist fonts
├── globals.css                       Tailwind v4 + oklch theme variables
├── page.tsx                          Landing page
├── (auth)/
│   ├── layout.tsx                    force-dynamic to prevent Supabase prerender errors
│   └── auth/
│       ├── login/page.tsx            Login + register form + Google OAuth button
│       └── callback/route.ts         OAuth code exchange handler
└── (dashboard)/
    ├── layout.tsx                    Auth check → redirect to /auth/login if unauthed
    ├── dashboard/page.tsx
    ├── trips/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/
    │       ├── layout.tsx            Fetches trip, wraps in TripDetailShell
    │       ├── page.tsx              Redirects to /overview
    │       ├── overview/page.tsx
    │       ├── places/page.tsx
    │       ├── itinerary/page.tsx
    │       ├── checklist/page.tsx
    │       ├── budget/page.tsx
    │       └── journal/page.tsx
    ├── wishlist/page.tsx
    ├── calendar/page.tsx
    ├── search/page.tsx
    └── journal/page.tsx

components/
├── ui/                               ShadCN base-ui components (accordion, avatar, badge,
│                                     button, calendar, card, checkbox, dialog, dropdown-menu,
│                                     input, label, popover, progress, scroll-area, select,
│                                     separator, sheet, skeleton, sonner, switch, table, tabs,
│                                     textarea, tooltip)
├── providers/theme-provider.tsx
├── shared/
│   ├── sidebar.tsx                   Collapsible sidebar, 7 nav items
│   ├── topbar.tsx                    Theme toggle, user avatar dropdown
│   └── dashboard-shell.tsx           Desktop sidebar + mobile Sheet + Topbar
├── dashboard/
│   ├── dashboard-content.tsx
│   ├── world-map-widget.tsx          Interactive world map (premium pan/zoom, visited/partial countries)
│   ├── countdown-card.tsx
│   ├── stats-grid.tsx                Regions & States stat card
│   └── trip-card.tsx
├── trips/
│   ├── trips-list-content.tsx
│   ├── create-trip-form.tsx
│   ├── edit-trip-dialog.tsx
│   ├── trip-detail-shell.tsx         Tab navigation across trip sub-pages
│   ├── trip-overview-content.tsx
│   └── places-content.tsx
├── checklist/checklist-content.tsx
├── itinerary/itinerary-content.tsx
├── budget/budget-content.tsx
├── journal/journal-content.tsx
├── visited/visited-countries-content.tsx  State/region picker, progress bars, 4-stat header
├── wishlist/wishlist-content.tsx
├── calendar/calendar-content.tsx
└── search/search-content.tsx

lib/
├── types/index.ts                    All TS interfaces and union types (incl. VisitedRegion)
├── data/subregions.ts                ISO 3166-2 region data for 10 countries (US/CA/AU/BR/IN/DE/ES/IT/GB/FR)
├── utils/index.ts                    cn, formatDate, daysUntil, tripDuration,
│                                     formatCurrency, getCountryFlag, getTripStatusColor,
│                                     getPriorityColor, buildLocationHierarchy,
│                                     generateGoogleMapsLink
├── utils.ts                          Re-exports from ./utils/index
└── supabase/
    ├── client.ts                     createBrowserClient (browser)
    ├── server.ts                     createServerClient (server components)
    └── middleware.ts                 Session refresh + route protection

supabase/migrations/
├── 001_initial_schema.sql            Full schema + RLS + updated_at triggers
└── 003_visited_regions.sql           visited_regions table + RLS (run manually in Supabase SQL Editor)
```

---

## Database Schema

Ten tables, all with Row Level Security enabled. Every user can only see their own data.

### `trips`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | uuid_generate_v4() |
| user_id | UUID FK → auth.users | |
| name | TEXT | |
| country | TEXT | |
| country_code | TEXT | e.g. "PL" for flag emoji |
| start_date | DATE | |
| end_date | DATE | |
| budget | DECIMAL(12,2) | |
| currency | TEXT | default 'USD' |
| notes | TEXT | |
| cover_photo | TEXT | URL |
| status | TEXT | planning / upcoming / active / completed / cancelled |
| created_at, updated_at | TIMESTAMPTZ | |

### `locations`
Hierarchical — `parent_id` self-references to build region → city → place tree.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| trip_id | UUID FK → trips | |
| parent_id | UUID FK → locations | nullable (top-level nodes) |
| name | TEXT | |
| type | TEXT | region / city / attraction / restaurant / beach / viewpoint / hotel / activity / transport / other |
| priority | TEXT | low / medium / high |
| visited | BOOLEAN | |
| google_maps_link | TEXT | |
| lat, lng | DECIMAL(10,7) | |
| estimated_cost | DECIMAL(10,2) | |
| order_index | INTEGER | |

### `checklist_items`
| Column | Type | Notes |
|---|---|---|
| trip_id | UUID FK → trips | |
| category | TEXT | documents / packing / custom |
| title | TEXT | |
| completed | BOOLEAN | |
| priority | TEXT | low / medium / high |
| due_date | DATE | |

### `itinerary_days`
| Column | Type | Notes |
|---|---|---|
| trip_id | UUID FK → trips | |
| date | DATE | |
| day_number | INTEGER | |
| title, notes | TEXT | |

### `itinerary_items`
| Column | Type | Notes |
|---|---|---|
| day_id | UUID FK → itinerary_days | |
| trip_id | UUID FK → trips | |
| type | TEXT | flight / transport / checkin / checkout / meal / activity / tour / event / rest / other |
| start_time, end_time | TIME | |
| location_id | UUID FK → locations | nullable |
| cost | DECIMAL(10,2) | |
| confirmation_number | TEXT | |
| order_index | INTEGER | drag-and-drop position |

### `budget_items`
| Column | Type | Notes |
|---|---|---|
| trip_id | UUID FK → trips | |
| category | TEXT | flights / hotels / food / activities / transport / shopping / other |
| planned_amount, actual_amount | DECIMAL(12,2) | |
| paid | BOOLEAN | |

### `journal_entries`
| Column | Type | Notes |
|---|---|---|
| trip_id | UUID FK → trips | |
| user_id | UUID FK → auth.users | |
| photos | TEXT[] | array of URLs |
| mood | TEXT | amazing / great / good / okay / bad |
| weather | TEXT | |
| location_id | UUID FK → locations | nullable |

### `wishlist_items`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → auth.users | |
| country, region, city | TEXT | for grouping |
| place_name | TEXT | |
| place_type | TEXT | attraction / restaurant / beach / viewpoint / hotel / activity / city / region / other |
| priority | TEXT | low / medium / high |
| converted_to_trip_id | UUID FK → trips | nullable, set when wishlist → trip |

### `visited_countries`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → auth.users | |
| country_code | TEXT | ISO 3166-1 alpha-2 |
| country_name | TEXT | |
| continent | TEXT | |
| first_visit_date, last_visit_date | DATE | optional |
| visit_count | INTEGER | default 1 |

### `visited_regions`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID FK → auth.users | |
| country_code | TEXT | e.g. "US" |
| country_name | TEXT | |
| region_code | TEXT | ISO 3166-2 code e.g. "US-CA" |
| region_name | TEXT | e.g. "California" |
| region_type | TEXT | state / province / territory / region / etc. |
| first_visit_date, last_visit_date | DATE | optional |
| visit_count | INTEGER | default 1 |
| notes, favorite_city | TEXT | optional |
| UNIQUE | (user_id, country_code, region_code) | |

---

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page |
| `/auth/login` | Dynamic | Login + register + Google OAuth |
| `/auth/callback` | Dynamic | OAuth redirect handler |
| `/dashboard` | Dynamic | Main dashboard with stats + countdown |
| `/trips` | Dynamic | Trip list with search + status filter |
| `/trips/new` | Dynamic | Create trip form |
| `/trips/[id]` | Dynamic | Redirects → `/trips/[id]/overview` |
| `/trips/[id]/overview` | Dynamic | Countdown, progress cards, checklist preview |
| `/trips/[id]/places` | Dynamic | Hierarchical location tree |
| `/trips/[id]/itinerary` | Dynamic | Day-by-day drag-and-drop planner |
| `/trips/[id]/checklist` | Dynamic | Pre-trip checklist by category |
| `/trips/[id]/budget` | Dynamic | Budget tracker + Recharts charts |
| `/trips/[id]/journal` | Dynamic | Per-trip journal entries |
| `/wishlist` | Dynamic | Future travel ideas grouped by country |
| `/calendar` | Dynamic | Monthly calendar with trip spans |
| `/search` | Dynamic | Full-text search across all data |
| `/journal` | Dynamic | All journal entries across all trips |
| `/visited` | Dynamic | Visited countries + state/region tracking |

---

## Remaining Tasks

### Must-do before first user can sign in
- [ ] Create a Supabase project at supabase.com
- [ ] Enable Email and Google auth providers in Supabase Authentication settings
- [ ] Set Google OAuth redirect URL: `https://<your-domain>/auth/callback`
- [ ] Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
- [ ] Run `supabase/migrations/003_visited_regions.sql` in the Supabase SQL Editor (adds visited_regions table)
- [ ] Populate `.env.local` with real credentials (see "How to Run" below)

### Nice-to-have / future features
- [x] **Convert wishlist → trip:** Each wishlist card now has a "Convert to Trip" button. Clicking opens a pre-filled dialog (country, name, dates, budget). On confirm: inserts a trip, seeds default checklist items, sets `converted_to_trip_id` on the wishlist item, redirects to `/trips/<id>/overview`. Already-converted cards show a "View trip" link instead.
- [x] **Loading states:** Added `loading.tsx` for all 12 data-fetching dashboard routes (dashboard, trips, wishlist, calendar, search, journal, and all 6 trip sub-pages). Uses the Skeleton component with layouts that approximate each page.
- [x] **Error boundaries:** Added `app/(dashboard)/error.tsx` (client component) — catches and displays any unhandled Supabase errors across all dashboard routes with a "Try again" retry button.
- [ ] **Photo uploads:** Journal and trip cover photo currently accept URLs. Replace with actual file upload (Supabase Storage).
- [ ] **Google Maps embed:** Places and itinerary items store `lat`/`lng` and `google_maps_link`. Could embed a real map (requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
- [ ] **Drag-and-drop between itinerary days:** Currently items reorder within a day. Cross-day movement would need `DragOverlay` and multiple `SortableContext` instances.
- [ ] **Checklist drag-and-drop reorder:** Items within each category could be reordered similarly to itinerary.
- [ ] **Budget multi-currency conversion:** Budget items store their own `currency` field but the charts always convert to the trip's base currency without an actual exchange rate.
- [ ] **Mobile trip-detail tabs:** The tab bar in `trip-detail-shell.tsx` can overflow on very small screens. A horizontal scroll or dropdown could help.
- [ ] **Email notifications / reminders:** Checklist due-date reminders, countdown notifications.
- [ ] **AI features** (originally requested as stretch goals): AI trip suggestions, AI itinerary generation, smart packing list.
- [ ] **Nearby-larger-city fallback for `/api/suggestions/generate`:** For small destinations (e.g. a 2,000-person town), TripAdvisor coverage is sparse enough that even a well-behaved model response mostly gets filtered out downstream (no photo/rating match). Rather than only asking the model to degrade gracefully, detect a small/low-coverage destination and generate a second pass scoped to the nearest larger city or region, explicitly labelled "near {original destination}" in both the prompt and the UI (never silently substituted — that would be misleading). Needs: (1) a small-destination signal — either a population/coverage check via Google Geocoding, or simpler: trigger a second pass when the first pass comes back mostly `no_results` per the per-category status in `/api/suggestions/generate`'s response; (2) a nearby-city resolver (Google Geocoding's admin region, or a broader TripAdvisor `location/search` query); (3) prompt + card UI changes so "near X" results are visibly distinguished from suggestions actually in the destination. Separate feature, not a small addition — scope and implement independently.

---

## Known Issues

| Issue | Severity | File | Notes |
|---|---|---|---|
| No real photo upload | Low | Journal, create-trip-form | Accepts URLs only; no Supabase Storage integration |
| Budget exchange rates are 1:1 | Low | `components/budget/budget-content.tsx` | `formatCurrency` doesn't convert between currencies |
| Google Maps links are manual | Low | Places, itinerary | `generateGoogleMapsLink` builds a search URL, not a pin |

---

## How to Run

### 1. Install dependencies
```bash
cd /home/travel_planer_app
npm install
```

### 2. Set environment variables
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-optional
```

### 3. Set up Supabase
1. Create a project at supabase.com
2. In **Authentication → Providers**, enable Email and Google
3. For Google OAuth set the redirect URL to `http://localhost:3000/auth/callback` (dev) or your production domain
4. Open the **SQL Editor**, paste `supabase/migrations/001_initial_schema.sql`, and run it

### 4. Start the dev server
```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Production build
```bash
npm run build
npm run start
```

---

## Next Recommended Development Steps

Prioritised by user impact:

1. **Supabase Storage for photos.**  
   Replace the URL text inputs in `create-trip-form.tsx` (cover photo) and `journal-content.tsx` (photos array) with a file upload button that stores to a `photos` bucket in Supabase Storage and saves the public URL.

2. **Cross-day drag-and-drop in itinerary.**  
   Currently `DndContext` and `SortableContext` live inside each day card. Moving them up to the parent and using `DragOverlay` would enable dropping items between days.

3. **Real Google Maps integration.**  
   Store `lat`/`lng` when creating a location. Render a `<MapEmbed>` component using the Maps JavaScript API in `places-content.tsx` and `itinerary-content.tsx`.

4. **Budget multi-currency conversion.**  
   `formatCurrency` doesn't convert between currencies — all amounts are treated as the trip base currency.

5. **Mobile trip-detail tabs.**  
   The tab bar in `trip-detail-shell.tsx` can overflow on very small screens.
