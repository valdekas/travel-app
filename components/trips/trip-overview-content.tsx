'use client'

import Link from 'next/link'
import { Trip, ChecklistItem, Location, BudgetItem } from '@/lib/types'
import { formatCurrency, tripDuration as calcTripDuration } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TripReadinessWidget } from '@/components/dashboard/trip-readiness-widget'
import {
  Calendar, DollarSign, MapPin, CheckSquare, ArrowRight, LayoutDashboard, FileText,
} from 'lucide-react'

interface Props {
  trip: Trip
  checklist: ChecklistItem[]
  locations: Location[]
  budgetItems: BudgetItem[]
  itineraryDaysCount: number
  itineraryDaysWithActivities: number
}

export function TripOverviewContent({ trip, checklist, locations, budgetItems, itineraryDaysCount, itineraryDaysWithActivities }: Props) {
  const checklistTotal = checklist.length
  const checklistDone  = checklist.filter(c => c.completed).length
  const checklistPct   = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const totalBudgeted = budgetItems.reduce((s, b) => s + b.planned_amount, 0)
  const totalSpent    = budgetItems.reduce((s, b) => s + b.actual_amount, 0)
  const tripBudget    = trip.budget || totalBudgeted
  const budgetPct     = tripBudget > 0 ? Math.round((totalSpent / tripBudget) * 100) : 0
  const isOverBudget  = budgetPct > 100

  const visitedLocations = locations.filter(l => l.visited).length
  const duration = calcTripDuration(trip.start_date, trip.end_date) ?? 0
  const placesPct        = locations.length > 0 ? Math.round((visitedLocations / locations.length) * 100) : 0

  const hasNotes = trip.notes && trip.notes.trim().length > 0

  return (
    <div className="px-5 py-4 space-y-4 max-w-5xl mx-auto">

      {/* Section header */}
      <div className="flex items-center gap-3 py-1">
        <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-base leading-tight">Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">A complete picture of your trip</p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Checklist */}
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
          <CardContent className="pl-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15">
                <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Checklist</span>
            </div>
            <Progress value={checklistPct} className="h-1.5 mb-2" />
            <p className="text-2xl font-bold">{checklistPct}%</p>
            <p className="text-xs text-muted-foreground mb-2">{checklistDone}/{checklistTotal} complete</p>
            <Link href={`/trips/${trip.id}/checklist`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`} />
          <CardContent className="pl-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-3">
              <div className={`p-1.5 rounded-md ${isOverBudget ? 'bg-red-100 dark:bg-red-500/15' : 'bg-blue-100 dark:bg-blue-500/15'}`}>
                <DollarSign className={`h-3.5 w-3.5 ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Budget</span>
            </div>
            <Progress
              value={Math.min(budgetPct, 100)}
              className={`h-1.5 mb-2 ${budgetPct > 90 ? '[&>div]:bg-red-500' : ''}`}
            />
            <p className="text-2xl font-bold">{formatCurrency(totalSpent, trip.currency)}</p>
            <p className="text-xs text-muted-foreground mb-2">
              of {formatCurrency(trip.budget || totalBudgeted, trip.currency)}
            </p>
            <Link href={`/trips/${trip.id}/budget`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Places */}
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-500 rounded-l-xl" />
          <CardContent className="pl-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-500/15">
                <MapPin className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Places</span>
            </div>
            <Progress value={placesPct} className="h-1.5 mb-2" />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground mb-2">{visitedLocations}/{locations.length} visited</p>
            <Link href={`/trips/${trip.id}/places`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
          <CardContent className="pl-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-500/15">
                <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Itinerary</span>
            </div>
            <Progress
              value={itineraryDaysCount > 0 ? Math.round((itineraryDaysWithActivities / itineraryDaysCount) * 100) : 0}
              className="h-1.5 mb-2"
            />
            <p className="text-2xl font-bold">
              {itineraryDaysCount > 0 ? `${itineraryDaysWithActivities}/${itineraryDaysCount}` : '0'}
            </p>
            <p className="text-xs text-muted-foreground mb-2">days planned</p>
            <Link href={`/trips/${trip.id}/itinerary`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Trip Readiness + Checklist preview ── */}
      <div className={`grid gap-4${checklistTotal > 0 ? ' lg:grid-cols-2' : ''}`}>

        <TripReadinessWidget
          checklistTotal={checklistTotal}
          checklistCompleted={checklistDone}
          itineraryDays={itineraryDaysCount}
          budgetPlanned={totalBudgeted}
          placesCount={locations.length}
          tripDuration={duration}
          tripBudget={trip.budget}
        />

        {checklistTotal > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                  Checklist Preview
                </CardTitle>
                <Link href={`/trips/${trip.id}/checklist`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-4">
              <div className="space-y-1">
                {checklist.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 py-1">
                    <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                      item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
                    }`}>
                      {item.completed && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs capitalize">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Trip Notes — only when notes exist ── */}
      {hasNotes && (
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-400 dark:bg-slate-500 rounded-l-xl" />
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-500/15">
                <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              Trip Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4 px-5">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{trip.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
