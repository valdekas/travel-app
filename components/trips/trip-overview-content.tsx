'use client'

import Link from 'next/link'
import { Trip, ChecklistItem, Location, BudgetItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, DollarSign, MapPin, CheckSquare, ArrowRight, LayoutDashboard,
} from 'lucide-react'

interface Props {
  trip: Trip
  checklist: ChecklistItem[]
  locations: Location[]
  budgetItems: BudgetItem[]
  itineraryDaysCount: number
}

export function TripOverviewContent({ trip, checklist, locations, budgetItems, itineraryDaysCount }: Props) {
  const checklistTotal = checklist.length
  const checklistDone = checklist.filter(c => c.completed).length
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const totalBudgeted = budgetItems.reduce((s, b) => s + b.planned_amount, 0)
  const totalSpent = budgetItems.reduce((s, b) => s + b.actual_amount, 0)
  const tripBudget = trip.budget || totalBudgeted
  const budgetPct = tripBudget > 0 ? Math.round((totalSpent / tripBudget) * 100) : 0

  const visitedLocations = locations.filter(l => l.visited).length

  return (
    <div className="px-5 py-4 space-y-4 max-w-5xl mx-auto">

      {/* Section header */}
      <div className="flex items-center gap-3 py-1">
        <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-base leading-tight">Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trip.notes ? trip.notes : 'A complete picture of your trip'}
          </p>
        </div>
      </div>

      {/* Progress stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Checklist */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Checklist</span>
              </div>
              <span className="text-xs text-muted-foreground">{checklistDone}/{checklistTotal}</span>
            </div>
            <Progress value={checklistPct} className="h-1.5 mb-2" />
            <p className="text-2xl font-bold">{checklistPct}%</p>
            <p className="text-xs text-muted-foreground mb-2">complete</p>
            <Link href={`/trips/${trip.id}/checklist`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <span className="text-xs text-muted-foreground">{budgetPct}% used</span>
            </div>
            <Progress value={Math.min(budgetPct, 100)} className={`h-1.5 mb-2 ${budgetPct > 90 ? '[&>div]:bg-red-500' : ''}`} />
            <p className="text-2xl font-bold">{formatCurrency(totalSpent, trip.currency)}</p>
            <p className="text-xs text-muted-foreground mb-2">of {formatCurrency(trip.budget || totalBudgeted, trip.currency)}</p>
            <Link href={`/trips/${trip.id}/budget`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Places */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Places</span>
              </div>
              <span className="text-xs text-muted-foreground">{visitedLocations}/{locations.length} visited</span>
            </div>
            <Progress
              value={locations.length > 0 ? Math.round((visitedLocations / locations.length) * 100) : 0}
              className="h-1.5 mb-2"
            />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground mb-2">planned locations</p>
            <Link href={`/trips/${trip.id}/places`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Itinerary</span>
              </div>
            </div>
            <div className="h-1.5 mb-2" />
            <p className="text-2xl font-bold">{itineraryDaysCount}</p>
            <p className="text-xs text-muted-foreground mb-2">days planned</p>
            <Link href={`/trips/${trip.id}/itinerary`}>
              <Button size="sm" variant="ghost" className="w-full gap-1 text-xs h-7">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick checklist preview */}
      {checklist.length > 0 && (
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
  )
}
