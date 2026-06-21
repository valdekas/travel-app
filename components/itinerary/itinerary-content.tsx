'use client'

import { useState, useRef, useCallback } from 'react'
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
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { DragHint } from '@/components/shared/drag-hint'
import { toast } from 'sonner'
import {
  Plus, Calendar, Trash2, Loader2, MapPin,
  ExternalLink, Pencil, Clock, GripVertical, MoreVertical,
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
  const mapsUrl = getMapsUrl(item)
  const icon = ITINERARY_TYPE_ICONS[item.type] ?? '📌'

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
      <div className={cn(
        'flex-1 min-w-0 rounded-xl border px-3 py-2.5 transition-colors',
        overlay
          ? 'bg-background border-border shadow-xl'
          : 'bg-muted/30 border-border/40 hover:border-border/70',
      )}>
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

            {/* Location */}
            {item.location_name && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
                {item.location_name}
              </p>
            )}
            {item.formatted_address && item.formatted_address !== item.location_name && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate pl-4">
                {item.formatted_address}
              </p>
            )}

            {/* Notes */}
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{item.description}</p>
            )}

            {/* Cost */}
            {item.cost > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(item.cost, currency)}</p>
            )}
          </div>

          {/* Actions (hidden in overlay) */}
          {!overlay && (
            <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
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
      </div>
    </>
  )
}

// ── Sortable activity card ─────────────────────────────────────────────────────

interface SortableCardProps {
  item: ItineraryItem
  currency: string
  isLast: boolean
  onEdit: (item: ItineraryItem) => void
  onDelete: (id: string) => void
}

function SortableActivityCard({ item, currency, isLast, onEdit, onDelete }: SortableCardProps) {
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
        !isLast && 'mb-3',
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
  dayIndex: number
  sensors: ReturnType<typeof useSensors>
}

function DayCard({
  day, currency, onDragStart, onDragEnd, onDragCancel,
  activeItem, onOpenAdd, onEdit, onDelete, onDeleteDay, dayIndex, sensors,
}: DayListProps) {
  const sorted = byOrderIndex(day.items ?? [])
  const itemIds = sorted.map(i => i.id)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
              {dayIndex + 1}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {day.title || `Day ${dayIndex + 1}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(day.date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {sorted.length} {sorted.length === 1 ? 'activity' : 'activities'}
            </Badge>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteDay(day.id)}
              title="Delete day"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

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
                {sorted.map((item, idx) => (
                  <SortableActivityCard
                    key={item.id}
                    item={item}
                    currency={currency}
                    isLast={idx === sorted.length - 1}
                    onEdit={onEdit}
                    onDelete={(id) => onDelete(day.id, id)}
                  />
                ))}
              </div>
            </SortableContext>

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
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ItineraryContentProps {
  trip: Trip
  initialDays: (ItineraryDay & { items: ItineraryItem[] })[]
  locations: { id: string; name: string; type: string }[]
}

export function ItineraryContent({ trip, initialDays }: ItineraryContentProps) {
  const [days, setDays] = useState(initialDays)
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null)

  const [addItemDialog, setAddItemDialog] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null)
  const [saving, setSaving] = useState(false)

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

      const reordered = arrayMove(items, oldIdx, newIdx)

      // Persist new order_index values to DB (fire and forget)
      reordered.forEach((item, idx) => {
        supabase
          .from('itinerary_items')
          .update({ order_index: idx })
          .eq('id', item.id)
          .then(({ error }) => { if (error) console.error('Order persist failed:', error) })
      })

      return { ...day, items: reordered.map((item, idx) => ({ ...item, order_index: idx })) }
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
    const lastDay = days[days.length - 1]
    const nextDate = lastDay
      ? format(addDays(parseISO(lastDay.date), 1), 'yyyy-MM-dd')
      : (trip.start_date ?? format(new Date(), 'yyyy-MM-dd'))

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({ trip_id: trip.id, date: nextDate, day_number: days.length + 1 })
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
        const currentCount = days.find(d => d.id === dayId)?.items?.length ?? 0
        const { data, error } = await supabase
          .from('itinerary_items')
          .insert({ ...payload, day_id: dayId, trip_id: trip.id, order_index: currentCount })
          .select().single()
        if (error) throw error
        setDays(d => d.map(day =>
          day.id === dayId ? { ...day, items: [...(day.items ?? []), data] } : day
        ))
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
    if (!confirm('Delete this activity?')) return
    await supabase.from('itinerary_items').delete().eq('id', itemId)
    setDays(d => d.map(day =>
      day.id === dayId ? { ...day, items: day.items.filter(i => i.id !== itemId) } : day
    ))
    toast.success('Activity removed')
  }

  async function deleteDay(dayId: string) {
    if (!confirm('Delete this day and all its activities?')) return
    await supabase.from('itinerary_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
    toast.success('Day removed')
  }

  const dialogOpen = addItemDialog !== null || editItem !== null

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
        <Button onClick={addDay} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Day
        </Button>
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
              onDelete={deleteItem}
              onDeleteDay={deleteDay}
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
    </div>
  )
}
