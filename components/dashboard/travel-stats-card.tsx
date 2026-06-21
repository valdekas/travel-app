'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Globe, Plane, TrendingUp, Clock, BarChart3, Map } from 'lucide-react'
import { Trip } from '@/lib/types'
import { tripDuration } from '@/lib/utils'

interface TravelStatsCardProps {
  trips: Trip[]
  countriesVisited: number
  continentsVisited: number
}

export function TravelStatsCard({ trips, countriesVisited, continentsVisited }: TravelStatsCardProps) {
  const stats = useMemo(() => {
    const completedTrips = trips.filter(t => t.status === 'completed').length
    const plannedTrips = trips.filter(t => t.status === 'planning' || t.status === 'upcoming').length

    const durations = trips
      .filter(t => t.start_date && t.end_date)
      .map(t => tripDuration(t.start_date, t.end_date) ?? 0)
      .filter(d => d > 0)

    const totalDays = durations.reduce((sum, d) => sum + d, 0)
    const longestTrip = durations.length ? Math.max(...durations) : 0
    const avgLength = durations.length ? Math.round(totalDays / durations.length) : 0

    return { completedTrips, plannedTrips, totalDays, longestTrip, avgLength }
  }, [trips])

  const rows = [
    { label: 'Countries Visited', value: countriesVisited || null, icon: Globe, color: 'text-violet-500' },
    { label: 'Trips Completed', value: stats.completedTrips || null, icon: Plane, color: 'text-indigo-500' },
    { label: 'Trips Planned', value: stats.plannedTrips || null, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Continents Explored', value: continentsVisited || null, icon: Map, color: 'text-emerald-500' },
    { label: 'Total Travel Days', value: stats.totalDays || null, icon: Clock, color: 'text-amber-500' },
    { label: 'Longest Trip', value: stats.longestTrip ? `${stats.longestTrip}d` : null, icon: BarChart3, color: 'text-rose-500' },
    { label: 'Avg Trip Length', value: stats.avgLength ? `${stats.avgLength}d` : null, icon: BarChart3, color: 'text-orange-500' },
  ].filter(r => r.value !== null)

  if (rows.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.28, duration: 0.45 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Travel Statistics</p>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {rows.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
              <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
