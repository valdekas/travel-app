# Travel Planner Pro — Release Candidate Audit

**Date:** 2026-06-22  
**Auditor:** Claude Sonnet 4.6 (read-only review — no code changes made)  
**Scope:** 14 pages / feature areas  
**Method:** Full component file reads, no live testing

---

## Verdict Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Ship-ready — no blocking issues |
| ⚠️ | Shippable with caveats — notable gaps but nothing broken |
| ❌ | Not ship-ready — missing core functionality or significant UX regression |

## Issue Priority Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical — blocks release or causes significant user confusion |
| 🟡 | Medium — degrades experience but doesn't block |
| 🟢 | Low — polish/refinement only |

---

## Page 1 — Login / Register

**Files:** `app/(auth)/auth/login/page.tsx`

### Desktop
Split-panel layout: left gradient/marketing, right form. Google OAuth + email+password fields. Password toggle button. Login/Register tab toggle. Well-structured, professional.

### Mobile
Collapses to single-panel (right form only). Large touch targets. Functional.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | No "Forgot password" link visible on the form — users who forget their password have no recovery path in the UI |
| 🟡 | Password field shows toggle icon always (not just when text is present) — minor cosmetic inconsistency |
| 🟢 | Left marketing panel is static content; on very tall screens it could feel sparse |

---

## Page 2 — Dashboard

**Files:** `components/dashboard/dashboard-content.tsx`

### Desktop
Comprehensive landing experience: hero/stats, world map, recent trips, travel quotes, achievements, quick actions. Good empty states throughout. Staggered animations.

### Mobile
Responsive grid — all sections stack cleanly. Appropriate information density.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Line 443: Recent Trips thumbnail uses `<img>` (not `<Image>`) — inconsistent with the rest of the app after the card fix; not cache-optimised |
| 🟡 | World Map widget `CountryTooltip` uses `t.status === 'completed'` (raw DB field, line 249 of `world-map-widget.tsx`) instead of `getEffectiveStatus(t)` — date-completed trips may not show as "Visited" in the tooltip |
| 🟢 | "Travel Insights" section on dashboard duplicates some stats already visible in the world map widget; could feel repetitive on smaller viewports |

---

## Page 3 — My Trips

**Files:** `components/trips/trips-list-content.tsx`

### Desktop
Trip card grid with search bar and status filter dropdown. New Trip CTA. Empty states for all filter combinations.

### Mobile
Single-column grid (sm:grid-cols-2 responsive). Appropriate.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🔴 | `const [view, setView] = useState<'grid' \| 'list'>('grid')` — dead code. The state variable exists but no list/grid toggle button is rendered and no list view UI is implemented. If a list view was planned, the missing toggle is a UX gap; if it was abandoned, the dead variable should be removed |
| 🟡 | Status filter values in the dropdown are hardcoded strings (`'planning'`, `'upcoming'`…); if the effective status includes date-derived values not matching the DB enum, some filter combinations may return surprising results (currently Planning filter is fixed, but 'upcoming' / 'completed' filter via `getEffectiveStatus()` — check is correct, but the filter UX doesn't explain this to users) |

---

## Page 4 — Trip Detail: Overview

**Files:** `components/trips/trip-overview-content.tsx`

### Desktop
Four stat cards (Days Until · Duration · Budget Used · Places Saved) + checklist preview section. Minimal.

### Mobile
Cards stack vertically. Works.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🔴 | The Overview tab is visually bare compared to every other tab in the app — plain Card components with no icon accents, no colored left-border accents, no visual hierarchy. Feels like an early-stage placeholder rather than a premium product. Users land here first after opening a trip. |
| 🟡 | `trip.notes` are never displayed anywhere in the Overview tab — users who write notes when creating a trip have no way to read them in context |
| 🟡 | No Trip Readiness widget (marked as TODO: "Add Trip Readiness widget to Overview tab") |
| 🟡 | No weather placeholder widget (marked as TODO) |
| 🟢 | No "Share trip" or export action from this view |

---

## Page 5 — Trip Detail: Places

**Files:** `components/trips/places-content.tsx`

### Desktop
DnD sortable list by group (To Visit / Visited). Add Place dialog with Google Places autocomplete. Edit dialog. Hover-revealed Edit/Delete/Maps actions.

### Mobile
Full-width drag handle, three-dot overflow menu (Edit / Open in Maps / Delete). Correct `min-h-[44px]` touch targets.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | `confirm()` browser dialogs for place deletion — inconsistent with the custom styled delete dialog used in `trip-detail-shell.tsx`; will feel jarring on mobile (native browser alert) |
| 🟡 | Place cards are plain text rows (name + type badge) — no image, no address preview, no cost display. The TODO calls out "Better Place cards" and "Improve mobile layout" |
| 🟡 | `handleReorder` has a logic inversion: `...prev.filter(l => group === 'unvisited' ? l.visited : !l.visited)` — this keeps the *opposite* group when building the merged list. Reorder within "unvisited" keeps only the visited items and discards the reordered slice. Bug introduced in reorder logic. |
| 🟢 | No map preview showing all places at once (would be a nice overview) |

---

## Page 6 — Trip Detail: Itinerary

**Files:** `components/itinerary/itinerary-content.tsx`

### Desktop
Per-day card accordion with collapsible activity lists. DnD reordering within a day. Activity cards with expand-in-place for description/address. Day complete toggle with emerald styling. Chronological auto-insert for new activities. Add Day button.

### Mobile
Wide drag handles (w-9 on mobile), three-dot overflow per activity. Full touch targets. DragHint banner (once per device).

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | `confirm()` dialogs for activity delete and day delete — same inconsistency as Places tab |
| 🟡 | No cross-day drag (marked as TODO: "Cross-day itinerary drag") — users who want to move an activity to a different day must delete and re-add |
| 🟢 | Itinerary has no "Add Day" affordance visible until scrolling to the bottom of all days |

---

## Page 7 — Trip Detail: Checklist

**Files:** `components/checklist/checklist-content.tsx`

### Desktop
Three tabs: Documents / Packing / Custom. Per-category DnD with smooth lift/shadow overlay. Progress bar header. Add Task dialog.

### Mobile
Always-visible drag handles (opacity 100 on mobile). Three-dot overflow per item. 44px touch targets on all interactive elements.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | `confirm()` dialog for item delete (both in Desktop delete button and Mobile dropdown) |
| 🟡 | No inline editing of existing tasks (only add/delete/toggle) — edit title or notes requires delete + re-add |
| 🟢 | No bulk import / quick-add templates (e.g., "add standard packing list") — low priority but requested often in travel apps |

---

## Page 8 — Trip Detail: Budget

**Files:** `components/budget/budget-content.tsx`

### Desktop
3 summary cards (Total / Spent / Remaining) with colored accent borders, over-budget warning. Bar chart (Planned vs Actual) + Pie chart (spending breakdown). Per-category cards. Full expense list with paid toggle and edit.

### Mobile
Summary cards stack 1-col (sm:grid-cols-3). Charts are responsive via ResponsiveContainer. Mobile three-dot overflow per expense row.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Budget item delete has **no confirmation at all** — `deleteItem()` fires immediately from the dropdown with no `confirm()` or styled dialog. Accidental deletes have no undo. |
| 🟡 | If `trip.budget` is 0 (not set), the "Total Budget" card falls back to `totalPlanned` — this may display confusingly when the user hasn't set a trip budget |
| 🟢 | Charts are hidden when there are no items — the empty state could hint at how to add data |

---

## Page 9 — Trip Detail: Journal

**Files:** `components/journal/journal-content.tsx`

### Desktop
Split-panel: left timeline (grouped by date), right detail panel (entry full view). Add/Edit dialog with mood picker, location picker, photo upload (gallery + camera + URL), favorites. Search bar.

### Mobile
Single-panel timeline; tapping an entry opens a full-screen Dialog with all details.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Entry delete likely uses `confirm()` (consistent with other tabs — not verified in full file read) |
| 🟡 | Weather field shows "Auto-filled in future" placeholder with no actual auto-fill — could confuse users who wait for it |
| 🟢 | No sort/filter options beyond search (can't filter by mood, date range, or favorites alone) |

---

## Page 10 — Calendar

**Files:** `components/calendar/calendar-content.tsx`

### Desktop
Multiple view modes (Month / 3 Months / 6 Months / Year) with Previous/Today/Next navigation. Colored trip bars (continuous across weeks, left/right rounded). Sidebar: featured next/active trip card, upcoming list, deadlines, legend. Day-click shows selected day panel.

### Mobile
Agenda view (`md:hidden`): trips listed by month with countdown badges. Calendar grid hidden on small screens to avoid cramped interaction.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Year view: 12 mini-calendars show dots instead of bars — acceptable but significantly reduces information density; an active trip spanning weeks only shows dots on start/end days |
| 🟡 | Sidebar disappears on non-lg screens (stacks below calendar) — on tablet width, the sidebar is below the fold and hard to discover |
| 🟢 | Clicking a trip bar in the calendar doesn't navigate to the trip — it only shows the day panel; no click-to-open action |

---

## Page 11 — Travel Journal (Global)

**Files:** `app/(dashboard)/journal/page.tsx`

### Desktop
Simple static list of most recent 20 journal entries with mood emoji, title, date, trip name, content preview, photo thumbnails. "Open →" button links to the per-trip journal.

### Mobile
Same list, scales fine.

### Verdict: ❌

### Issues
| Priority | Issue |
|----------|-------|
| 🔴 | **No interactive features at all** — no search, no filter by mood/trip/date, no editing, no delete, no favorites. The per-trip journal (Page 9) has all of these. The global view is a read-only stub that doesn't let users engage with their full journal history. |
| 🔴 | Hard-capped at 20 entries with no pagination or "Load more" — users with > 20 entries cannot see older ones from this page |
| 🔴 | Uses `<img>` for photo thumbnails (line 96) — not `<Image>`, unoptimised, no lazy loading |
| 🟡 | "Open →" button is ambiguous — navigates to the trip's journal tab, not to the entry itself; the user must find the entry again inside the trip |
| 🟡 | Entries not grouped by date, trip, or mood — just a flat `created_at DESC` list; hard to navigate with many entries |
| 🟢 | No way to write a new entry from this global view — user must navigate to a specific trip first |

---

## Page 12 — Visited Countries

**Files:** `components/visited/visited-countries-content.tsx`

### Desktop
Continent filter pills + search bar. Flag-forward country cards with visit count, region progress (for supported countries). Expandable region sub-list per country. Achievements panel. Migration pending warning.

### Mobile
Same layout — cards stack. Large toggle buttons (40px+ touch targets). Animations via Framer Motion.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Region sub-expansion (clicking a country card to see regions like Spain's autonomías) is powerful but UI is dense — no visual explanation that the card is expandable; relies on invisible interaction |
| 🟡 | `migrationPending` and `regionsMigrationPending` flags show error toasts but no visible banner — users who haven't run migrations see silent failures |
| 🟢 | No undo for country removal (only toast after deletion) |

---

## Page 13 — World Map

**Files:** `components/dashboard/world-map-widget.tsx`

### Desktop
Full custom SVG map (react-simple-maps) with:
- Pan + zoom (mouse drag, scroll wheel, pinch)
- Home country pin with pulsing animation
- Trip markers with animated rings and countdown badges
- Curved flight paths with animated plane
- Country hover tooltips with trip details
- Visited countries highlighted

### Mobile
Embedded in the Dashboard scroll flow. Zoom/pan via touch, but may conflict with page scroll depending on browser/OS.

### Verdict: ⚠️

### Issues
| Priority | Issue |
|----------|-------|
| 🔴 | `CountryTooltip` line 249: `data.trips.filter(t => t.status === 'completed')` — uses raw `trip.status` (DB field), not `getEffectiveStatus()`. Trips that are date-completed but have DB status 'upcoming' won't appear as "Visited" in the tooltip. Same bug we fixed in 5 other places. |
| 🟡 | Markers are fixed size at all zoom levels — at max zoom (6×) the 9px marker radius looks tiny; at low zoom (1×) it dominates countries near each other (in TODO: "adaptive marker scaling") |
| 🟡 | Map colors are dark/desaturated (in TODO: "improve map colors, less dark, more vibrant") |
| 🟡 | On mobile, touch pan may conflict with normal page scroll within the dashboard; no `touch-action: none` on the map container to explicitly prevent this |

---

## Page 14 — Settings

**Files:** `components/settings/settings-hub.tsx` + sub-pages (Account, Subscription, Notifications, Appearance, Language, Privacy)

### Desktop
Desktop settings use a sidebar layout (`app/(dashboard)/settings/layout.tsx`) with left nav + content area. Professional.

### Mobile
Hub-and-spoke: settings-hub shows iOS-style category list with icon chips. Each category has a back navigation. Native-feeling.

### Verdict: ✅

### Issues
| Priority | Issue |
|----------|-------|
| 🟡 | Subscription page shows "Free Plan" with no actual plan management — likely a placeholder; clicking it may confuse users expecting billing controls |
| 🟡 | Language selector shows language options but timezone/currency sub-settings (shown in hub description: "Language, timezone, currency") may not be fully wired up |
| 🟢 | No confirmation dialog when changing appearance theme — change applies immediately which is fine, but no visual loading state |

---

## Summary

| Page | Verdict | Critical Issues |
|------|---------|-----------------|
| 1. Login / Register | ⚠️ | No forgot-password link |
| 2. Dashboard | ⚠️ | Raw status in map tooltip; `<img>` thumbnail |
| 3. My Trips | ⚠️ | Dead list-view state variable |
| 4. Trip Detail: Overview | ⚠️ | Visually bare; no notes display; missing widgets |
| 5. Trip Detail: Places | ⚠️ | Reorder logic inversion bug; bare cards; `confirm()` |
| 6. Trip Detail: Itinerary | ✅ | `confirm()` dialogs; no cross-day drag |
| 7. Trip Detail: Checklist | ✅ | `confirm()` dialogs; no inline edit |
| 8. Trip Detail: Budget | ✅ | No delete confirmation |
| 9. Trip Detail: Journal | ✅ | Weather placeholder |
| 10. Calendar | ✅ | Year-view dots; sidebar below fold on tablet |
| 11. Global Travel Journal | ❌ | No interactivity; 20-entry hard cap; no pagination |
| 12. Visited Countries | ✅ | Invisible region-expand affordance |
| 13. World Map | ⚠️ | Raw status in tooltip; fixed marker size |
| 14. Settings | ✅ | Subscription placeholder |

**Totals: ✅ 7 · ⚠️ 6 · ❌ 1**

---

## Top 5 Critical Issues (Cross-App)

### 1. 🔴 Global Travel Journal is a non-functional stub
`app/(dashboard)/journal/page.tsx` — no search, no edit, no delete, no filter, hard-capped at 20 entries with no pagination. The per-trip journal (Page 9) has all of these. Users with an active journaling habit will find this page useless. **Priority: fix before release.**

### 2. 🔴 `trip.status` (raw DB field) used in World Map tooltip instead of `getEffectiveStatus()`
`components/dashboard/world-map-widget.tsx:249` — `data.trips.filter(t => t.status === 'completed')`. The same bug was fixed in 5 other places this sprint; this one was missed. Trips that are date-completed but DB-upcoming won't appear as "Visited" in country hover tooltips. **Priority: one-line fix.**

### 3. 🔴 Places tab `handleReorder` has a logic inversion bug
`components/trips/places-content.tsx` — The filter condition when merging groups after reorder keeps the wrong group:
```
...prev.filter(l => group === 'unvisited' ? l.visited : !l.visited)
```
When reordering 'unvisited', this keeps only the *visited* items (opposite intent). Reorder within either group will silently corrupt the other group. **Priority: logic bug, fix immediately.**

### 4. 🔴 Trip Detail Overview tab is the app's worst-looking page
`components/trips/trip-overview-content.tsx` — Users land here first when they open a trip. Four plain stat cards with no icon accents, no left-border color coding, no notes display, no readiness indicator. Visually inconsistent with the polished Budget, Journal, and Itinerary tabs. **Priority: polish before release.**

### 5. 🟡 `confirm()` browser dialogs used across 4 tabs for destructive actions
Itinerary (delete activity, delete day), Checklist (delete item), Places (delete place). These show the browser's native `confirm()` dialog — an unstyled, non-dismissable modal that breaks the visual language of the app and looks especially bad on mobile. The Trip Shell uses a custom styled dialog for trip deletion; the same pattern should be applied throughout. Budget goes in the other direction — no confirmation at all for expense deletion.
