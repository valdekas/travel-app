'use client'

import { motion } from 'framer-motion'
import { MapPin, DollarSign, Calendar, BookOpen, CalendarDays, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: MapPin,
    color: 'bg-rose-50 text-rose-600',
    title: 'Places',
    desc: 'Save and organize every restaurant, hotel, and attraction. Never forget a recommendation.',
    badge: null,
  },
  {
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Budget',
    desc: 'Track spending with real-time planned vs actual charts. Always know where your money goes.',
    badge: null,
  },
  {
    icon: Calendar,
    color: 'bg-violet-50 text-violet-600',
    title: 'Itinerary',
    desc: 'Plan each day with drag-and-drop simplicity. Chronological scheduling that just works.',
    badge: null,
  },
  {
    icon: BookOpen,
    color: 'bg-amber-50 text-amber-600',
    title: 'Journal',
    desc: 'Capture memories with photos, moods, and stories. Your trips, beautifully remembered.',
    badge: null,
  },
  {
    icon: CalendarDays,
    color: 'bg-blue-50 text-blue-600',
    title: 'Calendar',
    desc: 'See all your trips at a glance across months and years. Never double-book again.',
    badge: null,
  },
  {
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600',
    title: 'AI Suggestions',
    desc: 'AI-powered recommendations for any destination — restaurants, activities, hidden gems.',
    badge: 'New',
  },
]

export function LandingFeatures() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Everything in one workspace
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Six powerful modules, one seamless experience. Everything a traveler needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc, badge }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                {badge && (
                  <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="text-slate-900 font-semibold mb-1.5">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
