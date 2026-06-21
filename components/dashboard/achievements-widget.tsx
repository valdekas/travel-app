'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { ACHIEVEMENTS } from '@/lib/utils/achievements'

interface AchievementsWidgetProps {
  countriesVisited: number
  animationDelay?: number
}

export function AchievementsWidget({
  countriesVisited,
  animationDelay = 0.44,
}: AchievementsWidgetProps) {
  const earned = useMemo(
    () => ACHIEVEMENTS.filter(a => countriesVisited >= a.threshold),
    [countriesVisited],
  )

  if (earned.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex-1">
          Achievements
        </p>
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
          {earned.length}
        </span>
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        {earned.map(({ icon, label, description }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.15 }}
            title={description}
            className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-500/30 rounded-xl px-2.5 py-1.5 transition-colors duration-200 cursor-default"
          >
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
