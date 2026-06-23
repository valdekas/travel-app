'use client'

import { useState } from 'react'
import { Trip, LocationType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  name: string
  category: string
  description: string
  emoji: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapCategory(category: string): LocationType {
  const map: Record<string, LocationType> = {
    restaurant: 'restaurant', cafe: 'restaurant', bar: 'restaurant',
    museum: 'attraction', attraction: 'attraction', park: 'attraction',
    viewpoint: 'viewpoint', hotel: 'hotel', beach: 'beach',
    shopping: 'other',
  }
  return map[category.toLowerCase()] ?? 'other'
}

function duration(trip: Trip): number {
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
            <div className="h-4 bg-muted rounded w-16 ml-1" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-3/4" />
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
        {/* Emoji pill */}
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors',
          selected ? 'bg-violet-100 dark:bg-violet-900' : 'bg-muted',
        )}>
          {suggestion.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{suggestion.name}</span>
            <Badge variant="outline" className="text-[10px] capitalize shrink-0">
              {suggestion.category}
            </Badge>
            {selected && (
              <span className="ml-auto text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                ✓ Added
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {suggestion.description}
          </p>
        </div>
      </div>
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
  const [open, setOpen]             = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [adding, setAdding]         = useState(false)
  const supabase = createClient()

  async function fetchSuggestions() {
    setOpen(true)
    setLoading(true)
    setError(null)
    setSuggestions([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'places',
          destination: trip.city || trip.country,
          country: trip.country,
          duration: duration(trip),
          existingItems: existingNames,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch suggestions')
      setSuggestions(data.suggestions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
        trip_id:       trip.id,
        name:          s.name,
        type:          mapCategory(s.category),
        description:   s.description,
        estimated_cost: 0,
        visited:       false,
        order_index:   existingNames.length + i,
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
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={fetchSuggestions}
        className="gap-1.5 shrink-0 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">AI </span>Suggestions
      </Button>

      {/* Panel */}
      <Dialog open={open} onOpenChange={v => { if (!v && !adding) setOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0">
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-violet-500" />
              AI Place Suggestions
              <span className="text-sm font-normal text-muted-foreground">
                — {trip.city || trip.country}
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select places to add to your trip. Click any card to toggle selection.
            </p>
          </DialogHeader>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 min-h-0">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchSuggestions} className="gap-1.5">
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

          {/* Footer */}
          {!loading && !error && suggestions.length > 0 && (
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
                  : selCount > 0 ? `Add ${selCount} Place${selCount !== 1 ? 's' : ''}` : 'Select places below'
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
