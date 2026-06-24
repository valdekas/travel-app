'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, TripSuggestion, ItineraryDay, SUGGESTION_CATEGORIES } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles, MapPin, Calendar, Check, Loader2, Clock, Tag, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

/* ─── Type helpers ─────────────────────────────────────────────── */

type SuggestionCategory = typeof SUGGESTION_CATEGORIES[number]['key']

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
  'Free': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  '$':    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  '$$':   'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  '$$$':  'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
  '$$$$': 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
}

/* ─── Suggestion Card ───────────────────────────────────────────── */

interface CardProps {
  suggestion: TripSuggestion
  onAddToPlaces: (s: TripSuggestion) => Promise<void>
  onOpenDayPicker: (s: TripSuggestion) => void
  adding: boolean
}

function SuggestionCard({ suggestion: s, onAddToPlaces, onOpenDayPicker, adding }: CardProps) {
  const [localPlaces, setLocalPlaces] = useState(s.added_to_places)
  const [localItinerary, setLocalItinerary] = useState(s.added_to_itinerary)

  // Sync from parent (e.g. router.refresh)
  useEffect(() => { setLocalPlaces(s.added_to_places) }, [s.added_to_places])
  useEffect(() => { setLocalItinerary(s.added_to_itinerary) }, [s.added_to_itinerary])

  async function handleAddToPlaces() {
    setLocalPlaces(true)
    await onAddToPlaces({ ...s, added_to_places: localPlaces, added_to_itinerary: localItinerary })
  }

  return (
    <div className={cn(
      'group flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80',
      (localPlaces && localItinerary) && 'opacity-75',
    )}>
      {/* Card header */}
      <div className="p-4 pb-3 flex-1 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0" aria-hidden>
            {s.emoji || '📍'}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-2">{s.name}</h3>
            {s.price_range && (
              <span className={cn(
                'inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                priceColors[s.price_range] ?? 'bg-slate-100 text-slate-600',
              )}>
                {s.price_range}
              </span>
            )}
          </div>
        </div>

        {s.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {s.description}
          </p>
        )}

        {s.why_visit && (
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2 italic">
            &ldquo;{s.why_visit}&rdquo;
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-auto">
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
      <div className="px-3 pb-3 flex gap-2">
        {localPlaces ? (
          <span className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg py-1.5">
            <Check className="h-3 w-3" /> In Places
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1 font-medium"
            disabled={adding}
            onClick={handleAddToPlaces}
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
            + Places
          </Button>
        )}

        {localItinerary ? (
          <span className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 rounded-lg py-1.5">
            <Check className="h-3 w-3" /> In Itinerary
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1 font-medium"
            disabled={adding}
            onClick={() => onOpenDayPicker({ ...s, added_to_places: localPlaces, added_to_itinerary: localItinerary })}
          >
            <Calendar className="h-3 w-3" />
            + Itinerary
          </Button>
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
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [dayPickerSuggestion, setDayPickerSuggestion] = useState<TripSuggestion | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [addingToItinerary, setAddingToItinerary] = useState(false)

  // Sync when server refreshes
  useEffect(() => { setSuggestions(initialSuggestions) }, [initialSuggestions])

  // Poll for suggestions while they're being generated
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

  /* ── Destination label ─────────────────────────────────────────── */

  const destination = trip.city
    ? `${trip.city}, ${trip.country}`
    : trip.country

  /* ── Group suggestions by category ────────────────────────────── */

  const byCategory = new Map<string, TripSuggestion[]>()
  for (const s of suggestions) {
    const arr = byCategory.get(s.category) ?? []
    arr.push(s)
    byCategory.set(s.category, arr)
  }

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="md:max-w-5xl md:mx-auto md:px-5 py-6 px-4 space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <h1 className="text-xl font-bold">Suggestions</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Curated ideas for {destination}
          </p>
        </div>
      </div>

      {/* Generating state */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-violet-500 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <Loader2 className="h-3 w-3 text-white animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1.5">
              Finding the best of {trip.city || trip.country} for you…
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              We&apos;re generating personalised recommendations across 6 categories.
              This takes about 15–30 seconds.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category sections */}
      {!generating && SUGGESTION_CATEGORIES.map(({ key, emoji, label }) => {
        const items = byCategory.get(key as SuggestionCategory) ?? []
        if (items.length === 0) return null

        return (
          <section key={key}>
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl" aria-hidden>{emoji}</span>
              <h2 className="text-base font-semibold">{label}</h2>
              <span className="text-xs text-muted-foreground ml-1">
                {items.length} suggestion{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards — horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-x-visible md:snap-none md:mx-0 md:px-0 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(s => (
                <div key={s.id} className="flex-none w-[260px] md:w-auto snap-start">
                  <SuggestionCard
                    suggestion={suggestions.find(x => x.id === s.id) ?? s}
                    onAddToPlaces={handleAddToPlaces}
                    onOpenDayPicker={setDayPickerSuggestion}
                    adding={addingIds.has(s.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* Empty state after polling exhausted */}
      {!generating && suggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="font-semibold mb-1">No suggestions yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Suggestions are generated automatically for new trips.
              They may still be loading — try refreshing in a moment.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      )}

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

              {itineraryDays.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    No itinerary days yet. Add days in the Itinerary tab first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {itineraryDays.map(day => {
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
                  disabled={!selectedDayId || addingToItinerary}
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
