'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Plane, CheckSquare, Clock, Plus, X } from 'lucide-react'
import Link from 'next/link'
import {
  format, addMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, parseISO,
} from 'date-fns'

// ─── Color palette ─────────────────────────────────────────────────────────────

const PALETTE = [
  { bar: '#7c3aed', light: 'rgba(124,58,237,0.12)' },  // violet
  { bar: '#2563eb', light: 'rgba(37,99,235,0.12)' },   // blue
  { bar: '#059669', light: 'rgba(5,150,105,0.12)' },   // emerald
  { bar: '#d97706', light: 'rgba(217,119,6,0.12)' },   // amber
  { bar: '#db2777', light: 'rgba(219,39,119,0.12)' },  // pink
  { bar: '#0891b2', light: 'rgba(8,145,178,0.12)' },   // cyan
  { bar: '#ea580c', light: 'rgba(234,88,12,0.12)' },   // orange
  { bar: '#4f46e5', light: 'rgba(79,70,229,0.12)' },   // indigo
  { bar: '#16a34a', light: 'rgba(22,163,74,0.12)' },   // green
]

type TripColor = typeof PALETTE[number]

// ─── View config ───────────────────────────────────────────────────────────────

const VIEW_CONFIG = {
  month:    { count: 1,  nav: 1,  label: 'Month'    },
  '3months': { count: 3,  nav: 3,  label: '3 Months' },
  '6months': { count: 6,  nav: 6,  label: '6 Months' },
  year:     { count: 12, nav: 12, label: 'Year'     },
} as const
type CalView = keyof typeof VIEW_CONFIG

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarContentProps {
  trips: Trip[]
  checklistItems: { id: string; title: string; due_date: string; trip_id: string; completed: boolean }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildColorMap(trips: Trip[]): Map<string, TripColor> {
  const sorted = [...trips].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
  const map = new Map<string, TripColor>()
  sorted.forEach((t, i) => map.set(t.id, PALETTE[i % PALETTE.length]))
  return map
}

function isTripOnDay(trip: Trip, dateStr: string): boolean {
  if (!trip.start_date) return false
  const end = trip.end_date ?? trip.start_date
  return dateStr >= trip.start_date && dateStr <= end
}

function getFlag(code?: string): string {
  if (!code) return ''
  try {
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
  } catch { return '' }
}

function getMonthsToShow(anchor: Date, view: CalView): { year: number; month: number }[] {
  return Array.from({ length: VIEW_CONFIG[view].count }, (_, i) => {
    const d = addMonths(anchor, i)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
}

// ─── TripBar ──────────────────────────────────────────────────────────────────

function TripBar({
  trip, dateStr, dow, color, onNavigate,
}: {
  trip: Trip
  dateStr: string
  dow: number
  color: TripColor
  onNavigate: () => void
}) {
  const isStart = trip.start_date === dateStr
  const isEnd = (trip.end_date ?? trip.start_date) === dateStr
  const isWeekStart = dow === 0
  const isWeekEnd = dow === 6

  const roundL = isStart || isWeekStart
  const roundR = isEnd || isWeekEnd
  const showLabel = isStart || isWeekStart

  return (
    <div
      onClick={e => { e.stopPropagation(); onNavigate() }}
      title={trip.name}
      className={cn(
        'h-[18px] flex items-center overflow-hidden cursor-pointer transition-opacity hover:opacity-75 mt-[1px] select-none',
        roundL && roundR  ? 'rounded-full mx-1'   :
        roundL            ? 'rounded-l-full ml-1' :
        roundR            ? 'rounded-r-full mr-1' :
                            '',
      )}
      style={{ backgroundColor: color.bar }}
    >
      {showLabel && (
        <span className="text-white text-[10px] font-semibold leading-none pl-2 pr-1 truncate">
          {isStart ? '✈ ' : ''}{trip.name}
        </span>
      )}
    </div>
  )
}

// ─── MonthCalendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year, month, trips, colorMap, selectedDay, onSelectDay, compact = false,
}: {
  year: number
  month: number
  trips: Trip[]
  colorMap: Map<string, TripColor>
  selectedDay: string | null
  onSelectDay: (d: string) => void
  compact?: boolean
}) {
  const router = useRouter()
  const monthStart = new Date(year, month, 1)
  const days = eachDayOfInterval({ start: startOfMonth(monthStart), end: endOfMonth(monthStart) })
  const startDow = getDay(monthStart)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
    [trips],
  )

  const DOW_LABELS = compact
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <h3 className={cn('font-bold text-foreground mb-2', compact ? 'text-xs' : 'text-base md:text-lg')}>
        {format(monthStart, compact ? 'MMM yyyy' : 'MMMM yyyy')}
      </h3>

      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'text-center text-muted-foreground font-medium',
              compact ? 'text-[9px] py-0.5' : 'text-[11px] py-1',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[1px] bg-border/20 rounded-xl overflow-hidden border border-border/20">
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`e${i}`} className="bg-card" style={{ minHeight: compact ? 34 : 72 }} />
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dow = getDay(day)
          const isT = dateStr === todayStr
          const isSel = dateStr === selectedDay
          const dayTrips = sortedTrips.filter(t => isTripOnDay(t, dateStr))

          return (
            <div
              key={dateStr}
              onClick={() => !compact && onSelectDay(isSel ? '' : dateStr)}
              className={cn(
                'bg-card relative transition-colors',
                !compact && 'cursor-pointer hover:bg-muted/30',
                isT && 'bg-primary/5',
                isSel && !isT && 'bg-accent/40',
              )}
              style={{ minHeight: compact ? 34 : 72 }}
            >
              <div className={cn('flex items-center', compact ? 'justify-center pt-1' : 'pt-1.5 px-1.5')}>
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full font-medium transition-colors',
                    compact ? 'text-[10px] h-[18px] w-[18px]' : 'text-xs h-[22px] w-[22px]',
                    isT && 'bg-primary text-primary-foreground font-bold',
                    !isT && isSel && 'bg-foreground/90 text-background',
                    !isT && !isSel && 'text-foreground/80',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Trip bars — full view */}
              {!compact && (
                <div className="overflow-hidden pb-0.5">
                  {dayTrips.slice(0, 3).map(trip => {
                    const color = colorMap.get(trip.id) ?? PALETTE[0]
                    return (
                      <TripBar
                        key={trip.id}
                        trip={trip}
                        dateStr={dateStr}
                        dow={dow}
                        color={color}
                        onNavigate={() => router.push(`/trips/${trip.id}`)}
                      />
                    )
                  })}
                  {dayTrips.length > 3 && (
                    <span className="text-[9px] text-muted-foreground pl-2">
                      +{dayTrips.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Dots — compact/year view */}
              {compact && dayTrips.length > 0 && (
                <div className="flex justify-center gap-[2px] pb-1">
                  {dayTrips.slice(0, 3).map(t => {
                    const color = colorMap.get(t.id) ?? PALETTE[0]
                    return (
                      <div
                        key={t.id}
                        className="h-[5px] w-[5px] rounded-full"
                        style={{ backgroundColor: color.bar }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AgendaView (mobile) ──────────────────────────────────────────────────────

function AgendaView({
  months, trips, colorMap,
}: {
  months: { year: number; month: number }[]
  trips: Trip[]
  colorMap: Map<string, TripColor>
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      {months.map(({ year, month }) => {
        const monthStart = new Date(year, month, 1)
        const monthStr = format(monthStart, 'yyyy-MM')

        const monthTrips = trips.filter(t => {
          if (!t.start_date) return false
          const start = t.start_date.slice(0, 7)
          const end = (t.end_date ?? t.start_date).slice(0, 7)
          return monthStr >= start && monthStr <= end
        })

        return (
          <div key={`${year}-${month}`}>
            <h3 className="font-bold text-sm mb-2 text-foreground">
              {format(monthStart, 'MMMM yyyy')}
            </h3>

            {monthTrips.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3 px-3 rounded-xl border border-dashed border-border/50 text-center">
                No trips this month
              </div>
            ) : (
              <div className="space-y-2">
                {monthTrips.map(trip => {
                  const color = colorMap.get(trip.id) ?? PALETTE[0]
                  const days = daysUntil(trip.start_date)
                  const isActive = !!(
                    trip.start_date && trip.end_date &&
                    todayStr >= trip.start_date && todayStr <= trip.end_date
                  )
                  const flag = getFlag(trip.country_code)

                  return (
                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors min-h-[56px]">
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0"
                          style={{ backgroundColor: color.bar }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {flag && <span className="text-base leading-none">{flag}</span>}
                            <p className="font-semibold text-sm truncate">{trip.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(trip.start_date, 'MMM d')}
                            {trip.end_date && trip.end_date !== trip.start_date
                              ? ` – ${formatDate(trip.end_date, 'MMM d, yyyy')}`
                              : ''}
                          </p>
                        </div>
                        {isActive ? (
                          <Badge className="text-[10px] px-2 flex-shrink-0 bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                            Active
                          </Badge>
                        ) : days !== null && days >= 0 ? (
                          <Badge variant="outline" className="text-[10px] px-2 flex-shrink-0">
                            {days === 0 ? 'Today' : `${days}d`}
                          </Badge>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  trips, colorMap, checklistItems, selectedDay, onClearDay,
}: {
  trips: Trip[]
  colorMap: Map<string, TripColor>
  checklistItems: CalendarContentProps['checklistItems']
  selectedDay: string | null
  onClearDay: () => void
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const upcoming = useMemo(
    () =>
      [...trips]
        .filter(t => t.start_date && (t.end_date ?? t.start_date) >= todayStr)
        .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
    [trips, todayStr],
  )

  const featuredTrip = upcoming[0]

  const selectedDayTrips = selectedDay
    ? trips.filter(t => isTripOnDay(t, selectedDay))
    : []

  return (
    <div className="space-y-4">

      {/* Selected day */}
      {selectedDay && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Selected Day
                </p>
                <p className="font-bold text-sm mt-0.5">
                  {format(parseISO(selectedDay), 'EEEE, MMM d')}
                </p>
              </div>
              <button
                onClick={onClearDay}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {selectedDayTrips.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trips on this day.</p>
            ) : (
              <div className="space-y-1 mt-2">
                {selectedDayTrips.map(trip => {
                  const color = colorMap.get(trip.id) ?? PALETTE[0]
                  return (
                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color.bar }}
                        />
                        <span className="text-xs font-medium flex-1 truncate">{trip.name}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Featured trip card */}
      {featuredTrip && (() => {
        const color = colorMap.get(featuredTrip.id) ?? PALETTE[0]
        const flag = getFlag(featuredTrip.country_code)
        const days = daysUntil(featuredTrip.start_date)
        const isActive = !!(
          featuredTrip.start_date && featuredTrip.end_date &&
          todayStr >= featuredTrip.start_date && todayStr <= featuredTrip.end_date
        )

        return (
          <Link href={`/trips/${featuredTrip.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-1" style={{ backgroundColor: color.bar }} />
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {isActive ? 'Active Trip' : 'Next Trip'}
                </p>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: color.light }}
                  >
                    {flag || <Plane className="h-5 w-5" style={{ color: color.bar }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight line-clamp-1">
                      {featuredTrip.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{featuredTrip.country}</p>
                  </div>
                </div>

                {featuredTrip.start_date && (
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        {isActive ? 'Started' : 'Departing'}
                      </p>
                      <p className="text-xs font-semibold">
                        {formatDate(featuredTrip.start_date, 'EEE, MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-3xl font-black leading-none"
                        style={{ color: color.bar }}
                      >
                        {isActive || days === 0 ? '🛫' : days}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {isActive ? 'Bon voyage!' : days === 0 ? 'Today!' : 'days away'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })()}

      {/* Upcoming list */}
      <Card>
        <CardContent className="pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Upcoming Trips
          </p>

          {upcoming.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No upcoming trips</p>
              <Link href="/trips">
                <Button size="sm" variant="outline" className="mt-2 text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Plan a trip
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {upcoming.slice(0, 7).map(trip => {
                const color = colorMap.get(trip.id) ?? PALETTE[0]
                const flag = getFlag(trip.country_code)
                const days = daysUntil(trip.start_date)
                const isActive = !!(
                  trip.start_date && trip.end_date &&
                  todayStr >= trip.start_date && todayStr <= trip.end_date
                )

                return (
                  <Link key={trip.id} href={`/trips/${trip.id}`}>
                    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px]">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.bar }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {flag && <span className="text-sm leading-none">{flag}</span>}
                          <p className="text-xs font-medium truncate">{trip.name}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(trip.start_date, 'MMM d')}
                          {trip.end_date && trip.end_date !== trip.start_date
                            ? ` – ${formatDate(trip.end_date, 'MMM d')}`
                            : ''}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="text-[9px] font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                          Active
                        </span>
                      ) : days !== null && days >= 0 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                        >
                          {days === 0 ? 'Today' : `${days}d`}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deadlines */}
      {checklistItems.filter(c => c.due_date).length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" /> Upcoming Deadlines
            </p>
            <div className="space-y-2">
              {checklistItems
                .filter(c => c.due_date)
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 5)
                .map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-xs py-0.5">
                    <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {formatDate(c.due_date, 'MMM d')}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-primary" />
          Today
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-foreground/80" />
          Selected
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-10 h-2.5 rounded-full bg-violet-500/80" />
          Trip
        </div>
      </div>
    </div>
  )
}

// ─── CalendarContent ──────────────────────────────────────────────────────────

export function CalendarContent({ trips, checklistItems }: CalendarContentProps) {
  const [view, setView] = useState<CalView>('3months')
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const colorMap = useMemo(() => buildColorMap(trips), [trips])
  const months = useMemo(() => getMonthsToShow(anchor, view), [anchor, view])

  function navigate(dir: -1 | 1) {
    setAnchor(prev => addMonths(prev, dir * VIEW_CONFIG[view].nav))
  }

  function goToday() {
    setAnchor(startOfMonth(new Date()))
  }

  function switchView(v: CalView) {
    setView(v)
    if (v === 'year') {
      setAnchor(new Date(anchor.getFullYear(), 0, 1))
    }
  }

  function handleSelectDay(d: string) {
    setSelectedDay(prev => (prev === d ? null : d))
  }

  const hasTrips = trips.length > 0

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Travel Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your trips and milestones at a glance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {(Object.keys(VIEW_CONFIG) as CalView[]).map(v => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted/50',
                )}
              >
                {VIEW_CONFIG[v].label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={goToday}>
              Today
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasTrips && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">No trips yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Plan your first adventure and it will appear here.
          </p>
          <Link href="/trips">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Plan Your First Trip
            </Button>
          </Link>
        </div>
      )}

      {/* Main layout */}
      {hasTrips && (
        <div
          className={cn(
            'grid gap-6',
            view === 'year'
              ? 'grid-cols-1'
              : 'grid-cols-1 lg:grid-cols-[1fr_280px]',
          )}
        >
          {/* Calendar area */}
          <div>
            {/* Year view: compact 4-col grid */}
            {view === 'year' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {months.map(({ year: y, month: m }) => (
                  <MonthCalendar
                    key={`${y}-${m}`}
                    year={y} month={m}
                    trips={trips} colorMap={colorMap}
                    selectedDay={selectedDay}
                    onSelectDay={handleSelectDay}
                    compact
                  />
                ))}
              </div>
            )}

            {/* Month / 3M / 6M: desktop grid + mobile agenda */}
            {view !== 'year' && (
              <>
                {/* Desktop */}
                <div
                  className={cn(
                    'hidden md:grid gap-6',
                    view === '6months' ? 'md:grid-cols-2' : 'md:grid-cols-1',
                  )}
                >
                  {months.map(({ year: y, month: m }) => (
                    <MonthCalendar
                      key={`${y}-${m}`}
                      year={y} month={m}
                      trips={trips} colorMap={colorMap}
                      selectedDay={selectedDay}
                      onSelectDay={handleSelectDay}
                    />
                  ))}
                </div>

                {/* Mobile */}
                <div className="block md:hidden">
                  <AgendaView months={months} trips={trips} colorMap={colorMap} />
                </div>
              </>
            )}
          </div>

          {/* Sidebar — desktop sticky right column */}
          {view !== 'year' && (
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <Sidebar
                  trips={trips}
                  colorMap={colorMap}
                  checklistItems={checklistItems}
                  selectedDay={selectedDay}
                  onClearDay={() => setSelectedDay(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sidebar below on small screens */}
      {hasTrips && view !== 'year' && (
        <div className="block lg:hidden">
          <Sidebar
            trips={trips}
            colorMap={colorMap}
            checklistItems={checklistItems}
            selectedDay={selectedDay}
            onClearDay={() => setSelectedDay(null)}
          />
        </div>
      )}
    </div>
  )
}
