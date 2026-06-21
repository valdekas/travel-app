'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, formatCurrency, getDestinationImage } from '@/lib/utils'
import { Calendar, Clock, Wallet, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { FlagImg } from '@/components/ui/flag-img'

interface CountdownCardProps {
  trip: Trip
  animationDelay?: number
}

export function CountdownCard({ trip, animationDelay = 0 }: CountdownCardProps) {
  const days = daysUntil(trip.start_date)
  const duration = tripDuration(trip.start_date, trip.end_date)
  const imgSrc = getDestinationImage(trip)

  const countdownBg =
    days === null || days < 0 ? 'from-slate-700 to-slate-900' :
    days === 0              ? 'from-rose-500 to-orange-600' :
    days <= 7              ? 'from-orange-500 to-amber-600' :
    days <= 30             ? 'from-violet-600 to-indigo-700' :
    'from-indigo-600 to-blue-700'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.45, delay: animationDelay, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl h-72 shadow-xl shadow-slate-300/40 dark:shadow-black/30 hover:shadow-2xl hover:shadow-slate-400/30 dark:hover:shadow-black/50 transition-shadow duration-300 group"
    >
      {/* Background image */}
      <Image
        src={imgSrc}
        alt={trip.name}
        fill
        sizes="(max-width: 1024px) 100vw, 66vw"
        className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
        priority
      />

      {/* Layered overlays — stronger for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Top row */}
      <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
        {/* Country badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5">
            {trip.country_code ? <FlagImg code={trip.country_code} className="w-5 h-[15px]" /> : <span>✈️</span>}
            <span className="text-white text-xs font-semibold">{trip.city ? `${trip.city} · ${trip.country}` : trip.country}</span>
          </div>
          <div className="bg-indigo-600/90 backdrop-blur-md border border-indigo-400/30 rounded-full px-2.5 py-1 text-white text-[10px] font-semibold uppercase tracking-wider">
            Next Trip
          </div>
        </div>

        {/* Countdown badge — glassmorphism */}
        {days !== null && days >= 0 && (
          <div className={`bg-gradient-to-br ${countdownBg} backdrop-blur-xl rounded-2xl px-4 py-3.5 text-center min-w-[88px] border border-white/25 shadow-xl shadow-black/25`}>
            <div className="text-white font-bold text-4xl leading-none tabular-nums">{days}</div>
            <div className="text-white/80 text-[10px] font-semibold mt-1.5 uppercase tracking-wider">
              {days === 0 ? 'Today!' : days === 1 ? 'day left' : 'days left'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-white/55 text-[11px] font-semibold uppercase tracking-widest mb-1.5">
          Your next adventure
        </p>
        <h2 className="text-white font-bold text-2xl leading-tight mb-3">{trip.name}</h2>

        <div className="flex items-end justify-between gap-4">
          {/* Info strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {trip.start_date && (
              <span className="flex items-center gap-1.5 text-white/75 text-sm">
                <Calendar className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {formatDate(trip.start_date, 'MMM d, yyyy')}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1.5 text-white/75 text-sm">
                <Clock className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {duration} days
              </span>
            )}
            {trip.budget > 0 && (
              <span className="flex items-center gap-1.5 text-white/75 text-sm">
                <Wallet className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {formatCurrency(trip.budget, trip.currency)}
              </span>
            )}
          </div>

          {/* CTA — arrow slides on hover */}
          <Link href={`/trips/${trip.id}`} className="shrink-0">
            <motion.button
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 hover:border-white/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200"
            >
              View Trip
              <motion.span
                variants={{ rest: { x: 0 }, hover: { x: 4 } }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.span>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
