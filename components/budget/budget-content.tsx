'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Trip, BudgetItem, BudgetCategory, BUDGET_CATEGORY_COLORS, BUDGET_CATEGORY_ICONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
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
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Plus, Trash2, Loader2, DollarSign, Wallet,
  TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Pencil, CalendarDays, MoreVertical,
} from 'lucide-react'
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES: BudgetCategory[] = ['flights', 'hotels', 'food', 'activities', 'transport', 'shopping', 'other']

// ── Helpers ────────────────────────────────────────────────────────────────────

function ColorProgress({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={cn('h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── Custom chart tooltip ────────────────────────────────────────────────────────

interface ChartPayloadEntry { name: string; value: number; color?: string; fill?: string }
function ChartTooltip({ active, payload, label, currency, isDark }: {
  active?: boolean
  payload?: ChartPayloadEntry[]
  label?: string
  currency: string
  isDark: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl border shadow-lg px-3 py-2.5 text-sm min-w-[140px]"
      style={{
        background: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      {label && <p className="font-semibold text-foreground mb-1.5 text-xs uppercase tracking-wide">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color ?? p.fill }} />
            <span className="text-xs text-muted-foreground">{p.name}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">{formatCurrency(Number(p.value), currency)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Paid badge (clickable toggle) ──────────────────────────────────────────────

function PaidBadge({ paid, onClick }: { paid: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={paid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer border',
        paid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20',
      )}
    >
      {paid
        ? <CheckCircle2 className="h-3 w-3" />
        : <Clock className="h-3 w-3" />
      }
      {paid ? 'Paid' : 'Pending'}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface BudgetContentProps {
  trip: Trip
  initialItems: BudgetItem[]
}

interface FormState {
  title: string
  category: BudgetCategory
  planned_amount: string
  actual_amount: string
  date: string
  notes: string
  paid: boolean
}

const EMPTY_FORM: FormState = {
  title: '', category: 'other', planned_amount: '', actual_amount: '',
  date: '', notes: '', paid: false,
}

export function BudgetContent({ trip, initialItems }: BudgetContentProps) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const supabase = createClient()

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const set = (k: keyof FormState, v: string | boolean | null) =>
    setForm(f => ({ ...f, [k]: v ?? '' }))

  const currency = trip.currency

  // ── Calculations ─────────────────────────────────────────────────────────────

  const totalPlanned = items.reduce((s, i) => s + i.planned_amount, 0)
  const totalSpent   = items.reduce((s, i) => s + i.actual_amount, 0)
  const tripBudget   = trip.budget || totalPlanned
  const remaining    = tripBudget - totalSpent
  const isOverBudget = remaining < 0
  const overallPct   = tripBudget > 0 ? Math.min(100, Math.round((totalSpent / tripBudget) * 100)) : 0

  const byCategory = CATEGORIES.map(cat => {
    const catItems = items.filter(i => i.category === cat)
    const planned  = catItems.reduce((s, i) => s + i.planned_amount, 0)
    const actual   = catItems.reduce((s, i) => s + i.actual_amount, 0)
    return { cat, planned, actual, color: BUDGET_CATEGORY_COLORS[cat], icon: BUDGET_CATEGORY_ICONS[cat],
      label: cat.charAt(0).toUpperCase() + cat.slice(1) }
  }).filter(c => c.planned > 0 || c.actual > 0)

  const barData  = byCategory.map(c => ({ name: c.label, Planned: c.planned, Actual: c.actual }))
  const pieData  = byCategory.filter(c => c.actual > 0).map(c => ({ name: c.label, value: c.actual, color: c.color }))

  const chartTickColor  = isDark ? '#64748b' : '#94a3b8'
  const chartGridColor  = isDark ? '#1e293b' : '#f1f5f9'

  // ── Actions ───────────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(item: BudgetItem) {
    setEditingId(item.id)
    setForm({
      title:          item.title,
      category:       item.category,
      planned_amount: item.planned_amount.toString(),
      actual_amount:  item.actual_amount.toString(),
      date:           item.date ?? '',
      notes:          item.notes ?? '',
      paid:           item.paid,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      const payload = {
        title:          form.title.trim(),
        category:       form.category,
        planned_amount: parseFloat(form.planned_amount) || 0,
        actual_amount:  parseFloat(form.actual_amount) || 0,
        currency,
        date:           form.date || null,
        notes:          form.notes || null,
        paid:           form.paid,
      }
      if (editingId) {
        const { data, error } = await supabase.from('budget_items').update(payload).eq('id', editingId).select().single()
        if (error) throw error
        setItems(prev => prev.map(i => i.id === editingId ? data : i))
        toast.success('Expense updated')
      } else {
        const { data, error } = await supabase.from('budget_items').insert({ trip_id: trip.id, ...payload }).select().single()
        if (error) throw error
        setItems(prev => [...prev, data])
        toast.success('Expense added!')
      }
      setDialogOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 md:px-5 py-4 space-y-5 max-w-5xl mx-auto">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">Budget</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track travel expenses · {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid sm:grid-cols-3 gap-3">

        {/* Total Budget */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-l-xl" />
          <CardContent className="pl-5 pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-500/15">
                <Wallet className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(tripBudget, currency)}</p>
            <div className="mt-3 space-y-1.5">
              <ColorProgress
                value={overallPct}
                color={overallPct >= 100 ? '#ef4444' : overallPct >= 80 ? '#f59e0b' : '#6366f1'}
              />
              <p className="text-xs text-muted-foreground">{overallPct}% of budget used</p>
            </div>
          </CardContent>
        </Card>

        {/* Spent So Far */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
          <CardContent className="pl-5 pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Spent So Far</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSpent, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              of <span className="font-medium text-foreground">{formatCurrency(totalPlanned, currency)}</span> planned
            </p>
          </CardContent>
        </Card>

        {/* Remaining */}
        <Card className={cn('relative overflow-hidden', isOverBudget && 'ring-2 ring-red-400/60 dark:ring-red-600/40')}>
          <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', isOverBudget ? 'bg-red-500' : 'bg-violet-500')} />
          <CardContent className="pl-5 pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className={cn('p-1.5 rounded-md', isOverBudget ? 'bg-red-100 dark:bg-red-500/15' : 'bg-violet-100 dark:bg-violet-500/15')}>
                {isOverBudget
                  ? <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                }
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {isOverBudget ? 'Over Budget' : 'Remaining'}
              </span>
            </div>
            <p className={cn('text-2xl font-bold', isOverBudget ? 'text-red-500 dark:text-red-400' : 'text-foreground')}>
              {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining), currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              {isOverBudget
                ? <span className="text-red-500 font-medium">⚠ Exceeds budget</span>
                : 'left to spend'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ── */}
      {items.length > 0 && barData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Planned vs Actual</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: chartTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: chartTickColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    content={<ChartTooltip currency={currency} isDark={isDark} />}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', radius: 6 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => <span style={{ color: chartTickColor }}>{value}</span>}
                  />
                  <Bar dataKey="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Actual"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Donut chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Spending Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={210}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip currency={currency} isDark={isDark} />}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      formatter={(value) => <span style={{ color: chartTickColor }}>{value}</span>}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Category cards ── */}
      {byCategory.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {byCategory.map(({ cat, planned, actual, color, icon, label }) => {
            const over    = actual > planned && planned > 0
            const pct     = planned > 0 ? Math.round((actual / planned) * 100) : (actual > 0 ? 100 : 0)
            const diff    = planned - actual
            const barCol  = over ? '#ef4444' : color
            return (
              <Card
                key={cat}
                className={cn('transition-shadow hover:shadow-md', over && 'ring-1 ring-red-400/40 dark:ring-red-600/30')}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{icon}</span>
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                    <span className={cn('text-xs font-semibold tabular-nums', over ? 'text-red-500' : 'text-muted-foreground')}>
                      {pct}%
                    </span>
                  </div>
                  <ColorProgress value={pct} color={barCol} className="mb-2.5" />
                  <div className="grid grid-cols-2 gap-x-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className={cn('font-semibold mt-0.5', over ? 'text-red-500 dark:text-red-400' : 'text-foreground')}>
                        {formatCurrency(actual, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Planned</p>
                      <p className="font-semibold mt-0.5 text-foreground">{formatCurrency(planned, currency)}</p>
                    </div>
                  </div>
                  {planned > 0 && (
                    <p className={cn('text-[11px] mt-2 font-medium', over ? 'text-red-500' : 'text-muted-foreground')}>
                      {over
                        ? `⚠ ${formatCurrency(Math.abs(diff), currency)} over budget`
                        : `${formatCurrency(Math.abs(diff), currency)} remaining`
                      }
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── All Expenses ── */}
      {items.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">All Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {items.map(item => {
              const isOver = item.actual_amount > item.planned_amount && item.planned_amount > 0
              return (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 border border-border/50 rounded-xl p-3.5 hover:border-border hover:bg-muted/20 transition-all"
                >
                  {/* Category icon */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm mt-0.5"
                    style={{ backgroundColor: BUDGET_CATEGORY_COLORS[item.category] + '22' }}
                  >
                    {BUDGET_CATEGORY_ICONS[item.category]}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn('font-medium text-sm', item.paid && 'text-muted-foreground line-through')}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">{item.category}</Badge>
                          {item.itinerary_item_id && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded-full border border-border/40 bg-muted/30">
                              📅 Itinerary
                            </span>
                          )}
                          <PaidBadge paid={item.paid} onClick={() => togglePaid(item.id, !item.paid)} />
                        </div>
                      </div>
                      {/* Desktop: Edit + Delete (hover-revealed) */}
                      <div className="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(item)}
                          aria-label="Edit expense"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setPendingDeleteId(item.id)}
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Mobile: three-dot overflow menu */}
                      <div className="flex md:hidden flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="min-w-44">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePaid(item.id, !item.paid)}>
                              {item.paid
                                ? <Clock className="h-4 w-4" />
                                : <CheckCircle2 className="h-4 w-4" />
                              }
                              {item.paid ? 'Mark as Pending' : 'Mark as Paid'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setPendingDeleteId(item.id)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Amounts + date row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Planned:&nbsp;
                        <span className="font-medium text-foreground">
                          {formatCurrency(item.planned_amount, currency)}
                        </span>
                      </span>
                      {item.actual_amount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Actual:&nbsp;
                          <span className={cn('font-medium', isOver ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                            {formatCurrency(item.actual_amount, currency)}
                          </span>
                        </span>
                      )}
                      {item.date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(item.date, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">{item.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : (
        /* ── Empty state ── */
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
              <Wallet className="h-7 w-7 text-indigo-400" />
            </div>
            <p className="font-semibold text-lg text-foreground">Start tracking your travel budget</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Add flights, hotels, restaurants and activities to keep your trip on budget.
            </p>
            <Button onClick={openAdd} className="mt-5 gap-2">
              <Plus className="h-4 w-4" /> Add First Expense
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Add / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(EMPTY_FORM) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Ryanair flight, Hotel Miramare"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v as BudgetCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {BUDGET_CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Planned ({currency})</Label>
                <Input type="number" min="0" placeholder="0" value={form.planned_amount} onChange={e => set('planned_amount', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Actual ({currency})</Label>
                <Input type="number" min="0" placeholder="0" value={form.actual_amount} onChange={e => set('actual_amount', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Booking reference, tips…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.paid} onCheckedChange={v => set('paid', v)} id="paid-switch" />
              <Label htmlFor="paid-switch" className="cursor-pointer">Mark as paid</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Save Changes' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={open => { if (!open) setPendingDeleteId(null) }}
        title="Delete Expense"
        description="This will permanently remove this expense from your budget."
        onConfirm={() => { if (pendingDeleteId) deleteItem(pendingDeleteId) }}
        confirmLabel="Delete"
      />
    </div>
  )
}
