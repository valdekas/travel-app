'use client'

import { useState } from 'react'
import { Trip, LocationType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getCachedSuggestions, setCachedSuggestions } from '@/lib/utils/suggestions-cache'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { toast } from 'sonner'
import {
  Sparkles, Loader2, RefreshCw, ChevronLeft, X,
  MapPin, Star, Globe, Check,
} from 'lucide-react'

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

// ── TripAdvisor result type ────────────────────────────────────────────────────

interface TaResult {
  ta_location_id: string
  name:           string
  address:        string
  lat:            number | null
  lng:            number | null
  rating:         number | null
  reviews_count:  number | null
  photo_url:      string | null
  google_maps_url: string
  website:        string | null
  price_level:    string | null
  category:       string
}

type Step = 'categories' | 'area' | 'results'

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractCity(trip: Trip): string {
  if (trip.city && trip.city !== trip.country) return trip.city
  if (trip.region && trip.region !== trip.country) return trip.region
  return trip.country || 'the destination'
}

const categoryGradients: Record<string, string> = {
  'Restaurants':    'from-orange-400 to-rose-500',
  'Attractions':    'from-violet-400 to-indigo-500',
  'Viewpoints':     'from-sky-400 to-blue-500',
  'Museums':        'from-amber-400 to-orange-500',
  'Bars':           'from-purple-500 to-pink-500',
  'Parks & Nature': 'from-emerald-400 to-teal-500',
}

const priceColors: Record<string, string> = {
  'Free': 'bg-green-500 text-white',
  '$':    'bg-gray-500/80 text-white',
  '$$':   'bg-blue-500/80 text-white',
  '$$$':  'bg-amber-500/80 text-white',
  '$$$$': 'bg-purple-500/80 text-white',
}

function normalizePrice(raw: string): string {
  if (/free/i.test(raw))               return 'Free'
  if (raw.startsWith('$$$$'))          return '$$$$'
  if (raw.startsWith('$$$'))           return '$$$'
  if (raw.startsWith('$$'))            return '$$'
  if (raw.startsWith('$'))             return '$'
  if (/budget|cheap/i.test(raw))       return '$'
  if (/mid|moderate/i.test(raw))       return '$$'
  if (/expensive|upscale/i.test(raw))  return '$$$'
  if (/luxury|fine.?dining/i.test(raw)) return '$$$$'
  return raw
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border/50 overflow-hidden">
      <div className="h-28 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-muted rounded w-8" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
        <div className="h-3 bg-muted rounded w-full" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-7 bg-muted rounded w-14" />
          <div className="h-7 bg-muted rounded w-10" />
          <div className="h-7 bg-muted rounded w-20" />
        </div>
      </div>
    </div>
  )
}

// ── TripAdvisor result card ────────────────────────────────────────────────────

function TaCard({
  result,
  selected,
  onToggle,
}: {
  result: TaResult
  selected: boolean
  onToggle: () => void
}) {
  const [photoError, setPhotoError] = useState(false)
  const showPhoto = result.photo_url && !photoError
  const gradient  = categoryGradients[result.category] ?? 'from-slate-400 to-slate-600'
  const normalized = result.price_level ? normalizePrice(result.price_level) : null

  return (
    <div
      onClick={onToggle}
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-150 cursor-pointer select-none',
        selected
          ? 'border-violet-400 dark:border-violet-600 shadow-sm ring-1 ring-violet-400/30'
          : 'border-border/60 hover:border-violet-300 dark:hover:border-violet-700',
      )}
    >
      {/* Photo / gradient */}
      <div className="relative h-28 shrink-0 overflow-hidden">
        {showPhoto ? (
          <img
            src={result.photo_url!}
            alt={result.name}
            className="w-full h-full object-cover"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradient)}>
            <span className="text-3xl opacity-70" aria-hidden>📍</span>
          </div>
        )}
        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow-md">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
        {/* Price badge */}
        {normalized && (
          <span className={cn(
            'absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm',
            priceColors[normalized] ?? 'bg-gray-500/80 text-white',
          )}>
            {normalized}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm leading-snug">{result.name}</h3>

        {result.rating != null && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{result.rating}</span>
            {result.reviews_count != null && (
              <span className="text-[10px] text-muted-foreground">
                · {result.reviews_count.toLocaleString()} reviews
              </span>
            )}
          </div>
        )}

        {result.address && (
          <p className="flex items-start gap-1 text-[11px] text-muted-foreground leading-snug">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{result.address}</span>
          </p>
        )}

        {/* External links — stopPropagation so they don't trigger selection */}
        {(result.google_maps_url || result.website || result.ta_location_id) && (
          <div
            className="flex gap-1.5 pt-1"
            onClick={e => e.stopPropagation()}
          >
            {result.google_maps_url && (
              <a
                href={result.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2 flex items-center gap-1 text-[11px] font-medium border border-border rounded-md hover:bg-[#EA4335]/8 hover:border-[#EA4335]/40 transition-colors"
              >
                <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="#EA4335" aria-hidden>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-[#EA4335]">Maps</span>
              </a>
            )}
            {result.website && (
              <a
                href={result.website}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2 flex items-center gap-1 text-[11px] text-muted-foreground border border-border rounded-md hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Globe className="h-3 w-3" />
                Web
              </a>
            )}
            {result.ta_location_id && (
              <a
                href={`https://www.tripadvisor.com/Location_Review-d${result.ta_location_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2 flex items-center gap-1 text-[11px] font-medium border border-border rounded-md hover:bg-[#34E0A1]/10 hover:border-[#34E0A1]/50 transition-colors"
              >
                <span className="text-sm leading-none" aria-hidden>🦉</span>
                <span className="text-[#00AA6C] dark:text-[#34E0A1] text-[11px]">TA</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
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
  const [areaInput, setAreaInput]           = useState('')
  const [selectedArea, setSelectedArea]     = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [results, setResults]               = useState<TaResult[]>([])
  const [selected, setSelected]             = useState<Set<number>>(new Set())
  const [adding, setAdding]                 = useState(false)
  const supabase = createClient()
  const city = extractCity(trip)

  function openPanel() {
    setOpen(true)
    setStep('categories')
    setActiveCategory(null)
    setAreaInput('')
    setSelectedArea(null)
    setResults([])
    setSelected(new Set())
    setError(null)
  }

  function selectCategory(cat: PlaceCategory) {
    setActiveCategory(cat)
    setAreaInput('')
    setSelectedArea(null)
    setResults([])
    setSelected(new Set())
    setError(null)
    setStep('area')
  }

  async function fetchResults(cat: PlaceCategory, area: string | null) {
    setStep('results')
    setError(null)
    setResults([])
    setSelected(new Set())

    const cacheKey = `suggestions_ta_${trip.id}_${cat.id}_places_${area || 'all'}`
    const cached = getCachedSuggestions<TaResult>(cacheKey)
    if (cached) {
      setResults(cached)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/suggestions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat.id,
          city,
          country: trip.country,
          area: area || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      const items: TaResult[] = data.results ?? []
      setCachedSuggestions(cacheKey, items)
      setResults(items)
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
    setResults([])
    setSelected(new Set())
    setError(null)
    setLoading(false)
  }

  function goBackToArea() {
    setStep('area')
    setResults([])
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
    const items = [...selected].map(i => results[i])
    if (!items.length) return
    setAdding(true)
    try {
      const rows = items.map((s, i) => ({
        trip_id:        trip.id,
        name:           s.name,
        type:           activeCategory?.locationType ?? 'other',
        description:    null,
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

  const selCount    = selected.size
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
                What are you looking for? Choose a category to find real places on TripAdvisor.
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
                    · Searching TripAdvisor{selectedArea ? ` near ${selectedArea}` : ` in ${city}`}…
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
                placeholder="e.g. River North, Millennium Park, Old Town…"
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

              <div className="mt-4">
                <button
                  onClick={() => fetchResults(activeCategory!, null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-muted-foreground/40"
                >
                  Skip — search all of {city}
                </button>
              </div>

              <Button
                onClick={() => fetchResults(activeCategory!, selectedArea)}
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
                <div className="px-4 py-4 space-y-2.5">
                  {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

                  {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                      <p className="text-sm text-destructive mb-3">{error}</p>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => activeCategory && fetchResults(activeCategory, selectedArea)}
                        className="gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Try again
                      </Button>
                    </div>
                  )}

                  {!loading && !error && results.length === 0 && (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-sm font-medium">No results found</p>
                      <p className="text-xs text-muted-foreground">
                        No {activeCategory?.name.toLowerCase()} found
                        {selectedArea ? ` near ${selectedArea}` : ` in ${city}`}.
                        Try a different area or category.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={goBackToArea}>
                        Change area
                      </Button>
                    </div>
                  )}

                  {!loading && !error && results.map((r, i) => (
                    <TaCard
                      key={r.ta_location_id}
                      result={r}
                      selected={selected.has(i)}
                      onToggle={() => toggle(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer — results step only */}
          {step === 'results' && !loading && !error && results.length > 0 && (
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
