'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, MapPin, DollarSign, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ── App preview panels ─────────────────────────────────────────── */

function DashboardPanel() {
  return (
    <div className="p-4 space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Trips', value: '8', color: 'bg-violet-50 text-violet-700' },
          { label: 'Countries', value: '23', color: 'bg-blue-50 text-blue-700' },
          { label: 'Continents', value: '4', color: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-100 p-3 text-center shadow-sm">
            <p className={`text-xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-slate-500 text-[10px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming trips */}
      <div>
        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wide mb-2">Upcoming Trips</p>
        <div className="space-y-2">
          {[
            { name: 'Japan 2025', dates: 'Mar 15 – 28', days: '42 days', color: 'bg-violet-500' },
            { name: 'Mallorca Summer', dates: 'Jul 10 – 24', days: '130 days', color: 'bg-blue-500' },
          ].map(t => (
            <div key={t.name} className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2.5 shadow-sm">
              <div className={`w-2 h-8 rounded-full ${t.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-xs font-semibold truncate">{t.name}</p>
                <p className="text-slate-400 text-[10px]">{t.dates}</p>
              </div>
              <span className="text-slate-400 text-[10px] shrink-0">{t.days}</span>
            </div>
          ))}
        </div>
      </div>

      {/* World map placeholder */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden h-24 relative">
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {['🇯🇵','🇮🇹','🇫🇷','🇪🇸','🇺🇸','🇦🇺'].map((f, i) => (
            <span key={i} className="text-lg" style={{ opacity: 0.85 - i * 0.1 }}>{f}</span>
          ))}
        </div>
        <div className="absolute bottom-2 left-3">
          <p className="text-white/60 text-[9px]">23 countries visited</p>
        </div>
      </div>
    </div>
  )
}

function ItineraryPanel() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-800 text-sm font-bold">Tokyo Trip</p>
          <p className="text-slate-400 text-[11px]">Day 2 · Shibuya & Harajuku</p>
        </div>
        <span className="bg-violet-100 text-violet-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">4 activities</span>
      </div>

      <div className="space-y-1.5">
        {[
          { time: '9:00 AM', name: 'Senso-ji Temple', type: 'Sightseeing', icon: '🏯', dur: '2h' },
          { time: '11:30 AM', name: 'Harajuku Street Food', type: 'Food & Drink', icon: '🍜', dur: '1.5h' },
          { time: '14:00 PM', name: 'teamLab Borderless', type: 'Museum', icon: '🎨', dur: '3h' },
          { time: '19:00 PM', name: 'Shibuya Crossing', type: 'Landmark', icon: '🌆', dur: '1h' },
        ].map(a => (
          <div key={a.name} className="flex items-center gap-2.5 bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
            <span className="text-base shrink-0">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-[11px] font-semibold truncate">{a.name}</p>
              <p className="text-slate-400 text-[10px]">{a.time} · {a.type}</p>
            </div>
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <Clock className="h-2.5 w-2.5" />
              <span className="text-[10px]">{a.dur}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetPanel() {
  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-slate-800 text-sm font-bold">Japan Trip · Budget</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-lg font-bold text-slate-900">€2,147</span>
          <span className="text-slate-400 text-xs">of €3,200</span>
          <span className="ml-auto text-violet-600 text-xs font-semibold">67%</span>
        </div>
        <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: '67%' }} />
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: '🏨', cat: 'Accommodation', spent: 800, budget: 1000, pct: 80 },
          { icon: '✈️', cat: 'Flights', spent: 620, budget: 800, pct: 77 },
          { icon: '🍜', cat: 'Food & Drinks', spent: 380, budget: 500, pct: 76 },
          { icon: '🎟️', cat: 'Activities', spent: 210, budget: 400, pct: 52 },
          { icon: '🚌', cat: 'Transport', spent: 137, budget: 200, pct: 68 },
        ].map(c => (
          <div key={c.cat} className="bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{c.icon}</span>
                <span className="text-slate-700 text-[11px] font-medium">{c.cat}</span>
              </div>
              <span className="text-slate-500 text-[10px]">€{c.spent} / €{c.budget}</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.pct > 90 ? 'bg-rose-400' : 'bg-violet-400'}`}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── App window chrome ──────────────────────────────────────────── */
const PANELS = [
  { label: 'Dashboard', component: DashboardPanel },
  { label: 'Itinerary', component: ItineraryPanel },
  { label: 'Budget', component: BudgetPanel },
]

function AppPreview() {
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setPrev(active)
        setActive(a => (a + 1) % PANELS.length)
        setFading(false)
      }, 280)
    }, 3800)
    return () => clearInterval(id)
  }, [active])

  const ActivePanel = PANELS[active].component

  return (
    <div className="w-full" style={{ perspective: '1400px' }}>
      <div style={{ transform: 'rotateX(5deg) rotateY(-1deg)', transformOrigin: 'center top' }}>
        {/* Browser chrome */}
        <div className="rounded-xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200/80">
          {/* Title bar */}
          <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-3 border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-slate-200 rounded-md px-4 py-1 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-200" />
                travel365.live
              </div>
            </div>
            {/* Tab pills */}
            <div className="hidden sm:flex gap-1">
              {PANELS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setActive(i)}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                    i === active
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* App body */}
          <div className="flex bg-[#FAFAFA]">
            {/* Sidebar */}
            <div className="w-36 bg-white border-r border-slate-100 py-4 px-2 shrink-0 hidden sm:block">
              {[
                { icon: '🗺️', label: 'Dashboard', active: active === 0 },
                { icon: '📍', label: 'My Trips', active: false },
                { icon: '📅', label: 'Itinerary', active: active === 1 },
                { icon: '💰', label: 'Budget', active: active === 2 },
                { icon: '📖', label: 'Journal', active: false },
                { icon: '🗓', label: 'Calendar', active: false },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg mb-0.5 text-[11px] font-medium transition-colors ${
                    item.active
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-500'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-[320px] overflow-hidden relative">
              <div
                className="transition-opacity duration-300"
                style={{ opacity: fading ? 0 : 1 }}
              >
                <ActivePanel />
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {PANELS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'bg-violet-600 w-6' : 'bg-slate-300 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Hero section ───────────────────────────────────────────────── */
export function LandingHero() {
  return (
    <section className="bg-white pt-16 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Text content — centered */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200/80 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Now with AI Suggestions
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-5"
          >
            Plan trips.{' '}
            <span className="text-violet-600">Remember</span>{' '}
            adventures.
            <br className="hidden sm:block" />
            {' '}Explore the world.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            The all-in-one travel planner for people who love to travel well. Organize every trip, track every memory, visualize every journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Link href="/auth/login">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white h-11 px-8 text-base shadow-md shadow-violet-200 w-full sm:w-auto">
                Start planning free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-11 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="text-slate-400 text-sm"
          >
            Free to use · No credit card required · 2 min setup
          </motion.p>
        </div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <AppPreview />
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-slate-100"
        >
          {[
            { icon: <MapPin className="h-4 w-4 text-violet-500" />, label: '197 countries supported' },
            { icon: <DollarSign className="h-4 w-4 text-emerald-500" />, label: 'Budget tracking built in' },
            { icon: <Calendar className="h-4 w-4 text-blue-500" />, label: 'Day-by-day itineraries' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-slate-500 text-sm">
              {item.icon}
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
