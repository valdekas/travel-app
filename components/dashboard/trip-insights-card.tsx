'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, CalendarDays, CheckSquare2, Wallet, LayoutList } from 'lucide-react'
import { Trip } from '@/lib/types'
import { tripDuration, daysUntil } from '@/lib/utils'

interface TripInsightsCardProps {
  trip: Trip
  placesCount: number
  checklistTotal: number
  checklistCompleted: number
  budgetPlanned: number
  budgetActual: number
  itineraryDays: number
  animationDelay?: number
}

export function TripInsightsCard({
  trip,
  placesCount,
  checklistTotal,
  checklistCompleted,
  budgetPlanned,
  budgetActual,
  itineraryDays,
  animationDelay = 0,
}: TripInsightsCardProps) {
  const insights = useMemo(() => {
    const duration = tripDuration(trip.start_date, trip.end_date)
    const daysLeft = trip.start_date ? daysUntil(trip.start_date) : null
    const checklistPct = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : null
    const budgetDenominator = trip.budget || budgetPlanned
    const budgetPct = budgetDenominator > 0 ? Math.round((budgetActual / budgetDenominator) * 100) : null

    return [
      daysLeft !== null && daysLeft >= 0
        ? { label: 'Days Until Departure', value: `${daysLeft}`, unit: daysLeft === 1 ? 'day' : 'days', icon: CalendarDays, progress: null }
        : null,
      duration
        ? { label: 'Trip Duration', value: `${duration}`, unit: duration === 1 ? 'day' : 'days', icon: CalendarDays, progress: null }
        : null,
      placesCount > 0
        ? { label: 'Planned Places', value: `${placesCount}`, unit: null, icon: MapPin, progress: null }
        : null,
      itineraryDays > 0
        ? { label: 'Itinerary Days', value: `${itineraryDays}`, unit: null, icon: LayoutList, progress: null }
        : null,
      checklistPct !== null
        ? { label: 'Checklist Done', value: `${checklistPct}%`, unit: null, icon: CheckSquare2, progress: checklistPct }
        : null,
      budgetPct !== null
        ? { label: 'Budget Used', value: `${budgetPct}%`, unit: null, icon: Wallet, progress: Math.min(budgetPct, 100) }
        : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null)
  }, [trip, placesCount, checklistTotal, checklistCompleted, budgetPlanned, budgetActual, itineraryDays])

  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Next Trip Insights
        </p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {insights.map(({ label, value, unit, icon: Icon, progress }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums leading-none">{value}</span>
              {unit && <span className="text-xs text-slate-400 dark:text-slate-500">{unit}</span>}
            </div>
            {progress !== null && (
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-indigo-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
