'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar, CheckSquare2, Wallet, BookOpen, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface RecentActivityItem {
  id: string
  type: 'place' | 'itinerary' | 'checklist' | 'budget' | 'journal'
  title: string
  trip_id: string
  trip_name?: string
  created_at: string
}

interface RecentActivityWidgetProps {
  items: RecentActivityItem[]
  animationDelay?: number
}

const TYPE_CONFIG: Record<RecentActivityItem['type'], {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  bg: string
}> = {
  place:     { icon: MapPin,        label: 'Added place',          color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  itinerary: { icon: Calendar,      label: 'Added activity',       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  checklist: { icon: CheckSquare2,  label: 'Checklist item',       color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-500/10' },
  budget:    { icon: Wallet,        label: 'Added expense',        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  journal:   { icon: BookOpen,      label: 'Journal entry',        color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-500/10' },
}

export function RecentActivityWidget({ items, animationDelay = 0.42 }: RecentActivityWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.45 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Activity</p>
      </div>
      <div className="p-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-5">No recent activity yet.</p>
        ) : (
          items.map((item, i) => {
            const config = TYPE_CONFIG[item.type]
            const Icon = config.icon
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })

            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animationDelay + 0.06 + i * 0.04 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200"
              >
                <div className={`w-7 h-7 ${config.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {config.label}{item.trip_name ? ` · ${item.trip_name}` : ''}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 whitespace-nowrap">
                  {timeAgo}
                </span>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
