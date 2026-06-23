'use client'

import { useState } from 'react'
import { Trip, LocationType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getCachedSuggestions, setCachedSuggestions } from '@/lib/utils/suggestions-cache'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Sparkles, Loader2, RefreshCw, ChevronLeft } from 'lucide-react'

// ── Category definitions ───────────────────────────────────────────────────────

interface PlaceCategory {
  id: string
  emoji: string
  name: string
  description: string
  locationType: LocationType
}

const CATEGORIES: PlaceCategory[] = [
  { id: 'Restaurants',    emoji: '🍽️', name: 'Restaurants',    description: 'Best local dining spots',   locationType: 'restaurant' },
  { id: 'Attractions',    emoji: '🏛️', name: 'Attractions',    description: 'Must-see landmarks',         locationType: 'attraction' },
  { id: 'Viewpoints',     emoji: '🌅', name: 'Viewpoints',     description: 'Scenic panoramic spots',     locationType: 'viewpoint'  },
  { id: 'Museums',        emoji: '🎨', name: 'Museums',        description: 'Culture and galleries',      locationType: 'attraction' },
  { id: 'Bars',           emoji: '🍸', name: 'Bars',           description: 'Nightlife and cocktails',    locationType: 'restaurant' },
  { id: 'Parks & Nature', emoji: '🌿', name: 'Parks & Nature', description: 'Parks, gardens, beaches',    locationType: 'attraction' },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  name: string
  category: string
  emoji: string
  description: string
  whyVisit: string
  priceRange: string
  bestTimeToVisit: string
  mustTry: string | null
  tip: string
}

type Step = 'categories' | 'results'

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

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border/50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 bg-muted rounded w-2/5" />
            <div className="h-4 bg-muted rounded w-12" />
            <div className="h-4 bg-muted rounded w-8" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-4/5" />
          <div className="h-3 bg-muted rounded w-3/5" />
          <div className="flex gap-3">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-28" />
          </div>
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
  suggestion: PlaceSuggestion
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
          {/* Name + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm">{suggestion.name}</span>
            <Badge variant="outline" className="text-[10px] capitalize shrink-0">
              {suggestion.category}
            </Badge>
            {suggestion.priceRange && (
              <Badge variant="outline" className="text-[10px] shrink-0 font-mono tracking-tight">
                {suggestion.priceRange}
              </Badge>
            )}
            {selected && (
              <span className="ml-auto text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                ✓ Selected
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {suggestion.description}
          </p>

          {/* Why visit */}
          {suggestion.whyVisit && (
            <p className="text-[11px] text-muted-foreground/70 italic mt-0.5 leading-relaxed">
              {suggestion.whyVisit}
            </p>
          )}

          {/* Best time + tip */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {suggestion.bestTimeToVisit && (
              <span className="text-[11px] text-muted-foreground">
                🕐 {suggestion.bestTimeToVisit}
              </span>
            )}
            {suggestion.tip && (
              <span className="text-[11px] text-muted-foreground">
                💡 {suggestion.tip}
              </span>
            )}
          </div>

          {/* Must try */}
          {suggestion.mustTry && (
            <p className="text-[11px] text-muted-foreground mt-1">
              🍽️ Must try: {suggestion.mustTry}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Category card ──────────────────────────────────────────────────────────────

function CategoryCard({ cat, onClick }: { cat: PlaceCategory; onClick: () => void }) {
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

interface PlacesSuggestionsPanelProps {
  trip: Trip
  existingNames: string[]
  onAdded: () => void
}

export function PlacesSuggestionsPanel({ trip, existingNames, onAdded }: PlacesSuggestionsPanelProps) {
  const [open, setOpen]                     = useState(false)
  const [step, setStep]                     = useState<Step>('categories')
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [suggestions, setSuggestions]       = useState<PlaceSuggestion[]>([])
  const [selected, setSelected]             = useState<Set<number>>(new Set())
  const [adding, setAdding]                 = useState(false)
  const supabase = createClient()
  const city = extractCity(trip)

  function openPanel() {
    setOpen(true)
    setStep('categories')
    setActiveCategory(null)
    setSuggestions([])
    setSelected(new Set())
    setError(null)
  }

  async function selectCategory(cat: PlaceCategory) {
    setActiveCategory(cat)
    setStep('results')
    setError(null)
    setSuggestions([])
    setSelected(new Set())

    // Check cache first — instant load, no API call
    const cacheKey = `suggestions_${trip.id}_${cat.id}_places`
    const cached = getCachedSuggestions<PlaceSuggestion>(cacheKey)
    if (cached) {
      setLoading(false)
      setSuggestions(cached)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'places',
          destination: city,
          country: trip.country,
          duration: tripDurationDays(trip),
          category: cat.id,
          existingItems: existingNames,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch suggestions')
      const items: PlaceSuggestion[] = data.suggestions ?? []
      setCachedSuggestions(cacheKey, items)
      setSuggestions(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setStep('categories')
    setActiveCategory(null)
    setSuggestions([])
    setSelected(new Set())
    setError(null)
    setLoading(false)
  }

  function toggle(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  async function handleAdd() {
    const items = [...selected].map(i => suggestions[i])
    if (!items.length) return
    setAdding(true)
    try {
      const rows = items.map((s, i) => ({
        trip_id:        trip.id,
        name:           s.name,
        type:           activeCategory?.locationType ?? 'other',
        description:    s.description,
        estimated_cost: 0,
        visited:        false,
        order_index:    existingNames.length + i,
      }))
      const { error } = await supabase.from('locations').insert(rows)
      if (error) throw error
      toast.success(`Added ${items.length} place${items.length !== 1 ? 's' : ''} to your trip`)
      setOpen(false)
      onAdded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add places')
    } finally {
      setAdding(false)
    }
  }

  const selCount = selected.size

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
                What are you looking for? Choose a category to get 15 curated suggestions.
              </p>
            )}
            {step === 'results' && activeCategory && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {activeCategory.name}
                </button>
                {loading && (
                  <span className="text-xs text-muted-foreground">
                    · Finding the best {activeCategory.name.toLowerCase()} in {city}…
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Scrollable body */}
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

            {/* Step 2: Results */}
            {step === 'results' && (
              <div className="px-5 py-4 space-y-2.5">
                {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                    <p className="text-sm text-destructive mb-3">{error}</p>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => activeCategory && selectCategory(activeCategory)}
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

          {/* Footer — only in results step with suggestions */}
          {step === 'results' && !loading && !error && suggestions.length > 0 && (
            <div className="px-5 py-4 border-t border-border/50 shrink-0 flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={adding}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selCount === 0 || adding}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
              >
                {adding
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding…</>
                  : selCount > 0 ? `Add ${selCount} Place${selCount !== 1 ? 's' : ''}` : 'Select places above'
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
