'use client'

import { useState } from 'react'
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
import type { ChecklistItem, ChecklistCategory } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DragHint } from '@/components/shared/drag-hint'
import { toast } from 'sonner'
import { Plus, CheckSquare, FileText, Package, Trash2, Loader2, GripVertical, MoreVertical, Circle } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<ChecklistCategory, React.ElementType> = {
  documents: FileText,
  packing:   Package,
  custom:    CheckSquare,
}

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  documents: 'Documents',
  packing:   'Packing',
  custom:    'Custom',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function byOrderIndex(items: ChecklistItem[]): ChecklistItem[] {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

// ── Item visual (shared by sortable row and overlay) ───────────────────────────

function ItemDisplay({
  item,
  onToggle,
  onDelete,
  isDragging = false,
}: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}) {
  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-lg transition-colors',
      !isDragging && 'hover:bg-muted/40 group',
      item.completed && 'opacity-60',
    )}>
      {/* Check button */}
      <button
        onClick={() => onToggle(item.id, !item.completed)}
        className="mt-0.5 flex-shrink-0"
      >
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          item.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-muted-foreground/40 hover:border-primary',
        )}>
          {item.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-medium text-sm', item.completed && 'line-through text-muted-foreground')}>
            {item.title}
          </span>
          {item.due_date && (
            <span className="text-xs text-muted-foreground">due {formatDate(item.due_date, 'MMM d')}</span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
        )}
      </div>

      {/* Desktop: Delete (hover-revealed) */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Mobile: three-dot overflow menu */}
      <div className="flex md:hidden flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => onToggle(item.id, !item.completed)}>
              {item.completed
                ? <Circle className="h-4 w-4" />
                : <CheckSquare className="h-4 w-4" />
              }
              {item.completed ? 'Mark incomplete' : 'Mark complete'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Overlay card (rendered inside DragOverlay — no interaction handlers) ───────

function OverlayItem({ item }: { item: ChecklistItem }) {
  return (
    <div
      style={{ transform: 'scale(1.02)', transformOrigin: 'center' }}
      className="flex items-start gap-2 p-3 rounded-lg bg-background border border-border shadow-lg"
    >
      <div className="mt-0.5 flex-shrink-0">
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center',
          item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/40',
        )}>
          {item.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn('font-medium text-sm', item.completed && 'line-through text-muted-foreground')}>
          {item.title}
        </span>
        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
    </div>
  )
}

// ── Sortable row ───────────────────────────────────────────────────────────────

function SortableRow({
  item,
  onToggle,
  onDelete,
  isLast,
}: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

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
        'flex items-start gap-1 group/row',
        !isLast && 'border-b border-border',
        isDragging && 'opacity-40',
      )}
    >
      {/* Drag handle — only this triggers drag */}
      <button
        {...listeners}
        className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none min-h-[44px] w-9 text-muted-foreground/50 hover:text-muted-foreground/80 active:text-muted-foreground opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <ItemDisplay item={item} onToggle={onToggle} onDelete={onDelete} isDragging={isDragging} />
      </div>
    </div>
  )
}

// ── Per-category DnD list ──────────────────────────────────────────────────────

function CategoryDndList({
  items,
  onToggle,
  onDelete,
  onReorder,
}: {
  items: ChecklistItem[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onReorder: (reordered: ChecklistItem[]) => void
}) {
  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    const found = items.find(i => i.id === event.active.id)
    setActiveItem(found ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sorted = byOrderIndex(items)
    const oldIdx = sorted.findIndex(i => i.id === active.id)
    const newIdx = sorted.findIndex(i => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(sorted, oldIdx, newIdx)
    onReorder(reordered)
  }

  const sorted = byOrderIndex(items)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {sorted.map((item, idx) => (
          <SortableRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
            isLast={idx === sorted.length - 1}
          />
        ))}
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
        {activeItem ? <OverlayItem item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ChecklistContentProps {
  tripId: string
  initialItems: ChecklistItem[]
}

export function ChecklistContent({ tripId, initialItems }: ChecklistContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const supabase = createClient()

  const [form, setForm] = useState({
    title:    '',
    category: 'custom' as ChecklistCategory,
    due_date: '',
    notes:    '',
  })
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  const total = items.length
  const done  = items.filter(i => i.completed).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  async function toggleItem(id: string, completed: boolean) {
    await supabase.from('checklist_items').update({ completed }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed } : i))
  }

  async function deleteItem(id: string) {
    await supabase.from('checklist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Item removed')
  }

  async function addItem() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('checklist_items').insert({
        trip_id:     tripId,
        title:       form.title,
        category:    form.category,
        due_date:    form.due_date || null,
        notes:       form.notes || null,
        order_index: items.filter(i => i.category === form.category).length,
      }).select().single()
      if (error) throw error
      setItems(prev => [...prev, data])
      setForm({ title: '', category: 'custom', due_date: '', notes: '' })
      setAddOpen(false)
      toast.success('Item added!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  function handleReorder(category: ChecklistCategory, reordered: ChecklistItem[]) {
    // Update order_index on the reordered slice, keep other categories intact
    const updated = reordered.map((item, idx) => ({ ...item, order_index: idx }))
    setItems(prev => [
      ...prev.filter(i => i.category !== category),
      ...updated,
    ])
    // Fire-and-forget persist
    updated.forEach(item => {
      supabase
        .from('checklist_items')
        .update({ order_index: item.order_index })
        .eq('id', item.id)
        .then(({ error }) => { if (error) console.error('Order persist failed:', error) })
    })
  }

  const categories: ChecklistCategory[] = ['documents', 'packing', 'custom']

  return (
    <div className="px-5 py-4 max-w-3xl mx-auto">

      {/* Section header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">Checklist</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Prepare everything before departure · {done}/{total} done</p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Progress bar */}
      <Card className="mb-4">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{done} done</span>
                <span>{total - done} remaining</span>
              </div>
            </div>
            <span className={cn('text-2xl font-bold tabular-nums', pct === 100 ? 'text-emerald-500' : 'text-foreground')}>
              {pct}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList className="w-full mb-4">
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat]
            const catItems = items.filter(i => i.category === cat)
            const catDone  = catItems.filter(i => i.completed).length
            return (
              <TabsTrigger key={cat} value={cat} className="flex-1 gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {CATEGORY_LABELS[cat]}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {catDone}/{catItems.length}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat)
          const catDone  = catItems.filter(i => i.completed).length
          const catPct   = catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0
          const Icon     = CATEGORY_ICONS[cat]

          return (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {CATEGORY_LABELS[cat]}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress value={catPct} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">{catPct}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {catItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No {CATEGORY_LABELS[cat].toLowerCase()} items yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1"
                        onClick={() => { setForm(f => ({ ...f, category: cat })); setAddOpen(true) }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add one
                      </Button>
                    </div>
                  ) : (
                    <>
                      <DragHint />
                      <CategoryDndList
                        items={catItems}
                        onToggle={toggleItem}
                        onDelete={setPendingDeleteId}
                        onReorder={reordered => handleReorder(cat, reordered)}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Task *</Label>
              <Input
                placeholder="e.g. Passport, Camera, Travel Insurance"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="documents">📄 Documents</SelectItem>
                  <SelectItem value="packing">🧳 Packing</SelectItem>
                  <SelectItem value="custom">✅ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Details, reminders…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={addItem} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={open => { if (!open) setPendingDeleteId(null) }}
        title="Delete Item"
        description="This will permanently remove this item from your checklist."
        onConfirm={() => { if (pendingDeleteId) deleteItem(pendingDeleteId) }}
        confirmLabel="Delete"
      />
    </div>
  )
}
