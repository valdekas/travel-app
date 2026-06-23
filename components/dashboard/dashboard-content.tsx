'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Trip } from '@/lib/types'
import { getDestinationImage, daysUntil, formatDate, getEffectiveStatus, tripDuration as calcTripDuration } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'
import { Button } from '@/components/ui/button'
import {
  Plus, Plane, ArrowRight, Calendar as CalIcon,
  Star, BookOpen, Compass,
  TrendingUp, Quote,
} from 'lucide-react'
import { CountdownCard } from './countdown-card'
import { TripCard } from './trip-card'
import { StatsGrid } from './stats-grid'
import { WorldMapWidget } from './world-map-widget'
import { TravelStatsCard } from './travel-stats-card'
import { TripInsightsCard } from './trip-insights-card'
import { TripReadinessWidget } from './trip-readiness-widget'
import { RecentActivityWidget } from './recent-activity-widget'
import { AchievementsWidget } from './achievements-widget'
import type { RecentActivityItem } from './recent-activity-widget'
import { getDailyQuote } from '@/lib/data/travel-quotes'
import { EmptyWorldMap } from './empty-world-map'

/* ─── Props ──────────────────────────────────────────────────── */
interface DashboardContentProps {
  trips: Trip[]
  wishlistCount: number
  allLocations: { id: string; visited: boolean; trip_id: string }[]
  visitedCountryCodes: string[]
  visitedContinents: string[]
  partiallyVisitedRegions?: Record<string, string[]>
  visitedRegionsTotal?: number
  userName: string
  nextTripChecklist: { total: number; completed: number }
  nextTripBudget: { planned: number; actual: number }
  nextTripItineraryDays: number
  recentActivity: RecentActivityItem[]
}

/* ─── Component ──────────────────────────────────────────────── */
export function DashboardContent({
  trips, wishlistCount, allLocations, visitedCountryCodes, visitedContinents,
  partiallyVisitedRegions = {}, visitedRegionsTotal = 0, userName,
  nextTripChecklist, nextTripBudget, nextTripItineraryDays, recentActivity,
}: DashboardContentProps) {
  const now = new Date()

  const upcomingTrips = useMemo(
    () =>
      trips
        .filter(t => getEffectiveStatus(t) === 'upcoming')
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()),
    [trips],
  )

  const activeTrips = trips.filter(t => getEffectiveStatus(t) === 'active')
  const nextTrip = upcomingTrips[0] ?? activeTrips[0] ?? null
  const completedTrips = trips.filter(t => getEffectiveStatus(t) === 'completed').length

  const countriesVisited = visitedCountryCodes.length > 0
    ? visitedCountryCodes.length
    : new Set(trips.filter(t => getEffectiveStatus(t) === 'completed').map(t => t.country)).size

  const continentsVisited = visitedContinents.length

  const nextTripPlaces   = nextTrip
    ? allLocations.filter(l => l.trip_id === nextTrip.id).length
    : 0
  const nextTripDuration = nextTrip
    ? (calcTripDuration(nextTrip.start_date, nextTrip.end_date) ?? 0)
    : 0

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayQuote = getDailyQuote()
  const dayName = format(now, 'EEEE')
  const dateStr = format(now, 'MMMM d, yyyy')

  const quickLinks = [
    { href: '/trips/new', icon: Plus, label: 'Plan a New Trip', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { href: '/wishlist', icon: Star, label: 'My Wishlist', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { href: '/calendar', icon: CalIcon, label: 'Trip Calendar', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { href: '/journal', icon: BookOpen, label: 'Travel Journal', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ]

  /* ── Empty state (no trips at all) ───────────────────────── */
  if (trips.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

          {/* Section 1 — Greeting + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
              {dayName} · {dateStr}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {greeting()}, {userName.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
              Where will your next adventure begin?
            </p>
            <Link href="/trips/new">
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-indigo-500/25 rounded-xl h-11 px-7 text-base">
                <Plus className="h-4 w-4" /> Create Your First Trip
              </Button>
            </Link>
          </motion.div>

          {/* Section 2 — Decorative world map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <EmptyWorldMap />
          </motion.div>

          {/* Section 3 — Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {[
              { emoji: '✈️', title: 'Trips',     sub: 'Plan your next adventure' },
              { emoji: '📅', title: 'Itinerary', sub: 'Organize every day' },
              { emoji: '📍', title: 'Places',    sub: 'Restaurants, hotels, viewpoints' },
              { emoji: '💰', title: 'Budget',    sub: 'Track your spending' },
              { emoji: '📖', title: 'Journal',   sub: 'Save memories forever' },
            ].map(f => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className="text-2xl mb-2">{f.emoji}</div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{f.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{f.sub}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    )
  }

  /* ── Full dashboard ───────────────────────────────────────── */
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── GREETING ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
              {dayName} · {dateStr}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting()}, {userName.split(' ')[0]} ✈️
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {nextTrip
                ? `Your next trip to ${nextTrip.country} is on the horizon.`
                : `You have ${upcomingTrips.length} upcoming trip${upcomingTrips.length !== 1 ? 's' : ''}.`}
            </p>
          </div>

          <Link href="/trips/new" className="shrink-0">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-indigo-500/20 rounded-xl h-10 px-5 text-sm font-semibold">
                <Plus className="h-4 w-4" /> New Trip
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── WORLD MAP ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04 }}
        >
          <WorldMapWidget trips={trips} visitedCountryCodes={visitedCountryCodes} partiallyVisitedRegions={partiallyVisitedRegions} />
        </motion.div>

        {/* ── STATS ── */}
        <StatsGrid
          totalTrips={trips.length}
          countriesVisited={countriesVisited}
          continentsVisited={continentsVisited}
          savedPlaces={allLocations.length}
          visitedPlaces={allLocations.filter(l => l.visited).length}
          wishlistCount={wishlistCount}
          upcomingCount={upcomingTrips.length}
          regionsVisited={visitedRegionsTotal}
        />

        {/* ── MAIN GRID: 2/3 + 1/3 ── */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: hero + insights + trips + achievements ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero countdown card */}
            {nextTrip && <CountdownCard trip={nextTrip} animationDelay={0.26} />}

            {/* Next trip insights (shown when we have a next trip) */}
            {nextTrip && (
              <TripInsightsCard
                trip={nextTrip}
                placesCount={nextTripPlaces}
                checklistTotal={nextTripChecklist.total}
                checklistCompleted={nextTripChecklist.completed}
                budgetPlanned={nextTripBudget.planned}
                budgetActual={nextTripBudget.actual}
                itineraryDays={nextTripItineraryDays}
                animationDelay={0.3}
              />
            )}

            {/* Upcoming trips */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.32 }}
                className="flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plane className="h-[18px] w-[18px] text-indigo-500" />
                  Upcoming Trips
                </h2>
                <Link href="/trips">
                  <button className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </motion.div>

              {upcomingTrips.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Compass className="h-6 w-6 text-indigo-500" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No upcoming trips yet</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
                    Start planning your next destination
                  </p>
                  <Link href="/trips/new">
                    <Button size="sm" variant="outline" className="gap-1 rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      <Plus className="h-3.5 w-3.5" /> Plan a Trip
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcomingTrips.slice(0, 4).map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.36 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <TripCard trip={trip} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievements */}
            <AchievementsWidget
              countriesVisited={countriesVisited}
              animationDelay={0.44}
            />

            {/* Active trips (currently travelling) */}
            {activeTrips.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <TrendingUp className="h-[18px] w-[18px] text-emerald-500" />
                  Active Now
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeTrips.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                      <TripCard trip={trip} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: sidebar widgets ── */}
          <div className="space-y-4">

            {/* Travel quote */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20"
            >
              <p className="text-[10px] font-semibold text-indigo-300/70 uppercase tracking-widest mb-3">Today&apos;s Quote</p>
              <div className="flex items-start gap-3">
                <Quote className="h-4 w-4 text-indigo-300/80 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[13.5px] leading-relaxed font-medium text-white italic">
                    &ldquo;{todayQuote.text}&rdquo;
                  </p>
                  <p className="text-indigo-200/70 text-xs mt-2.5 font-medium">— {todayQuote.author}</p>
                </div>
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quick Actions</p>
              </div>
              <div className="p-2">
                {quickLinks.map(({ href, icon: Icon, label, color, bg }) => (
                  <Link key={href} href={href}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer group"
                    >
                      <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200 flex-1">
                        {label}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 ml-auto opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Travel statistics */}
            <TravelStatsCard
              trips={trips}
              countriesVisited={countriesVisited}
              continentsVisited={continentsVisited}
            />

            {/* Trip readiness (only when there's a next trip) */}
            {nextTrip && (
              <TripReadinessWidget
                checklistTotal={nextTripChecklist.total}
                checklistCompleted={nextTripChecklist.completed}
                itineraryDays={nextTripItineraryDays}
                budgetPlanned={nextTripBudget.planned}
                placesCount={nextTripPlaces}
                tripDuration={nextTripDuration}
                tripBudget={nextTrip!.budget}
              />
            )}

            {/* Recent trips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Trips</p>
                <Link href="/trips">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">See all</span>
                </Link>
              </div>
              {trips.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">No trips yet</p>
                  <Link href="/trips/new">
                    <Button size="sm" variant="outline" className="gap-1 rounded-xl text-xs border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      <Plus className="h-3 w-3" /> Create your first trip
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-2">
                  {trips.slice(0, 5).map(trip => {
                    const imgSrc = getDestinationImage(trip)
                    const days = trip.start_date ? daysUntil(trip.start_date) : null
                    const dateLabel = trip.start_date ? formatDate(trip.start_date, 'MMM d, yyyy') : null

                    const effectiveStatus = getEffectiveStatus(trip)
                    const statusBadge = (() => {
                      if (effectiveStatus === 'active')    return { label: 'Active',     className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }
                      if (effectiveStatus === 'completed') return { label: 'Done',       className: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' }
                      if (effectiveStatus === 'cancelled') return { label: 'Cancelled',  className: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' }
                      // upcoming — show countdown if date is in the future, otherwise Planning
                      if (days !== null && days >= 0) {
                        const text = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`
                        return { label: text, className: days <= 7 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' }
                      }
                      return { label: 'Planning', className: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' }
                    })()

                    return (
                      <Link key={trip.id} href={`/trips/${trip.id}`}>
                        <motion.div
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 px-3 min-h-[52px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                            <img src={imgSrc} alt={trip.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                              {trip.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate">
                              {trip.country_code && <FlagImg code={trip.country_code} className="w-4 h-3 shrink-0" />}
                              <span className="truncate">{trip.country}{dateLabel ? ` · ${dateLabel}` : ''}</span>
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Recent activity */}
            <RecentActivityWidget items={recentActivity} animationDelay={0.38} />

            {/* Wishlist CTA */}
            {wishlistCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.46, duration: 0.45 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {wishlistCount} Destination{wishlistCount !== 1 ? 's' : ''} Saved
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Ready to become a trip</p>
                  </div>
                </div>
                <Link href="/wishlist">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15 text-sm font-semibold"
                  >
                    View Wishlist
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
