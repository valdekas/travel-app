'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Globe, MapPin, Calendar, CheckSquare, BarChart3, BookOpen,
  ArrowRight, Plane, Star,
} from 'lucide-react'

/* ─── animation helper ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.09 },
  }),
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── data ─────────────────────────────────────────────────────────── */
const features = [
  { icon: Globe,       grad: 'from-violet-500 to-purple-600', title: 'Trip Planning',     desc: 'Organize countries, regions, cities and places in a beautiful hierarchy.' },
  { icon: Calendar,    grad: 'from-blue-500 to-cyan-500',     title: 'Itinerary Builder', desc: 'Drag-and-drop day planner with time blocks and activities.' },
  { icon: MapPin,      grad: 'from-rose-500 to-pink-600',     title: 'Places & Maps',     desc: 'Save attractions and restaurants with Google Maps integration.' },
  { icon: BarChart3,   grad: 'from-emerald-500 to-teal-500',  title: 'Budget Tracker',    desc: 'Track planned vs actual spending across all trip categories.' },
  { icon: CheckSquare, grad: 'from-amber-500 to-orange-500',  title: 'Travel Checklist',  desc: 'Never forget documents, packing, or reservations again.' },
  { icon: BookOpen,    grad: 'from-indigo-500 to-blue-600',   title: 'Travel Journal',    desc: 'Capture memories, photos, and ratings for every place you visit.' },
]

const destinations = [
  { name: 'Italy',       sub: 'Rome · Venice · Amalfi',     tag: 'Most Popular', rating: '4.9', img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80' },
  { name: 'Japan',       sub: 'Tokyo · Kyoto · Osaka',      tag: 'Trending',     rating: '4.8', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { name: 'Switzerland', sub: 'Alps · Lucerne · Zurich',    tag: "Editor's Pick",rating: '4.9', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  { name: 'Iceland',     sub: 'Reykjavik · Aurora · Fjords',tag: 'Adventure',    rating: '4.7', img: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=600&q=80' },
  { name: 'Bali',        sub: 'Ubud · Seminyak · Kuta',     tag: 'Relaxation',   rating: '4.8', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
]

const testimonials = [
  { name: 'Sarah Chen',   role: 'Travel Blogger',   av: 'SC', grad: 'from-violet-500 to-purple-600', text: 'Travel Planner Pro completely transformed how I plan trips. The itinerary builder alone saved me 10+ hours on my Japan trip.', stat: '47 trips planned' },
  { name: 'Marcus Weber', role: 'Digital Nomad',    av: 'MW', grad: 'from-blue-500 to-cyan-500',     text: "The budget tracker is incredibly accurate. I've never gone over budget since I started using it. Absolutely essential.", stat: '31 countries visited' },
  { name: 'Priya Sharma', role: 'Family Traveler',  av: 'PS', grad: 'from-rose-500 to-pink-600',     text: "Planning family vacations used to be chaotic. Now everything's in one place — checklist, itinerary, budget. Life-changing.", stat: '12 family trips' },
]

const steps = [
  { n: '01', icon: Globe,    title: 'Create Your Trip',   desc: 'Add your destination, travel dates and start building your dream journey in minutes.' },
  { n: '02', icon: Calendar, title: 'Plan Activities',    desc: 'Build your day-by-day itinerary, discover places, and keep your budget on track.' },
  { n: '03', icon: Plane,    title: 'Enjoy & Remember',   desc: 'Travel with full confidence. Journal every experience and relive every moment.' },
]

const stats = [
  { v: '50K+', l: 'Trips Planned' },
  { v: '120+', l: 'Countries' },
  { v: '4.9★', l: 'Average Rating' },
  { v: 'Free', l: 'Always' },
]

/* ─── Globe illustration ────────────────────────────────────────────── */
function GlobeIllustration() {
  const pins: { x: number; y: number; label: string }[] = [
    { x: 148, y: 188, label: 'New York' },
    { x: 262, y: 178, label: 'Rome' },
    { x: 355, y: 185, label: 'Tokyo' },
    { x: 348, y: 260, label: 'Bali' },
    { x: 230, y: 140, label: 'Iceland' },
  ]

  const latLines = [60, 100, 140, 190, 240, 290, 340, 380, 420]
  const lonAngles = [0, 30, 60, 90, 120, 150]
  const paths = [
    'M 148 188 Q 198 128 262 178',
    'M 262 178 Q 318 142 355 185',
    'M 355 185 Q 368 225 348 260',
    'M 230 140 Q 248 158 262 178',
  ]

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-80 h-80 rounded-full bg-violet-700/20 blur-3xl pointer-events-none" />
      <div className="absolute w-60 h-60 rounded-full bg-blue-600/15 blur-2xl pointer-events-none translate-x-16 translate-y-8" />

      <svg viewBox="0 0 480 480" className="w-full max-w-[460px] drop-shadow-2xl">
        <defs>
          <radialGradient id="gg" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="60%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="gr" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.45" />
          </radialGradient>
          <filter id="fp">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="gc"><circle cx="240" cy="240" r="190" /></clipPath>
        </defs>

        <circle cx="240" cy="240" r="190" fill="url(#gg)" />

        {latLines.map((cy) => {
          const dy = cy - 240
          const rx = Math.sqrt(Math.max(0, 190 * 190 - dy * dy))
          return rx > 0 ? (
            <ellipse key={cy} cx="240" cy={cy} rx={rx} ry={rx * 0.22}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ) : null
        })}

        {lonAngles.map((a) => (
          <ellipse key={a} cx="240" cy="240" rx={48} ry={190}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"
            transform={`rotate(${a} 240 240)`} />
        ))}

        <g clipPath="url(#gc)" fill="#166534" fillOpacity="0.68">
          <path d="M95 155 C100 135 135 128 155 144 C170 156 173 178 162 198 C152 216 130 222 110 212 C90 202 85 172 95 155Z" />
          <path d="M128 222 C142 214 165 220 170 240 C177 264 168 294 154 302 C140 310 124 302 118 282 C112 262 115 228 128 222Z" />
          <path d="M222 150 C234 140 257 138 268 149 C278 160 275 178 263 189 C252 198 230 196 220 184 C210 172 212 158 222 150Z" />
          <path d="M224 196 C240 187 264 192 272 206 C284 224 278 258 262 268 C246 278 228 272 220 256 C212 240 210 204 224 196Z" />
          <path d="M275 148 C295 138 345 142 368 160 C384 174 388 198 374 218 C362 236 334 242 308 236 C283 230 266 216 264 198 C261 180 258 155 275 148Z" />
          <path d="M350 264 C362 256 382 262 386 277 C390 292 378 306 364 305 C350 304 340 292 342 278 C343 272 347 268 350 264Z" />
        </g>

        <circle cx="240" cy="240" r="190" fill="url(#gr)" />
        <circle cx="240" cy="240" r="190" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.55" />

        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#a78bfa" strokeWidth="1.5"
            strokeDasharray="5 4" opacity="0.65" />
        ))}

        {pins.map(({ x, y, label }) => (
          <g key={label} filter="url(#fp)">
            <circle cx={x} cy={y} r="11" fill="#fbbf24" fillOpacity="0.15">
              <animate attributeName="r" from="7" to="19" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="5" fill="#fbbf24" />
            <circle cx={x} cy={y} r="2.5" fill="white" />
          </g>
        ))}

        <text fontSize="16" fill="white" style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }}>
          ✈
          <animateMotion
            dur="10s"
            repeatCount="indefinite"
            rotate="auto"
            path="M 148 188 Q 198 128 262 178 Q 318 142 355 185"
          />
        </text>
      </svg>

      {/* floating UI chips */}
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-6 right-0 lg:-right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Flight Booked</p>
            <p className="text-slate-400 text-[10px]">Tokyo → Bali · Jun 28</p>
          </div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute bottom-24 -left-2 lg:-left-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">18 Places Saved</p>
            <p className="text-slate-400 text-[10px]">Japan Wishlist</p>
          </div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-40 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Budget: $2,400</p>
            <p className="text-slate-400 text-[10px]">68% utilized</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Phone mockup ──────────────────────────────────────────────────── */
function Phone({ delay = 0, tilt = 0 }: { delay?: number; tilt?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ rotate: tilt }}
      className="relative w-[200px] h-[420px] bg-gray-900 rounded-[36px] border-[6px] border-gray-800 shadow-[0_0_60px_rgba(124,58,237,0.3)] shrink-0"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-2xl z-10" />
      <div className="w-full h-full rounded-[30px] overflow-hidden bg-gradient-to-b from-violet-950 to-slate-950 flex flex-col">
        <div className="h-8 bg-black/20 flex items-center justify-between px-4 pt-2 shrink-0">
          <span className="text-white text-[8px] font-medium">9:41</span>
          <div className="flex items-center gap-0.5">
            {[2, 3, 4].map(h => <div key={h} className="w-1 bg-white rounded-sm" style={{ height: h }} />)}
          </div>
        </div>
        <div className="bg-violet-900/40 px-4 py-2.5 shrink-0 border-b border-white/5">
          <p className="text-[9px] text-slate-400">My Trip</p>
          <p className="text-white text-xs font-bold">Japan 2025 ✨</p>
        </div>
        <div className="p-3 space-y-2 flex-1 overflow-hidden">
          {['Day 1 · Tokyo Arrival', 'Day 2 · Shibuya & Harajuku', 'Day 3 · Mt. Fuji Day Trip'].map((d, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-2.5 border border-white/8">
              <p className="text-white text-[9px] font-semibold">{d}</p>
              <div className="mt-1.5 flex gap-1">
                {['Museum', 'Lunch', 'Hotel'].slice(0, i + 1).map(t => (
                  <span key={t} className="bg-violet-500/25 text-violet-300 text-[7px] px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 p-2.5 flex justify-around shrink-0">
          {[Globe, Calendar, MapPin, BarChart3].map((Icon, i) => (
            <div key={i} className={`p-2 rounded-xl ${i === 0 ? 'bg-violet-500/25' : ''}`}>
              <Icon className="w-3.5 h-3.5 text-violet-400" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null)

  return (
    <div className="min-h-screen bg-[#030711] text-white overflow-x-hidden">
      {/* ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-900/18 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-blue-900/12 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-900/18 blur-[100px]" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Travel Planner Pro</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">Sign In</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 border-0">
              Get Started Free
            </Button>
          </Link>
        </motion.div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative pt-10 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* left */}
          <div className="relative z-10">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-8">
                <Star className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />
                The ultimate travel planning companion
              </div>
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
              className="text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.06] tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-violet-100 to-slate-300 bg-clip-text text-transparent">
                Plan trips that
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                feel legendary
              </span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
              className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              From dreaming about Japan to exploring the Amalfi Coast — organize every detail of your journey. Itinerary, budget, places, journal, all in one beautiful place.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/login">
                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 h-12 text-base shadow-xl shadow-violet-500/25 border-0 w-full sm:w-auto">
                  Start Planning Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 px-8 h-12 text-base w-full sm:w-auto">
                  <Plane className="mr-2 h-4 w-4" /> See Live Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  'from-violet-400 to-purple-500',
                  'from-blue-400 to-cyan-500',
                  'from-rose-400 to-pink-500',
                  'from-amber-400 to-orange-500',
                  'from-emerald-400 to-teal-500',
                ].map((g, i) => (
                  <div key={i}
                    className={`w-8 h-8 rounded-full border-2 border-[#030711] bg-gradient-to-br ${g} flex items-center justify-center text-[10px] font-bold text-white`}>
                    {['S','M','P','A','J'][i]}
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-semibold">50,000+</span> travelers planning smarter
              </p>
            </motion.div>
          </div>

          {/* right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:h-[540px] flex items-center"
          >
            <GlobeIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="border-y border-white/8 bg-white/[0.025] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{v}</p>
              <p className="text-slate-500 text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Everything in one place
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            A complete toolkit built for travelers who want to explore more and stress less.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, grad, title, desc }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-colors h-full"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Start in minutes
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

            {steps.map(({ n, icon: Icon, title, desc }, i) => (
              <Reveal key={n} delay={i * 0.12} className="relative">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/25">
                      <Icon className="w-9 h-9 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-xs font-bold text-violet-300">
                      {n}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Destinations</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Where will you go next?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Discover and save your dream destinations. Build your wishlist, then turn it into a trip.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map(({ name, sub, tag, rating, img }, i) => (
            <Reveal key={name} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className="relative h-64 w-full">
                  <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/15 backdrop-blur border border-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur rounded-full px-2.5 py-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-white text-xs font-semibold">{rating}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{name}</h3>
                    <p className="text-slate-300 text-sm mt-0.5">{sub}</p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── MOBILE PREVIEW ── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">App Preview</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Beautiful on every screen
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A seamless experience whether you're planning from your desk or adjusting on the go.
            </p>
          </Reveal>

          <div className="flex justify-center items-end gap-6 md:gap-10">
            <Phone delay={0.5} tilt={-6} />
            <Phone delay={0} tilt={0} />
            <Phone delay={1} tilt={6} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Loved by travelers
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, av, grad, text, stat }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                <div className="flex mb-3 gap-0.5">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                    {av}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-slate-500 text-xs">{role} · {stat}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <Reveal>
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/60 via-purple-900/60 to-indigo-900/60 border border-violet-500/30 p-12 text-center">
            {/* background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-violet-200 to-slate-300 bg-clip-text text-transparent">
                  Your next adventure
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  starts here
                </span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                Join 50,000+ travelers who plan smarter, travel better, and remember every moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/login">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-10 h-12 text-base shadow-xl shadow-violet-500/25 border-0 w-full sm:w-auto">
                    Start Planning — It&apos;s Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 h-12 text-base w-full sm:w-auto">
                    View Demo
                  </Button>
                </Link>
              </div>
              <p className="text-slate-600 text-sm mt-6">No credit card required · Free forever plan</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">Travel Planner Pro</span>
          </div>
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Travel Planner Pro. Built for explorers.</p>
          <div className="flex gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
