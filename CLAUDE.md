@AGENTS.md

# Travel Planner Pro — Claude Handover

## Project at a glance

Full-stack trip planning web app. Built and production-build verified. Dev server runs on port **3001**.

- **Directory:** `/home/travel_planer_app`
- **Live (local):** `http://38.242.252.59:3001`
- **Stack:** Next.js 16.2.9 · TypeScript · Tailwind CSS v4 · ShadCN UI (base-ui) · Supabase · Recharts · DnD Kit

> Read `PROJECT_STATUS.md` for the full feature list, database schema, file tree, remaining tasks, and known issues before doing any work.

---

## Critical: ShadCN uses base-ui, NOT radix-ui

The installed ShadCN uses **@base-ui/react**. Several APIs differ from radix-ui and from most online examples. Violating these causes TypeScript errors.

### 1. No `asChild` — use `render={}`
```tsx
// WRONG
<DialogTrigger asChild><Button>Open</Button></DialogTrigger>

// CORRECT
<DialogTrigger render={<Button>Open</Button>} />
```
Applies to: `DialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `SheetTrigger`.

### 2. `Select.onValueChange` returns `string | null`
```tsx
// WRONG — type error, value is string | null
onValueChange={(value: string) => setState(value)}

// CORRECT
onValueChange={v => setState(v ?? 'default')}
```
Any `set` / form helper that accepts a Select value needs signature `(k: string, v: string | null)`.

### 3. `DropdownMenuItem` has no `asChild`
```tsx
// WRONG
<DropdownMenuItem asChild><a href="/page">Go</a></DropdownMenuItem>

// CORRECT
<DropdownMenuItem><a href="/page" className="w-full">Go</a></DropdownMenuItem>
```

### 4. Calendar uses react-day-picker v10 API
`classNames` key is `month_grid`, not `table`. Already fixed in `components/ui/calendar.tsx`.

---

## Critical: Next.js version

This is **Next.js 16.2.9** — newer than training data. Before writing routing, layout, or config code:
```
cat node_modules/next/dist/docs/<relevant-guide>.md
```
Do not assume Next.js 13/14/15 conventions apply.

---

## Architecture decisions to preserve

| Decision | Why |
|---|---|
| `export const dynamic = 'force-dynamic'` on `(auth)/layout.tsx` | Prevents static prerender with placeholder Supabase URL at build time |
| `select('*')` on calendar page trips query | Partial selects return objects missing fields required by the `Trip` type |
| `import type { ChecklistItem }` in checklist component | Avoids naming conflict with the `ChecklistItem` React component in the same file |
| `as unknown as JournalEntryWithTrip[]` in global journal page | Supabase join typing — define explicit interface, cast via unknown |
| `lib/utils.ts` re-exports `lib/utils/index.ts` | ShadCN init creates `lib/utils.ts`; all utilities live in `lib/utils/index.ts` |

---

## Environment

`.env.local` (already populated with real keys):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### Start dev server
```bash
npm run dev        # runs on port 3001
```

### Production build
```bash
npm run build && npm run start
```

---

## Key files

| What | Where |
|---|---|
| All TypeScript types | `lib/types/index.ts` |
| All utility functions | `lib/utils/index.ts` |
| Supabase browser client | `lib/supabase/client.ts` |
| Supabase server client | `lib/supabase/server.ts` |
| Middleware (auth guard) | `middleware.ts` + `lib/supabase/middleware.ts` |
| Database schema + RLS | `supabase/migrations/001_initial_schema.sql` |
| ShadCN components | `components/ui/` |
| Dashboard layout shell | `components/shared/dashboard-shell.tsx` |
| Trip tab shell | `components/trips/trip-detail-shell.tsx` |
| Project status & remaining tasks | `PROJECT_STATUS.md` |

---

## Restarting the dev/production server

This project runs in production mode via PM2 (process name: **travel365**, port **3001**), used for team testing at `travel365.live`. Other unrelated projects (e.g. `momentum_screener/frontend`) may be running on the same machine — never touch their processes.

To deploy changes and restart only this project after committing code:

1. `npm run build`
2. `pm2 restart travel365`
3. Confirm with `pm2 status` that travel365 is online and no other process was affected.

Do NOT use `npm run dev` or `nohup` for this project's shared testing domain — it must always run as a production build under PM2, so testers see real production behavior, not dev-mode hot-reload.

---

## Top remaining tasks (prioritised)

1. **Wishlist → Convert to Trip** — `components/wishlist/wishlist-content.tsx` `handleConvert()` shows a toast but does nothing. Should insert a trip row, set `converted_to_trip_id`, then `router.push('/trips/<id>/overview')`.
2. **Photo uploads** — journal entries and trip cover photo accept URLs only. Wire up Supabase Storage.
3. **Loading states** — server pages have no `<Suspense>` skeletons; add them for perceived performance.
4. **Cross-day itinerary drag** — items reorder within a day only. Move `DndContext` up a level and add `DragOverlay` for cross-day drops.
5. **Error boundaries** — unhandled Supabase errors surface as raw Next.js error pages.

# Claude Instructions

You are building a premium Travel Planner application.

Always follow these rules:

- Finish the current task before starting another.
- Never rewrite working functionality unless necessary.
- Preserve UI consistency.
- Desktop and mobile must always be supported.
- Run build after every major change.
- Fix all TypeScript errors before continuing.
- Never leave unfinished work.
- Follow ROADMAP.md.
- Follow TODO.md.


# Definition of Done (DoD)

A task is NOT complete until ALL of the following are true:

✅ Feature works correctly.

✅ No TypeScript errors.

✅ npm run build passes.

✅ Desktop tested.

✅ Mobile tested.

✅ Responsive layout verified.

✅ UI polished.

✅ Animations are smooth.

✅ No console errors.

✅ Existing functionality still works.


## UI Rule

Never leave UI in an unfinished state.

If a feature works but looks unfinished,
continue polishing until it feels production ready.


## Architecture Rule

Before rewriting existing code,
always prefer extending the current implementation
instead of replacing it.

## UX Rule

Never hide important functionality behind invisible interactions.

If a feature exists (drag, edit, swipe, reorder, expand), the UI should provide a clear visual affordance that teaches users the feature is available.