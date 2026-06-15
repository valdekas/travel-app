'use client'

import { useState } from 'react'
import { Trip, ItineraryDay, ItineraryItem, ItineraryItemType, ITINERARY_TYPE_ICONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Calendar, Clock, Trash2, GripVertical, Loader2 } from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { parseISO, addDays, format } from 'date-fns'

const ITEM_TYPES: { value: ItineraryItemType; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'transport', label: 'Transport' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'checkout', label: 'Check-out' },
  { value: 'meal', label: 'Meal / Restaurant' },
  { value: 'activity', label: 'Activity' },
  { value: 'tour', label: 'Tour' },
  { value: 'event', label: 'Event' },
  { value: 'rest', label: 'Rest / Free Time' },
  { value: 'other', label: 'Other' },
]

function SortableItem({ item, onDelete }: { item: ItineraryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const icon = ITINERARY_TYPE_ICONS[item.type]

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
      <button {...attributes} {...listeners} className="mt-2 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2.5 border border-border hover:border-border/80 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-base flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {item.start_time && (
                  <span className="text-xs font-mono text-primary font-semibold">{item.start_time.slice(0, 5)}</span>
                )}
                {item.end_time && (
                  <span className="text-xs text-muted-foreground">– {item.end_time.slice(0, 5)}</span>
                )}
                <span className="font-medium text-sm">{item.title}</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
              )}
              {item.cost > 0 && (
                <p className="text-xs text-muted-foreground">Cost: {item.cost} €</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ItineraryContentProps {
  trip: Trip
  initialDays: (ItineraryDay & { items: ItineraryItem[] })[]
  locations: { id: string; name: string; type: string }[]
}

export function ItineraryContent({ trip, initialDays, locations }: ItineraryContentProps) {
  const [days, setDays] = useState(initialDays)
  const [addItemDialog, setAddItemDialog] = useState<string | null>(null) // dayId
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [itemForm, setItemForm] = useState({
    title: '', type: 'activity' as ItineraryItemType,
    start_time: '', end_time: '', description: '', cost: '',
  })
  const setField = (k: string, v: string | null) => setItemForm(f => ({ ...f, [k]: v ?? '' }))

  async function addDay() {
    const lastDay = days[days.length - 1]
    const nextDate = lastDay
      ? format(addDays(parseISO(lastDay.date), 1), 'yyyy-MM-dd')
      : (trip.start_date ?? format(new Date(), 'yyyy-MM-dd'))

    const { data, error } = await supabase.from('itinerary_days').insert({
      trip_id: trip.id,
      date: nextDate,
      day_number: days.length + 1,
    }).select('*, items:itinerary_items(*)').single()

    if (error) { toast.error(error.message); return }
    setDays(d => [...d, data])
    toast.success('Day added')
  }

  async function addItem(dayId: string) {
    if (!itemForm.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('itinerary_items').insert({
        day_id: dayId,
        trip_id: trip.id,
        title: itemForm.title,
        type: itemForm.type,
        start_time: itemForm.start_time || null,
        end_time: itemForm.end_time || null,
        description: itemForm.description || null,
        cost: itemForm.cost ? parseFloat(itemForm.cost) : 0,
        order_index: (days.find(d => d.id === dayId)?.items?.length ?? 0),
      }).select().single()

      if (error) throw error
      setDays(d => d.map(day =>
        day.id === dayId ? { ...day, items: [...(day.items ?? []), data] } : day
      ))
      setItemForm({ title: '', type: 'activity', start_time: '', end_time: '', description: '', cost: '' })
      setAddItemDialog(null)
      toast.success('Activity added!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(dayId: string, itemId: string) {
    await supabase.from('itinerary_items').delete().eq('id', itemId)
    setDays(d => d.map(day =>
      day.id === dayId ? { ...day, items: day.items.filter(i => i.id !== itemId) } : day
    ))
    toast.success('Removed')
  }

  async function deleteDay(dayId: string) {
    if (!confirm('Delete this day and all its activities?')) return
    await supabase.from('itinerary_days').delete().eq('id', dayId)
    setDays(d => d.filter(day => day.id !== dayId))
    toast.success('Day removed')
  }

  function handleDragEnd(dayId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDays(d => d.map(day => {
      if (day.id !== dayId) return day
      const oldIdx = day.items.findIndex(i => i.id === active.id)
      const newIdx = day.items.findIndex(i => i.id === over.id)
      const reordered = arrayMove(day.items, oldIdx, newIdx)
      reordered.forEach((item, idx) => {
        supabase.from('itinerary_items').update({ order_index: idx }).eq('id', item.id)
      })
      return { ...day, items: reordered }
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Itinerary</h2>
          <p className="text-sm text-muted-foreground">{days.length} days planned</p>
        </div>
        <Button onClick={addDay} className="gap-2">
          <Plus className="h-4 w-4" /> Add Day
        </Button>
      </div>

      {days.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No days planned yet</p>
            <p className="text-muted-foreground mt-1">Click &ldquo;Add Day&rdquo; to start building your itinerary</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day, dayIndex) => (
            <Card key={day.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold">
                      {dayIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {day.title || `Day ${dayIndex + 1}`}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(day.date, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{day.items?.length ?? 0} activities</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteDay(day.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={e => handleDragEnd(day.id, e)}
                >
                  <SortableContext
                    items={day.items?.map(i => i.id) ?? []}
                    strategy={verticalListSortingStrategy}
                  >
                    {(day.items ?? [])
                      .sort((a, b) => {
                        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
                        return a.order_index - b.order_index
                      })
                      .map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onDelete={(id) => deleteItem(day.id, id)}
                        />
                      ))}
                  </SortableContext>
                </DndContext>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/30 mt-2"
                  onClick={() => { setAddItemDialog(day.id); setItemForm({ title: '', type: 'activity', start_time: '', end_time: '', description: '', cost: '' }) }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Activity
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={!!addItemDialog} onOpenChange={() => setAddItemDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Sunset Cruise, Pizza Da Michele" value={itemForm.title} onChange={e => setField('title', e.target.value)} />
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
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Notes, address, reservation number…" value={itemForm.description} onChange={e => setField('description', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cost ({trip.currency})</Label>
              <Input type="number" placeholder="0" value={itemForm.cost} onChange={e => setField('cost', e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddItemDialog(null)} className="flex-1">Cancel</Button>
              <Button onClick={() => addItemDialog && addItem(addItemDialog)} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
