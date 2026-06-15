'use client'

import { useMemo } from 'react'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, getTripStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalIcon, Clock, MapPin, CheckSquare, Plane } from 'lucide-react'
import Link from 'next/link'
import { parseISO, format, eachMonthOfInterval, startOfYear, endOfYear, isWithinInterval, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

interface CalendarContentProps {
  trips: Trip[]
  checklistItems: { id: string; title: string; due_date: string; trip_id: string; completed: boolean }[]
}

function MonthGrid({ year, month, trips, checklistItems }: {
  year: number
  month: number
  trips: Trip[]
  checklistItems: CalendarContentProps['checklistItems']
}) {
  const monthStart = new Date(year, month, 1)
  const days = eachDayOfInterval({ start: startOfMonth(monthStart), end: endOfMonth(monthStart) })
  const startDow = monthStart.getDay()

  function getTripsForDay(date: Date) {
    return trips.filter(t => {
      if (!t.start_date && !t.end_date) return false
      const d = date
      if (t.start_date && t.end_date) {
        return isWithinInterval(d, { start: parseISO(t.start_date), end: parseISO(t.end_date) })
      }
      if (t.start_date) return format(parseISO(t.start_date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
      return false
    })
  }

  function getChecklistForDay(date: Date) {
    return checklistItems.filter(c => c.due_date && format(parseISO(c.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
  }

  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const dayTrips = getTripsForDay(day)
          const dayChecklist = getChecklistForDay(day)
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          return (
            <div key={day.toISOString()} className={`min-h-[60px] p-1 rounded-md ${isToday ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/50'} transition-colors`}>
              <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
              {dayTrips.map((t, i) => (
                <Link key={t.id} href={`/trips/${t.id}`}>
                  <div className={`text-xs text-white rounded px-1 py-0.5 mt-0.5 truncate ${COLORS[i % COLORS.length]} hover:opacity-80`}>
                    {format(parseISO(t.start_date!), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? '✈️ ' : ''}{t.name}
                  </div>
                </Link>
              ))}
              {dayChecklist.map(c => (
                <div key={c.id} className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded px-1 py-0.5 mt-0.5 truncate">
                  ✓ {c.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarContent({ trips, checklistItems }: CalendarContentProps) {
  const now = new Date()
  const upcomingTrips = trips
    .filter(t => t.start_date && new Date(t.start_date) > now)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())

  const months = [now.getMonth(), now.getMonth() + 1, now.getMonth() + 2]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Travel Calendar</h1>
        <p className="text-muted-foreground mt-1">Your trips, deadlines, and milestones at a glance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar months */}
        <div className="lg:col-span-2 space-y-6">
          {months.map(m => {
            const year = m > 11 ? now.getFullYear() + 1 : now.getFullYear()
            const month = m > 11 ? m - 12 : m
            return (
              <Card key={`${year}-${month}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {format(new Date(year, month, 1), 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MonthGrid year={year} month={month} trips={trips} checklistItems={checklistItems} />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Next trip countdown */}
          {upcomingTrips[0] && (
            <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200/50 dark:border-violet-800/30">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="h-4 w-4 text-violet-500" />
                  <span className="font-semibold text-sm text-violet-700 dark:text-violet-300">Next Trip</span>
                </div>
                <p className="font-bold text-lg">{upcomingTrips[0].name}</p>
                <p className="text-sm text-muted-foreground">{upcomingTrips[0].country}</p>
                {upcomingTrips[0].start_date && (
                  <div className="mt-4 text-center">
                    <div className="text-4xl font-black text-violet-600 dark:text-violet-400">
                      {daysUntil(upcomingTrips[0].start_date)}
                    </div>
                    <div className="text-sm text-muted-foreground">days away</div>
                  </div>
                )}
                <Link href={`/trips/${upcomingTrips[0].id}`}>
                  <div className="mt-3 text-xs text-primary hover:underline text-center">
                    {formatDate(upcomingTrips[0].start_date, 'EEEE, MMM d, yyyy')}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* All upcoming trips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Upcoming Trips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {upcomingTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming trips</p>
              ) : (
                upcomingTrips.map(trip => (
                  <Link key={trip.id} href={`/trips/${trip.id}`}>
                    <div className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {trip.country_code ? (
                          <span>{String.fromCodePoint(...trip.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))}</span>
                        ) : (
                          <MapPin className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{trip.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(trip.start_date, 'MMM d')}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {daysUntil(trip.start_date)}d
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Deadlines */}
          {checklistItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {checklistItems
                  .filter(c => c.due_date)
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .slice(0, 5)
                  .map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(c.due_date, 'MMM d')}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
