'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import {
  BookOpen,
  ListChecks,
  Sparkles,
  Map,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Map,
    title: 'Plan your itinerary',
    desc: 'Drag-and-drop activities, set times, and see your whole trip laid out day by day.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: ListChecks,
    title: 'Never forget a thing',
    desc: 'Smart packing lists and travel checklists. Drag to reorder, check off as you go.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    title: 'Keep a travel journal',
    desc: 'Capture memories with photos, mood, and location. Beautiful timeline of your journey.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Sparkles,
    title: 'AI trip suggestions',
    desc: 'Get personalised restaurant, activity, and accommodation recommendations powered by AI.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
]

const SCREENS = [
  // Itinerary
  <div key="itinerary" className="p-4 space-y-2.5">
    <div className="text-white text-xs font-semibold mb-3">Day 3 — July 17</div>
    {[
      { time: '09:00', name: 'TeamLab Borderless', tag: 'Art' },
      { time: '12:30', name: 'Tsukiji Market lunch', tag: 'Food' },
      { time: '15:00', name: 'Odaiba Waterfront', tag: 'Walk' },
      { time: '19:30', name: 'Robot Restaurant show', tag: 'Night' },
    ].map(item => (
      <div key={item.name} className="flex items-center gap-2.5 bg-slate-700/50 rounded-lg px-3 py-2">
        <div className="text-xs text-slate-400 w-10 shrink-0 font-mono">{item.time}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{item.name}</div>
        </div>
        <div className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-medium">{item.tag}</div>
      </div>
    ))}
  </div>,

  // Checklist
  <div key="checklist" className="p-4 space-y-2">
    <div className="text-white text-xs font-semibold mb-3">Packing Checklist</div>
    {[
      { label: 'Passport + copies', done: true },
      { label: 'Travel insurance docs', done: true },
      { label: 'JR Rail Pass', done: true },
      { label: 'Pocket WiFi reserved', done: false },
      { label: 'Yen exchanged', done: false },
    ].map(item => (
      <div key={item.label} className="flex items-center gap-2.5">
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
        }`}>
          {item.done && <div className="w-2 h-1.5 border-b-2 border-l-2 border-white -rotate-45 mb-0.5" />}
        </div>
        <span className={`text-xs ${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
          {item.label}
        </span>
      </div>
    ))}
  </div>,

  // Journal
  <div key="journal" className="p-4 space-y-3">
    <div className="text-white text-xs font-semibold mb-2">Day 3 journal</div>
    <div className="bg-slate-700/50 rounded-xl overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80"
        alt="Tokyo"
        className="w-full h-20 object-cover"
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">😍</span>
          <span className="text-white text-xs font-medium">TeamLab was unreal</span>
        </div>
        <div className="text-slate-400 text-xs line-clamp-2">
          Spent 4 hours completely lost in the digital art. The &quot;Borderless World&quot; room made me tear up a little…
        </div>
      </div>
    </div>
  </div>,

  // AI suggestions
  <div key="ai" className="p-4 space-y-2">
    <div className="text-white text-xs font-semibold mb-2">✨ AI Recommendations</div>
    {[
      { name: 'Ichiran Ramen', tag: 'Food', price: '¥1,200' },
      { name: 'Mount Fuji day trip', tag: 'Activity', price: '¥5,000' },
      { name: 'Onsen experience', tag: 'Wellness', price: '¥3,500' },
    ].map(s => (
      <div key={s.name} className="flex items-center gap-2.5 bg-slate-700/50 rounded-lg px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white">{s.name}</div>
          <div className="text-xs text-slate-400">{s.tag}</div>
        </div>
        <div className="text-xs text-slate-300 font-mono">{s.price}</div>
        <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md font-medium">
          Add
        </div>
      </div>
    ))}
  </div>,
]

export function LandingPhoneShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const index = Math.min(
      FEATURES.length - 1,
      Math.floor(latest * FEATURES.length),
    )
    setActiveIndex(index)
  })

  return (
    <section ref={containerRef} className="relative bg-slate-950" style={{ height: `${FEATURES.length * 55}vh` }}>
      {/* Sticky wrapper */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: feature list */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5 mb-4">
                  Features
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  Everything you need on the go
                </h2>
              </motion.div>

              <div className="space-y-4">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon
                  const isActive = i === activeIndex
                  return (
                    <button
                      key={f.title}
                      onClick={() => setActiveIndex(i)}
                      className={`w-full text-left flex items-start gap-4 p-3 rounded-xl transition-all duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isActive ? f.bg : 'bg-slate-800/50'}`}>
                        <Icon className={`h-5 w-5 ${isActive ? f.color : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <div className={`font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>{f.title}</div>
                        <div className="text-slate-400 text-sm mt-0.5 leading-relaxed">{f.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[260px]">
                {/* Phone frame */}
                <div className="relative bg-slate-800 rounded-[36px] p-3 border-2 border-slate-700 shadow-2xl shadow-black/60">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-950 rounded-b-xl z-10" />
                  {/* Screen */}
                  <div className="bg-slate-900 rounded-[28px] overflow-hidden min-h-[420px]">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-5 pt-8 pb-2">
                      <span className="text-white text-xs font-semibold">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-2 border border-white/60 rounded-sm relative">
                          <div className="absolute inset-0.5 right-auto w-1.5 bg-white/60 rounded-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Screen content */}
                    <div className="relative overflow-hidden">
                      <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {SCREENS[activeIndex]}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Glow */}
                <div className="absolute -inset-8 -z-10 bg-violet-600/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
