'use client'

import { useState } from 'react'
import { Trip, BudgetItem, BudgetCategory, BUDGET_CATEGORY_COLORS, BUDGET_CATEGORY_ICONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const CATEGORIES: BudgetCategory[] = ['flights', 'hotels', 'food', 'activities', 'transport', 'shopping', 'other']

interface BudgetContentProps {
  trip: Trip
  initialItems: BudgetItem[]
}

export function BudgetContent({ trip, initialItems }: BudgetContentProps) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '',
    category: 'other' as BudgetCategory,
    planned_amount: '',
    actual_amount: '',
    date: '',
    paid: false,
  })
  const set = (k: string, v: string | boolean | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  const currency = trip.currency

  const totalPlanned = items.reduce((s, i) => s + i.planned_amount, 0)
  const totalSpent = items.reduce((s, i) => s + i.actual_amount, 0)
  const tripBudget = trip.budget || totalPlanned
  const remaining = tripBudget - totalSpent
  const overallPct = tripBudget > 0 ? Math.min(100, Math.round((totalSpent / tripBudget) * 100)) : 0

  // By category
  const byCategory = CATEGORIES.map(cat => {
    const catItems = items.filter(i => i.category === cat)
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      planned: catItems.reduce((s, i) => s + i.planned_amount, 0),
      actual: catItems.reduce((s, i) => s + i.actual_amount, 0),
      color: BUDGET_CATEGORY_COLORS[cat],
      icon: BUDGET_CATEGORY_ICONS[cat],
    }
  }).filter(c => c.planned > 0 || c.actual > 0)

  const pieData = byCategory.filter(c => c.actual > 0).map(c => ({ name: c.name, value: c.actual, color: c.color }))
  const totalByCategory = byCategory.filter(c => c.planned > 0).map(c => ({ name: c.name, value: c.planned, color: c.color }))

  async function addItem() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('budget_items').insert({
        trip_id: trip.id,
        title: form.title,
        category: form.category,
        planned_amount: parseFloat(form.planned_amount) || 0,
        actual_amount: parseFloat(form.actual_amount) || 0,
        currency,
        date: form.date || null,
        paid: form.paid,
      }).select().single()
      if (error) throw error
      setItems(prev => [...prev, data])
      setForm({ title: '', category: 'other', planned_amount: '', actual_amount: '', date: '', paid: false })
      setAddOpen(false)
      toast.success('Budget item added!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    await supabase.from('budget_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Removed')
  }

  async function togglePaid(id: string, paid: boolean) {
    await supabase.from('budget_items').update({ paid }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, paid } : i))
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Budget Tracker</h2>
          <p className="text-sm text-muted-foreground">{items.length} expense{items.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(tripBudget, currency)}</p>
            <Progress value={overallPct} className={`h-2 mt-3 ${overallPct > 90 ? '[&>div]:bg-red-500' : overallPct > 70 ? '[&>div]:bg-amber-500' : ''}`} />
            <p className="text-xs text-muted-foreground mt-1">{overallPct}% used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Spent So Far</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSpent, currency)}</p>
            <p className="text-xs text-muted-foreground mt-3">of {formatCurrency(totalPlanned, currency)} planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={`h-4 w-4 ${remaining >= 0 ? 'text-violet-500' : 'text-red-500'}`} />
              <span className="text-sm text-muted-foreground">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${remaining >= 0 ? '' : 'text-red-500'}`}>
              {formatCurrency(Math.abs(remaining), currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              {remaining >= 0 ? 'left to spend' : 'OVER budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {items.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planned vs Actual by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byCategory} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} />
                  <Legend />
                  <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[3,3,0,0]} />
                  <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {byCategory.map(cat => {
            const pct = cat.planned > 0 ? Math.min(100, Math.round((cat.actual / cat.planned) * 100)) : 0
            return (
              <Card key={cat.name} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium text-sm capitalize">{cat.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5 mb-2" style={{ ['--tw-color' as string]: cat.color }} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent: <strong>{formatCurrency(cat.actual, currency)}</strong></span>
                    <span>Plan: {formatCurrency(cat.planned, currency)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Items table */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 group transition-colors">
                  <span className="text-lg flex-shrink-0">{BUDGET_CATEGORY_ICONS[item.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${item.paid ? 'line-through text-muted-foreground' : ''}`}>{item.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                      {item.paid && <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">paid</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Plan: {formatCurrency(item.planned_amount, currency)}
                      {item.actual_amount > 0 && ` · Actual: ${formatCurrency(item.actual_amount, currency)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={item.paid}
                      onCheckedChange={v => togglePaid(item.id, v)}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No expenses yet</p>
            <p className="text-muted-foreground mt-1">Add flights, hotels, restaurants to track your budget</p>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Ryanair flight, Hotel Miramare" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category as string} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{BUDGET_CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Planned ({currency})</Label>
                <Input type="number" placeholder="0" value={form.planned_amount} onChange={e => set('planned_amount', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Actual ({currency})</Label>
                <Input type="number" placeholder="0" value={form.actual_amount} onChange={e => set('actual_amount', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.paid} onCheckedChange={v => set('paid', v)} id="paid-switch" />
              <Label htmlFor="paid-switch">Mark as paid</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={addItem} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
