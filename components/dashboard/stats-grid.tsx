'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Globe, Star, Plane, TrendingUp, Map } from 'lucide-react'

interface StatsGridProps {
  totalTrips: number
  countriesVisited: number
  continentsVisited: number
  savedPlaces: number
  visitedPlaces: number
  wishlistCount: number
  upcomingCount: number
  regionsVisited?: number
}

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (target === 0) return

    const duration = 650
    const startTime = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [target])

  return <>{count}</>
}

export function StatsGrid({
  totalTrips, countriesVisited, continentsVisited, wishlistCount, upcomingCount, regionsVisited = 0,
}: StatsGridProps) {
  const stats = [
    {
      label: 'Total Trips',
      value: totalTrips,
      icon: Plane,
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      href: '/trips',
    },
    {
      label: 'Countries Visited',
      value: countriesVisited,
      icon: Globe,
      iconBg: 'bg-violet-50 dark:bg-violet-500/10 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: '/visited',
    },
    {
      label: 'Regions • States • Islands',
      value: regionsVisited,
      icon: Map,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/visited',
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/trips',
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      icon: Star,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      href: '/wishlist',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map(({ label, value, icon: Icon, iconBg, iconColor, href }, i) => (
        <Link key={label} href={href}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-lg dark:hover:shadow-black/20 hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-300 cursor-pointer group"
          >
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4 transition-colors duration-300`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums leading-none">
              <AnimatedNumber target={value} />
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{label}</div>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
