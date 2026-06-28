'use client'

import { useState, useRef, useCallback, Fragment } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trip, ItineraryDay, ItineraryItem, ItineraryItemType, ITINERARY_TYPE_ICONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { DragHint } from '@/components/shared/drag-hint'
import { ItinerarySuggestionsPanel } from '@/components/itinerary/itinerary-suggestions-panel'
import { toast } from 'sonner'
import {
  Plus, Calendar, Trash2, Loader2, MapPin,
  ExternalLink, Pencil, Clock, GripVertical, MoreVertical, ChevronDown, CheckCircle2, Sparkles,
} from 'lucide-react'
import { parseISO, addDays, format } from 'date-fns'
import { cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const ITEM_TYPES: { value: ItineraryItemType; label: string }[] = [
  { value: 'flight',     label: 'Flight' },
  { value: 'hotel',      label: 'Hotel / Check-in' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'beach',      label: 'Beach' },
  { value: 'viewpoint',  label: 'Viewpoint' },
  { value: 'transport',  label: 'Transport' },
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'tour',       label: 'Tour' },
  { value: 'shopping',   label: 'Shopping' },
  { value: 'activity',   label: 'Activity' },
  { value: 'event',      label: 'Event' },
  { value: 'rest',       label: 'Rest / Free time' },
  { value: 'other',      label: 'Other' },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface LocationRef {
  location_name: string
  formatted_address: string
  city: string
  region: string
  country: string
  latitude: number | null
  longitude: number | null
  google_place_id: string
  google_maps_url: string
}

const EMPTY_LOCATION: LocationRef = {
  location_name: '', formatted_address: '', city: '', region: '',
  country: '', latitude: null, longitude: null, google_place_id: '', google_maps_url: '',
}

interface ItemFormState {
  title: string
  type: ItineraryItemType
  start_time: string
  end_time: string
  description: string
  cost: string
  location_name: string
}

const EMPTY_FORM: ItemFormState = {
  title: '', type: 'activity', start_time: '', end_time: '',
  description: '', cost: '', location_name: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMapsUrl(item: ItineraryItem): string | null {
  if (item.google_maps_url) return item.google_maps_url
  if (item.latitude && item.longitude) return `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
  if (item.location_name) return `https://www.google.com/maps/search/${encodeURIComponent(item.location_name)}`
  return null
}

/** Sort by order_index only — manual order always wins */
function byOrderIndex(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

// ── Card inner content (shared between sortable card and drag overlay) ─────────

interface CardContentProps {
  item: ItineraryItem
  currency: string
  isLast: boolean
  /** When true, renders elevated overlay style (no interactive buttons) */
  overlay?: boolean
  onEdit?: (item: ItineraryItem) => void
  onDelete?: (id: string) => void
}

function ActivityCardInner({ item, currency, isLast, overlay, onEdit, onDelete }: CardContentProps) {
  const [expanded, setExpanded] = useState(false)
  const mapsUrl = getMapsUrl(item)
  const icon = ITINERARY_TYPE_ICONS[item.type] ?? '📌'

  // Card is expandable when it has detail content that gets truncated in the compact view
  const hasExpandable = !!(
    item.description ||
    (item.formatted_address && item.formatted_address !== item.location_name)
  )

  function handleCardClick() {
    if (!overlay && hasExpandable) setExpanded(v => !v)
  }

  return (
    <>
      {/* Time column */}
      <div className="w-11 flex-shrink-0 text-right pt-1">
        {item.start_time ? (
          <span className="text-[11px] font-mono font-semibold text-primary leading-none tabular-nums">
            {item.start_time.slice(0, 5)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/25">—</span>
        )}
      </div>

      {/* Timeline dot + connector */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background flex-shrink-0" />
        {!isLast && !overlay && (
          <div className="w-px flex-1 bg-border/40 mt-1 min-h-[1.5rem]" />
        )}
      </div>

      {/* Content card */}
      <div
        onClick={handleCardClick}
        className={cn(
          'flex-1 min-w-0 rounded-xl border px-3 py-2.5 transition-colors',
          overlay
            ? 'bg-background border-border shadow-xl'
            : 'bg-muted/30 border-border/40 hover:border-border/70',
          !overlay && hasExpandable && 'cursor-pointer select-none',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base leading-none">{icon}</span>
              <span className="font-medium text-sm">{item.title}</span>
              {item.end_time && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {item.start_time ? `→ ${item.end_time.slice(0, 5)}` : item.end_time.slice(0, 5)}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] capitalize ml-auto shrink-0">
                {item.type.replace('_', ' ')}
              </Badge>
            </div>

            {/* Location — remove truncate when expanded */}
            {item.location_name && (
              <p className={cn(
                'text-xs text-muted-foreground mt-1 flex items-center gap-1',
                !expanded && 'truncate',
              )}>
                <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
                {item.location_name}
              </p>
            )}
            {item.formatted_address && item.formatted_address !== item.location_name && (
              <p className={cn(
                'text-[11px] text-muted-foreground/60 mt-0.5 pl-4',
                !expanded ? 'truncate' : 'break-words',
              )}>
                {item.formatted_address}
              </p>
            )}

            {/* Notes — show 2-line preview collapsed, full text expanded */}
            {item.description && (
              <p className={cn(
                'text-xs text-muted-foreground mt-1 italic',
                !expanded ? 'line-clamp-2' : 'break-words whitespace-pre-wrap',
              )}>
                {item.description}
              </p>
            )}

            {/* Cost */}
            {item.cost > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(item.cost, currency)}</p>
            )}

            {/* Expanded: inline Edit / Maps shortcuts */}
            {expanded && !overlay && (
              <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center gap-3">
                <button
                  className="text-xs text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
                  onClick={e => { e.stopPropagation(); onEdit?.(item) }}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Actions (hidden in overlay) — stopPropagation prevents card expand toggle */}
          {!overlay && (
            <div
              className="flex items-center gap-0.5 flex-shrink-0 mt-0.5"
              onClick={e => e.stopPropagation()}
            >
              {/* Desktop: Maps link + Edit + Delete (hover-revealed) */}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Open in Google Maps" className="hidden md:inline-flex">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              )}
              <Button
                variant="ghost" size="icon"
                className="hidden md:inline-flex h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit?.(item)}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="hidden md:inline-flex h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete?.(item.id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>

              {/* Mobile: three-dot overflow menu */}
              <div className="flex md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem onClick={() => onEdit?.(item)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {mapsUrl ? (
                      <DropdownMenuItem onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}>
                        <ExternalLink className="h-4 w-4" />
                        Open in Maps
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Expand/collapse indicator — only when there's expandable content */}
        {!overlay && hasExpandable && (
          <div className="flex justify-center mt-1.5 -mb-0.5">
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-muted-foreground/25 transition-transform duration-200',
              expanded && 'rotate-180 text-muted-foreground/50',
            )} />
          </div>
        )}
      </div>
    </>
  )
}

// ── Sortable activity card ─────────────────────────────────────────────────────

interface SortableCardProps {
  item: ItineraryItem
  currency: string
  isLast: boolean
  hasConnector: boolean
  onEdit: (item: ItineraryItem) => void
  onDelete: (id: string) => void
}

function SortableActivityCard({ item, currency, isLast, hasConnector, onEdit, onDelete }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex gap-2 group',
        !isLast && !hasConnector && 'mb-3',
        !isLast && hasConnector && 'mb-0',
        isDragging && 'opacity-40',
      )}
    >
      {/* Drag handle — only this element triggers drag */}
      <button
        {...listeners}
        className={cn(
          'flex-shrink-0 flex items-center justify-center self-stretch',
          'w-9 md:w-5 min-h-[44px]',
          'cursor-grab active:cursor-grabbing touch-none',
          'text-muted-foreground/50 hover:text-muted-foreground/80 active:text-muted-foreground',
          'md:text-muted-foreground/20 md:hover:text-muted-foreground/60',
          'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded',
        )}
        aria-label="Drag to reorder"
        tabIndex={0}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <ActivityCardInner
        item={item}
        currency={currency}
        isLast={isLast}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

// ── Drag overlay card (elevated, no interaction) ───────────────────────────────

function OverlayCard({ item, currency }: { item: ItineraryItem; currency: string }) {
  return (
    <div
      className="flex gap-2"
      style={{ transform: 'scale(1.02)', transformOrigin: 'center' }}
    >
      {/* Handle (decorative) */}
      <div className="flex-shrink-0 flex items-center justify-center w-5">
        <GripVertical className="h-4 w-4 text-muted-foreground/60" />
      </div>

      <ActivityCardInner item={item} currency={currency} isLast overlay />
    </div>
  )
}

// ── Day list with DnD ──────────────────────────────────────────────────────────

interface DayListProps {
  day: ItineraryDay & { items: ItineraryItem[] }
  currency: string
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (dayId: string, event: DragEndEvent) => void
  onDragCancel: () => void
  activeItem: ItineraryItem | null
  onOpenAdd: (dayId: string) => void
  onEdit: (item: ItineraryItem) => void
  onDelete: (dayId: string, itemId: string) => void
  onDeleteDay: (dayId: string) => void
  onToggleComplete: (dayId: string) => void
  onAutoSchedule: (dayId: string) => void
  isScheduling: boolean
  hasStaleSchedule: boolean
  dayIndex: number
  sensors: ReturnType<typeof useSensors>
}

function DayCard({
  day, currency, onDragStart, onDragEnd, onDragCancel,
  activeItem, onOpenAdd, onEdit, onDelete, onDeleteDay, onToggleComplete,
  onAutoSchedule, isScheduling, hasStaleSchedule, dayIndex, sensors,
}: DayListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isCompleted = day.is_completed ?? false
  const sorted = byOrderIndex(day.items ?? [])
  const itemIds = sorted.map(i => i.id)

  return (
    <Card className="overflow-hidden">
      {/* Clicking the header area (left/title side) toggles collapse.
          The right-side button group stops propagation so each icon is independent. */}
      <CardHeader
        className={cn(
          'pb-3 cursor-pointer select-none transition-colors',
          isCompleted
            ? 'bg-emerald-50/60 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
            : 'bg-muted/20 hover:bg-muted/30',
        )}
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center justify-between gap-2">

          {/* Left: day number circle + title/date (min-w-0 allows shrinking on narrow screens) */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0 transition-colors',
              isCompleted ? 'bg-emerald-500' : 'bg-primary',
            )}>
              {dayIndex + 1}
            </div>
            <div className="min-w-0">
              <CardTitle className={cn(
                'text-sm font-semibold truncate transition-colors',
                isCompleted && 'text-muted-foreground',
              )}>
                {day.title || `Day ${dayIndex + 1}`}
              </CardTitle>
              <p className={cn(
                'text-xs flex items-center gap-1 mt-0.5 transition-colors',
                isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground',
              )}>
                <Calendar className="h-3 w-3 flex-shrink-0" />
                {formatDate(day.date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Right: badge + icon buttons.
              gap-2 (8px) between each keeps touch targets clearly separate on mobile.
              stopPropagation on wrapper isolates each button from the header collapse toggle. */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {sorted.length} {sorted.length === 1 ? 'activity' : 'activities'}
            </Badge>

            {/* ✨ Schedule button — icon-only on mobile, labeled on desktop; only when 2+ activities */}
            {sorted.length >= 2 && (
              <>
                {/* Mobile: icon-only, 44px touch target */}
                <Button
                  variant="ghost" size="icon"
                  className="flex sm:hidden h-11 w-11 flex-shrink-0 text-violet-500 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/50 disabled:opacity-50"
                  onClick={() => onAutoSchedule(day.id)}
                  disabled={isScheduling}
                  title="Auto-schedule day"
                >
                  {isScheduling
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Sparkles className="h-4 w-4" />
                  }
                </Button>
                {/* Desktop: labeled outline button */}
                <Button
                  variant="outline" size="sm"
                  className="hidden sm:flex h-8 px-2.5 gap-1.5 text-xs text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950/50 flex-shrink-0"
                  onClick={() => onAutoSchedule(day.id)}
                  disabled={isScheduling}
                >
                  {isScheduling
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Sparkles className="h-3.5 w-3.5" />
                  }
                  {isScheduling ? 'Scheduling…' : 'Schedule'}
                </Button>
              </>
            )}

            {/* Complete toggle — h-11/w-11 on mobile for 44px touch target */}
            <Button
              variant="ghost" size="icon"
              className={cn(
                'h-11 w-11 md:h-7 md:w-7 flex-shrink-0 transition-colors',
                isCompleted
                  ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                  : 'text-muted-foreground/40 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
              )}
              onClick={() => onToggleComplete(day.id)}
              title={isCompleted ? 'Mark as incomplete' : 'Mark day as completed'}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>

            {/* Collapse chevron */}
            <Button
              variant="ghost" size="icon"
              className="h-11 w-11 md:h-7 md:w-7 flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground hover:bg-transparent"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? 'Expand day' : 'Collapse day'}
            >
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform duration-200',
                collapsed && '-rotate-90',
              )} />
            </Button>

            {/* Day overflow menu — delete day only */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="ghost" size="icon"
                  className="h-11 w-11 md:h-7 md:w-7 flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
                  aria-label="Day options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem variant="destructive" onClick={() => onDeleteDay(day.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete day
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-4 pb-3">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center text-muted-foreground">
              <p className="text-sm">No activities yet</p>
              <p className="text-xs mt-0.5">Add your first activity below</p>
            </div>
          ) : (
            <>
              <DragHint />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={(e) => onDragEnd(day.id, e)}
                onDragCancel={onDragCancel}
              >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  <div className="mb-3">
                    {sorted.map((item, idx) => {
                      const isLast     = idx === sorted.length - 1
                      const hasTravel  = !isLast && !!item.travel_time_to_next
                      const modeIcon   = item.travel_mode_to_next === 'driving'  ? '🚗'
                                       : item.travel_mode_to_next === 'transit'  ? '🚌'
                                       : '🚶'
                      return (
                        <Fragment key={item.id}>
                          <SortableActivityCard
                            item={item}
                            currency={currency}
                            isLast={isLast}
                            hasConnector={hasTravel}
                            onEdit={onEdit}
                            onDelete={(id) => onDelete(day.id, id)}
                          />
                          {hasTravel && (
                            <div className="flex items-center gap-2 pl-11 pt-1.5 pb-2 text-[11px] text-muted-foreground/55">
                              <div className="h-px w-3 bg-border/40 flex-shrink-0" />
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                {modeIcon}
                                {item.travel_time_to_next}
                                {item.travel_distance_to_next && (
                                  <span className="text-muted-foreground/40">· {item.travel_distance_to_next}</span>
                                )}
                              </span>
                              <div className="h-px flex-1 bg-border/40" />
                            </div>
                          )}
                        </Fragment>
                      )
                    })}
                  </div>
                </SortableContext>

                {/* Stale schedule hint — shown after manual drag clears travel times */}
                {hasStaleSchedule && (
                  <p className="text-[11px] text-muted-foreground/50 text-center -mt-1 mb-2">
                    ♻️ Travel times cleared — re-run ✨ Schedule to update
                  </p>
                )}

                <DragOverlay
                  dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  {activeItem ? (
                    <OverlayCard item={activeItem} currency={currency} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}

          <Button
            variant="ghost" size="sm"
            className="w-full gap-1.5 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40 mt-1"
            onClick={() => onOpenAdd(day.id)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Activity
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ItineraryContentProps {
  trip: Trip
  initialDays: (ItineraryDay & { items: ItineraryItem[] })[]
  locations: { id: string; name: string; type: string }[]
}

interface SchedulePreview {
  dayId:          string
  dayNumber:      number
  optimizedOrder: { id: string; suggested_time: string }[]
  travelTimes:    { fromId: string; toId: string; duration: string; distance: string; mode: string }[]
  activities:     ItineraryItem[]
}

export function ItineraryContent({ trip, initialDays }: ItineraryContentProps) {
  const [days, setDays] = useState(initialDays)
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null)

  const [addItemDialog, setAddItemDialog] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null)
  const [saving, setSaving] = useState(false)

  type PendingDelete =
    | { type: 'item'; dayId: string; itemId: string }
    | { type: 'day'; dayId: string }
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  // Auto-schedule state
  const [schedulingDayId, setSchedulingDayId]       = useState<string | null>(null)
  const [schedulePreview, setSchedulePreview]         = useState<SchedulePreview | null>(null)
  const [staleScheduleDayIds, setStaleScheduleDayIds] = useState<Set<string>>(new Set())

  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_FORM)
  const locationRef = useRef<LocationRef>(EMPTY_LOCATION)

  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const setField = useCallback((k: keyof ItemFormState, v: string | null) =>
    setItemForm(f => ({ ...f, [k]: v ?? '' })), [])

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const item = days.flatMap(d => d.items ?? []).find(i => i.id === id) ?? null
    setActiveItem(item)
  }

  function handleDragEnd(dayId: string, event: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setDays(prev => prev.map(day => {
      if (day.id !== dayId) return day

      const items = byOrderIndex(day.items ?? [])
      const oldIdx = items.findIndex(i => i.id === active.id)
      const newIdx = items.findIndex(i => i.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return day

      // Track whether this day had travel times (to show the stale hint)
      const hadTravelTimes = items.some(i => i.travel_time_to_next != null)

      const reordered = arrayMove(items, oldIdx, newIdx)

      // Persist new order + clear stale travel times (fire and forget)
      reordered.forEach((item, idx) => {
        supabase
          .from('itinerary_items')
          .update({
            order_index:             idx,
            travel_time_to_next:     null,
            travel_distance_to_next: null,
            travel_mode_to_next:     null,
          })
          .eq('id', item.id)
          .then(({ error }) => { if (error) console.error('Order persist failed:', error) })
      })

      if (hadTravelTimes) {
        setStaleScheduleDayIds(prev => new Set(prev).add(dayId))
      }

      return {
        ...day,
        items: reordered.map((item, idx) => ({
          ...item,
          order_index:             idx,
          travel_time_to_next:     null,
          travel_distance_to_next: null,
          travel_mode_to_next:     null,
        })),
      }
    }))
  }

  function handleDragCancel() {
    setActiveItem(null)
  }

  // ── Dialog helpers ────────────────────────────────────────────────────────────

  function openAdd(dayId: string) {
    setAddItemDialog(dayId)
    setEditItem(null)
    setItemForm(EMPTY_FORM)
    locationRef.current = { ...EMPTY_LOCATION }
  }

  function openEdit(item: ItineraryItem) {
    setEditItem(item)
    setAddItemDialog(null)
    setItemForm({
      title: item.title,
      type: item.type,
      start_time: item.start_time?.slice(0, 5) ?? '',
      end_time: item.end_time?.slice(0, 5) ?? '',
      description: item.description ?? '',
      cost: item.cost > 0 ? String(item.cost) : '',
      location_name: item.location_name ?? '',
    })
    locationRef.current = {
      location_name: item.location_name ?? '',
      formatted_address: item.formatted_address ?? '',
      city: item.city ?? '',
      region: item.region ?? '',
      country: item.country ?? '',
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      google_place_id: item.google_place_id ?? '',
      google_maps_url: item.google_maps_url ?? '',
    }
  }

  function closeDialog() {
    setAddItemDialog(null)
    setEditItem(null)
    setItemForm(EMPTY_FORM)
    locationRef.current = { ...EMPTY_LOCATION }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────────

  async function addDay() {
    const nextDayNumber = days.length + 1

    // Anchor date to trip start so it's always start_date + (dayNumber - 1),
    // not last-day + 1 (which drifts when days are deleted then re-added).
    let newDate: string | null = null
    if (trip.start_date) {
      newDate = format(addDays(parseISO(trip.start_date), nextDayNumber - 1), 'yyyy-MM-dd')
    } else {
      const lastDay = days[days.length - 1]
      newDate = lastDay?.date
        ? format(addDays(parseISO(lastDay.date), 1), 'yyyy-MM-dd')
        : null
    }

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({ trip_id: trip.id, date: newDate, day_number: nextDayNumber, is_completed: false })
      .select('*, items:itinerary_items(*)')
      .single()

    if (error) { toast.error(error.message); return }
    setDays(d => [...d, { ...data, items: [] }])
    toast.success('Day added')
  }

  async function handleSave() {
    if (!itemForm.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const payload = {
        title: itemForm.title.trim(),
        type: itemForm.type,
        start_time: itemForm.start_time || null,
        end_time: itemForm.end_time || null,
        description: itemForm.description || null,
        cost: itemForm.cost ? parseFloat(itemForm.cost) : 0,
        location_name: locationRef.current.location_name || null,
        formatted_address: locationRef.current.formatted_address || null,
        city: locationRef.current.city || null,
        region: locationRef.current.region || null,
        country: locationRef.current.country || null,
        latitude: locationRef.current.latitude,
        longitude: locationRef.current.longitude,
        google_place_id: locationRef.current.google_place_id || null,
        google_maps_url: locationRef.current.google_maps_url || null,
      }

      if (editItem) {
        const { data, error } = await supabase
          .from('itinerary_items').update(payload).eq('id', editItem.id).select().single()
        if (error) throw error
        setDays(d => d.map(day => ({
          ...day,
          items: day.items.map(i => i.id === editItem.id ? data : i),
        })))
        toast.success('Activity updated')
      } else {
        const dayId = addItemDialog!
        const existingItems = byOrderIndex(days.find(d => d.id === dayId)?.items ?? [])

        // Slot new item at its chronological position by start_time.
        // No-time activities append at the end.
        let insertAt: number
        if (payload.start_time) {
          const newTime = payload.start_time.slice(0, 5)
          // Walk display-sorted items in reverse to find the last item whose
          // time ≤ new item's time; new item slots directly after it.
          // Existing items from DB have "HH:MM:SS" format; slice to "HH:MM" for comparison.
          const leftNeighbor = [...existingItems]
            .reverse()
            .find(i => i.start_time && i.start_time.slice(0, 5) <= newTime)
          insertAt = leftNeighbor !== undefined ? leftNeighbor.order_index + 1 : 0
        } else {
          insertAt = existingItems.length
        }

        // Shift every item at or after insertAt up by one (fire-and-forget,
        // same pattern as DnD reorder — no uniqueness constraint on order_index)
        existingItems
          .filter(i => i.order_index >= insertAt)
          .forEach(i => {
            supabase
              .from('itinerary_items')
              .update({ order_index: i.order_index + 1 })
              .eq('id', i.id)
              .then(({ error: e }) => { if (e) console.error('Reorder failed:', e) })
          })

        const { data, error } = await supabase
          .from('itinerary_items')
          .insert({ ...payload, day_id: dayId, trip_id: trip.id, order_index: insertAt })
          .select().single()
        if (error) throw error

        setDays(d => d.map(day => {
          if (day.id !== dayId) return day
          const shiftedItems = day.items.map(i =>
            i.order_index >= insertAt ? { ...i, order_index: i.order_index + 1 } : i
          )
          return { ...day, items: [...shiftedItems, data] }
        }))
        toast.success('Activity added')
      }
      closeDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(dayId: string, itemId: string) {
    const deletedItem = days.flatMap(d => d.items ?? []).find(i => i.id === itemId)
    await supabase.from('itinerary_items').delete().eq('id', itemId)
    setDays(d => d.map(day =>
      day.id === dayId ? { ...day, items: day.items.filter(i => i.id !== itemId) } : day
    ))
    if (deletedItem) {
      supabase
        .from('trip_suggestions')
        .update({ added_to_itinerary: false })
        .eq('trip_id', trip.id)
        .eq('name', deletedItem.title)
        .then(({ error }) => { if (error) console.error('Failed to reset suggestion flag:', error) })
    }
    toast.success('Activity removed')
  }

  async function deleteDay(dayId: string) {
    await supabase.from('itinerary_days').delete().eq('id', dayId)

    const renumbered = days
      .filter(d => d.id !== dayId)
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map((day, index) => ({
        ...day,
        day_number: index + 1,
        date: trip.start_date
          ? format(addDays(parseISO(trip.start_date), index), 'yyyy-MM-dd')
          : day.date,
      }))

    await Promise.all(
      renumbered.map(day =>
        supabase.from('itinerary_days').update({ day_number: day.day_number, date: day.date }).eq('id', day.id)
      )
    )

    setDays(renumbered)
    toast.success('Day removed')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.type === 'item') await deleteItem(pendingDelete.dayId, pendingDelete.itemId)
    else await deleteDay(pendingDelete.dayId)
    setPendingDelete(null)
  }

  async function toggleDayComplete(dayId: string) {
    const day = days.find(d => d.id === dayId)
    if (!day) return
    const next = !day.is_completed
    setDays(d => d.map(d => d.id === dayId ? { ...d, is_completed: next } : d))
    const { error } = await supabase
      .from('itinerary_days')
      .update({ is_completed: next })
      .eq('id', dayId)
    if (error) {
      setDays(d => d.map(d => d.id === dayId ? { ...d, is_completed: !next } : d))
      toast.error('Failed to update day status')
    }
  }

  const dialogOpen = addItemDialog !== null || editItem !== null

  function handleSuggestionsAdded(dayId: string, newItems: ItineraryItem[]) {
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, items: [...(d.items ?? []), ...newItems] } : d
    ))
  }

  // ── Auto-schedule ─────────────────────────────────────────────────────────────

  async function handleAutoSchedule(dayId: string) {
    const day = days.find(d => d.id === dayId)
    if (!day || (day.items ?? []).length < 2) return

    setSchedulingDayId(dayId)
    try {
      const activities = byOrderIndex(day.items ?? []).map(item => ({
        id:            item.id,
        name:          item.title,
        category:      item.type,
        start_time:    item.start_time ?? null,
        location_name: item.location_name ?? null,
        lat:           item.latitude ?? null,
        lng:           item.longitude ?? null,
      }))

      const res = await fetch('/api/itinerary/auto-schedule', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          dayId,
          tripId:     trip.id,
          activities,
          city:    trip.city || trip.country,
          country: trip.country,
        }),
      })
      if (!res.ok) throw new Error('Scheduling failed')
      const { optimizedOrder, travelTimes } = await res.json()

      setSchedulePreview({
        dayId,
        dayNumber:      day.day_number ?? (days.indexOf(day) + 1),
        optimizedOrder,
        travelTimes,
        activities:     day.items ?? [],
      })
    } catch {
      toast.error('Auto-schedule failed. Please try again.')
    } finally {
      setSchedulingDayId(null)
    }
  }

  async function handleApplySchedule() {
    if (!schedulePreview) return
    const { dayId, optimizedOrder, travelTimes } = schedulePreview

    const updates = optimizedOrder.map((o, idx) => {
      const travel = travelTimes.find(t => t.fromId === o.id)
      return {
        id:                      o.id,
        order_index:             idx,
        start_time:              o.suggested_time,
        travel_time_to_next:     travel?.duration     ?? null,
        travel_distance_to_next: travel?.distance     ?? null,
        travel_mode_to_next:     travel?.mode         ?? null,
      }
    })

    await Promise.all(updates.map(u =>
      supabase.from('itinerary_items').update({
        order_index:             u.order_index,
        start_time:              u.start_time,
        travel_time_to_next:     u.travel_time_to_next,
        travel_distance_to_next: u.travel_distance_to_next,
        travel_mode_to_next:     u.travel_mode_to_next,
      }).eq('id', u.id)
    ))

    setDays(prev => prev.map(day => {
      if (day.id !== dayId) return day
      return {
        ...day,
        items: (day.items ?? []).map(item => {
          const u = updates.find(x => x.id === item.id)
          return u ? { ...item, ...u } : item
        }),
      }
    }))

    setStaleScheduleDayIds(prev => { const n = new Set(prev); n.delete(dayId); return n })
    setSchedulePreview(null)
    toast.success('Schedule applied!')
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="px-5 py-4 max-w-4xl mx-auto">

      {/* Section header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">Itinerary</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan your days in detail · {days.length} day{days.length !== 1 ? 's' : ''} planned
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {days.length > 0 && (
            <ItinerarySuggestionsPanel
              trip={trip}
              days={days}
              existingNames={days.flatMap(d => d.items ?? []).map(i => i.title)}
              onAdded={handleSuggestionsAdded}
            />
          )}
          <Button onClick={addDay} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Add Day
          </Button>
        </div>
      </div>

      {days.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No days planned yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Click &ldquo;Add Day&rdquo; to start building your itinerary
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day, dayIndex) => (
            <DayCard
              key={day.id}
              day={day}
              currency={trip.currency}
              dayIndex={dayIndex}
              sensors={sensors}
              activeItem={activeItem}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              onOpenAdd={openAdd}
              onEdit={openEdit}
              onDelete={(dayId, itemId) => setPendingDelete({ type: 'item', dayId, itemId })}
              onDeleteDay={(dayId) => setPendingDelete({ type: 'day', dayId })}
              onToggleComplete={toggleDayComplete}
              onAutoSchedule={handleAutoSchedule}
              isScheduling={schedulingDayId === day.id}
              hasStaleSchedule={staleScheduleDayIds.has(day.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Sunset Cruise, Colosseum Visit"
                value={itemForm.title}
                onChange={e => setField('title', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={itemForm.type} onValueChange={v => setField('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {ITINERARY_TYPE_ICONS[t.value]} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={itemForm.start_time} onChange={e => setField('start_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={itemForm.end_time} onChange={e => setField('end_time', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Location</Label>
              <PlacesAutocomplete
                value={itemForm.location_name}
                onChange={v => setField('location_name', v)}
                onPlaceSelect={p => {
                  setField('location_name', p.name)
                  locationRef.current = {
                    location_name: p.name,
                    formatted_address: p.address,
                    city: p.city,
                    region: p.region,
                    country: p.country,
                    latitude: p.lat,
                    longitude: p.lng,
                    google_place_id: p.placeId,
                    google_maps_url: p.googleMapsLink,
                  }
                }}
                placeholder="Search restaurant, hotel, airport…"
              />
              {locationRef.current.formatted_address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
                  {locationRef.current.formatted_address}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder="Reservation number, meeting point, tips…"
                value={itemForm.description}
                onChange={e => setField('description', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cost ({trip.currency})</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0"
                value={itemForm.cost}
                onChange={e => setField('cost', e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={closeDialog} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : editItem ? 'Save Changes' : 'Add Activity'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => { if (!open) setPendingDelete(null) }}
        title={pendingDelete?.type === 'day' ? 'Delete Day' : 'Delete Activity'}
        description={(() => {
          if (pendingDelete?.type === 'day') {
            const count = days.find(d => d.id === pendingDelete.dayId)?.items?.length ?? 0
            return count > 0
              ? `This will permanently delete this day and all ${count} ${count === 1 ? 'activity' : 'activities'} in it. This cannot be undone.`
              : 'This will permanently delete this day. This cannot be undone.'
          }
          return 'This will permanently remove this activity from your itinerary.'
        })()}
        onConfirm={confirmDelete}
        confirmLabel={pendingDelete?.type === 'day' ? 'Delete Day' : 'Delete'}
      />

      {/* ── Auto-schedule preview dialog ─────────────────────────────────────── */}
      <Dialog
        open={schedulePreview !== null}
        onOpenChange={open => { if (!open) setSchedulePreview(null) }}
      >
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Optimised schedule — Day {schedulePreview?.dayNumber}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review the suggested order and times, then apply.
            </p>
          </DialogHeader>

          {schedulePreview && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 min-h-0">
              {schedulePreview.optimizedOrder.map((o, idx) => {
                const activity = schedulePreview.activities.find(a => a.id === o.id)
                if (!activity) return null
                const travel  = schedulePreview.travelTimes.find(t => t.fromId === o.id)
                const isLast  = idx === schedulePreview.optimizedOrder.length - 1
                const modeIcon = travel?.mode === 'driving' ? '🚗'
                               : travel?.mode === 'transit'  ? '🚌'
                               : '🚶'
                return (
                  <Fragment key={o.id}>
                    {/* Activity row */}
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-muted/40 border border-border/30">
                      <span className="text-[11px] font-mono font-semibold text-primary w-10 text-right flex-shrink-0">
                        {o.suggested_time}
                      </span>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {ITINERARY_TYPE_ICONS[activity.type]} {activity.title}
                      </span>
                      {activity.location_name && (
                        <span className="text-[10px] text-muted-foreground hidden sm:block truncate max-w-[120px]">
                          {activity.location_name}
                        </span>
                      )}
                    </div>
                    {/* Travel time connector */}
                    {!isLast && (
                      <div className="flex items-center gap-2 pl-[52px] py-1.5 text-[11px] text-muted-foreground/55">
                        {travel ? (
                          <>
                            <div className="h-px w-3 bg-border/40 flex-shrink-0" />
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              {modeIcon} {travel.duration}
                              {travel.distance && <span className="text-muted-foreground/40">· {travel.distance}</span>}
                            </span>
                            <div className="h-px flex-1 bg-border/40" />
                          </>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          )}

          <div className="px-5 py-4 border-t border-border/50 flex gap-3 shrink-0">
            <Button variant="outline" className="flex-1" onClick={() => setSchedulePreview(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleApplySchedule}
            >
              Apply Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
