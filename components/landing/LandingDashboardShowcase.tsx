'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Plane,
  MapPin,
  TrendingUp,
  Star,
} from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trip', label: 'Trip Detail', icon: Map },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Wallet },
] as const

type TabId = (typeof TABS)[number]['id']

function DashboardMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Trips', value: '12', color: 'text-violet-400' },
          { label: 'Countries', value: '24', color: 'text-blue-400' },
          { label: 'Cities', value: '61', color: 'text-emerald-400' },
          { label: 'Days', value: '184', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-700/50 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent trips */}
      <div className="bg-slate-700/50 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Trips</div>
        <div className="space-y-2.5">
          {[
            { name: 'Tokyo Summer 2024', country: 'Japan', status: 'upcoming', color: 'bg-blue-500' },
            { name: 'Barcelona Getaway', country: 'Spain', status: 'completed', color: 'bg-violet-500' },
            { name: 'NYC New Year', country: 'USA', status: 'planning', color: 'bg-amber-500' },
          ].map(t => (
            <div key={t.name} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${t.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{t.name}</div>
                <div className="text-xs text-slate-400">{t.country}</div>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                ${t.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300'
                  : t.status === 'completed' ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-amber-500/20 text-amber-300'}`}
              >
                {t.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">Total Budget</span>
          </div>
          <div className="text-lg font-bold text-white">€8,420</div>
          <div className="text-xs text-emerald-400">62% used</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-slate-400">Wishlist</span>
          </div>
          <div className="text-lg font-bold text-white">7 places</div>
          <div className="text-xs text-amber-400">3 converting</div>
        </div>
      </div>
    </div>
  )
}

function TripMockup() {
  return (
    <div className="p-5 space-y-4">
      {/* Trip hero */}
      <div className="relative rounded-xl overflow-hidden h-28">
        <img
          src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80"
          alt="Tokyo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70" />
        <div className="absolute bottom-3 left-3">
          <div className="text-white font-bold text-lg">Tokyo Summer 2024</div>
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <MapPin className="h-3 w-3" /> Tokyo, Japan · Jul 15–28
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
          Upcoming
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
        {['Overview', 'Itinerary', 'Places', 'Budget'].map((t, i) => (
          <div key={t} className={`flex-1 text-center text-xs py-1.5 rounded-md font-medium transition-colors
            ${i === 1 ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
            {t}
          </div>
        ))}
      </div>

      {/* Itinerary items */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Day 1 — July 15</div>
        {[
          { time: '10:00', name: 'Senso-ji Temple', type: 'Sightseeing' },
          { time: '13:00', name: 'Shibuya Crossing', type: 'Landmark' },
          { time: '19:00', name: 'Shinjuku dinner', type: 'Food & Drink' },
        ].map(item => (
          <div key={item.name} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2">
            <div className="text-xs text-slate-400 w-10 shrink-0">{item.time}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{item.name}</div>
              <div className="text-xs text-slate-400">{item.type}</div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-slate-600 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarMockup() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dates = Array.from({ length: 35 }, (_, i) => i - 1)
  const tripStart = 14
  const tripEnd = 27

  return (
    <div className="p-5 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">July 2024</div>
        <div className="flex gap-1">
          {['Month', '3M', '6M', 'Year'].map((v, i) => (
            <div key={v} className={`text-xs px-2.5 py-1 rounded-md font-medium
              ${i === 1 ? 'bg-violet-600 text-white' : 'text-slate-400 bg-slate-700/50'}`}>
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div>
        <div className="grid grid-cols-7 mb-1">
          {days.map(d => (
            <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {dates.map((d, i) => {
            const day = d + 1
            const inTrip = day >= tripStart && day <= tripEnd
            const isStart = day === tripStart
            const isEnd = day === tripEnd
            return (
              <div
                key={i}
                className={`relative h-8 flex items-center justify-center text-xs
                  ${d < 0 || d >= 31 ? 'opacity-0' : ''}
                  ${inTrip ? 'bg-violet-600/30' : ''}
                  ${isStart ? 'rounded-l-full' : ''}
                  ${isEnd ? 'rounded-r-full' : ''}
                  ${day === 15 ? 'font-bold text-white' : inTrip ? 'text-violet-200' : 'text-slate-300'}
                `}
              >
                {d >= 0 && d < 31 ? day : ''}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-slate-700/50 rounded-xl p-3">
        <div className="text-xs text-slate-400 mb-2">Upcoming trips</div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 rounded-full bg-violet-500 h-10 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Tokyo Summer 2024</div>
            <div className="text-xs text-slate-400">Jul 15–28 · 13 nights</div>
          </div>
          <div className="ml-auto bg-violet-500/20 text-violet-300 text-xs font-semibold px-2 py-1 rounded-full">
            19d
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetMockup() {
  const categories = [
    { name: 'Flights', spent: 780, budget: 900, color: 'bg-blue-500' },
    { name: 'Hotels', spent: 1200, budget: 1400, color: 'bg-violet-500' },
    { name: 'Food', spent: 420, budget: 500, color: 'bg-amber-500' },
    { name: 'Activities', spent: 310, budget: 400, color: 'bg-emerald-500' },
  ]

  return (
    <div className="p-5 space-y-4">
      {/* Total */}
      <div className="bg-slate-700/50 rounded-xl p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-slate-400 text-xs">Total spent</div>
            <div className="text-2xl font-bold text-white">€2,710</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs">Budget</div>
            <div className="text-lg font-semibold text-slate-300">€3,500</div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: '77%' }} />
        </div>
        <div className="text-xs text-slate-400 mt-1.5">77% of budget used · €790 remaining</div>
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        {categories.map(c => (
          <div key={c.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">{c.name}</span>
              <span className="text-slate-400">€{c.spent} / €{c.budget}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.color}`}
                style={{ width: `${(c.spent / c.budget) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const MOCKUPS: Record<TabId, React.ReactNode> = {
  dashboard: <DashboardMockup />,
  trip: <TripMockup />,
  calendar: <CalendarMockup />,
  budget: <BudgetMockup />,
}

const FEATURES = [
  { tab: 'dashboard' as TabId, title: 'All your trips at a glance', desc: 'Dashboard overview with stats, recent trips, budget summary, and travel achievements.' },
  { tab: 'trip' as TabId, title: 'Complete trip management', desc: 'Day-by-day itineraries, saved places, journal entries, and budget tracking — all in one place.' },
  { tab: 'calendar' as TabId, title: 'Visual calendar planning', desc: 'See all trips on a timeline. Month, 3-month, 6-month and year views with trip date bars.' },
  { tab: 'budget' as TabId, title: 'Smart budget tracking', desc: 'Track expenses by category, set budgets per trip, and see exactly where your money goes.' },
]

export function LandingDashboardShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const activeFeature = FEATURES.find(f => f.tab === activeTab)!

  return (
    <section className="bg-slate-900 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5 mb-4">
            Everything in one place
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Built for how travellers actually plan
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            From first inspiration to final itinerary — every tool you need, beautifully integrated.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: tabs + description */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="space-y-2">
              {FEATURES.map(f => {
                const Icon = TABS.find(t => t.id === f.tab)!.icon
                const isActive = activeTab === f.tab
                return (
                  <button
                    key={f.tab}
                    onClick={() => setActiveTab(f.tab)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-800 border-violet-500/50 shadow-lg shadow-violet-900/20'
                        : 'border-transparent hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${isActive ? 'bg-violet-600' : 'bg-slate-700'}`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {f.title}
                      </div>
                      <div className="text-slate-400 text-sm mt-0.5 leading-relaxed">{f.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Right: mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-slate-800 rounded-2xl border border-white/8 overflow-hidden shadow-2xl shadow-black/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-850 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <div className="ml-4 flex-1 bg-slate-700/50 rounded-md h-5 flex items-center px-3">
                  <span className="text-xs text-slate-500">travel365.live/dashboard</span>
                </div>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {MOCKUPS[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Glow */}
            <div className="absolute -inset-4 -z-10 bg-violet-600/10 rounded-3xl blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
