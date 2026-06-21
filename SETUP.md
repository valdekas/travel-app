# Travel Planner Pro — Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Email** and **Google** providers in Authentication > Providers
3. For Google OAuth, set your redirect URL to: `https://yourapp.com/auth/callback`
4. Run all SQL migrations in order via the SQL Editor (or use `apply-migration.mjs`):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_visited_countries.sql`
   - `supabase/migrations/003_visited_regions.sql`
   - `supabase/migrations/004_trip_destination.sql`
   - `supabase/migrations/005_itinerary_location.sql`
   - `supabase/migrations/006_user_settings.sql`
   - `supabase/migrations/007_journal_improvements.sql`
   - `supabase/migrations/008_journal_photos_storage.sql`

### 3a. Supabase Storage (Journal Photos)

Migration `008_journal_photos_storage.sql` automatically:
- Creates the `journal-photos` Storage bucket (public, 10 MB limit per file)
- Adds RLS policies so users can only upload/delete from their own folder

**Storage path structure:** `{userId}/{tripId}/{timestamp}_{random}.{ext}`

**Supported formats:** JPEG, PNG, WebP, GIF, HEIC/HEIF

**Security:**
- Public read (photos render via URL in `journal_entries.photos TEXT[]`)
- Upload restricted: authenticated users can only write to `{their_uid}/...`
- Delete restricted: authenticated users can only delete their own files

To apply migrations programmatically (requires Supabase personal access token):
```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node apply-migration.mjs supabase/migrations/008_journal_photos_storage.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
├── (auth)/auth/login/      # Login & register page
├── (dashboard)/
│   ├── dashboard/          # Main dashboard
│   ├── trips/              # Trip list & creation
│   ├── trips/[id]/
│   │   ├── overview/       # Trip overview with countdown
│   │   ├── places/         # Location hierarchy planner
│   │   ├── itinerary/      # Day-by-day drag & drop
│   │   ├── checklist/      # Pre-trip checklist
│   │   ├── budget/         # Budget tracker
│   │   └── journal/        # Trip journal
│   ├── wishlist/           # Future travel wishlist
│   ├── calendar/           # Travel calendar view
│   ├── search/             # Global search
│   └── journal/            # All journal entries
components/
├── dashboard/              # Dashboard components
├── trips/                  # Trip management components
├── checklist/              # Checklist system
├── itinerary/              # Itinerary planner
├── budget/                 # Budget tracker
├── journal/                # Travel journal
├── wishlist/               # Wishlist
├── calendar/               # Calendar view
├── search/                 # Search
└── shared/                 # Layout, sidebar, topbar
lib/
├── types/                  # TypeScript types
├── utils/                  # Utility functions
└── supabase/               # Supabase clients
supabase/migrations/        # Database schema
```

## Features

- **Dashboard** — stats, countdown to next trip, recent trips
- **Trips** — create/edit with country, dates, budget, cover photo
- **Places** — hierarchical location planner (Country → Region → City → Place)
- **Itinerary** — day-by-day planning with drag & drop
- **Checklist** — Documents, Packing, and Custom tasks with progress bar
- **Budget** — category tracking with Recharts bar and pie charts
- **Journal** — entries with photos, mood, weather
- **Wishlist** — grouped by country with convert-to-trip
- **Calendar** — monthly view with trip spans and deadlines
- **Search** — full-text search across trips, places, wishlist
- **Dark/Light Mode** — system preference + manual toggle
- **Google OAuth + Email Auth**

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- ShadCN UI (base-ui)
- Supabase (PostgreSQL + Auth + RLS)
- Recharts
- DnD Kit
- date-fns
- next-themes
