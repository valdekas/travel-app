'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MapPin, Clock, DollarSign, Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ── Tab content panels ─────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="p-6 space-y-5">
      {/* Trip header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl shrink-0">
          🗼
        </div>
        <div>
          <h3 className="text-slate-900 font-bold text-lg">Tokyo Adventure</h3>
          <p className="text-slate-500 text-sm">Japan · Mar 15 – 28, 2025 · 14 days</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Upcoming</span>
            <span className="bg-violet-100 text-violet-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Planning</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Places saved', value: '24', icon: <MapPin className="h-3.5 w-3.5 text-rose-500" /> },
          { label: 'Days planned', value: '14/14', icon: <Clock className="h-3.5 w-3.5 text-violet-500" /> },
          { label: 'Budget used', value: '67%', icon: <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> },
          { label: 'AI suggestions', value: '38', icon: <Star className="h-3.5 w-3.5 text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <p className="text-slate-900 font-bold text-sm">{s.value}</p>
            <p className="text-slate-400 text-[10px] leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trip readiness */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-700 text-sm font-semibold">Trip Readiness</p>
          <span className="text-violet-600 font-bold text-sm">82%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: '82%' }} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
          {['Itinerary complete', 'Places saved', 'Budget planned', 'Documents ready'].map((item, i) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className={`h-3 w-3 ${i < 3 ? 'text-emerald-500' : 'text-slate-300'}`} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlacesTab() {
  const PLACES = [
    { name: 'Senso-ji Temple', type: 'Temple', area: 'Asakusa', icon: '🏯', saved: true, rating: 4.9 },
    { name: 'Tsukiji Outer Market', type: 'Food Market', area: 'Tsukiji', icon: '🦀', saved: true, rating: 4.7 },
    { name: 'teamLab Borderless', type: 'Museum', area: 'Odaiba', icon: '🎨', saved: true, rating: 4.8 },
    { name: 'Shinjuku Gyoen', type: 'Park', area: 'Shinjuku', icon: '🌸', saved: true, rating: 4.6 },
    { name: 'Ramen Street', type: 'Restaurant', area: 'Tokyo Station', icon: '🍜', saved: false, rating: 4.5 },
    { name: 'Akihabara Electric Town', type: 'Shopping', area: 'Akihabara', icon: '🎮', saved: false, rating: 4.4 },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-700 text-sm font-semibold">Saved Places · Tokyo</h3>
        <span className="text-violet-600 text-xs font-semibold">{PLACES.length} places</span>
      </div>
      <div className="space-y-2">
        {PLACES.map(p => (
          <div key={p.name} className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
            <span className="text-xl shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-semibold truncate">{p.name}</p>
              <p className="text-slate-400 text-xs">{p.type} · {p.area}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-semibold text-slate-600">{p.rating}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${p.saved ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                {p.saved && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ItineraryTab() {
  const DAYS = [
    {
      day: 'Day 1', title: 'Arrival & Shinjuku', date: 'Mar 15',
      activities: [
        { time: '3:00 PM', name: 'Hotel check-in', icon: '🏨', dur: '30min' },
        { time: '5:00 PM', name: 'Shinjuku stroll', icon: '🌆', dur: '2h' },
        { time: '7:30 PM', name: 'Dinner at Ichiran Ramen', icon: '🍜', dur: '1h' },
      ],
    },
    {
      day: 'Day 2', title: 'Shibuya & Harajuku', date: 'Mar 16',
      activities: [
        { time: '9:00 AM', name: 'Senso-ji Temple', icon: '🏯', dur: '2h' },
        { time: '11:30 AM', name: 'Harajuku Street Food', icon: '🍡', dur: '1.5h' },
        { time: '2:00 PM', name: 'teamLab Borderless', icon: '🎨', dur: '3h' },
        { time: '7:00 PM', name: 'Shibuya Crossing at night', icon: '🌃', dur: '1h' },
      ],
    },
    {
      day: 'Day 3', title: 'Mt. Fuji Day Trip', date: 'Mar 17',
      activities: [
        { time: '7:00 AM', name: 'Shinkansen to Fuji', icon: '🚄', dur: '1h' },
        { time: '10:00 AM', name: 'Lake Kawaguchiko', icon: '🏔️', dur: '4h' },
        { time: '6:00 PM', name: 'Return to Tokyo', icon: '🚄', dur: '1h' },
      ],
    },
  ]

  return (
    <div className="p-6 space-y-4">
      {DAYS.map(({ day, title, date, activities }) => (
        <div key={day} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="bg-violet-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{day}</span>
              <span className="text-slate-800 text-sm font-semibold">{title}</span>
            </div>
            <span className="text-slate-400 text-xs">{date}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.map(a => (
              <div key={a.name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-xs font-medium truncate">{a.name}</p>
                  <p className="text-slate-400 text-[10px]">{a.time} · {a.dur}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BudgetTab() {
  const CATEGORIES = [
    { icon: '✈️', name: 'Flights', spent: 680, budget: 800, color: 'bg-blue-400' },
    { icon: '🏨', name: 'Accommodation', spent: 920, budget: 1100, color: 'bg-violet-400' },
    { icon: '🍜', name: 'Food & Drinks', spent: 310, budget: 500, color: 'bg-amber-400' },
    { icon: '🎟️', name: 'Activities', spent: 180, budget: 400, color: 'bg-rose-400' },
    { icon: '🚌', name: 'Transport', spent: 57, budget: 200, color: 'bg-emerald-400' },
    { icon: '🛍️', name: 'Shopping', spent: 200, budget: 200, color: 'bg-orange-400' },
  ]

  const totalSpent = CATEGORIES.reduce((a, c) => a + c.spent, 0)
  const totalBudget = CATEGORIES.reduce((a, c) => a + c.budget, 0)
  const pct = Math.round((totalSpent / totalBudget) * 100)

  return (
    <div className="p-6 space-y-4">
      {/* Summary */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Total spent</p>
            <p className="text-slate-900 text-2xl font-bold">€{totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs mb-0.5">Budget</p>
            <p className="text-slate-600 font-semibold">€{totalBudget.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-violet-600 text-xs font-semibold mt-1.5">{pct}% of budget used</p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map(c => {
          const catPct = Math.round((c.spent / c.budget) * 100)
          return (
            <div key={c.name} className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{c.icon}</span>
                  <span className="text-slate-700 text-xs font-medium">{c.name}</span>
                </div>
                <span className="text-slate-500 text-xs">€{c.spent} / €{c.budget}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${c.color} rounded-full`}
                  style={{ width: `${Math.min(catPct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Interactive demo ───────────────────────────────────────────── */
const TABS = [
  { id: 'overview', label: 'Overview', component: OverviewTab },
  { id: 'places', label: 'Places', component: PlacesTab },
  { id: 'itinerary', label: 'Itinerary', component: ItineraryTab },
  { id: 'budget', label: 'Budget', component: BudgetTab },
]

export function LandingDemo() {
  const [active, setActive] = useState(0)
  const ActiveTab = TABS[active].component

  return (
    <section id="demo" className="bg-slate-50 py-20 px-6 border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">Interactive Demo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            See it in action
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Explore a sample Tokyo trip — no sign-up required.
          </p>
        </div>

        {/* Demo window */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Window chrome */}
          <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-3 border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-slate-200 rounded-md px-4 py-1 text-xs text-slate-400 flex items-center gap-2 max-w-xs w-full justify-center">
                <div className="w-2 h-2 rounded-full bg-violet-300" />
                Tokyo Adventure · Sample Trip
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 bg-white px-4">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActive(i)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  i === active
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px] overflow-y-auto max-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveTab />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer CTA */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <p className="text-slate-500 text-sm">Ready to plan your own trip?</p>
            <Link href="/auth/login">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                Create your own trip
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
