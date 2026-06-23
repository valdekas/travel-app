'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

interface TripReadinessWidgetProps {
  checklistTotal: number
  checklistCompleted: number
  itineraryDays: number
  budgetPlanned: number
  placesCount: number
  tripDuration: number
  tripBudget: number
}

export function TripReadinessWidget({
  checklistTotal,
  checklistCompleted,
  itineraryDays,
  budgetPlanned,
  placesCount,
  tripDuration,
  tripBudget,
}: TripReadinessWidgetProps) {
  const { score, components } = useMemo(() => {
    const checklistScore = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0

    const itineraryScore = tripDuration > 0
      ? Math.min((itineraryDays / tripDuration) * 100, 100)
      : (itineraryDays > 0 ? 100 : 0)

    const hasTripBudget  = tripBudget > 0
    const hasBudgetItems = budgetPlanned > 0
    const budgetScore = hasTripBudget && hasBudgetItems ? 100
      : (hasTripBudget || hasBudgetItems) ? 50
      : 0

    const placesTarget = Math.max(Math.floor(tripDuration / 2), 3)
    const placesScore  = placesCount > 0 ? Math.min((placesCount / placesTarget) * 100, 100) : 0

    const score = Math.round(
      checklistScore * 0.3 +
      itineraryScore * 0.25 +
      budgetScore * 0.25 +
      placesScore * 0.2,
    )

    return {
      score,
      components: [
        { label: 'Checklist', pct: Math.round(checklistScore) },
        { label: 'Itinerary', pct: Math.round(itineraryScore) },
        { label: 'Budget', pct: budgetScore },
        { label: 'Places', pct: Math.round(placesScore) },
      ],
    }
  }, [checklistTotal, checklistCompleted, itineraryDays, budgetPlanned, placesCount, tripDuration, tripBudget])

  const scoreColor =
    score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    score >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-indigo-600 dark:text-indigo-400'

  const barColor =
    score >= 80 ? 'bg-emerald-500' :
    score >= 50 ? 'bg-amber-500' :
    'bg-indigo-500'

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.34, duration: 0.45 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex-1">
          Trip Readiness
        </p>
        <span className={`text-sm font-bold ${scoreColor}`}>{score}%</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        <div className="space-y-1.5">
          {components.map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 w-14 shrink-0">{label}</span>
              <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-400' : 'bg-indigo-400/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-7 text-right tabular-nums">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
