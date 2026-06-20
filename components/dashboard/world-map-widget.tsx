'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  ComposableMap, Geographies, Geography, Marker, useMapContext,
} from 'react-simple-maps'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'
import { NUMERIC_TO_A2, COUNTRY_COORDS, resolveA2 } from '@/lib/utils/country-codes'
import {
  Globe, Trophy, ZoomIn, ZoomOut, RotateCcw,
  Home, X, Search, Check, Calendar, Clock, Wallet, MapPin,
} from 'lucide-react'

const GEO_URL = '/countries-110m.json'

/* ── Map interaction constants ───────────────────────── */
const SVG_W     = 900
const SVG_H     = 430
const MAP_MIN_K = 1
const MAP_MAX_K = 6
const PAN_SENS  = 0.52   // 48% reduction vs raw delta
const FRICTION  = 0.91   // inertia decay per frame

/* ─── Continent map ──────────────────────────────────── */
const CONTINENT: Record<string, string> = {
  AF:'AF',AL:'EU',DZ:'AF',AO:'AF',AR:'SA',AM:'AS',AU:'OC',AT:'EU',AZ:'AS',
  BS:'NA',BH:'AS',BD:'AS',BY:'EU',BE:'EU',BZ:'NA',BJ:'AF',BT:'AS',BO:'SA',
  BA:'EU',BW:'AF',BR:'SA',BN:'AS',BG:'EU',BF:'AF',BI:'AF',KH:'AS',CM:'AF',
  CA:'NA',CF:'AF',TD:'AF',CL:'SA',CN:'AS',CO:'SA',KM:'AF',CG:'AF',CD:'AF',
  CR:'NA',CI:'AF',HR:'EU',CU:'NA',CY:'EU',CZ:'EU',DK:'EU',DO:'NA',EC:'SA',
  EG:'AF',ET:'AF',ER:'AF',EE:'EU',FJ:'OC',FI:'EU',FR:'EU',GA:'AF',GE:'AS',
  GM:'AF',DE:'EU',GH:'AF',GR:'EU',GT:'NA',GN:'AF',GY:'SA',HT:'NA',HN:'NA',
  HU:'EU',IS:'EU',IN:'AS',ID:'AS',IR:'AS',IQ:'AS',IE:'EU',IL:'AS',IT:'EU',
  JM:'NA',JP:'AS',JO:'AS',KZ:'AS',KE:'AF',KP:'AS',KR:'AS',KW:'AS',KG:'AS',
  LA:'AS',LV:'EU',LB:'AS',LS:'AF',LR:'AF',LY:'AF',LT:'EU',LU:'EU',MG:'AF',
  MW:'AF',MY:'AS',MV:'AS',ML:'AF',MR:'AF',MX:'NA',MD:'EU',MN:'AS',ME:'EU',
  MA:'AF',MZ:'AF',MM:'AS',NA:'AF',NP:'AS',NL:'EU',NZ:'OC',NI:'NA',NE:'AF',
  NG:'AF',MK:'EU',NO:'EU',OM:'AS',PK:'AS',PA:'NA',PG:'OC',PY:'SA',PE:'SA',
  PH:'AS',PL:'EU',PT:'EU',QA:'AS',RO:'EU',RU:'EU',RW:'AF',SA:'AS',SN:'AF',
  RS:'EU',SL:'AF',SG:'AS',SK:'EU',SI:'EU',SO:'AF',ZA:'AF',SS:'AF',ES:'EU',
  LK:'AS',SD:'AF',SR:'SA',SE:'EU',CH:'EU',SY:'AS',TW:'AS',TJ:'AS',TZ:'AF',
  TH:'AS',TL:'AS',TG:'AF',TT:'NA',TN:'AF',TR:'AS',TM:'AS',UG:'AF',UA:'EU',
  AE:'AS',GB:'EU',US:'NA',UY:'SA',UZ:'AS',VE:'SA',VN:'AS',YE:'AS',ZM:'AF',ZW:'AF',
}
const countContinents = (codes: Set<string>) =>
  new Set([...codes].map(c => CONTINENT[c]).filter(Boolean)).size

/* ─── Achievement definitions ────────────────────────── */
const ACHIEVEMENTS: { icon: string; label: string; desc: string; check: (trips: Trip[], visited: Set<string>) => boolean }[] = [
  { icon: '🛫', label: 'First Trip',    desc: 'Complete your first trip',              check: (t) => t.length >= 1 },
  { icon: '🌍', label: '5 Countries',   desc: 'Visit 5 different countries',            check: (_, v) => v.size >= 5 },
  { icon: '🌐', label: '10 Countries',  desc: 'Visit 10 different countries',           check: (_, v) => v.size >= 10 },
  { icon: '🗺️', label: '3 Continents', desc: 'Travel across 3 continents',             check: (_, v) => countContinents(v) >= 3 },
  { icon: '✈️', label: '10 Trips',      desc: 'Plan & complete 10 trips',               check: (t) => t.length >= 10 },
  { icon: '🏆', label: 'Globe Trotter', desc: 'Visit 20 countries — legendary status', check: (_, v) => v.size >= 20 },
  { icon: '🌏', label: 'Asia Explorer', desc: 'Travel to an Asian country',             check: (_, v) => [...v].some(c => CONTINENT[c] === 'AS') },
  { icon: '🏖️', label: 'Island Hopper', desc: 'Visit an island paradise',              check: (_, v) => ['MV','FJ','ID','PH','TH','LK','CU','JM'].some(c => v.has(c)) },
]

/* ─── Popular home countries ─────────────────────────── */
const HOME_COUNTRIES = [
  { iso2: 'IE', name: 'Ireland' }, { iso2: 'GB', name: 'United Kingdom' },
  { iso2: 'US', name: 'United States' }, { iso2: 'FR', name: 'France' },
  { iso2: 'DE', name: 'Germany' }, { iso2: 'IT', name: 'Italy' },
  { iso2: 'ES', name: 'Spain' }, { iso2: 'PL', name: 'Poland' },
  { iso2: 'NL', name: 'Netherlands' }, { iso2: 'BE', name: 'Belgium' },
  { iso2: 'PT', name: 'Portugal' }, { iso2: 'CH', name: 'Switzerland' },
  { iso2: 'AT', name: 'Austria' }, { iso2: 'SE', name: 'Sweden' },
  { iso2: 'NO', name: 'Norway' }, { iso2: 'DK', name: 'Denmark' },
  { iso2: 'FI', name: 'Finland' }, { iso2: 'CZ', name: 'Czech Republic' },
  { iso2: 'CA', name: 'Canada' }, { iso2: 'AU', name: 'Australia' },
  { iso2: 'NZ', name: 'New Zealand' }, { iso2: 'JP', name: 'Japan' },
  { iso2: 'SG', name: 'Singapore' }, { iso2: 'IN', name: 'India' },
  { iso2: 'AE', name: 'UAE' }, { iso2: 'ZA', name: 'South Africa' },
  { iso2: 'BR', name: 'Brazil' }, { iso2: 'MX', name: 'Mexico' },
  { iso2: 'AR', name: 'Argentina' }, { iso2: 'TR', name: 'Turkey' },
  { iso2: 'RU', name: 'Russia' }, { iso2: 'UA', name: 'Ukraine' },
  { iso2: 'EG', name: 'Egypt' }, { iso2: 'MA', name: 'Morocco' },
  { iso2: 'TH', name: 'Thailand' }, { iso2: 'MY', name: 'Malaysia' },
  { iso2: 'KR', name: 'South Korea' }, { iso2: 'CN', name: 'China' },
  { iso2: 'GR', name: 'Greece' }, { iso2: 'HR', name: 'Croatia' },
].sort((a, b) => a.name.localeCompare(b.name))

/* ─── Home picker ────────────────────────────────────── */
function HomeCountryPicker({ current, onSelect, onClose }: {
  current: string | null
  onSelect: (iso2: string, name: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = HOME_COUNTRIES.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute top-11 right-0 z-50 w-68 bg-[#071628]/98 backdrop-blur-2xl border border-white/12 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden"
      style={{ width: 260 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Home className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-white font-semibold text-sm">Home Country</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-white/8">
        <div className="flex items-center gap-2 bg-white/6 rounded-xl px-3 py-2">
          <Search className="w-3 h-3 text-slate-500 shrink-0" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search…" className="bg-transparent text-white text-xs placeholder-slate-500 outline-none w-full" />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.map(({ iso2, name }) => (
          <button key={iso2} onClick={() => onSelect(iso2, name)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-white/6 transition-colors text-left group">
            <div className="flex items-center gap-2.5">
              <FlagImg code={iso2} className="w-5 h-[15px]" />
              <span className="text-slate-200 text-xs group-hover:text-white transition-colors">{name}</span>
            </div>
            {current === iso2 && <Check className="w-3 h-3 text-violet-400 shrink-0" />}
          </button>
        ))}
        {filtered.length === 0 && <div className="px-4 py-5 text-center text-slate-500 text-xs">No countries found</div>}
      </div>
    </motion.div>
  )
}

/* ─── Home pin ───────────────────────────────────────── */
function HomePing({ name: _name }: { name: string }) {
  return (
    <g>
      <circle r={20} fill="#7c3aed" opacity={0}>
        <animate attributeName="r" from="7" to="22" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.28" to="0" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle r={14} fill="#6d28d9" opacity={0}>
        <animate attributeName="r" from="5" to="16" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.35" to="0" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      <circle r={8} fill="#7c3aed" stroke="#c4b5fd" strokeWidth={1.5} />
      <text x={0} y={3.5} textAnchor="middle" fontSize={8} fill="white">🏠</text>
    </g>
  )
}

/* ─── Trip marker ────────────────────────────────────── */
interface TripMarkerProps {
  trip: Trip
  isNext: boolean
  onEnter: (id: string, e: React.MouseEvent) => void
  onLeave: () => void
  onClick: () => void
}
function TripMarker({ trip, isNext, onEnter, onLeave, onClick }: TripMarkerProps) {
  const days = trip.start_date ? daysUntil(trip.start_date) : null
  const baseColor = isNext ? '#f59e0b' : '#fb923c'
  const ringColor = isNext ? '#fde68a' : '#fed7aa'
  const badgeBg  = isNext ? '#d97706' : '#ea580c'

  return (
    <g style={{ cursor: 'pointer' }}
      onMouseEnter={e => onEnter(trip.id, e as unknown as React.MouseEvent)}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <circle r={22} fill={baseColor} opacity={0}>
        <animate attributeName="r" from="9" to="26" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.22" to="0" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle r={16} fill={baseColor} opacity={0}>
        <animate attributeName="r" from="7" to="18" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.32" to="0" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle r={9} fill={baseColor} opacity={0}>
        <animate attributeName="r" from="5" to="11" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.45" to="0" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle r={7} fill={baseColor} stroke={ringColor} strokeWidth={1.8} filter="url(#markerGlow)" />
      <circle r={2.5} fill="white" />
      {days !== null && days >= 0 && (
        <g transform="translate(9, -13)">
          <rect x={0} y={0} width={30} height={14} rx={7} fill={badgeBg} />
          <text x={15} y={10} textAnchor="middle" fontSize={7.5} fill="white" fontWeight="700">
            {days === 0 ? 'Today' : `${days}d`}
          </text>
        </g>
      )}
    </g>
  )
}

/* ─── Flight path ────────────────────────────────────── */
function FlightPath({ from, to, index }: { from: [number, number]; to: [number, number]; index: number }) {
  const { projection } = useMapContext()
  const pid = `fp-${index}-${Math.abs(Math.round(from[0]))}-${Math.abs(Math.round(to[0]))}`

  const p1 = projection(from)
  const p2 = projection(to)
  if (!p1 || !p2) return null

  const [x1, y1] = p1
  const [x2, y2] = p2
  const dx = x2 - x1, dy = y2 - y1
  const spread = Math.hypot(dx, dy)
  const mx = (x1 + x2) / 2 - dy * 0.18
  const my = (y1 + y2) / 2 - spread * 0.28
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
  const speed = `${7 + index * 2}s`

  return (
    <g>
      {/* Wide soft ambient glow under the route */}
      <path d={d} fill="none" stroke="#f97316" strokeWidth={12} opacity={0.04} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fbbf24" strokeWidth={4}  opacity={0.09} strokeLinecap="round"
        style={{ animation: 'routePulse 3s ease-in-out infinite' }} />
      {/* Hidden reference path for animateMotion */}
      <path id={pid} d={d} fill="none" stroke="none" />
      {/* Dashed route line */}
      <path d={d} fill="none" stroke="#fcd34d" strokeWidth={1.4}
        strokeDasharray="5 7" strokeLinecap="round" opacity={0.65}
        style={{ animation: 'dashScroll 1.8s linear infinite' }} />
      {/* Airplane */}
      <g filter="url(#planeShadow)">
        <text fontSize={13} textAnchor="middle" dominantBaseline="middle" fill="white">✈</text>
        <animateMotion dur={speed} repeatCount="indefinite" rotate="auto">
          <mpath href={`#${pid}`} />
        </animateMotion>
      </g>
    </g>
  )
}

/* ─── Country hover tooltip ──────────────────────────── */
interface CountryTip { name: string; trips: Trip[]; x: number; y: number; iso2?: string; partialRegions?: string[] }
function CountryTooltip({ data }: { data: CountryTip }) {
  const upcoming = data.trips.filter(t => t.start_date && new Date(t.start_date) >= new Date())
  const visited  = data.trips.filter(t => t.status === 'completed')
  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.13 }}
      className="absolute z-50 pointer-events-none"
      style={{ left: data.x + 14, top: data.y - 8, maxWidth: 220 }}>
      <div className="bg-[#071628]/97 backdrop-blur-2xl border border-white/12 rounded-xl p-3.5 shadow-2xl shadow-black/70">
        <div className="flex items-center gap-2 mb-2.5">
          {data.iso2 ? <FlagImg code={data.iso2} className="w-5 h-[15px]" /> : data.trips[0]?.country_code ? <FlagImg code={data.trips[0].country_code} className="w-5 h-[15px]" /> : <span>🌍</span>}
          <p className="text-white font-bold text-sm leading-tight">{data.name || data.trips[0]?.country}</p>
        </div>
        {upcoming[0] && (() => {
          const days = upcoming[0].start_date ? daysUntil(upcoming[0].start_date) : null
          return (
            <div className="bg-amber-500/12 border border-amber-400/20 rounded-lg px-2.5 py-2 mb-2">
              <p className="text-amber-300 text-[10px] font-semibold uppercase tracking-widest mb-1">Upcoming</p>
              <p className="text-white text-xs font-semibold truncate">{upcoming[0].name}</p>
              {days !== null && (
                <p className="text-amber-400/80 text-[10px] mt-0.5">
                  {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                </p>
              )}
            </div>
          )
        })()}
        {visited.length > 0 && (
          <div className="bg-violet-500/12 border border-violet-400/20 rounded-lg px-2.5 py-2 mb-2">
            <p className="text-violet-300 text-[10px] font-semibold uppercase tracking-widest mb-1">Visited</p>
            <p className="text-white text-xs">{visited.length} trip{visited.length !== 1 ? 's' : ''}</p>
          </div>
        )}
        {data.partialRegions && data.partialRegions.length > 0 && (
          <div className="bg-indigo-500/12 border border-indigo-400/20 rounded-lg px-2.5 py-2 mb-2">
            <p className="text-indigo-300 text-[10px] font-semibold uppercase tracking-widest mb-1">
              Visited regions · {data.partialRegions.length}
            </p>
            <p className="text-white text-xs leading-relaxed">
              {data.partialRegions.slice(0, 4).join(', ')}{data.partialRegions.length > 4 ? ` +${data.partialRegions.length - 4} more` : ''}
            </p>
          </div>
        )}
        {data.trips.length > 0 && <p className="text-slate-600 text-[10px]">Click to open trip</p>}
      </div>
    </motion.div>
  )
}

/* ─── Trip marker tooltip ────────────────────────────── */
interface TripTip { trip: Trip; x: number; y: number }
function TripTooltip({ data }: { data: TripTip }) {
  const { trip } = data
  const days  = trip.start_date ? daysUntil(trip.start_date) : null
  const dur   = tripDuration(trip.start_date, trip.end_date)
  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.13 }}
      className="absolute z-50 pointer-events-none"
      style={{ left: data.x + 14, top: data.y - 60, maxWidth: 220 }}>
      <div className="bg-[#071628]/97 backdrop-blur-2xl border border-amber-400/20 rounded-xl overflow-hidden shadow-2xl shadow-black/70">
        <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            {trip.country_code ? <FlagImg code={trip.country_code} className="w-5 h-[15px]" /> : <span>📍</span>}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{trip.name}</p>
              <p className="text-amber-300/80 text-[11px]">{trip.city ? `${trip.city}, ${trip.country}` : trip.country}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2">
          {trip.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-slate-300 text-xs">{formatDate(trip.start_date, 'MMM d, yyyy')}</span>
            </div>
          )}
          {days !== null && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-xs font-semibold text-amber-300">
                {days === 0 ? 'Departing today!' : days === 1 ? 'Tomorrow' : `${days} days to go`}
              </span>
            </div>
          )}
          {dur !== null && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-slate-300 text-xs">{dur} day{dur !== 1 ? 's' : ''} trip</span>
            </div>
          )}
          {trip.budget > 0 && (
            <div className="flex items-center gap-2">
              <Wallet className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-slate-300 text-xs">{formatCurrency(trip.budget, trip.currency)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Skeleton loader ────────────────────────────────── */
function MapSkeleton() {
  return (
    <div className="w-full aspect-[2/1] bg-[#0a1628] rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 opacity-30">
          <Globe className="w-12 h-12 text-slate-600 animate-pulse" />
          <div className="text-slate-600 text-sm">Loading map…</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────── */
function MapEmpty() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#071628]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-10 py-8 text-center max-w-xs pointer-events-auto">
        <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto mb-4">
          <circle cx="40" cy="40" r="32" fill="#1e3a5f" />
          <ellipse cx="40" cy="40" rx="18" ry="32" fill="none" stroke="#2d5a8e" strokeWidth="1" />
          <ellipse cx="40" cy="40" rx="32" ry="12" fill="none" stroke="#2d5a8e" strokeWidth="1" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="#3b6ca8" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="4" fill="#7c3aed" opacity="0.7">
            <animate attributeName="r" from="4" to="9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="40" cy="40" r="3" fill="#a78bfa" />
        </svg>
        <p className="text-white font-bold text-base mb-1.5">Your world awaits</p>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">
          Add a trip and watch your travel map come to life with routes, pins, and destinations.
        </p>
        <Link href="/trips/new">
          <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20">
            Plan First Trip
          </button>
        </Link>
      </motion.div>
    </div>
  )
}

/* ══ useMapInteraction ═══════════════════════════════════
 *
 *  Drives the SVG <g> transform directly via DOM for 60 fps.
 *  No React re-renders during pan/zoom — only refs and RAF.
 *
 *  Physics:
 *   - Drag: 52% sensitivity reduction, pointer capture
 *   - Inertia: exponential velocity decay (FRICTION per frame)
 *   - Wheel: log-scale accumulation, one RAF flush per tick
 *   - Pinch: two-finger scale with SVG-space pivot
 *   - Double-click: cubic-ease zoom ×1.8
 *   - Buttons: smooth cubic-ease zoom toward viewport centre
 */
function useMapInteraction() {
  const contentRef  = useRef<SVGGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  /* Mutable state — never goes through React */
  const T = useRef({ tx: 0, ty: 0, k: 1 })
  const drag = useRef<{
    startX: number; startY: number
    startTx: number; startTy: number
    lastX: number; lastY: number; lastTime: number
    vx: number; vy: number; dist: number
  } | null>(null)
  const pinch = useRef<{
    startDist: number; startK: number
    pivX: number; pivY: number
    startTx: number; startTy: number
  } | null>(null)
  const rafId  = useRef(0)
  const wheel  = useRef({ acc: 0, cx: 0, cy: 0, raf: 0 })

  /* Convert CSS client coords → viewport SVG coords */
  const toSvg = useCallback((cx: number, cy: number): [number, number] => {
    const el = containerRef.current
    if (!el) return [0, 0]
    const r = el.getBoundingClientRect()
    return [
      (cx - r.left) / r.width  * SVG_W,
      (cy - r.top)  / r.height * SVG_H,
    ]
  }, [])

  /* Clamp transform to keep map on screen */
  const clampT = useCallback((tx: number, ty: number, k: number) => {
    k = Math.max(MAP_MIN_K, Math.min(MAP_MAX_K, k))
    const mx = (k - 1) * SVG_W * 0.85 + 80
    const my = (k - 1) * SVG_H * 0.85 + 50
    return {
      tx: Math.max(-mx, Math.min(mx, tx)),
      ty: Math.max(-my, Math.min(my, ty)),
      k,
    }
  }, [])

  /* Write transform to DOM — zero React overhead */
  const applyT = useCallback((tx: number, ty: number, k: number) => {
    const c = clampT(tx, ty, k)
    T.current = c
    const g = contentRef.current
    if (g) g.setAttribute('transform', `translate(${c.tx},${c.ty}) scale(${c.k})`)
  }, [clampT])

  const stopRaf = useCallback(() => {
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0 }
  }, [])

  /* Smooth zoom toward an SVG-space pivot point */
  const smoothZoomTo = useCallback((targetK: number, pivX: number, pivY: number, ms = 260) => {
    stopRaf()
    const { tx: sx, ty: sy, k: sk } = T.current
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)           // cubic ease-out
      const k  = sk + (targetK - sk) * e
      const tx = pivX - (pivX - sx) / sk * k
      const ty = pivY - (pivY - sy) / sk * k
      applyT(tx, ty, k)
      if (p < 1) rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
  }, [stopRaf, applyT])

  /* Register all native gesture listeners on mount */
  useEffect(() => {
    const _el = containerRef.current
    if (!_el) return
    /* Capture as non-nullable so TypeScript correctly types closures */
    const el: HTMLDivElement = _el

    /* ── Pointer drag ── */
    function onPD(e: PointerEvent) {
      if (e.button !== 0) return
      stopRaf()
      const [sx, sy] = toSvg(e.clientX, e.clientY)
      drag.current = {
        startX: sx, startY: sy,
        startTx: T.current.tx, startTy: T.current.ty,
        lastX: sx, lastY: sy,
        lastTime: performance.now(),
        vx: 0, vy: 0, dist: 0,
      }
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    function onPM(e: PointerEvent) {
      const d = drag.current
      if (!d) return
      const [sx, sy] = toSvg(e.clientX, e.clientY)

      /* Track distance from origin (for click-vs-drag discrimination) */
      d.dist = Math.hypot(sx - d.startX, sy - d.startY)

      /* Velocity via exponential moving average */
      const now = performance.now()
      const dt  = Math.max(1, now - d.lastTime)
      const rvx = (sx - d.lastX) * PAN_SENS / dt * 16
      const rvy = (sy - d.lastY) * PAN_SENS / dt * 16
      d.vx = d.vx * 0.65 + rvx * 0.35
      d.vy = d.vy * 0.65 + rvy * 0.35
      d.lastX = sx; d.lastY = sy; d.lastTime = now

      applyT(
        d.startTx + (sx - d.startX) * PAN_SENS,
        d.startTy + (sy - d.startY) * PAN_SENS,
        T.current.k,
      )
    }

    function onPU(_e: PointerEvent) {
      const d = drag.current
      drag.current = null
      el.style.cursor = ''
      if (!d) return

      if (d.dist > 4) {
        /* Suppress click events that follow this drag */
        isDraggingRef.current = true
        setTimeout(() => { isDraggingRef.current = false }, 200)

        /* Inertia */
        if (Math.hypot(d.vx, d.vy) > 0.25) {
          let { vx, vy } = d
          const tick = () => {
            vx *= FRICTION; vy *= FRICTION
            if (Math.abs(vx) < 0.04 && Math.abs(vy) < 0.04) return
            const { tx, ty, k } = T.current
            applyT(tx + vx, ty + vy, k)
            rafId.current = requestAnimationFrame(tick)
          }
          rafId.current = requestAnimationFrame(tick)
        }
      }
    }

    /* ── Mouse wheel / trackpad scroll ── */
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const [sx, sy] = toSvg(e.clientX, e.clientY)
      const w = wheel.current
      w.cx = sx; w.cy = sy

      /* Normalize pixel / line / page modes */
      let dy = -e.deltaY
      if (e.deltaMode === 1) dy *= 28
      if (e.deltaMode === 2) dy *= 280

      /* Cap per-event contribution → gradual zoom */
      w.acc += Math.max(-0.12, Math.min(0.12, dy * 0.0028))

      if (!w.raf) {
        w.raf = requestAnimationFrame(() => {
          w.raf = 0
          const factor = Math.exp(w.acc)
          w.acc = 0
          const { tx, ty, k } = T.current
          const nk  = Math.max(MAP_MIN_K, Math.min(MAP_MAX_K, k * factor))
          const ntx = w.cx - (w.cx - tx) / k * nk
          const nty = w.cy - (w.cy - ty) / k * nk
          applyT(ntx, nty, nk)
        })
      }
    }

    /* ── Pinch-to-zoom (touch) ── */
    function onTS(e: TouchEvent) {
      if (e.touches.length !== 2) return
      drag.current = null  // cancel any active drag
      const t1 = e.touches[0], t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const [pivX, pivY] = toSvg(
        (t1.clientX + t2.clientX) / 2,
        (t1.clientY + t2.clientY) / 2,
      )
      pinch.current = {
        startDist: dist, startK: T.current.k,
        pivX, pivY,
        startTx: T.current.tx, startTy: T.current.ty,
      }
    }

    function onTM(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinch.current) return
      e.preventDefault()
      const t1 = e.touches[0], t2 = e.touches[1]
      const dist  = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const ratio = dist / pinch.current.startDist
      const nk    = Math.max(MAP_MIN_K, Math.min(MAP_MAX_K, pinch.current.startK * ratio))
      const { pivX, pivY, startTx, startTy, startK } = pinch.current
      const ntx = pivX - (pivX - startTx) / startK * nk
      const nty = pivY - (pivY - startTy) / startK * nk
      applyT(ntx, nty, nk)
    }

    function onTE() { pinch.current = null }

    /* ── Double-click zoom ── */
    function onDbl(e: MouseEvent) {
      const [sx, sy] = toSvg(e.clientX, e.clientY)
      smoothZoomTo(Math.min(MAP_MAX_K, T.current.k * 1.8), sx, sy)
    }

    el.addEventListener('pointerdown',  onPD)
    el.addEventListener('pointermove',  onPM)
    el.addEventListener('pointerup',    onPU)
    el.addEventListener('pointercancel',onPU)
    el.addEventListener('wheel',        onWheel, { passive: false })
    el.addEventListener('touchstart',   onTS,    { passive: true })
    el.addEventListener('touchmove',    onTM,    { passive: false })
    el.addEventListener('touchend',     onTE)
    el.addEventListener('dblclick',     onDbl)

    return () => {
      el.removeEventListener('pointerdown',  onPD)
      el.removeEventListener('pointermove',  onPM)
      el.removeEventListener('pointerup',    onPU)
      el.removeEventListener('pointercancel',onPU)
      el.removeEventListener('wheel',        onWheel)
      el.removeEventListener('touchstart',   onTS)
      el.removeEventListener('touchmove',    onTM)
      el.removeEventListener('touchend',     onTE)
      el.removeEventListener('dblclick',     onDbl)
      stopRaf()
      const w = wheel.current
      if (w.raf) { cancelAnimationFrame(w.raf); w.raf = 0 }
    }
  }, [toSvg, applyT, stopRaf, smoothZoomTo])

  /* Zoom button helpers — animate toward viewport centre */
  const zoomIn = useCallback(() => {
    smoothZoomTo(Math.min(MAP_MAX_K, T.current.k + 0.8), SVG_W / 2, SVG_H / 2)
  }, [smoothZoomTo])

  const zoomOut = useCallback(() => {
    smoothZoomTo(Math.max(MAP_MIN_K, T.current.k - 0.8), SVG_W / 2, SVG_H / 2)
  }, [smoothZoomTo])

  const reset = useCallback(() => {
    stopRaf()
    const { tx: sx, ty: sy, k: sk } = T.current
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 380)
      const e = 1 - Math.pow(1 - p, 3)
      applyT(sx * (1 - e), sy * (1 - e), sk + (1 - sk) * e)
      if (p < 1) rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
  }, [stopRaf, applyT])

  return { contentRef, containerRef, isDraggingRef, zoomIn, zoomOut, reset }
}

/* ══ WorldMapWidget ══════════════════════════════════════ */
export function WorldMapWidget({
  trips,
  visitedCountryCodes = [],
  partiallyVisitedRegions = {},
}: {
  trips: Trip[]
  visitedCountryCodes?: string[]
  partiallyVisitedRegions?: Record<string, string[]>
}) {
  const router      = useRouter()
  const map         = useMapInteraction()
  const geoLoadedRef = useRef(false)

  const [mapLoaded,   setMapLoaded]   = useState(false)
  const [tooltip,     setTooltip]     = useState<CountryTip | null>(null)
  const [tripTip,     setTripTip]     = useState<TripTip | null>(null)
  const [showPicker,  setShowPicker]  = useState(false)
  const [homeIso2,    setHomeIso2]    = useState<string | null>(null)
  const [homeName,    setHomeName]    = useState<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('travel365_home_country')
      if (s) { const { iso2, name } = JSON.parse(s); setHomeIso2(iso2); setHomeName(name) }
    } catch { /* ignore */ }
  }, [])

  const saveHome = useCallback((iso2: string, name: string) => {
    setHomeIso2(iso2); setHomeName(name); setShowPicker(false)
    try { localStorage.setItem('travel365_home_country', JSON.stringify({ iso2, name })) } catch { /* ignore */ }
  }, [])

  /* ── Derived ────────────────────────── */
  const allTripsMap = useMemo(() => {
    const m: Record<string, Trip[]> = {}
    trips.forEach(t => {
      const iso2 = resolveA2(t.country_code, t.country)
      if (!iso2) return
      ;(m[iso2] ??= []).push(t)
    })
    return m
  }, [trips])

  const tripVisitedCodes = useMemo(() =>
    new Set(trips.filter(t => t.status === 'completed').map(t => resolveA2(t.country_code, t.country)).filter(Boolean) as string[]),
  [trips])

  const manuallyVisited = useMemo(() => new Set(visitedCountryCodes), [visitedCountryCodes])
  const visitedCodes    = useMemo(() => new Set([...tripVisitedCodes, ...manuallyVisited]), [tripVisitedCodes, manuallyVisited])
  /* Countries with some visited regions but NOT yet fully visited */
  const partiallyCodes  = useMemo(() => new Set(Object.keys(partiallyVisitedRegions).filter(c => !visitedCodes.has(c))), [partiallyVisitedRegions, visitedCodes])

  const plannedCodes = useMemo(() =>
    new Set(
      trips
        .filter(t => ['upcoming','planning','active'].includes(t.status) || (t.start_date && new Date(t.start_date) >= new Date()))
        .map(t => resolveA2(t.country_code, t.country))
        .filter(Boolean) as string[]
    ),
  [trips])

  const orderedUpcoming = useMemo(() =>
    trips
      .filter(t => t.start_date && new Date(t.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
      .slice(0, 6)
      .map(t => {
        const iso2 = resolveA2(t.country_code, t.country)
        const coords: [number, number] | null =
          (t.lng != null && t.lat != null) ? [t.lng, t.lat] :
          iso2 ? COUNTRY_COORDS[iso2] : null
        return iso2 && coords ? { trip: t, iso2, coords } : null
      })
      .filter(Boolean) as { trip: Trip; iso2: string; coords: [number, number] }[],
  [trips])

  const flightPaths = useMemo(() => {
    const hc = homeIso2 ? COUNTRY_COORDS[homeIso2] : null
    if (!hc || !orderedUpcoming.length) return []
    return orderedUpcoming.filter(m => m.iso2 !== homeIso2).map((m, i) => ({ from: hc, to: m.coords, index: i }))
  }, [orderedUpcoming, homeIso2])

  const homeCoords = homeIso2 ? COUNTRY_COORDS[homeIso2] : null

  const stats = useMemo(() => ({
    visited:           visitedCodes.size,
    planned:           plannedCodes.size,
    continentsVisited: countContinents(new Set([...visitedCodes, ...partiallyCodes])),
    upcomingCount:     orderedUpcoming.length,
  }), [visitedCodes, plannedCodes, partiallyCodes, orderedUpcoming])

  const achievements = useMemo(() =>
    ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(trips, visitedCodes) })),
  [trips, visitedCodes])

  /* ── Handlers ─────────────────────── */
  const handleGeoClick = useCallback((iso2: string) => {
    if (map.isDraggingRef.current) return
    const here = allTripsMap[iso2]
    if (!here?.length) return
    const t = here.find(x => x.start_date && new Date(x.start_date) >= new Date()) ?? here[0]
    router.push(`/trips/${t.id}`)
  }, [allTripsMap, router, map.isDraggingRef])

  const handleGeoEnter = useCallback((evt: React.MouseEvent, geo: { id: unknown; properties: Record<string,unknown> }) => {
    if (map.isDraggingRef.current) return
    const iso2 = NUMERIC_TO_A2[String(geo.id)]
    const here = iso2 ? allTripsMap[iso2] : null
    const partialRegions = iso2 ? partiallyVisitedRegions[iso2] : undefined
    /* Show tooltip if this country has trips OR partial region visits */
    if ((!here?.length && !partialRegions?.length) || !map.containerRef.current) return
    const r = map.containerRef.current.getBoundingClientRect()
    setTooltip({ name: String(geo.properties.name ?? ''), trips: here ?? [], iso2: iso2 ?? undefined, partialRegions, x: evt.clientX - r.left, y: evt.clientY - r.top })
  }, [allTripsMap, partiallyVisitedRegions, map.isDraggingRef, map.containerRef])

  const handleGeoLeave  = useCallback(() => setTooltip(null), [])

  const handleMarkerEnter = useCallback((id: string, e: React.MouseEvent) => {
    if (map.isDraggingRef.current || !map.containerRef.current) return
    const r = map.containerRef.current.getBoundingClientRect()
    const found = orderedUpcoming.find(m => m.trip.id === id)
    if (found) setTripTip({ trip: found.trip, x: e.clientX - r.left, y: e.clientY - r.top })
  }, [orderedUpcoming, map.isDraggingRef, map.containerRef])

  const handleMarkerLeave = useCallback(() => setTripTip(null), [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!map.containerRef.current) return
    const r = map.containerRef.current.getBoundingClientRect()
    const pos = { x: e.clientX - r.left, y: e.clientY - r.top }
    setTooltip(prev => prev ? { ...prev, ...pos } : null)
    setTripTip(prev => prev ? { ...prev, ...pos } : null)
  }, [map.containerRef])

  /* ── Country fill ──────────────────── */
  const getFill = useCallback((iso2?: string) => {
    if (!iso2) return '#1b2f48'
    if (visitedCodes.has(iso2))   return '#3e18a4'
    if (partiallyCodes.has(iso2)) return '#23225e'
    if (plannedCodes.has(iso2))   return '#7a2c0e'
    return '#1b2f48'
  }, [visitedCodes, partiallyCodes, plannedCodes])

  const getHover = useCallback((iso2?: string) => {
    if (!iso2) return '#26415e'
    if (visitedCodes.has(iso2))   return '#5c22d4'
    if (partiallyCodes.has(iso2)) return '#3a2e8a'
    if (plannedCodes.has(iso2))   return '#b34d10'
    return '#26415e'
  }, [visitedCodes, partiallyCodes, plannedCodes])

  /* ── Stats bar config ──────────────── */
  const statCells = [
    { value: stats.visited,           label: 'Countries Visited', icon: '🏆', color: 'text-violet-400',  bg: 'hover:bg-violet-500/6' },
    { value: stats.planned,           label: 'Countries Planned', icon: '🗓️', color: 'text-amber-400',   bg: 'hover:bg-amber-500/6' },
    { value: stats.continentsVisited,  label: 'Continents Visited', icon: '🌍', color: 'text-blue-400',    bg: 'hover:bg-blue-500/6' },
    { value: stats.upcomingCount,     label: 'Upcoming Trips',    icon: '✈️', color: 'text-emerald-400', bg: 'hover:bg-emerald-500/6' },
  ]

  return (
    <div className="rounded-3xl overflow-visible border border-slate-700/30 shadow-2xl shadow-black/60 bg-gradient-to-br from-[#05101f] via-[#091c30] to-[#060d1b]">
      <style>{`
        @keyframes dashScroll { to { stroke-dashoffset: -24; } }
        @keyframes routePulse { 0%,100% { opacity: 0.55; } 50% { opacity: 0.85; } }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">My Travel Map</h2>
            {trips.length === 0 ? (
              <div className="mt-0.5">
                <p className="text-slate-400 text-xs leading-tight">Your travel story starts here.</p>
                <p className="text-slate-600 text-[10px] mt-0.5 leading-tight">Create your first trip and begin exploring the world.</p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs mt-0.5 leading-tight">
                {stats.visited === 1 ? '1 country visited' : `${stats.visited} countries visited`}
                {' • '}
                {stats.upcomingCount === 1 ? '1 upcoming trip' : `${stats.upcomingCount} upcoming trips`}
                {' • '}
                {stats.continentsVisited === 1 ? '1 continent explored' : `${stats.continentsVisited} continents explored`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] mr-1">
            {([
              { color: 'bg-[#5c22d4]', ring: 'ring-violet-400/30', label: 'Visited',        tip: 'Countries fully marked as visited.' },
              { color: 'bg-[#23225e]', ring: 'ring-indigo-400/20', label: 'Partly visited',  tip: 'Large countries where only some states or regions were visited.' },
              { color: 'bg-[#b45309]', ring: 'ring-amber-400/30',  label: 'Upcoming',        tip: 'Countries with planned trips.' },
            ] as const).map(({ color, ring, label, tip }) => (
              <span key={label} className="relative group flex items-center gap-1.5 text-slate-400 cursor-default select-none">
                <span className={`w-3 h-3 rounded-sm ${color} inline-block ring-1 ${ring} shrink-0`} />
                {label}
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] w-max max-w-[160px] px-2.5 py-2 bg-[#071628]/97 backdrop-blur-xl border border-white/12 rounded-xl text-[10px] text-slate-300 text-center leading-relaxed shadow-2xl shadow-black/70 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                  {tip}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#0e2035]" />
                </div>
              </span>
            ))}
          </div>

          {/* Home country selector */}
          <div className="relative">
            <button onClick={() => setShowPicker(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                homeIso2
                  ? 'bg-violet-600/15 border-violet-500/30 text-violet-300 hover:bg-violet-600/25'
                  : 'bg-white/6 border-white/12 text-slate-400 hover:text-white hover:bg-white/10'
              }`}>
              {homeIso2 ? (
                <><FlagImg code={homeIso2} className="w-5 h-[15px]" /><span className="max-w-20 truncate">{homeName}</span></>
              ) : (
                <><Home className="w-3.5 h-3.5" /><span>Set home</span></>
              )}
            </button>
            <AnimatePresence>
              {showPicker && <HomeCountryPicker current={homeIso2} onSelect={saveHome} onClose={() => setShowPicker(false)} />}
            </AnimatePresence>
          </div>

          {/* Zoom controls */}
          {([
            { icon: ZoomIn,    action: map.zoomIn },
            { icon: ZoomOut,   action: map.zoomOut },
            { icon: RotateCcw, action: map.reset },
          ] as const).map(({ icon: Icon, action }, i) => (
            <button key={i} onClick={action}
              className="w-7 h-7 rounded-lg bg-white/7 hover:bg-white/14 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Set-home nudge */}
      <AnimatePresence>
        {!homeIso2 && orderedUpcoming.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-3 flex items-center gap-2.5 bg-indigo-500/8 border border-indigo-500/18 rounded-xl px-4 py-2.5 overflow-hidden">
            <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <p className="text-indigo-300/90 text-xs flex-1">
              <span className="font-semibold">Set your home country</span> to display flight routes on the map.
            </p>
            <button onClick={() => setShowPicker(true)}
              className="text-indigo-400 hover:text-indigo-200 text-xs font-semibold transition-colors shrink-0">
              Set now →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map ── */}
      <div
        ref={map.containerRef}
        className="relative mx-0 overflow-hidden select-none"
        style={{ cursor: 'grab' }}
        onMouseMove={handleMouseMove}
      >
        {!mapLoaded && <div className="absolute inset-0 z-20"><MapSkeleton /></div>}

        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 148, center: [15, 25] }}
          width={SVG_W} height={SVG_H}
          style={{ width: '100%', height: 'auto', display: 'block', background: 'transparent' }}
        >
          <defs>
            {/* Ocean — rich deep-blue with top-left radial light source */}
            <radialGradient id="ocean" cx="32%" cy="28%" r="72%">
              <stop offset="0%"   stopColor="#0f3460" />
              <stop offset="42%"  stopColor="#0a2040" />
              <stop offset="100%" stopColor="#040c18" />
            </radialGradient>
            {/* Subtle atmospheric sheen over the ocean */}
            <radialGradient id="oceanSheen" cx="50%" cy="10%" r="60%">
              <stop offset="0%"   stopColor="#1a4e8a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0a2040" stopOpacity="0"    />
            </radialGradient>
            {/* Visited countries — colored purple glow */}
            <filter id="visitGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feFlood floodColor="#7c3aed" floodOpacity="0.5" result="c" />
              <feComposite in="c" in2="b" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Upcoming/planned countries — warm orange glow */}
            <filter id="planGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feFlood floodColor="#f97316" floodOpacity="0.40" result="c" />
              <feComposite in="c" in2="b" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Trip destination markers — amber glow */}
            <filter id="markerGlow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor="#f59e0b" floodOpacity="0.65" result="c" />
              <feComposite in="c" in2="b" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Airplane trail glow */}
            <filter id="planeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fcd34d" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Ocean background — outside the pan/zoom group so it always fills */}
          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#ocean)" />
          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#oceanSheen)" />

          {/* All map content inside a single <g> driven by useMapInteraction */}
          <g ref={map.contentRef}>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; id: unknown; properties: Record<string,unknown> }> }) => {
                if (!geoLoadedRef.current && geographies.length > 0) {
                  geoLoadedRef.current = true
                  setTimeout(() => setMapLoaded(true), 0)
                }
                return geographies.map(geo => {
                  const iso2      = NUMERIC_TO_A2[String(geo.id)]
                  const isVisited = !!iso2 && visitedCodes.has(iso2)
                  const isPartial = !!iso2 && partiallyCodes.has(iso2)
                  const isPlanned = !!iso2 && plannedCodes.has(iso2)
                  const hasTrips  = !!iso2 && !!allTripsMap[iso2]?.length
                  const hasPartialRegions = !!iso2 && !!partiallyVisitedRegions[iso2]?.length
                  return (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill={getFill(iso2)}
                      stroke="#0d2038"
                      strokeWidth={0.7}
                      filter={isVisited ? 'url(#visitGlow)' : isPartial ? 'url(#planGlow)' : isPlanned ? 'url(#planGlow)' : undefined}
                      style={{
                        default: { outline: 'none', transition: 'fill 0.18s ease' },
                        hover:   { fill: getHover(iso2), outline: 'none', cursor: (hasTrips || hasPartialRegions) ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => iso2 && handleGeoClick(iso2)}
                      onMouseEnter={(e: React.MouseEvent) => handleGeoEnter(e, geo)}
                      onMouseLeave={handleGeoLeave}
                    />
                  )
                })
              }}
            </Geographies>

            {/* Flight paths */}
            {flightPaths.map(fp => (
              <FlightPath key={fp.index} from={fp.from} to={fp.to} index={fp.index} />
            ))}

            {/* Home pin */}
            {homeCoords && (
              <Marker coordinates={homeCoords}>
                <HomePing name={homeName ?? ''} />
              </Marker>
            )}

            {/* Trip pins */}
            {orderedUpcoming.map((md, i) => (
              <Marker key={md.trip.id} coordinates={md.coords}>
                <TripMarker
                  trip={md.trip}
                  isNext={i === 0}
                  onEnter={handleMarkerEnter}
                  onLeave={handleMarkerLeave}
                  onClick={() => {
                    if (!map.isDraggingRef.current) router.push(`/trips/${md.trip.id}`)
                  }}
                />
              </Marker>
            ))}
          </g>
        </ComposableMap>

        {/* Tooltips */}
        <AnimatePresence>
          {tooltip  && !tripTip && <CountryTooltip data={tooltip} />}
          {tripTip  && <TripTooltip  data={tripTip} />}
        </AnimatePresence>

        {/* Empty state */}
        {trips.length === 0 && mapLoaded && <MapEmpty />}
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/6">
        {statCells.map(({ value, label, icon, color, bg }, i) => (
          <div key={label}
            className={`relative flex flex-col items-center justify-center py-4 px-3 transition-colors ${bg} ${i > 0 ? 'border-l border-white/5' : ''} group cursor-default`}>
            <span className="text-2xl mb-1.5 leading-none">{icon}</span>
            <span className={`text-2xl font-bold leading-none ${color} tabular-nums`}>{value}</span>
            <span className="text-slate-500 text-[10px] font-medium mt-1.5 uppercase tracking-wider text-center">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Achievements ── */}
      <div className="px-5 py-4 border-t border-white/6">
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold">Travel Achievements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {achievements.map(({ icon, label, desc, unlocked }) => (
            <div key={label} className="relative group">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-default select-none ${
                unlocked
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/15 border-violet-500/35 text-violet-200 shadow-sm shadow-violet-900/30'
                  : 'bg-white/3 border-white/7 text-slate-600'
              }`}>
                <span className={unlocked ? '' : 'grayscale opacity-40'}>{icon}</span>
                <span className={unlocked ? '' : 'opacity-40'}>{label}</span>
                {unlocked && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-0.5 shadow-sm shadow-violet-400/60" />}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 border border-white/10 rounded-lg text-[11px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl">
                {desc}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
