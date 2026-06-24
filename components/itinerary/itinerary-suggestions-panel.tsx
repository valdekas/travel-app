'use client'

import { useState } from 'react'
import { Trip, ItineraryDay, ItineraryItem, ItineraryItemType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getCachedSuggestions, setCachedSuggestions } from '@/lib/utils/suggestions-cache'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { toast } from 'sonner'
import { Sparkles, Loader2, RefreshCw, ChevronLeft, Clock, Timer, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

// ── Category definitions ───────────────────────────────────────────────────────

interface ActivityCategory {
  id: string
  emoji: string
  name: string
  description: string
  itemType: ItineraryItemType
}

const CATEGORIES: ActivityCategory[] = [
  { id: 'restaurants and dining',        emoji: '🍽️', name: 'Dining',      description: 'Restaurants and cafés',       itemType: 'restaurant' },
  { id: 'sightseeing and landmarks',     emoji: '🏛️', name: 'Sightseeing', description: 'Landmarks and attractions',    itemType: 'attraction' },
  { id: 'guided tours and experiences',  emoji: '🎯', name: 'Tours',       description: 'Guided tours and experiences', itemType: 'tour'       },
  { id: 'shopping and markets',          emoji: '🛍️', name: 'Shopping',    description: 'Markets and shopping areas',   itemType: 'shopping'   },
  { id: 'nature and outdoor activities', emoji: '🌿', name: 'Nature',      description: 'Parks, beaches, outdoors',     itemType: 'activity'   },
  { id: 'nightlife and entertainment',   emoji: '🌙', name: 'Nightlife',   description: 'Bars, shows, entertainment',   itemType: 'other'      },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface ItinerarySuggestion {
  name: string
  category: string
  description: string
  suggestedTime: string
  duration: string
  emoji: string
  tip: string
}

type Step = 'categories' | 'area' | 'results'

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractCity(trip: Trip): string {
  if (trip.city && trip.city !== trip.country) return trip.city
  if (trip.region && trip.region !== trip.country) return trip.region
  return trip.country || 'the destination'
}

function tripDurationDays(trip: Trip): number {
  if (!trip.start_date || !trip.end_date) return 7
  return Math.max(1, Math.round(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86_400_000
  ) + 1)
}

function dayLabel(day: ItineraryDay, index: number): string {
  const num = day.day_number ?? index + 1
  try {
    return `Day ${num} — ${format(parseISO(day.date), 'EEE, MMM d')}`
  } catch {
    return `Day ${num}`
  }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border/50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 bg-muted rounded w-2/5" />
            <div className="h-4 bg-muted rounded w-16 ml-1" />
          </div>
          <div className="flex gap-3">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-3 bg-muted rounded w-14" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-2/5" />
        </div>
      </div>
    </div>
  )
}

// ── Suggestion card ────────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  selected,
  onToggle,
}: {
  suggestion: ItinerarySuggestion
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full text-left rounded-xl border p-3.5 transition-all duration-150',
        selected
          ? 'border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950/50 shadow-sm'
          : 'border-border/60 hover:border-violet-200 hover:bg-muted/30 dark:hover:border-violet-800',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors',
          selected ? 'bg-violet-100 dark:bg-violet-900' : 'bg-muted',
        )}>
          {suggestion.emoji}
        </div>
        <div className="flex-1 min-w-0">
          {/* Name + badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{suggestion.name}</span>
            <Badge variant="outline" className="text-[10px] capitalize shrink-0">
              {suggestion.category}
            </Badge>
            {selected && (
              <span className="ml-auto text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                ✓ Selected
              </span>
            )}
          </div>

          {/* Time + duration */}
          <div className="flex items-center gap-3 mt-1">
            {suggestion.suggestedTime && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {suggestion.suggestedTime}
              </span>
            )}
            {suggestion.duration && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" /> {suggestion.duration}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {suggestion.description}
          </p>

          {/* Tip */}
          {suggestion.tip && (
            <p className="text-[11px] text-muted-foreground mt-1">
              💡 {suggestion.tip}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Category card ──────────────────────────────────────────────────────────────

function CategoryCard({ cat, onClick }: { cat: ActivityCategory; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-violet-300 hover:bg-violet-50/60 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 transition-all text-center group"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform duration-150">
        {cat.emoji}
      </span>
      <span className="font-semibold text-sm leading-tight">{cat.name}</span>
      <span className="text-[11px] text-muted-foreground leading-snug">{cat.description}</span>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ItinerarySuggestionsPanelProps {
  trip: Trip
  days: (ItineraryDay & { items: ItineraryItem[] })[]
  existingNames: string[]
  onAdded: (dayId: string, newItems: ItineraryItem[]) => void
}

export function ItinerarySuggestionsPanel({
  trip,
  days,
  existingNames,
  onAdded,
}: ItinerarySuggestionsPanelProps) {
  const [open, setOpen]                     = useState(false)
  const [step, setStep]                     = useState<Step>('categories')
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | null>(null)
  const [areaInput, setAreaInput]           = useState('')
  const [selectedArea, setSelectedArea]     = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [suggestions, setSuggestions]       = useState<ItinerarySuggestion[]>([])
  const [selected, setSelected]             = useState<Set<number>>(new Set())
  const [selectedDayId, setSelectedDayId]   = useState<string>('')
  const [adding, setAdding]                 = useState(false)
  const supabase = createClient()
  const city = extractCity(trip)

  function openPanel() {
    setOpen(true)
    setStep('categories')
    setActiveCategory(null)
    setAreaInput('')
    setSelectedArea(null)
    setSuggestions([])
    setSelected(new Set())
    setError(null)
    setSelectedDayId(days.length === 1 ? days[0].id : '')
  }

  function selectCategory(cat: ActivityCategory) {
    setActiveCategory(cat)
    setAreaInput('')
    setSelectedArea(null)
    setSuggestions([])
    setSelected(new Set())
    setError(null)
    setStep('area')
  }

  async function fetchSuggestions(cat: ActivityCategory, area: string | null) {
    setStep('results')
    setError(null)
    setSuggestions([])
    setSelected(new Set())

    const cacheKey = `suggestions_${trip.id}_${cat.id}_itinerary_${area || 'all'}`
    const cached = getCachedSuggestions<ItinerarySuggestion>(cacheKey)
    if (cached) {
      setSuggestions(cached)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'itinerary',
          destination: city,
          country: trip.country,
          duration: tripDurationDays(trip),
          category: cat.id,
          area: area || undefined,
          existingItems: existingNames,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch suggestions')
      const items: ItinerarySuggestion[] = data.suggestions ?? []
      setCachedSuggestions(cacheKey, items)
      setSuggestions(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function goBackToCategories() {
    setStep('categories')
    setActiveCategory(null)
    setAreaInput('')
    setSelectedArea(null)
    setSuggestions([])
    setSelected(new Set())
    setError(null)
    setLoading(false)
  }

  function goBackToArea() {
    setStep('area')
    setSuggestions([])
    setSelected(new Set())
    setError(null)
    setLoading(false)
  }

  function clearArea() {
    setSelectedArea(null)
    setAreaInput('')
  }

  function toggle(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  async function handleAdd() {
    if (!selectedDayId) { toast.error('Please select a day first'); return }
    const items = [...selected].map(i => suggestions[i])
    if (!items.length) return

    setAdding(true)
    try {
      const targetDay = days.find(d => d.id === selectedDayId)
      const startIndex = targetDay?.items?.length ?? 0

      const rows = items.map((s, i) => ({
        day_id:      selectedDayId,
        trip_id:     trip.id,
        title:       s.name,
        type:        activeCategory?.itemType ?? 'activity',
        description: s.description || null,
        start_time:  s.suggestedTime || null,
        cost:        0,
        order_index: startIndex + i,
      }))

      const { data, error } = await supabase
        .from('itinerary_items')
        .insert(rows)
        .select()
      if (error) throw error

      toast.success(`Added ${items.length} activit${items.length !== 1 ? 'ies' : 'y'} to your itinerary`)
      setOpen(false)
      onAdded(selectedDayId, (data ?? []) as ItineraryItem[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add activities')
    } finally {
      setAdding(false)
    }
  }

  const selCount     = selected.size
  const needsDayPick = days.length > 1
  const canAdd       = selCount > 0 && (!needsDayPick || !!selectedDayId)
  const locationBias = trip.lat != null && trip.lng != null
    ? { lat: trip.lat, lng: trip.lng }
    : undefined

  return (
    <>
      {/* Trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={openPanel}
        className="gap-1.5 shrink-0 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggestions
      </Button>

      {/* Panel */}
      <Dialog open={open} onOpenChange={v => { if (!v && !adding) setOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0">

          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Suggestions
              <span className="text-sm font-normal text-muted-foreground">— {city}</span>
            </DialogTitle>

            {step === 'categories' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                What kind of activities are you looking for? Choose a category.
              </p>
            )}
            {(step === 'area' || step === 'results') && activeCategory && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  onClick={step === 'area' ? goBackToCategories : goBackToArea}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {activeCategory.name}
                </button>
                {step === 'results' && selectedArea && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-violet-600 dark:text-violet-400">{selectedArea}</span>
                  </span>
                )}
                {step === 'results' && loading && (
                  <span className="text-xs text-muted-foreground">
                    · Finding the best {activeCategory.name.toLowerCase()}
                    {selectedArea ? ` near ${selectedArea}` : ` in ${city}`}…
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Area step — outside scroll container so autocomplete dropdown isn't clipped */}
          {step === 'area' && (
            <div className="px-5 py-5">
              <p className="text-sm font-medium text-foreground mb-1">Where in {city}?</p>
              <p className="text-xs text-muted-foreground mb-4">
                Search for a neighbourhood, landmark, or area — or skip to search the whole city
              </p>

              <PlacesAutocomplete
                value={areaInput}
                onChange={setAreaInput}
                onPlaceSelect={(place) => {
                  setSelectedArea(place.name)
                  setAreaInput(place.name)
                }}
                placeholder={`e.g. River North, Millennium Park, Old Town…`}
                locationBias={locationBias}
              />

              {selectedArea && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200/60 dark:border-violet-700/60">
                    📍 {selectedArea}
                    <button
                      onClick={clearArea}
                      className="hover:bg-violet-200/80 dark:hover:bg-violet-800/80 rounded-full p-0.5 transition-colors"
                      aria-label="Clear area"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => fetchSuggestions(activeCategory!, null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-muted-foreground/40"
                >
                  Skip — search all of {city}
                </button>
              </div>

              <Button
                onClick={() => fetchSuggestions(activeCategory!, selectedArea)}
                className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {selectedArea
                  ? `Find ${activeCategory?.name} near ${selectedArea}`
                  : `Find ${activeCategory?.name} in ${city}`
                }
              </Button>
            </div>
          )}

          {/* Scrollable body — categories + results only */}
          {step !== 'area' && (
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* Step 1: Category picker */}
              {step === 'categories' && (
                <div className="px-5 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => (
                      <CategoryCard key={cat.id} cat={cat} onClick={() => selectCategory(cat)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Results */}
              {step === 'results' && (
                <div className="px-5 py-4 space-y-2.5">
                  {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

                  {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                      <p className="text-sm text-destructive mb-3">{error}</p>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => activeCategory && fetchSuggestions(activeCategory, selectedArea)}
                        className="gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Try again
                      </Button>
                    </div>
                  )}

                  {!loading && !error && suggestions.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground text-sm">No suggestions returned.</div>
                  )}

                  {!loading && !error && suggestions.map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      selected={selected.has(i)}
                      onToggle={() => toggle(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer — results step only */}
          {step === 'results' && !loading && !error && suggestions.length > 0 && (
            <div className="px-5 py-4 border-t border-border/50 shrink-0 space-y-3">
              {needsDayPick && selCount > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Add to which day?</p>
                  <Select value={selectedDayId} onValueChange={v => setSelectedDayId(v ?? '')}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select a day…" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day, idx) => (
                        <SelectItem key={day.id} value={day.id}>
                          {dayLabel(day, idx)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={adding}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!canAdd || adding}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                >
                  {adding
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding…</>
                    : selCount > 0
                      ? `Add ${selCount} Activit${selCount !== 1 ? 'ies' : 'y'}`
                      : 'Select activities above'
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
