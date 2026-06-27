'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, TripSuggestion, ItineraryDay, SUGGESTION_CATEGORIES } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles, MapPin, Calendar, Check, Loader2, Clock, Tag, ChevronRight, ChevronDown, Globe, Star } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

/* ─── Type helpers ─────────────────────────────────────────────── */

type SuggestionCategory = typeof SUGGESTION_CATEGORIES[number]['key']
type ActiveTab = 'All' | SuggestionCategory

const ALL_TAB = { key: 'All' as const, emoji: '✨', label: 'All' }
const TABS = [ALL_TAB, ...SUGGESTION_CATEGORIES]

const COLLAPSED_COUNT = 5

function categoryToLocationType(cat: string) {
  const map: Record<string, string> = {
    Restaurants:      'restaurant',
    Attractions:      'attraction',
    Viewpoints:       'viewpoint',
    Museums:          'attraction',
    Bars:             'restaurant',
    'Parks & Nature': 'activity',
  }
  return map[cat] ?? 'other'
}

function categoryToItineraryType(cat: string) {
  const map: Record<string, string> = {
    Restaurants:      'restaurant',
    Attractions:      'attraction',
    Viewpoints:       'viewpoint',
    Museums:          'attraction',
    Bars:             'restaurant',
    'Parks & Nature': 'activity',
  }
  return map[cat] ?? 'other'
}

/* ─── Props ────────────────────────────────────────────────────── */

interface Props {
  trip: Trip
  initialSuggestions: TripSuggestion[]
  itineraryDays: Pick<ItineraryDay, 'id' | 'date' | 'day_number' | 'title'>[]
}

/* ─── Price badge colours ───────────────────────────────────────── */

const priceColors: Record<string, string> = {
  'Free': 'bg-green-500 text-white',
  '$':    'bg-gray-500/80 text-white',
  '$$':   'bg-blue-500/80 text-white',
  '$$$':  'bg-amber-500/80 text-white',
  '$$$$': 'bg-purple-500/80 text-white',
}

/* ─── Skeleton ──────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 bg-muted animate-pulse rounded w-full" />
          <div className="h-2.5 bg-muted animate-pulse rounded w-5/6" />
          <div className="h-2.5 bg-muted animate-pulse rounded w-4/6" />
        </div>
        <div className="h-8 bg-muted/60 animate-pulse rounded-lg" />
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <div className="flex-1 h-8 bg-muted animate-pulse rounded-lg" />
        <div className="flex-1 h-8 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Suggestion Card ───────────────────────────────────────────── */

interface CardProps {
  suggestion: TripSuggestion
  onAddToPlaces: (s: TripSuggestion) => Promise<void>
  onOpenDayPicker: (s: TripSuggestion) => void
  adding: boolean
}

// Category gradient backgrounds for photo placeholder
const categoryGradients: Record<string, string> = {
  Restaurants:      'from-orange-400 to-rose-500',
  Attractions:      'from-violet-400 to-indigo-500',
  Viewpoints:       'from-sky-400 to-blue-500',
  Museums:          'from-amber-400 to-orange-500',
  Bars:             'from-purple-500 to-pink-500',
  'Parks & Nature': 'from-emerald-400 to-teal-500',
}

function SuggestionCard({ suggestion: s, onAddToPlaces, onOpenDayPicker, adding }: CardProps) {
  const [localPlaces, setLocalPlaces] = useState(s.added_to_places)
  const [localItinerary, setLocalItinerary] = useState(s.added_to_itinerary)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => { setLocalPlaces(s.added_to_places) }, [s.added_to_places])
  useEffect(() => { setLocalItinerary(s.added_to_itinerary) }, [s.added_to_itinerary])

  async function handleAddToPlaces() {
    setLocalPlaces(true)
    await onAddToPlaces({ ...s, added_to_places: localPlaces, added_to_itinerary: localItinerary })
  }

  const showPhoto = s.photo_url && !photoError
  const gradient = categoryGradients[s.category] ?? 'from-slate-400 to-slate-600'

  return (
    <div className={cn(
      'group flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80',
      (localPlaces && localItinerary) && 'opacity-75',
    )}>
      {/* Hero: photo or gradient placeholder */}
      <div className="relative h-36 shrink-0 overflow-hidden">
        {showPhoto ? (
          <img
            src={s.photo_url!}
            alt={s.name}
            className="w-full h-full object-cover"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradient)}>
            <span className="text-5xl opacity-80" aria-hidden>{s.emoji || '📍'}</span>
          </div>
        )}
        {/* Price badge overlay — prefer TA price_level, fall back to AI price_range */}
        {(() => {
          const raw = s.price_level ?? s.price_range
          if (!raw) return null
          // Normalise AI text labels to $ symbols
          const normalized =
            /free/i.test(raw)      ? 'Free' :
            /budget|cheap|\$$/i.test(raw) && raw === '$' ? '$' :
            raw.startsWith('$$$$') ? '$$$$' :
            raw.startsWith('$$$')  ? '$$$'  :
            raw.startsWith('$$')   ? '$$'   :
            raw.startsWith('$')    ? '$'    :
            /budget|cheap/i.test(raw) ? '$' :
            /mid|moderate/i.test(raw) ? '$$' :
            /expensive|upscale/i.test(raw) ? '$$$' :
            /luxury|fine.?dining/i.test(raw) ? '$$$$' :
            null
          if (!normalized) return null
          return (
            <span className={cn(
              'absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm',
              priceColors[normalized] ?? 'bg-gray-500/80 text-white',
            )}>
              {normalized}
            </span>
          )
        })()}
      </div>

      {/* Body */}
      <div className="p-3 pb-2 flex-1 flex flex-col gap-2">
        {/* Name + emoji (no photo case) */}
        <div className="flex items-start gap-2">
          {!showPhoto && (
            <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden>{s.emoji || '📍'}</span>
          )}
          <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-2 flex-1">{s.name}</h3>
        </div>

        {/* Rating — TripAdvisor 1–5 scale */}
        {s.rating != null && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-foreground">{s.rating}</span>
            {s.reviews_count != null && (
              <span className="text-[10px] text-muted-foreground">
                · {s.reviews_count.toLocaleString()} reviews
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {s.address && (
          <p className="flex items-start gap-1 text-[11px] text-muted-foreground leading-snug">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{s.address}</span>
          </p>
        )}

        {/* Description */}
        {s.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {s.description}
          </p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {s.best_time_to_visit && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />{s.best_time_to_visit}
            </span>
          )}
          {s.must_try && (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2 py-0.5">
              <Tag className="h-2.5 w-2.5" />{s.must_try}
            </span>
          )}
        </div>

        {s.tip && (
          <p className="text-[11px] text-muted-foreground/80 bg-muted/50 rounded-lg px-2.5 py-2 leading-relaxed">
            💡 {s.tip}
          </p>
        )}
      </div>

      {/* Action row */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {/* Add-to actions */}
        {localPlaces ? (
          <span className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg h-9 min-w-[80px]">
            <Check className="h-3.5 w-3.5" /> In Places
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs gap-1.5 font-medium min-w-[80px]"
            disabled={adding}
            onClick={handleAddToPlaces}
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            + Places
          </Button>
        )}

        {localItinerary ? (
          <span className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 rounded-lg h-9 min-w-[80px]">
            <Check className="h-3.5 w-3.5" /> In Itinerary
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs gap-1.5 font-medium min-w-[80px]"
            disabled={adding}
            onClick={() => onOpenDayPicker({ ...s, added_to_places: localPlaces, added_to_itinerary: localItinerary })}
          >
            <Calendar className="h-3.5 w-3.5" />
            + Itinerary
          </Button>
        )}

        {/* Branded external links — grouped so they wrap together */}
        {(s.google_maps_url || s.website || s.ta_location_id) && (
          <div className="flex gap-1.5">
            {s.google_maps_url && (
              <a
                href={s.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Maps"
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg hover:bg-[#EA4335]/8 hover:border-[#EA4335]/40 transition-colors"
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#EA4335" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-[#EA4335]">Maps</span>
              </a>
            )}

            {s.website && (
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                title="Visit website"
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Web
              </a>
            )}

            {s.ta_location_id && (
              <a
                href={`https://www.tripadvisor.com/Location_Review-d${s.ta_location_id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in TripAdvisor"
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg hover:bg-[#34E0A1]/10 hover:border-[#34E0A1]/50 transition-colors"
              >
                <span className="text-sm leading-none" aria-hidden>🦉</span>
                <span className="text-[#00AA6C] dark:text-[#34E0A1]">TripAdvisor</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────── */

export function SuggestionsContent({ trip, initialSuggestions, itineraryDays }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [activeTab, setActiveTab] = useState<ActiveTab>('All')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [dayPickerSuggestion, setDayPickerSuggestion] = useState<TripSuggestion | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [addingToItinerary, setAddingToItinerary] = useState(false)
  const [liveDays, setLiveDays] = useState(itineraryDays)
  const [daysLoading, setDaysLoading] = useState(false)

  useEffect(() => { setSuggestions(initialSuggestions) }, [initialSuggestions])

  // On mount: reset stale added_to_itinerary / added_to_places flags for items that no longer exist
  useEffect(() => {
    if (initialSuggestions.length === 0) return
    async function resetStaleFlags() {
      const [{ data: items }, { data: locs }] = await Promise.all([
        supabase.from('itinerary_items').select('title').eq('trip_id', trip.id),
        supabase.from('locations').select('name').eq('trip_id', trip.id),
      ])
      const itineraryNames = new Set((items ?? []).map((i: { title: string }) => i.title))
      const locationNames  = new Set((locs  ?? []).map((l: { name:  string }) => l.name))

      const staleItinerary = initialSuggestions.filter(s => s.added_to_itinerary && !itineraryNames.has(s.name))
      const stalePlaces    = initialSuggestions.filter(s => s.added_to_places    && !locationNames.has(s.name))

      if (staleItinerary.length > 0) {
        await supabase.from('trip_suggestions')
          .update({ added_to_itinerary: false })
          .in('id', staleItinerary.map(s => s.id))
        setSuggestions(prev => prev.map(s =>
          staleItinerary.some(x => x.id === s.id) ? { ...s, added_to_itinerary: false } : s
        ))
      }
      if (stalePlaces.length > 0) {
        await supabase.from('trip_suggestions')
          .update({ added_to_places: false })
          .in('id', stalePlaces.map(s => s.id))
        setSuggestions(prev => prev.map(s =>
          stalePlaces.some(x => x.id === s.id) ? { ...s, added_to_places: false } : s
        ))
      }
    }
    resetStaleFlags()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  // Only show suggestions that have been enriched with TripAdvisor data
  const visibleSuggestions = suggestions.filter(s => s.photo_url && s.rating != null)

  // Poll every 5s while generating
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollAttemptsRef = useRef(0)
  const generating = suggestions.length === 0

  useEffect(() => {
    if (!generating) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      return
    }
    pollAttemptsRef.current = 0

    function tick() {
      if (pollAttemptsRef.current >= 12) return
      pollAttemptsRef.current++
      router.refresh()
      pollTimerRef.current = setTimeout(tick, 5000)
    }

    pollTimerRef.current = setTimeout(tick, 4000)
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generating])

  /* ── Add to Places ─────────────────────────────────────────────── */

  async function handleAddToPlaces(suggestion: TripSuggestion) {
    setAddingIds(prev => new Set(prev).add(suggestion.id))
    setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, added_to_places: true } : s))
    try {
      const { count } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', trip.id)

      const { error: insertErr } = await supabase.from('locations').insert({
        trip_id:        trip.id,
        name:           suggestion.name,
        type:           categoryToLocationType(suggestion.category),
        description:    suggestion.description ?? null,
        notes:          suggestion.tip ?? null,
        estimated_cost: 0,
        visited:        false,
        order_index:    count ?? 0,
      })
      if (insertErr) throw insertErr

      await supabase
        .from('trip_suggestions')
        .update({ added_to_places: true })
        .eq('id', suggestion.id)

      toast.success(`"${suggestion.name}" added to Places`)
    } catch {
      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, added_to_places: false } : s))
      toast.error('Failed to add to Places')
    } finally {
      setAddingIds(prev => { const n = new Set(prev); n.delete(suggestion.id); return n })
    }
  }

  /* ── Open day picker — re-fetches live days so deleted/added days are current ── */

  async function openDayPicker(s: TripSuggestion) {
    setDayPickerSuggestion(s)
    setDaysLoading(true)
    const { data } = await supabase
      .from('itinerary_days')
      .select('id, day_number, date, title')
      .eq('trip_id', trip.id)
      .order('day_number', { ascending: true })
    if (data) setLiveDays(data as typeof liveDays)
    setDaysLoading(false)
  }

  /* ── Add to Itinerary ──────────────────────────────────────────── */

  async function handleAddToItinerary() {
    if (!dayPickerSuggestion || !selectedDayId) return
    const s = dayPickerSuggestion
    setAddingToItinerary(true)
    try {
      const { count } = await supabase
        .from('itinerary_items')
        .select('*', { count: 'exact', head: true })
        .eq('day_id', selectedDayId)

      const { error: insertErr } = await supabase.from('itinerary_items').insert({
        trip_id:     trip.id,
        day_id:      selectedDayId,
        title:       s.name,
        description: s.description ?? null,
        type:        categoryToItineraryType(s.category),
        cost:        0,
        order_index: count ?? 0,
      })
      if (insertErr) throw insertErr

      await supabase
        .from('trip_suggestions')
        .update({ added_to_itinerary: true })
        .eq('id', s.id)

      setSuggestions(prev => prev.map(x => x.id === s.id ? { ...x, added_to_itinerary: true } : x))
      toast.success(`"${s.name}" added to Itinerary`)
      setDayPickerSuggestion(null)
      setSelectedDayId(null)
    } catch {
      toast.error('Failed to add to Itinerary')
    } finally {
      setAddingToItinerary(false)
    }
  }

  /* ── Helpers ───────────────────────────────────────────────────── */

  const destination = trip.city ? `${trip.city}, ${trip.country}` : trip.country

  const byCategory = new Map<string, TripSuggestion[]>()
  for (const s of visibleSuggestions) {
    const arr = byCategory.get(s.category) ?? []
    arr.push(s)
    byCategory.set(s.category, arr)
  }

  function toggleExpand(key: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="md:max-w-5xl md:mx-auto w-full px-4 md:px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <h1 className="text-xl font-bold">Suggestions</h1>
        </div>
        <p className="text-sm text-muted-foreground">Curated ideas for {destination}</p>
      </div>

      {/* Sticky category tabs */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="md:max-w-5xl md:mx-auto w-full px-4 md:px-5">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              const count = tab.key === 'All'
                ? visibleSuggestions.length
                : (byCategory.get(tab.key as SuggestionCategory) ?? []).length
              const isEmpty = !generating && tab.key !== 'All' && count === 0
              return (
                <button
                  key={tab.key}
                  onClick={() => !isEmpty && setActiveTab(tab.key as ActiveTab)}
                  disabled={generating || isEmpty}
                  className={cn(
                    'flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150',
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm'
                      : generating || isEmpty
                      ? 'text-muted-foreground/40 bg-muted/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <span className="text-base leading-none">{tab.emoji}</span>
                  {tab.label}
                  {!generating && (
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      isActive
                        ? 'bg-white/20 text-white'
                        : isEmpty
                        ? 'bg-muted/50 text-muted-foreground/40'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="md:max-w-5xl md:mx-auto w-full px-4 md:px-5 py-6 flex-1">

        {/* ── Skeleton loading ── */}
        {generating && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 text-white animate-spin" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Finding the best of {trip.city || trip.country}…
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generating across 6 categories · ~2–3 minutes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* ── Single category view ── */}
        {!generating && activeTab !== 'All' && (() => {
          const catMeta = SUGGESTION_CATEGORIES.find(c => c.key === activeTab)!
          const items = byCategory.get(activeTab) ?? []
          return (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-xl" aria-hidden>{catMeta.emoji}</span>
                <h2 className="text-base font-semibold">{catMeta.label}</h2>
                <span className="text-xs text-muted-foreground">
                  {items.length} enriched suggestion{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <span className="text-4xl">{catMeta.emoji}</span>
                  <p className="text-sm text-muted-foreground">No suggestions for this category yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map(s => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={suggestions.find(x => x.id === s.id) ?? s}
                      onAddToPlaces={handleAddToPlaces}
                      onOpenDayPicker={openDayPicker}
                      adding={addingIds.has(s.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })()}

        {/* ── All categories view ── */}
        {!generating && activeTab === 'All' && (
          <div className="space-y-10">
            {visibleSuggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1">
                    {suggestions.length === 0 ? 'No suggestions yet' : 'Enrichment in progress'}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {suggestions.length === 0
                      ? 'Suggestions are generated automatically for new trips. They may still be loading — try refreshing in a moment.'
                      : 'Venue details are being fetched. Check back shortly.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                  Refresh
                </Button>
              </div>
            )}

            {SUGGESTION_CATEGORIES.map(({ key, emoji, label }) => {
              const items = byCategory.get(key as SuggestionCategory) ?? []
              if (items.length === 0) return null
              const isExpanded = expandedCategories.has(key)
              const displayed = isExpanded ? items : items.slice(0, COLLAPSED_COUNT)
              const hasMore = items.length > COLLAPSED_COUNT

              return (
                <section key={key}>
                  {/* Section header with "show all" shortcut */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-xl" aria-hidden>{emoji}</span>
                    <h2 className="text-base font-semibold">{label}</h2>
                    <button
                      onClick={() => setActiveTab(key as SuggestionCategory)}
                      className="ml-1 text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      {items.length} enriched
                    </button>
                  </div>

                  {/* Cards — horizontal scroll mobile, grid desktop */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-x-visible md:snap-none md:mx-0 md:px-0 lg:grid-cols-3">
                    {displayed.map(s => (
                      <div key={s.id} className="flex-none w-[260px] md:w-auto snap-start">
                        <SuggestionCard
                          suggestion={suggestions.find(x => x.id === s.id) ?? s}
                          onAddToPlaces={handleAddToPlaces}
                          onOpenDayPicker={openDayPicker}
                          adding={addingIds.has(s.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Show more / less */}
                  {hasMore && (
                    <button
                      onClick={() => toggleExpand(key)}
                      className="mt-3 flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                    >
                      {isExpanded ? (
                        <>Show less <ChevronDown className="h-3.5 w-3.5 rotate-180" /></>
                      ) : (
                        <>Show all {items.length} <ChevronDown className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {/* Day picker dialog */}
      <Dialog
        open={!!dayPickerSuggestion}
        onOpenChange={open => {
          if (!open) { setDayPickerSuggestion(null); setSelectedDayId(null) }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Add to Itinerary
            </DialogTitle>
          </DialogHeader>
          {dayPickerSuggestion && (
            <div className="space-y-4 mt-1">
              <p className="text-sm text-muted-foreground">
                Choose which day to add <strong className="text-foreground">{dayPickerSuggestion.name}</strong> to:
              </p>

              {daysLoading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : liveDays.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    No itinerary days yet. Add days in the Itinerary tab first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {liveDays.map(day => {
                    const dateLabel = day.date
                      ? format(parseISO(day.date), 'EEE, MMM d')
                      : null
                    const isSelected = selectedDayId === day.id
                    return (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDayId(day.id)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-border/80 hover:bg-muted/40',
                        )}
                      >
                        <div>
                          <span className="text-sm font-medium">
                            Day {day.day_number ?? '?'}
                            {day.title && ` — ${day.title}`}
                          </span>
                          {dateLabel && (
                            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
                          )}
                        </div>
                        {isSelected
                          ? <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                        }
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setDayPickerSuggestion(null); setSelectedDayId(null) }}
                  disabled={addingToItinerary}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={daysLoading || !selectedDayId || addingToItinerary}
                  onClick={handleAddToItinerary}
                >
                  {addingToItinerary
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding…</>
                    : 'Add to Day'
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
