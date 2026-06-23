'use client'

import { useState } from 'react'
import { Trip, ItineraryDay, ItineraryItem, ItineraryItemType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Sparkles, Loader2, RefreshCw, Clock, Timer } from 'lucide-react'
import { format, parseISO } from 'date-fns'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ItinerarySuggestion {
  name: string
  category: string
  description: string
  suggestedTime: string
  duration: string
  emoji: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapCategory(category: string): ItineraryItemType {
  const map: Record<string, ItineraryItemType> = {
    attraction: 'attraction', restaurant: 'restaurant', tour: 'tour',
    shopping: 'shopping', viewpoint: 'viewpoint', beach: 'beach',
    hotel: 'hotel', transport: 'transport', activity: 'activity', other: 'other',
  }
  return map[category.toLowerCase()] ?? 'other'
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

          {/* Time + duration meta */}
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

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {suggestion.description}
          </p>
        </div>
      </div>
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
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ItinerarySuggestion[]>([])
  const [selected, setSelected]       = useState<Set<number>>(new Set())
  const [selectedDayId, setSelectedDayId] = useState<string>('')
  const [adding, setAdding]           = useState(false)
  const supabase = createClient()

  async function fetchSuggestions() {
    setOpen(true)
    setLoading(true)
    setError(null)
    setSuggestions([])
    setSelected(new Set())
    // Pre-select the first day if only one exists
    setSelectedDayId(days.length === 1 ? days[0].id : '')

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'itinerary',
          destination: trip.city || trip.country,
          country: trip.country,
          duration: tripDurationDays(trip),
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
        type:        mapCategory(s.category),
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
              AI Activity Suggestions
              <span className="text-sm font-normal text-muted-foreground">
                — {trip.city || trip.country}
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select activities to add to a day in your itinerary.
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
            <div className="px-5 py-4 border-t border-border/50 shrink-0 space-y-3">
              {/* Day selector — shown only when multiple days exist */}
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
                      : 'Select activities'
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
