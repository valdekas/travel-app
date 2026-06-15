'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, formatCurrency, tripDuration, getTripStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Globe, MapPin, Calendar, Plus, TrendingUp, Clock, Star,
  CheckSquare, Plane, ArrowRight
} from 'lucide-react'
import { CountdownCard } from './countdown-card'
import { TripCard } from './trip-card'
import { StatsGrid } from './stats-grid'

interface DashboardContentProps {
  trips: Trip[]
  wishlistCount: number
  allLocations: { id: string; visited: boolean; trip_id: string }[]
  userName: string
}

export function DashboardContent({ trips, wishlistCount, allLocations, userName }: DashboardContentProps) {
  const now = new Date()

  const upcomingTrips = useMemo(
    () => trips
      .filter(t => t.start_date && new Date(t.start_date) > now)
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()),
    [trips]
  )

  const nextTrip = upcomingTrips[0]
  const countriesVisited = useMemo(
    () => new Set(trips.filter(t => t.status === 'completed').map(t => t.country)).size,
    [trips]
  )
  const totalSaved = allLocations.length
  const totalVisited = allLocations.filter(l => l.visited).length
  const activeTrips = trips.filter(t => t.status === 'active')

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}, {userName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">
            {trips.length === 0
              ? "Let's plan your first adventure!"
              : `You have ${upcomingTrips.length} upcoming trip${upcomingTrips.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/trips/new">
          <Button className="gap-2 flex-shrink-0">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid
        totalTrips={trips.length}
        countriesVisited={countriesVisited}
        savedPlaces={totalSaved}
        visitedPlaces={totalVisited}
        wishlistCount={wishlistCount}
        upcomingCount={upcomingTrips.length}
      />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Countdown + upcoming — left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Countdown to next trip */}
          {nextTrip && (
            <CountdownCard trip={nextTrip} />
          )}

          {/* Upcoming trips */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plane className="h-4 w-4 text-primary" /> Upcoming Trips
              </h2>
              <Link href="/trips">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {upcomingTrips.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">No upcoming trips</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Create your first trip to get started</p>
                  <Link href="/trips/new" className="mt-4">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Plan a Trip
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {upcomingTrips.slice(0, 4).map(trip => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>

          {/* Active trips */}
          {activeTrips.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-green-500" /> Active Now
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeTrips.map(trip => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { href: '/trips/new', icon: Plus, label: 'Create New Trip' },
                { href: '/wishlist', icon: Star, label: 'Add to Wishlist' },
                { href: '/calendar', icon: Calendar, label: 'Open Calendar' },
                { href: '/search', icon: MapPin, label: 'Search Places' },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent trips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Trips</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {trips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No trips yet</p>
              ) : (
                trips.slice(0, 5).map(trip => (
                  <Link key={trip.id} href={`/trips/${trip.id}`}>
                    <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                        {trip.country_code ? (
                          <span>{String.fromCodePoint(...trip.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))}</span>
                        ) : (
                          <Globe className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{trip.name}</p>
                        <p className="text-xs text-muted-foreground">{trip.country}</p>
                      </div>
                      <Badge className={`text-xs ${getTripStatusColor(trip.status)}`} variant="secondary">
                        {trip.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Wishlist preview */}
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200/50 dark:border-violet-800/30">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="font-semibold text-violet-900 dark:text-violet-100">{wishlistCount} saved</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">on your wishlist</p>
                </div>
              </div>
              <Link href="/wishlist">
                <Button variant="outline" size="sm" className="w-full mt-4 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                  View Wishlist
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
