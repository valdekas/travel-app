'use client'

import { useState, useCallback, useRef } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, TouchSensor,
  useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trip, Location, LocationType, LOCATION_TYPE_ICONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Plus, MapPin, ExternalLink, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Loader2, Trash2, GripVertical, Pencil, MoreVertical,
} from 'lucide-react'
import { PlacesAutocomplete, type PlaceDetails } from '@/components/ui/places-autocomplete'
import { DragHint } from '@/components/shared/drag-hint'

// ── Constants ──────────────────────────────────────────────────────────────────

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel',      label: 'Hotel' },
  { value: 'city',       label: 'City' },
  { value: 'region',     label: 'Region / State' },
  { value: 'beach',      label: 'Beach' },
  { value: 'viewpoint',  label: 'Viewpoint' },
  { value: 'activity',   label: 'Activity' },
  { value: 'transport',  label: 'Transport' },
  { value: 'other',      label: 'Other' },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlacesContentProps {
  trip: Trip
  initialLocations: Location[]
}

interface LocationForm {
  name: string
  type: LocationType
  country: string
  state: string
  city: string
  description: string
  estimated_cost: string
  estimated_visit_time: string
  notes: string
  google_maps_link: string
}

const EMPTY_FORM: LocationForm = {
  name: '', type: 'attraction', country: '', state: '', city: '',
  description: '', estimated_cost: '', estimated_visit_time: '',
  notes: '', google_maps_link: '',
}

interface PlaceRef {
  lat: number | null
  lng: number | null
  address: string
  place_id: string
}

const EMPTY_PLACE_REF: PlaceRef = { lat: null, lng: null, address: '', place_id: '' }

// ── Shared row content ─────────────────────────────────────────────────────────

function RowContent({
  location,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: {
  location: Location
  currency: string
  onToggle: (id: string, visited: boolean) => void
  onEdit: (location: Location) => void
  onDelete: (id: string) => void
}) {
  const icon = LOCATION_TYPE_ICONS[location.type]

  return (
    <>
      {/* Visit toggle */}
      <button
        onClick={() => onToggle(location.id, !location.visited)}
        className="mt-0.5 flex-shrink-0"
        aria-label={location.visited ? 'Mark as not visited' : 'Mark as visited'}
      >
        {location.visited
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{icon}</span>
          <span className={cn('font-medium text-sm', location.visited && 'line-through text-muted-foreground')}>
            {location.name}
          </span>
          <Badge variant="outline" className="text-xs capitalize">{location.type}</Badge>
        </div>

        {location.address && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{location.address}</p>
        )}

        {location.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{location.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {location.estimated_cost > 0 && (
            <span className="text-xs text-muted-foreground">{currency} {location.estimated_cost}</span>
          )}
          {location.estimated_visit_time && (
            <span className="text-xs text-muted-foreground">{location.estimated_visit_time} min</span>
          )}
          {location.google_maps_link && (
            <a
              href={location.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Open in Maps
            </a>
          )}
        </div>
      </div>

      {/* Desktop: Edit + Delete (hover-revealed) */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
        onClick={() => onEdit(location)}
        aria-label="Edit location"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 text-destructive hover:bg-destructive/10 transition-opacity"
        onClick={() => onDelete(location.id)}
        aria-label="Delete location"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Mobile: three-dot overflow menu */}
      <div className="flex md:hidden flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" side="bottom" className="min-w-44">
            <DropdownMenuItem onClick={() => onEdit(location)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {location.google_maps_link ? (
              <DropdownMenuItem onClick={() => window.open(location.google_maps_link!, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="h-4 w-4" />
                Open in Maps
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(location.id)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

// ── Overlay card (floating during drag — no interaction) ───────────────────────

function OverlayRow({ location, currency }: { location: Location; currency: string }) {
  const noop = () => {}
  return (
    <div
      style={{ transform: 'scale(1.02)', transformOrigin: 'center' }}
      className="flex items-start gap-2 py-3 px-2 rounded-lg bg-background border border-border shadow-lg"
    >
      <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
      <RowContent location={location} currency={currency} onToggle={noop} onEdit={noop} onDelete={noop} />
    </div>
  )
}

// ── Sortable row ───────────────────────────────────────────────────────────────

function SortableRow({
  location,
  currency,
  onToggle,
  onEdit,
  onDelete,
  isLast,
}: {
  location: Location
  currency: string
  onToggle: (id: string, visited: boolean) => void
  onEdit: (location: Location) => void
  onDelete: (id: string) => void
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: location.id })

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
        'group flex items-start gap-2 py-3 hover:bg-muted/20 rounded-lg -mx-2 px-2 transition-colors',
        !isLast && 'border-b border-border/40',
        isDragging && 'opacity-40',
      )}
    >
      {/* Drag handle — only this triggers drag */}
      <button
        {...listeners}
        className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none min-h-[44px] w-9 text-muted-foreground/50 hover:text-muted-foreground/80 active:text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <RowContent
        location={location}
        currency={currency}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

// ── Per-group DnD list ─────────────────────────────────────────────────────────

function LocationDndList({
  items,
  currency,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
}: {
  items: Location[]
  currency: string
  onToggle: (id: string, visited: boolean) => void
  onEdit: (location: Location) => void
  onDelete: (id: string) => void
  onReorder: (reordered: Location[]) => void
}) {
  const [activeItem, setActiveItem] = useState<Location | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(sorted.find(i => i.id === event.active.id) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sorted.findIndex(i => i.id === active.id)
    const newIdx = sorted.findIndex(i => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    onReorder(arrayMove(sorted, oldIdx, newIdx))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {sorted.map((loc, idx) => (
          <SortableRow
            key={loc.id}
            location={loc}
            currency={currency}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            isLast={idx === sorted.length - 1}
          />
        ))}
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
        {activeItem ? <OverlayRow location={activeItem} currency={currency} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── Place form (shared by Add and Edit dialogs) ────────────────────────────────

function PlaceForm({
  form,
  set,
  onPlaceSelect,
  trip,
  showAdvanced,
  setShowAdvanced,
  existingAddress,
}: {
  form: LocationForm
  set: (k: keyof LocationForm, v: string | null) => void
  onPlaceSelect: (p: PlaceDetails) => void
  trip: Trip
  showAdvanced: boolean
  setShowAdvanced: (v: boolean) => void
  existingAddress?: string
}) {
  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label>Search Place *</Label>
        <PlacesAutocomplete
          value={form.name}
          onChange={v => set('name', v)}
          onPlaceSelect={onPlaceSelect}
          placeholder="Search for a place, city, or attraction…"
        />
        {existingAddress && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {existingAddress}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={v => set('type', v as LocationType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LOCATION_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>
                {LOCATION_TYPE_ICONS[t.value]} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Country</Label>
        <Input placeholder="Auto-filled from search" value={form.country} onChange={e => set('country', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>State / Region</Label>
          <Input placeholder="Auto-filled" value={form.state} onChange={e => set('state', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input placeholder="Auto-filled" value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={2} placeholder="What makes this place special?" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Est. Cost ({trip.currency})</Label>
          <Input type="number" min="0" placeholder="0" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Visit Time (min)</Label>
          <Input type="number" min="0" placeholder="60" value={form.estimated_visit_time} onChange={e => set('estimated_visit_time', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Personal Notes</Label>
        <Textarea rows={2} placeholder="Tips, reminders, must-tries…" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="border border-border/60 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <span>Advanced</span>
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showAdvanced && (
          <div className="px-3 pb-3 pt-2 space-y-1.5 border-t border-border/60">
            <Label>Google Maps Link</Label>
            <Input
              placeholder="https://maps.google.com/…"
              value={form.google_maps_link}
              onChange={e => set('google_maps_link', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Auto-filled when you select a place above. Override only if needed.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PlacesContent({ trip, initialLocations }: PlacesContentProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // ── Add dialog state ──────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<LocationForm>(EMPTY_FORM)
  const [addShowAdvanced, setAddShowAdvanced] = useState(false)
  const addPlaceRef = useRef<PlaceRef>(EMPTY_PLACE_REF)

  const setAdd = useCallback((k: keyof LocationForm, v: string | null) =>
    setAddForm(f => ({ ...f, [k]: v ?? '' })), [])

  function closeAdd() {
    setAddOpen(false)
    setAddForm(EMPTY_FORM)
    setAddShowAdvanced(false)
    addPlaceRef.current = { ...EMPTY_PLACE_REF }
  }

  // ── Edit dialog state ─────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editForm, setEditForm] = useState<LocationForm>(EMPTY_FORM)
  const [editShowAdvanced, setEditShowAdvanced] = useState(false)
  const editPlaceRef = useRef<PlaceRef>(EMPTY_PLACE_REF)
  // Track whether user selected a new Google Place during edit
  const editPlaceChanged = useRef(false)

  const setEdit = useCallback((k: keyof LocationForm, v: string | null) =>
    setEditForm(f => ({ ...f, [k]: v ?? '' })), [])

  function openEdit(location: Location) {
    setEditingLocation(location)
    setEditForm({
      name:                 location.name,
      type:                 location.type,
      country:              '',
      state:                '',
      city:                 '',
      description:          location.description ?? '',
      estimated_cost:       location.estimated_cost > 0 ? location.estimated_cost.toString() : '',
      estimated_visit_time: location.estimated_visit_time?.toString() ?? '',
      notes:                location.notes ?? '',
      google_maps_link:     location.google_maps_link ?? '',
    })
    editPlaceRef.current = {
      lat:      location.lat ?? null,
      lng:      location.lng ?? null,
      address:  location.address ?? '',
      place_id: '',
    }
    editPlaceChanged.current = false
    setEditShowAdvanced(false)
    setEditOpen(true)
  }

  function closeEdit() {
    setEditOpen(false)
    setEditingLocation(null)
    setEditForm(EMPTY_FORM)
    setEditShowAdvanced(false)
    editPlaceRef.current = { ...EMPTY_PLACE_REF }
    editPlaceChanged.current = false
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────────

  async function refresh() {
    const { data } = await supabase.from('locations').select('*').eq('trip_id', trip.id).order('order_index')
    setLocations(data ?? [])
  }

  async function handleAdd() {
    if (!addForm.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('locations').insert({
        trip_id:              trip.id,
        name:                 addForm.name.trim(),
        type:                 addForm.type,
        description:          addForm.description || null,
        notes:                addForm.notes || null,
        address:              addPlaceRef.current.address || null,
        google_maps_link:     addForm.google_maps_link || null,
        lat:                  addPlaceRef.current.lat,
        lng:                  addPlaceRef.current.lng,
        estimated_cost:       addForm.estimated_cost ? parseFloat(addForm.estimated_cost) : 0,
        estimated_visit_time: addForm.estimated_visit_time ? parseInt(addForm.estimated_visit_time) : null,
      })
      if (error) throw error
      toast.success('Location added!')
      closeAdd()
      await refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editingLocation || !editForm.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name:                 editForm.name.trim(),
        type:                 editForm.type,
        description:          editForm.description || null,
        notes:                editForm.notes || null,
        google_maps_link:     editForm.google_maps_link || null,
        estimated_cost:       editForm.estimated_cost ? parseFloat(editForm.estimated_cost) : 0,
        estimated_visit_time: editForm.estimated_visit_time ? parseInt(editForm.estimated_visit_time) : null,
      }

      // Only overwrite Google Places data if the user selected a new place
      if (editPlaceChanged.current) {
        payload.address = editPlaceRef.current.address || null
        payload.lat     = editPlaceRef.current.lat
        payload.lng     = editPlaceRef.current.lng
      }

      const { data, error } = await supabase
        .from('locations')
        .update(payload)
        .eq('id', editingLocation.id)
        .select()
        .single()
      if (error) throw error

      setLocations(prev => prev.map(l => l.id === editingLocation.id ? data : l))
      toast.success('Place updated!')
      closeEdit()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisited(id: string, visited: boolean) {
    await supabase.from('locations').update({ visited }).eq('id', id)
    setLocations(prev => prev.map(l => l.id === id ? { ...l, visited } : l))
  }

  async function deleteLocation(id: string) {
    if (!confirm('Delete this location?')) return
    await supabase.from('locations').delete().eq('id', id)
    setLocations(prev => prev.filter(l => l.id !== id))
    toast.success('Location deleted')
  }

  function handleReorder(group: 'unvisited' | 'visited', reordered: Location[]) {
    const updated = reordered.map((loc, idx) => ({ ...loc, order_index: idx }))
    setLocations(prev => [
      ...prev.filter(l => group === 'unvisited' ? l.visited : !l.visited),
      ...updated,
    ])
    updated.forEach(loc => {
      supabase
        .from('locations')
        .update({ order_index: loc.order_index })
        .eq('id', loc.id)
        .then(({ error }) => { if (error) console.error('Order persist failed:', error) })
    })
  }

  const visited   = locations.filter(l => l.visited)
  const unvisited = locations.filter(l => !l.visited)

  return (
    <div className="px-5 py-4 space-y-3 max-w-3xl mx-auto">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">Places</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Saved locations for this trip · {locations.length} saved · {visited.length} visited
            </p>
          </div>
        </div>

        {/* Add dialog */}
        <Dialog open={addOpen} onOpenChange={open => { if (!open) closeAdd(); else setAddOpen(true) }}>
          <DialogTrigger render={
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Add Place
            </Button>
          } />
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Place</DialogTitle>
            </DialogHeader>
            <PlaceForm
              form={addForm}
              set={setAdd}
              onPlaceSelect={p => {
                setAdd('name', p.name)
                setAdd('country', p.country)
                setAdd('state', p.region)
                setAdd('city', p.city)
                setAdd('google_maps_link', p.googleMapsLink)
                addPlaceRef.current = { lat: p.lat, lng: p.lng, address: p.address, place_id: p.placeId }
              }}
              trip={trip}
              showAdvanced={addShowAdvanced}
              setShowAdvanced={setAddShowAdvanced}
            />
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={closeAdd} className="flex-1">Cancel</Button>
              <Button onClick={handleAdd} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Place'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No places yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Search and save places you want to visit on this trip
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <DragHint />
          {unvisited.length > 0 && (
            <Card>
              <CardContent className="pt-3 pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  To Visit · {unvisited.length}
                </p>
                <LocationDndList
                  items={unvisited}
                  currency={trip.currency}
                  onToggle={toggleVisited}
                  onEdit={openEdit}
                  onDelete={deleteLocation}
                  onReorder={reordered => handleReorder('unvisited', reordered)}
                />
              </CardContent>
            </Card>
          )}

          {visited.length > 0 && (
            <Card>
              <CardContent className="pt-3 pb-2 opacity-70">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Visited · {visited.length}
                </p>
                <LocationDndList
                  items={visited}
                  currency={trip.currency}
                  onToggle={toggleVisited}
                  onEdit={openEdit}
                  onDelete={deleteLocation}
                  onReorder={reordered => handleReorder('visited', reordered)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={open => { if (!open) closeEdit() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Place</DialogTitle>
          </DialogHeader>
          <PlaceForm
            form={editForm}
            set={setEdit}
            onPlaceSelect={p => {
              setEdit('name', p.name)
              setEdit('country', p.country)
              setEdit('state', p.region)
              setEdit('city', p.city)
              setEdit('google_maps_link', p.googleMapsLink)
              editPlaceRef.current = { lat: p.lat, lng: p.lng, address: p.address, place_id: p.placeId }
              editPlaceChanged.current = true
            }}
            trip={trip}
            showAdvanced={editShowAdvanced}
            setShowAdvanced={setEditShowAdvanced}
            existingAddress={
              !editPlaceChanged.current && editingLocation?.address
                ? editingLocation.address
                : undefined
            }
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={closeEdit} className="flex-1">Cancel</Button>
            <Button onClick={handleEdit} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
