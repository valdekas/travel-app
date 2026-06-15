'use client'

import { useState } from 'react'
import type { ChecklistItem, ChecklistCategory, Priority } from '@/lib/types'
import { getPriorityColor, formatDate } from '@/lib/utils'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, CheckSquare, FileText, Package, Wand2, Trash2, Loader2 } from 'lucide-react'

const CATEGORY_ICONS: Record<ChecklistCategory, React.ElementType> = {
  documents: FileText,
  packing: Package,
  custom: CheckSquare,
}

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  documents: 'Documents',
  packing: 'Packing',
  custom: 'Custom',
}

interface ChecklistContentProps {
  tripId: string
  initialItems: ChecklistItem[]
}

function ChecklistItem({ item, onToggle, onDelete }: {
  item: ChecklistItem
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 group transition-colors ${item.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onToggle(item.id, !item.completed)}
        className="mt-0.5 flex-shrink-0"
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/40 hover:border-primary'
        }`}>
          {item.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
          {item.due_date && (
            <span className="text-xs text-muted-foreground">due {formatDate(item.due_date, 'MMM d')}</span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function ChecklistContent({ tripId, initialItems }: ChecklistContentProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '',
    category: 'custom' as ChecklistCategory,
    priority: 'medium' as Priority,
    due_date: '',
    notes: '',
  })
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  const total = items.length
  const done = items.filter(i => i.completed).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

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
        trip_id: tripId,
        title: form.title,
        category: form.category,
        priority: form.priority,
        due_date: form.due_date || null,
        notes: form.notes || null,
        order_index: items.length,
      }).select().single()
      if (error) throw error
      setItems(prev => [...prev, data])
      setForm({ title: '', category: 'custom', priority: 'medium', due_date: '', notes: '' })
      setAddOpen(false)
      toast.success('Item added!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const categories: ChecklistCategory[] = ['documents', 'packing', 'custom']

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Pre-Trip Checklist</h2>
          <p className="text-sm text-muted-foreground">{done} of {total} completed</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Progress bar */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className={`text-2xl font-bold ${pct === 100 ? 'text-emerald-500' : 'text-foreground'}`}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{done} done</span>
            <span>{total - done} remaining</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList className="w-full mb-4">
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat]
            const catItems = items.filter(i => i.category === cat)
            const catDone = catItems.filter(i => i.completed).length
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
          const catDone = catItems.filter(i => i.completed).length
          const catPct = catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0
          const Icon = CATEGORY_ICONS[cat]

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
                    <div className="divide-y divide-border">
                      {catItems.map(item => (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          onToggle={toggleItem}
                          onDelete={deleteItem}
                        />
                      ))}
                    </div>
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
            <div className="grid grid-cols-2 gap-3">
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
    </div>
  )
}
