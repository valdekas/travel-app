'use client'

import Link from 'next/link'
import { Trip, ChecklistItem, Location, BudgetItem } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Clock, DollarSign, MapPin, CheckSquare,
  ArrowRight, Plane, TrendingUp, Globe, Edit
} from 'lucide-react'
import { EditTripDialog } from './edit-trip-dialog'

interface Props {
  trip: Trip
  checklist: ChecklistItem[]
  locations: Location[]
  budgetItems: BudgetItem[]
  itineraryDaysCount: number
}

export function TripOverviewContent({ trip, checklist, locations, budgetItems, itineraryDaysCount }: Props) {
  const days = daysUntil(trip.start_date)
  const duration = tripDuration(trip.start_date, trip.end_date)
  const checklistTotal = checklist.length
  const checklistDone = checklist.filter(c => c.completed).length
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const totalBudgeted = budgetItems.reduce((s, b) => s + b.planned_amount, 0)
  const totalSpent = budgetItems.reduce((s, b) => s + b.actual_amount, 0)
  const budgetPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0

  const visitedLocations = locations.filter(l => l.visited).length

  const urgencyBg =
    days === null ? 'from-violet-500 to-indigo-600' :
    days <= 7 ? 'from-rose-500 to-orange-500' :
    days <= 30 ? 'from-amber-500 to-orange-400' :
    'from-violet-500 to-indigo-600'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Countdown hero */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className={`bg-gradient-to-br ${urgencyBg} p-8 text-white`}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium mb-1">Next Departure</p>
              <h2 className="text-3xl font-bold mb-2">{trip.name}</h2>
              <div className="flex items-center gap-1.5 text-white/80">
                <Globe className="h-4 w-4" />
                <span className="text-lg">{trip.country}</span>
              </div>

              <div className="flex flex-wrap gap-4 mt-6 text-white/80">
                {trip.start_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(trip.start_date, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{duration} days</span>
                  </div>
                )}
                {trip.budget > 0 && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(trip.budget, trip.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-2xl p-6 min-w-[140px]">
              {days !== null && days >= 0 ? (
                <>
                  <div className="text-6xl font-black leading-none">{days}</div>
                  <div className="text-white/80 text-base font-semibold mt-2">
                    {days === 0 ? 'TODAY!' : days === 1 ? 'DAY LEFT' : 'DAYS LEFT'}
                  </div>
                </>
              ) : days !== null && days < 0 ? (
                <>
                  <div className="text-4xl font-black leading-none">{Math.abs(days)}</div>
                  <div className="text-white/80 text-sm font-semibold mt-2">DAYS AGO</div>
                </>
              ) : (
                <>
                  <Plane className="h-10 w-10 mx-auto mb-2 opacity-60" />
                  <div className="text-white/80 text-sm font-semibold">No date set</div>
                </>
              )}
            </div>
          </div>
        </div>
        <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {trip.notes && <span className="line-clamp-1">{trip.notes}</span>}
          </p>
          <EditTripDialog trip={trip} />
        </CardContent>
      </Card>

      {/* Progress cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Checklist */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Checklist</span>
              </div>
              <span className="text-xs text-muted-foreground">{checklistDone}/{checklistTotal}</span>
            </div>
            <Progress value={checklistPct} className="h-2 mb-2" />
            <p className="text-2xl font-bold">{checklistPct}%</p>
            <p className="text-xs text-muted-foreground">complete</p>
            <Link href={`/trips/${trip.id}/checklist`}>
              <Button size="sm" variant="ghost" className="w-full mt-3 gap-1 text-xs">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <span className="text-xs text-muted-foreground">{budgetPct}% used</span>
            </div>
            <Progress value={budgetPct} className={`h-2 mb-2 ${budgetPct > 90 ? '[&>div]:bg-red-500' : ''}`} />
            <p className="text-2xl font-bold">{formatCurrency(totalSpent, trip.currency)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(trip.budget || totalBudgeted, trip.currency)}</p>
            <Link href={`/trips/${trip.id}/budget`}>
              <Button size="sm" variant="ghost" className="w-full mt-3 gap-1 text-xs">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Places */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Places</span>
              </div>
              <span className="text-xs text-muted-foreground">{visitedLocations}/{locations.length} visited</span>
            </div>
            <Progress
              value={locations.length > 0 ? Math.round((visitedLocations / locations.length) * 100) : 0}
              className="h-2 mb-2"
            />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">planned locations</p>
            <Link href={`/trips/${trip.id}/places`}>
              <Button size="sm" variant="ghost" className="w-full mt-3 gap-1 text-xs">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Itinerary</span>
              </div>
            </div>
            <div className="h-2 mb-2" />
            <p className="text-2xl font-bold">{itineraryDaysCount}</p>
            <p className="text-xs text-muted-foreground">days planned</p>
            <Link href={`/trips/${trip.id}/itinerary`}>
              <Button size="sm" variant="ghost" className="w-full mt-3 gap-1 text-xs">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick checklist preview */}
      {checklist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                Recent Checklist Items
              </CardTitle>
              <Link href={`/trips/${trip.id}/checklist`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {checklist.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                  item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
                }`}>
                  {item.completed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
