# Mobile Readiness Audit — Travel Planner Pro

**Date:** 2026-06-21 (§ "API routes" and §12 below updated 2026-08-12 — the original audit's "exactly one API route" claim was outdated)  
**Scope:** React Native readiness of the existing Supabase + Next.js backend  
**Method:** Static code audit — no functionality changed  

---

## Summary Table

| Area | Status | Effort |
|---|---|---|
| 1. Authentication — email/password | ✅ Ready | None |
| 2. Authentication — Google OAuth | ⚠️ Needs Work | Medium (deep link config) |
| 3. Data access — write path (client components) | ✅ Ready | None |
| 4. Data access — read path (server components) | ✅ Ready | None (mobile fetches directly) |
| 5. Business logic in server-only code | ✅ Ready | None |
| 6. Row Level Security | ✅ Ready | None |
| 7. Google Places API key | ⚠️ Needs Work | Low–Medium |
| 8. Supabase Storage — journal-photos bucket | ✅ Ready | None |
| 9. Supabase Storage — avatars bucket | ⚠️ Needs Work | Low (missing migration) |
| 10. Storage utility coupling to browser client | ⚠️ Needs Work | Low (1 function refactor) |
| 11. Environment variables / secrets | ✅ Ready | None |
| 12. Custom API routes (`/api/*`) — mobile auth | ✅ Fixed 2026-08-12 | Was blocking mobile silently — see §12 |

---

## 1. Authentication

### Current implementation

- Package: `@supabase/ssr` (`createBrowserClient` on web, `createServerClient` on server)
- Session storage: **HTTP cookies**, managed by `lib/supabase/middleware.ts` (reads/writes cookies on every request via `NextRequest`/`NextResponse` and `next/headers`)
- Login: email/password (`signInWithPassword`) + Google OAuth (`signInWithOAuth`)
- OAuth callback: `app/(auth)/auth/callback/route.ts` — exchanges the PKCE auth code for a session via `exchangeCodeForSession`, sets cookie, redirects to `/dashboard`

### Email/password — ✅ Ready

`signInWithPassword({ email, password })` is a plain Supabase SDK call. React Native would call the identical method using `@supabase/supabase-js` with an `AsyncStorage` adapter — no change to the backend.

### Session storage — needs mobile adapter (defer to mobile build)

`@supabase/ssr`'s cookie-based session is browser/Next.js-specific. React Native has no `localStorage`, no `next/headers`, and no HTTP cookie jar. This is expected — the standard pattern for React Native is:

```ts
// React Native (example only — don't add this yet)
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true }
})
```

**No backend changes needed.** The Supabase project already supports token-based auth — the session is a JWT regardless of how it's stored.

### Google OAuth — ⚠️ Needs Work (defer to mobile build)

The current flow:
1. `signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback' } })`
2. Google redirects to `https://travel365.live/auth/callback?code=...`
3. Server route calls `exchangeCodeForSession(code)`, sets cookie, redirects to `/dashboard`

Steps 2–3 are web-only. For React Native:
- A **deep link URL scheme** must be registered (e.g. `com.travel365://auth/callback`)
- The redirect URL must be added to the **Supabase Auth allowed redirect URLs** list
- The redirect URL must be added to the **Google Cloud Console OAuth authorized redirect URIs**
- React Native handles the incoming deep link and calls `supabase.auth.exchangeCodeForSession(url)` directly (no Next.js route involved)

**Nothing to do now** — this is a mobile-project-start task.

---

## 2. Data Access Architecture

### Write path — ✅ Ready

All mutations (INSERT/UPDATE/DELETE) are performed in `'use client'` React components using `createClient()` from `lib/supabase/client.ts` (`createBrowserClient`). These are direct Supabase SDK calls with no Next.js dependencies:

```
create-trip-form.tsx → supabase.from('trips').insert(...)
edit-trip-dialog.tsx → supabase.from('trips').update(...)
places-content.tsx   → supabase.from('locations').insert/update/delete(...)
checklist-content.tsx, itinerary-content.tsx, budget-content.tsx
journal-content.tsx, visited-countries-content.tsx, wishlist-content.tsx
```

A React Native client would call the identical Supabase methods — the RLS policies handle authorization. **No changes needed.**

### Read path — ✅ Ready (mobile fetches directly, not via SSR)

All initial data reads are done in Next.js Server Components (files in `app/(dashboard)/*/page.tsx`) using `createClient()` from `lib/supabase/server.ts`. These are also direct Supabase SDK calls — the only difference is they run on the server and use cookie auth.

React Native doesn't have Server Components, but this is not a gap — it's a different rendering model. Mobile would simply call `supabase.from('trips').select('*')` directly from the device (client-side fetch). The same RLS policies apply. **No backend changes needed.**

### API routes — ⚠️ this section was wrong; see §12

This originally claimed "exactly one API route" (the OAuth callback) and "no backend changes needed." That was true on 2026-06-21 and is no longer true. Six custom `/api/*` route handlers exist as of 2026-08-12: `trips/fetch-hero`, `suggestions/generate`, `suggestions/search`, `checklist/suggestions`, `itinerary/auto-schedule`, and `recommendations`. Several of these are already called by the mobile client (confirmed via nginx access logs — `okhttp` user-agent hitting `fetch-hero`, `suggestions/generate`, and `itinerary/auto-schedule`). This is a real gap the original audit didn't anticipate — see §12 for what broke and how it was fixed.

### Business logic — ✅ Ready

All business logic lives in `lib/utils/index.ts`, `lib/utils/achievements.ts`, `lib/utils/country-codes.ts`, `lib/data/` — pure TypeScript functions with no Next.js dependencies. These are portable to React Native as-is (or as a shared package).

The status derivation (`getEffectiveStatus`), date utilities, formatting, achievement tiers, and country/subregion data can all be shared verbatim.

---

## 3. Row Level Security

### Policy review (all 10 tables)

| Table | Policy type | Pattern |
|---|---|---|
| `trips` | All ops | `auth.uid() = user_id` |
| `locations` | All ops | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `checklist_items` | All ops | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `itinerary_days` | All ops | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `itinerary_items` | All ops | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `budget_items` | All ops | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `journal_entries` | All ops | `auth.uid() = user_id` |
| `wishlist_items` | All ops | `auth.uid() = user_id` |
| `visited_countries` | All ops | `auth.uid() = user_id` |
| `visited_regions` | All ops | `auth.uid() = user_id` |
| `user_settings` | All ops | `auth.uid() = user_id` WITH CHECK |

**All policies use `auth.uid()`** — the standard Supabase RLS mechanism that works from any authenticated client (browser, mobile, or server) that presents a valid user JWT.

**No service role key is used anywhere.** Confirmed: there is no `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, and no `service_role` references in application code. Every operation goes through the anon key + user JWT path, which is exactly what a React Native client would also use.

**RLS is fully mobile-ready. No changes needed.**

---

## 4. Google Places API Key

### Current usage

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is used exclusively in `components/ui/places-autocomplete.tsx`, loaded as a `<script>` tag injected into the browser DOM:

```ts
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
```

This is a **client-side browser call** using the Google Maps JavaScript SDK. The key is already public (it's in the browser bundle via `NEXT_PUBLIC_`).

### Mobile gap — ⚠️ Needs Work

`PlacesAutocomplete` uses `window`, `document.createElement`, and `window.google.maps` — all browser-only APIs. It cannot run on React Native.

For React Native, there are three options:

| Option | Pros | Cons |
|---|---|---|
| **A. Proxy via Supabase Edge Function** | Key never leaves server; one key for all platforms; no bundle ID management | Requires writing an Edge Function; adds latency |
| **B. Separate mobile API key** | Simple; standard Google pattern | Two keys to manage; key is in mobile bundle |
| **C. React Native Google Places SDK** | Native UX | Requires separate iOS/Android API keys with bundle ID restrictions |

**Recommended:** Option A — a thin Supabase Edge Function proxy for Places API. The web app calls this function instead of directly hitting Google, the mobile app calls the same function. The API key is server-only. This is a moderate amount of work (one Edge Function + update `PlacesAutocomplete` to use it) but pays off for both security and mobile portability.

**What to do now (before mobile):** Nothing urgent — the current setup works for web. Add the proxy as a pre-mobile task.

---

## 5. Supabase Storage

### journal-photos bucket — ✅ Ready

Defined in `supabase/migrations/008_journal_photos_storage.sql`:
- **Public bucket** — any URL is readable without auth (correct for displaying photos in app)
- **Authenticated writes** — INSERT policy requires `(storage.foldername(name))[1] = auth.uid()::text`; path is `{userId}/{tripId}/{filename}`
- **Authenticated deletes** — same path ownership check

The upload function (`lib/utils/journal-photos.ts: uploadJournalPhoto`) uses Supabase Storage SDK calls — portable to React Native with one refactor (see §6).

**Storage policies work from any authenticated client. No backend changes needed.**

### avatars bucket — ⚠️ Needs Work (minor)

`components/settings/account-settings.tsx` uploads to `supabase.storage.from('avatars')` with path `{userId}/avatar.{ext}`. However:
- There is **no migration file** for the `avatars` bucket
- The code contains a comment: *"Upload failed — create an 'avatars' bucket in Supabase Storage first"*
- The bucket may or may not exist in production

**Action needed (do now, not mobile-related):** Create `supabase/migrations/011_avatars_storage.sql` to define the bucket and its RLS policies, matching the pattern of `008_journal_photos_storage.sql`. This is a web bug too, not just a mobile concern.

---

## 6. Storage Utility — Client Coupling

### Current issue — ⚠️ Needs Work (low effort)

`lib/utils/journal-photos.ts` instantiates its own Supabase client internally:

```ts
export async function uploadJournalPhoto(file, userId, tripId): Promise<string> {
  const supabase = createClient()  // ← hardcoded browser client
  // ...
}
```

`createClient()` here imports from `lib/supabase/client.ts` which calls `createBrowserClient()` — a web-only factory from `@supabase/ssr`. React Native can't use this.

**Fix (do now, low risk):** Refactor `uploadJournalPhoto` and `deleteJournalPhoto` to accept a `supabase` client as a parameter instead of instantiating one:

```ts
// Before
export async function uploadJournalPhoto(file: File, userId: string, tripId: string)

// After
export async function uploadJournalPhoto(supabase: SupabaseClient, file: File, userId: string, tripId: string)
```

Callers pass their client. Web passes `createBrowserClient()`, mobile passes its `AsyncStorage`-backed client. The storage operations themselves are identical. **This is a 10-line refactor with no behaviour change.**

---

## 7. Environment Variables

| Variable | Visibility | Mobile usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (bundled in JS) | Copy as-is to mobile `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (bundled in JS) | Copy as-is to mobile `.env` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public (bundled in JS) | **Do NOT reuse** — create a separate mobile key with iOS/Android bundle restrictions, or use proxy (see §4) |

There are **no server-only secrets** in this project — no `SUPABASE_SERVICE_ROLE_KEY`, no private API keys, no webhook secrets. The entire app runs on the anon key + user JWT. This is excellent for mobile portability.

---

## 12. Custom API Routes vs. Mobile Auth — ✅ Fixed 2026-08-12

### What broke

`middleware.ts` gates every non-static, non-`/auth`, non-`/` path behind a valid Supabase **cookie** session — including `/api/*`. That's fine for the browser (cookies are automatic) but the mobile client has no cookie jar (per §1, it authenticates with a JWT via `AsyncStorage`, not cookies). Every mobile request to a custom API route was silently redirected (`307`) to `/auth/login` before the route handler ever ran. Because `okhttp` (Android's HTTP client, used under React Native's `fetch`) follows redirects by default, this looked like a `200` from the mobile app's point of view — landing on the login page's HTML — while the actual endpoint logic (Google Places lookup, AI suggestion generation, etc.) silently never executed. No error surfaced anywhere: the API routes don't log, and the web call sites that invoke the same endpoints do so fire-and-forget with `.catch(() => {})`, so nothing checked the response either.

Confirmed via nginx access logs: `fetch-hero`, `suggestions/generate`, and `itinerary/auto-schedule` all showed `307` responses for `okhttp`-tagged requests, alongside `200`s on `/auth/login` from the followed redirect.

### The fix

Three pieces, all in the web repo (no mobile-side change required beyond what §1 already specified — mobile just needs to send its Supabase access token):

1. **`lib/supabase/middleware.ts`** — before falling back to the cookie check, look for an `Authorization: Bearer <token>` header and verify it against the Supabase Auth server (`getUser(token)`). A valid token lets the request through with no cookies touched. A missing or invalid token falls through to the original cookie-based flow unchanged — this only adds a path, it doesn't remove or alter the existing one.
2. **`lib/supabase/server.ts` — `createApiClient(req)`** — a new helper alongside the existing (untouched) `createClient()`. Reads the same `Authorization` header; if present, builds a Supabase client with `global: { headers: { Authorization: 'Bearer <token>' } }` so every downstream `.from()` / `.storage` call carries the token too — verifying the token alone doesn't satisfy RLS, `auth.uid()` needs it on each request the client makes, not just the identity check. Falls back to the cookie-based `createClient()` when there's no bearer token. Returns `{ supabase, user }`, with `user` always coming from `getUser()` resolving the token/cookie — never from a client-supplied field.
3. **API routes now 401, not redirect, on missing auth** — `middleware.ts` splits `/api/*` from page routes when there's no valid session: API routes get `NextResponse.json({ error: 'Not authenticated' }, { status: 401 })`, page routes keep the HTML redirect to `/auth/login`. This is what made the original failure invisible — a followed 307-to-login-page reads as success if nothing checks the final URL or body; a 401 doesn't.

`app/api/trips/fetch-hero/route.ts` and `app/api/suggestions/generate/route.ts` were switched to `createApiClient(req)` (they're the two that do authenticated Supabase queries internally). `suggestions/search`, `checklist/suggestions`, and `itinerary/auto-schedule` don't call Supabase at all — they only needed the middleware fix to stop being redirected away.

**Mobile-side requirement:** send `Authorization: Bearer <session.access_token>` on calls to these routes (`supabase.auth.getSession()` → `session.access_token`, refreshed automatically by the SDK per §1's `AsyncStorage` setup).

---

## Prioritized Action List

### Do now (during web development — small, safe, applicable to web too)

| Priority | Action | Why now |
|---|---|---|
| 1 | **Create `avatars` storage bucket migration** (`011_avatars_storage.sql`) | Silent web bug: avatar upload fails unless the bucket was manually created in Supabase Dashboard. Should be in migrations like everything else. |
| 2 | **Refactor `uploadJournalPhoto` / `deleteJournalPhoto` to accept a client parameter** (`lib/utils/journal-photos.ts`) | 10-line change; removes the only tight coupling between business logic and a platform-specific client factory. Zero risk to web. |

### Do before starting the React Native project

| Priority | Action | Notes |
|---|---|---|
| 3 | **Supabase Edge Function proxy for Google Places** | Removes API key from all client bundles; single endpoint for web and mobile. Requires updating `PlacesAutocomplete` to hit the proxy instead of loading the Maps JS SDK. |
| 4 | **Add mobile OAuth redirect URLs** to Supabase Auth dashboard and Google Cloud Console | Register the app's deep link scheme (e.g. `com.travel365://auth/callback`) before writing a single line of React Native code. |

### Defer until React Native project starts

| Item | Notes |
|---|---|
| `@supabase/supabase-js` + `AsyncStorage` client setup | Standard Expo/RN boilerplate; no backend impact |
| Deep link handler for OAuth callback | React Native code only |
| Expo / React Native project scaffolding | Separate repo or monorepo decision |
| Push notifications infrastructure | Needs Expo Push Notifications or APNs/FCM setup; separate from data layer |
| Offline mode / optimistic sync | Not needed until mobile UX design is defined |
| Mobile-specific UI components | No shared web components are portable; start fresh in RN |

---

## Architecture Verdict

The backend is in **good shape** for mobile reuse, with one correction to the original verdict: the "no backend changes needed" conclusion below assumed the app had no custom API layer. That stopped being true after this audit was written — see §12. The reasons that still hold:

1. **No server-side business logic lock-in** — all logic is in portable `lib/utils/` functions
2. **No service role key** — every operation is anon key + user JWT, identical to what mobile would use, including the six `/api/*` routes now that they accept a bearer token (§12)
3. **RLS is thorough and correct** — all 10 tables have user-scoped policies
4. **Write path is already direct SDK calls** — the same call pattern used in React client components works in React Native
5. **Two small actions now** (avatars migration + storage utility refactor) would eliminate the only meaningful coupling issues

The remaining non-trivial work before mobile is the **Google Places API proxy** (§4) — the current browser-only SDK integration would need to be replaced with something platform-agnostic. Any *future* `/api/*` route should be written with mobile in mind from the start (accept the bearer token via `createApiClient`) rather than assuming a cookie session, now that §12 established this is a real, actively-used calling pattern rather than a hypothetical.
