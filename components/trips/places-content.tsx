'use client'

import { useState, useCallback } from 'react'
import { Trip, Location, LocationType, Priority, LOCATION_TYPE_ICONS } from '@/lib/types'
import { buildLocationHierarchy, getPriorityColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus, MapPin, ChevronDown, ChevronRight, ExternalLink,
  CheckCircle2, Circle, Loader2, Trash2, Edit
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'region', label: 'Region / State' },
  { value: 'city', label: 'City' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'beach', label: 'Beach' },
  { value: 'viewpoint', label: 'Viewpoint' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'activity', label: 'Activity' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
]

interface PlacesContentProps {
  trip: Trip
  initialLocations: Location[]
}

interface AddLocationForm {
  name: string
  type: LocationType
  parent_id: string
  description: string
  notes: string
  google_maps_link: string
  estimated_cost: string
  estimated_visit_time: string
  priority: Priority
}

function LocationNode({ location, tripId, depth = 0, onRefresh }: {
  location: Location & { children?: Location[] }
  tripId: string
  depth?: number
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function toggleVisited() {
    setLoading(true)
    await supabase.from('locations').update({ visited: !location.visited }).eq('id', location.id)
    onRefresh()
    setLoading(false)
  }

  async function deleteLocation() {
    if (!confirm('Delete this location and all sub-locations?')) return
    await supabase.from('locations').delete().eq('id', location.id)
    onRefresh()
    toast.success('Location deleted')
  }

  const hasChildren = location.children && location.children.length > 0
  const icon = LOCATION_TYPE_ICONS[location.type]

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-border pl-4' : ''}>
      <div className="group flex items-start gap-2 py-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {hasChildren
            ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
            : <div className="w-4" />
          }
        </button>

        <button
          onClick={toggleVisited}
          disabled={loading}
          className="mt-0.5 flex-shrink-0"
        >
          {location.visited
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">{icon}</span>
            <span className={`font-medium text-sm ${location.visited ? 'line-through text-muted-foreground' : ''}`}>
              {location.name}
            </span>
            <Badge variant="outline" className="text-xs capitalize">{location.type}</Badge>
            <span className={`text-xs font-medium ${getPriorityColor(location.priority)}`}>
              {location.priority}
            </span>
          </div>
          {location.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{location.description}</p>
          )}
          {location.google_maps_link && (
            <a
              href={location.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
            >
              <ExternalLink className="h-3 w-3" /> Open in Maps
            </a>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={deleteLocation}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {location.children!.map(child => (
            <LocationNode key={child.id} location={child} tripId={tripId} depth={depth + 1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlacesContent({ trip, initialLocations }: PlacesContentProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const [form, setForm] = useState<AddLocationForm>({
    name: '',
    type: 'city',
    parent_id: '',
    description: '',
    notes: '',
    google_maps_link: '',
    estimated_cost: '',
    estimated_visit_time: '',
    priority: 'medium',
  })
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  async function refresh() {
    const { data } = await supabase.from('locations').select('*').eq('trip_id', trip.id).order('order_index')
    setLocations(data ?? [])
  }

  async function handleAdd() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('locations').insert({
        trip_id: trip.id,
        parent_id: form.parent_id || null,
        name: form.name.trim(),
        type: form.type,
        description: form.description || null,
        notes: form.notes || null,
        google_maps_link: form.google_maps_link || null,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : 0,
        estimated_visit_time: form.estimated_visit_time ? parseInt(form.estimated_visit_time) : null,
        priority: form.priority,
      })
      if (error) throw error
      toast.success('Location added!')
      setForm({ name: '', type: 'city', parent_id: '', description: '', notes: '', google_maps_link: '', estimated_cost: '', estimated_visit_time: '', priority: 'medium' })
      setAddOpen(false)
      await refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const tree = buildLocationHierarchy(locations)
  const parentOptions = locations.filter(l => ['region', 'city'].includes(l.type))

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Places</h2>
          <p className="text-sm text-muted-foreground">{locations.length} locations planned</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Location
            </Button>
          } />
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input placeholder="e.g. Castel Sant'Elmo" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {LOCATION_TYPE_ICONS[t.value]} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {parentOptions.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Parent Location</Label>
                  <Select value={form.parent_id} onValueChange={v => set('parent_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="None (top level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (top level)</SelectItem>
                      {parentOptions.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => set('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="What is this place?" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Google Maps Link</Label>
                <Input placeholder="https://maps.google.com/…" value={form.google_maps_link} onChange={e => set('google_maps_link', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Est. Cost ({trip.currency})</Label>
                  <Input type="number" placeholder="0" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Visit Time (min)</Label>
                  <Input type="number" placeholder="60" value={form.estimated_visit_time} onChange={e => set('estimated_visit_time', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Personal Notes</Label>
                <Textarea rows={2} placeholder="Reminders, tips…" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Location'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No places yet</p>
            <p className="text-muted-foreground mt-1">Add regions, cities, and attractions to build your itinerary hierarchy</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
              <span>{trip.country}</span>
            </div>
            {tree.map(node => (
              <LocationNode key={node.id} location={node} tripId={trip.id} onRefresh={refresh} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
