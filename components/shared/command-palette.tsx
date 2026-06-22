'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Loader2, ArrowRight, Clock } from 'lucide-react'
import { LOCATION_TYPE_ICONS } from '@/lib/types'
import { getCountryFlag, formatDate, cn, getEffectiveStatus } from '@/lib/utils'

/* ── types ─────────────────────────────────────────────────── */

interface CmdItem {
  id: string
  group: 'recent' | 'trips' | 'places' | 'wishlist' | 'checklist' | 'journal' | 'actions'
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  icon: string
  href: string
}

interface CachedData {
  trips: { id: string; name: string; country: string; country_code?: string; status: string; start_date?: string }[]
  locations: { id: string; name: string; type: string; trip_id: string; address?: string }[]
  wishlist: { id: string; place_name: string; country: string; city?: string; place_type: string }[]
  checklist: { id: string; title: string; category: string; trip_id: string }[]
  journal: { id: string; title?: string; date?: string; trip_id: string }[]
}

/* ── constants ──────────────────────────────────────────────── */

const RECENTS_KEY = 'tp_cmd_recents'
const MAX_RECENTS = 6

const QUICK_ACTIONS: CmdItem[] = [
  { id: 'act-new-trip', group: 'actions', icon: '✈️', title: 'Create New Trip',    subtitle: 'Plan a new adventure',         href: '/trips/new' },
  { id: 'act-calendar', group: 'actions', icon: '📅', title: 'Open Calendar',      subtitle: 'View your trip timeline',      href: '/calendar' },
  { id: 'act-journal',  group: 'actions', icon: '📔', title: 'Travel Journal',     subtitle: 'Your memories & stories',      href: '/journal' },
  { id: 'act-wishlist', group: 'actions', icon: '⭐', title: 'Wishlist',           subtitle: 'Places you dream of visiting', href: '/wishlist' },
  { id: 'act-visited',  group: 'actions', icon: '🗺️', title: 'Visited Countries', subtitle: 'Track your travel map',        href: '/visited' },
  { id: 'act-trips',    group: 'actions', icon: '🧳', title: 'All Trips',          subtitle: 'Browse your adventures',       href: '/trips' },
]

const GROUP_LABELS: Record<CmdItem['group'], string> = {
  recent: 'Recent', trips: 'Trips', places: 'Places',
  wishlist: 'Wishlist', checklist: 'Checklist',
  journal: 'Journal', actions: 'Quick Actions',
}

const STATUS_COLORS: Record<string, string> = {
  planning:  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  upcoming:  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

/* ── localStorage helpers ───────────────────────────────────── */

function loadRecents(): CmdItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') } catch { return [] }
}

function saveRecent(item: CmdItem) {
  if (typeof window === 'undefined') return
  try {
    const prev = loadRecents().filter(r => r.href !== item.href)
    localStorage.setItem(
      RECENTS_KEY,
      JSON.stringify([{ ...item, group: 'recent' as const }, ...prev].slice(0, MAX_RECENTS))
    )
  } catch { /* ignore */ }
}

/* ── component ──────────────────────────────────────────────── */

interface Props { open: boolean; onClose: () => void }

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery]         = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData]           = useState<CachedData | null>(null)
  const [recents, setRecents]     = useState<CmdItem[]>([])

  const fetchedRef = useRef(false)
  const inputRef   = useRef<HTMLInputElement>(null)
  const listRef    = useRef<HTMLDivElement>(null)

  /* Reset state and focus input on open */
  useEffect(() => {
    if (!open) return
    setRecents(loadRecents())
    setQuery('')
    setActiveIdx(0)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  /* Escape key fallback (handles when input is not focused) */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  /* Fetch data once across all palette opens */
  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    setIsLoading(true)
    ;(async () => {
      try {
        const [
          { data: trips },
          { data: locations },
          { data: wishlist },
          { data: checklist },
          { data: journal },
        ] = await Promise.all([
          supabase.from('trips').select('id, name, country, country_code, status, start_date').order('created_at', { ascending: false }),
          supabase.from('locations').select('id, name, type, trip_id, address').order('created_at', { ascending: false }).limit(200),
          supabase.from('wishlist_items').select('id, place_name, country, city, place_type').order('created_at', { ascending: false }),
          supabase.from('checklist_items').select('id, title, category, trip_id').eq('completed', false).limit(200),
          supabase.from('journal_entries').select('id, title, date, trip_id').order('date', { ascending: false }).limit(50),
        ])
        setData({
          trips: trips ?? [],
          locations: locations ?? [],
          wishlist: wishlist ?? [],
          checklist: checklist ?? [],
          journal: journal ?? [],
        })
      } catch { /* fail silently */ } finally {
        setIsLoading(false)
      }
    })()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Flat ordered list of results */
  const flatItems = useMemo((): CmdItem[] => {
    const q = query.trim().toLowerCase()

    if (!q) return [...recents, ...QUICK_ACTIONS]

    const out: CmdItem[] = []

    if (data) {
      /* Trips */
      data.trips
        .filter(t => t.name.toLowerCase().includes(q) || t.country.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(t => out.push({
          id: `trip-${t.id}`, group: 'trips', icon: '✈️',
          title: t.name,
          subtitle: `${t.country_code ? getCountryFlag(t.country_code) + ' ' : ''}${t.country}${t.start_date ? ' · ' + formatDate(t.start_date, 'MMM yyyy') : ''}`,
          badge: getEffectiveStatus(t),
          badgeColor: STATUS_COLORS[getEffectiveStatus(t)],
          href: `/trips/${t.id}`,
        }))

      /* Places */
      data.locations
        .filter(l => l.name.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(l => {
          const trip = data.trips.find(t => t.id === l.trip_id)
          out.push({
            id: `loc-${l.id}`, group: 'places',
            icon: (LOCATION_TYPE_ICONS as Record<string, string>)[l.type] ?? '📍',
            title: l.name,
            subtitle: [trip?.name, l.address].filter(Boolean).join(' · '),
            href: `/trips/${l.trip_id}/places`,
          })
        })

      /* Wishlist */
      data.wishlist
        .filter(w =>
          w.place_name.toLowerCase().includes(q) ||
          w.country.toLowerCase().includes(q) ||
          w.city?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .forEach(w => out.push({
          id: `wish-${w.id}`, group: 'wishlist', icon: '⭐',
          title: w.place_name,
          subtitle: [w.city, w.country].filter(Boolean).join(', '),
          href: '/wishlist',
        }))

      /* Checklist */
      data.checklist
        .filter(c => c.title.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(c => {
          const trip = data.trips.find(t => t.id === c.trip_id)
          out.push({
            id: `chk-${c.id}`, group: 'checklist',
            icon: c.category === 'documents' ? '📄' : c.category === 'packing' ? '🧳' : '✅',
            title: c.title,
            subtitle: trip?.name,
            href: `/trips/${c.trip_id}/checklist`,
          })
        })

      /* Journal */
      data.journal
        .filter(j => j.title?.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(j => {
          const trip = data.trips.find(t => t.id === j.trip_id)
          out.push({
            id: `jnl-${j.id}`, group: 'journal', icon: '📔',
            title: j.title || 'Untitled Entry',
            subtitle: [trip?.name, j.date ? formatDate(j.date, 'MMM d, yyyy') : undefined].filter(Boolean).join(' · '),
            href: `/trips/${j.trip_id}/journal`,
          })
        })
    }

    /* Matching quick actions */
    QUICK_ACTIONS
      .filter(a => a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q))
      .forEach(a => out.push(a))

    return out
  }, [query, recents, data])

  /* Reset active index when items list changes */
  useEffect(() => { setActiveIdx(0) }, [flatItems])

  /* Scroll active item into view */
  useEffect(() => {
    ;(listRef.current?.querySelector('[data-active="true"]') as HTMLElement | null)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  /* Navigate to selected item */
  const navigate = useCallback((item: CmdItem) => {
    saveRecent(item)
    setRecents(loadRecents())
    onClose()
    router.push(item.href)
  }, [onClose, router])

  /* Keyboard navigation on input */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[activeIdx]
      if (item) navigate(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [flatItems, activeIdx, navigate, onClose])

  /* Group items for display */
  const groups = useMemo(() => {
    const order: CmdItem['group'][] = ['recent', 'trips', 'places', 'wishlist', 'checklist', 'journal', 'actions']
    const map = new Map<CmdItem['group'], CmdItem[]>(order.map(g => [g, []]))
    flatItems.forEach(item => map.get(item.group)?.push(item))
    return order
      .filter(g => (map.get(g)?.length ?? 0) > 0)
      .map(g => ({ key: g, label: GROUP_LABELS[g], items: map.get(g)! }))
  }, [flatItems])

  const safeActiveIdx = Math.min(activeIdx, Math.max(0, flatItems.length - 1))

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="palette-dialog"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[14%] z-50 w-full max-w-2xl -translate-x-1/2 px-4 pointer-events-none"
          >
            <div className="pointer-events-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden">

              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                {isLoading
                  ? <Loader2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0 animate-spin" />
                  : <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search trips, places, journal…"
                  className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[15px] outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); inputRef.current?.focus() }}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-1 rounded-md font-mono leading-none select-none">
                  esc
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'min(420px, 60vh)' }}>
                {flatItems.length === 0 && !isLoading ? (
                  <div className="py-10 text-center px-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                      {QUICK_ACTIONS.slice(0, 3).map(a => (
                        <button
                          key={a.id}
                          onClick={() => navigate(a)}
                          className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                        >
                          <span>{a.icon}</span> {a.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    {groups.map(group => {
                      const groupStartIdx = flatItems.indexOf(group.items[0])
                      return (
                        <div key={group.key}>
                          {/* Group header */}
                          <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                            {group.key === 'recent' && (
                              <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            )}
                            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                              {group.label}
                            </p>
                          </div>

                          {/* Items */}
                          {group.items.map((item, j) => {
                            const flatIdx = groupStartIdx + j
                            const isActive = flatIdx === safeActiveIdx

                            return (
                              <button
                                key={item.id}
                                data-active={String(isActive)}
                                onClick={() => navigate(item)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                  isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                )}
                              >
                                {/* Icon */}
                                <div className={cn(
                                  'w-8 h-8 rounded-lg text-[17px] flex items-center justify-center shrink-0 transition-colors',
                                  isActive
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800',
                                )}>
                                  {item.icon}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm font-medium truncate',
                                    isActive
                                      ? 'text-indigo-700 dark:text-indigo-300'
                                      : 'text-slate-800 dark:text-slate-200',
                                  )}>
                                    {item.title}
                                  </p>
                                  {item.subtitle && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>

                                {/* Status badge */}
                                {item.badge && (
                                  <span className={cn(
                                    'hidden sm:block text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full shrink-0',
                                    item.badgeColor ?? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                  )}>
                                    {item.badge}
                                  </span>
                                )}

                                {/* Arrow on active */}
                                {isActive && (
                                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500 shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 select-none">
                <span className="flex items-center gap-1.5">
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">↑↓</span>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">↵</span>
                  open
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">esc</span>
                  close
                </span>
                {!isLoading && flatItems.length > 0 && (
                  <span className="ml-auto">{flatItems.length} result{flatItems.length !== 1 ? 's' : ''}</span>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
