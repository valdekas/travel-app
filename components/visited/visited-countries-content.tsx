'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/data/countries'
import { COUNTRY_SUBREGIONS, hasSubregions, subregionLabel } from '@/lib/data/subregions'
import { ACHIEVEMENTS, TOTAL_COUNTRIES } from '@/lib/utils/achievements'
import type { VisitedCountry, VisitedRegion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Search, Globe2, CheckCircle2, Circle, X, Calendar,
  MapPin, Star, AlertTriangle, Trophy, Loader2,
  ChevronDown, ChevronUp, CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'

/* ── Constants ─────────────────────────────────────────── */
const CONTINENT_COLORS: Record<string, string> = {
  Europe:   'bg-indigo-500',
  Americas: 'bg-emerald-500',
  Asia:     'bg-amber-500',
  Africa:   'bg-orange-500',
  Oceania:  'bg-teal-500',
}
const CONTINENT_BG: Record<string, string> = {
  Europe:   'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20',
  Americas: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
  Asia:     'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
  Africa:   'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20',
  Oceania:  'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20',
}
const CONTINENT_TEXT: Record<string, string> = {
  Europe:   'text-indigo-700 dark:text-indigo-300',
  Americas: 'text-emerald-700 dark:text-emerald-300',
  Asia:     'text-amber-700 dark:text-amber-300',
  Africa:   'text-orange-700 dark:text-orange-300',
  Oceania:  'text-teal-700 dark:text-teal-300',
}
const CONTINENTS = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania']


/* ── Types ─────────────────────────────────────────────── */
interface DetailForm {
  visit_count: string
  first_visit_date: string
  last_visit_date: string
  notes: string
  favorite_city: string
}

interface RegionDetailForm {
  first_visit_date: string
  last_visit_date: string
  notes: string
  favorite_city: string
}

interface VisitedCountriesContentProps {
  userId: string
  initialVisited: VisitedCountry[]
  initialVisitedRegions: VisitedRegion[]
  migrationPending: boolean
  regionsMigrationPending: boolean
}

/* ══ Component ═══════════════════════════════════════════ */
export function VisitedCountriesContent({
  userId,
  initialVisited,
  initialVisitedRegions,
  migrationPending,
  regionsMigrationPending,
}: VisitedCountriesContentProps) {
  const supabase = createClient()

  /* Country-level visits: Map<countryCode, VisitedCountry> */
  const [visited, setVisited] = useState<Map<string, VisitedCountry>>(
    () => new Map(initialVisited.map(v => [v.country_code, v]))
  )

  /* Region-level visits: Map<"countryCode:regionCode", VisitedRegion> */
  const [visitedRegions, setVisitedRegions] = useState<Map<string, VisitedRegion>>(
    () => new Map(initialVisitedRegions.map(r => [`${r.country_code}:${r.region_code}`, r]))
  )

  const [search, setSearch] = useState('')
  const [continentFilter, setContinentFilter] = useState<string>('All')
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [regionSearch, setRegionSearch] = useState('')

  /* Country detail edit */
  const [editCountry, setEditCountry] = useState<{ code: string; name: string; continent: string; region: string } | null>(null)
  const [detailForm, setDetailForm] = useState<DetailForm>({ visit_count: '1', first_visit_date: '', last_visit_date: '', notes: '', favorite_city: '' })

  /* Region detail edit */
  const [editRegion, setEditRegion] = useState<{ countryCode: string; regionCode: string; regionName: string } | null>(null)
  const [regionForm, setRegionForm] = useState<RegionDetailForm>({ first_visit_date: '', last_visit_date: '', notes: '', favorite_city: '' })

  const [saving, setSaving] = useState(false)
  const [togglingCode, setTogglingCode] = useState<string | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)

  /* ── Derived counts ─────────────────────────────── */
  const visitedCount        = visited.size
  const visitedRegionsCount = visitedRegions.size

  /* Which countries are "partially" visited (have some regions but not fully marked) */
  const partialCountries = useMemo(() => {
    const partial = new Set<string>()
    for (const key of visitedRegions.keys()) {
      const countryCode = key.split(':')[0]
      if (!visited.has(countryCode)) partial.add(countryCode)
    }
    return partial
  }, [visitedRegions, visited])

  const continentsVisited = useMemo(() => {
    const continents = new Set([...visited.values()].map(v => v.continent))
    for (const code of partialCountries) {
      const country = COUNTRIES.find(c => c.code === code)
      if (country) continents.add(country.continent)
    }
    return continents.size
  }, [visited, partialCountries])

  /* Progress across all supported regions for a given country */
  const regionProgress = useCallback((countryCode: string) => {
    const sr = COUNTRY_SUBREGIONS[countryCode]
    if (!sr) return null
    const total   = sr.regions.length
    const done    = sr.regions.filter(r => visitedRegions.has(`${countryCode}:${r.code}`)).length
    return { done, total }
  }, [visitedRegions])

  const progressPct = Math.round((visitedCount / TOTAL_COUNTRIES) * 100)
  const nextAchievement = ACHIEVEMENTS.find(a => visitedCount < a.threshold)

  const continentCounts = useMemo(() => {
    const map: Record<string, { total: number; visited: number }> = {}
    COUNTRIES.forEach(c => {
      if (!map[c.continent]) map[c.continent] = { total: 0, visited: 0 }
      map[c.continent].total++
      if (visited.has(c.code) || partialCountries.has(c.code)) map[c.continent].visited++
    })
    return map
  }, [visited, partialCountries])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return COUNTRIES.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
      const matchCont   = continentFilter === 'All' || c.continent === continentFilter
      return matchSearch && matchCont
    })
  }, [search, continentFilter])

  /* ── Country-level toggle ───────────────────────── */
  const toggleCountryVisited = useCallback(async (
    code: string, name: string, continent: string, region: string
  ) => {
    if (migrationPending) { toast.error('Database migration pending.'); return }
    setTogglingCode(code)
    try {
      if (visited.has(code)) {
        const { error } = await supabase.from('visited_countries').delete()
          .eq('user_id', userId).eq('country_code', code)
        if (error) throw error
        setVisited(prev => { const m = new Map(prev); m.delete(code); return m })
        toast.success(`${name} removed from visited`)
      } else {
        const { data, error } = await supabase
          .from('visited_countries')
          .insert({ user_id: userId, country_code: code, country_name: name, continent, region, visit_count: 1 })
          .select().single()
        if (error) throw error
        setVisited(prev => new Map(prev).set(code, data))
        toast.success(`${name} marked as visited! 🎉`)
      }
    } catch { toast.error('Failed to update') }
    finally   { setTogglingCode(null) }
  }, [visited, userId, supabase, migrationPending])

  /* ── Region-level toggle ────────────────────────── */
  const toggleRegionVisited = useCallback(async (
    countryCode: string, countryName: string, regionCode: string, regionName: string, regionType: string
  ) => {
    if (regionsMigrationPending) { toast.error('Regions migration pending. Run 003_visited_regions.sql first.'); return }
    const key = `${countryCode}:${regionCode}`
    setTogglingCode(key)
    try {
      if (visitedRegions.has(key)) {
        const { error } = await supabase.from('visited_regions').delete()
          .eq('user_id', userId).eq('country_code', countryCode).eq('region_code', regionCode)
        if (error) throw error
        setVisitedRegions(prev => { const m = new Map(prev); m.delete(key); return m })
        toast.success(`${regionName} removed`)
      } else {
        const { data, error } = await supabase
          .from('visited_regions')
          .insert({ user_id: userId, country_code: countryCode, country_name: countryName, region_code: regionCode, region_name: regionName, region_type: regionType, visit_count: 1 })
          .select().single()
        if (error) throw error
        setVisitedRegions(prev => new Map(prev).set(key, data))
        toast.success(`${regionName} marked as visited! 🎉`)

        /* Auto-mark country when ALL regions are visited */
        const sr = COUNTRY_SUBREGIONS[countryCode]
        if (sr && !visited.has(countryCode)) {
          const newMap = new Map(visitedRegions).set(key, data)
          const allVisited = sr.regions.every(r => newMap.has(`${countryCode}:${r.code}`) || r.code === regionCode)
          if (allVisited) {
            const country = COUNTRIES.find(c => c.code === countryCode)
            if (country) {
              const { data: cd, error: ce } = await supabase
                .from('visited_countries')
                .insert({ user_id: userId, country_code: countryCode, country_name: countryName, continent: country.continent, region: country.region, visit_count: 1 })
                .select().single()
              if (!ce && cd) {
                setVisited(prev => new Map(prev).set(countryCode, cd))
                toast.success(`All ${subregionLabel(countryCode)} visited — ${countryName} marked as fully visited! 🏆`)
              }
            }
          }
        }
      }
    } catch { toast.error('Failed to update') }
    finally   { setTogglingCode(null) }
  }, [visitedRegions, visited, userId, supabase, regionsMigrationPending])

  /* ── Mark whole country (even with only some regions) ── */
  const markWholeCountry = useCallback(async (
    code: string, name: string, continent: string, region: string
  ) => {
    if (migrationPending) { toast.error('Migration pending.'); return }
    if (visited.has(code)) return
    setTogglingCode(code)
    try {
      const { data, error } = await supabase
        .from('visited_countries')
        .insert({ user_id: userId, country_code: code, country_name: name, continent, region, visit_count: 1 })
        .select().single()
      if (error) throw error
      setVisited(prev => new Map(prev).set(code, data))
      toast.success(`${name} marked as fully visited! 🎉`)
    } catch { toast.error('Failed to update') }
    finally   { setTogglingCode(null) }
  }, [visited, userId, supabase, migrationPending])

  /* ── Mark ALL regions of a country ─────────────── */
  const markAllRegions = useCallback(async (
    countryCode: string, countryName: string, continent: string, region: string
  ) => {
    if (regionsMigrationPending) { toast.error('Regions migration pending.'); return }
    const sr = COUNTRY_SUBREGIONS[countryCode]
    if (!sr) return
    setTogglingCode(`all:${countryCode}`)
    try {
      const unvisited = sr.regions.filter(r => !visitedRegions.has(`${countryCode}:${r.code}`))
      if (unvisited.length > 0) {
        const rows = unvisited.map(r => ({ user_id: userId, country_code: countryCode, country_name: countryName, region_code: r.code, region_name: r.name, region_type: r.type, visit_count: 1 }))
        const { data, error } = await supabase.from('visited_regions').insert(rows).select()
        if (error) throw error
        setVisitedRegions(prev => {
          const m = new Map(prev)
          ;(data ?? []).forEach((r: VisitedRegion) => m.set(`${r.country_code}:${r.region_code}`, r))
          return m
        })
      }
      /* Also mark country as fully visited */
      if (!visited.has(countryCode)) {
        const { data: cd, error: ce } = await supabase
          .from('visited_countries')
          .insert({ user_id: userId, country_code: countryCode, country_name: countryName, continent, region, visit_count: 1 })
          .select().single()
        if (!ce && cd) setVisited(prev => new Map(prev).set(countryCode, cd))
      }
      toast.success(`All ${sr.label} of ${countryName} marked! 🏆`)
    } catch { toast.error('Failed to mark all regions') }
    finally   { setTogglingCode(null) }
  }, [visitedRegions, visited, userId, supabase, regionsMigrationPending])

  /* ── Clear all regions + country mark ──────────── */
  const clearCountryAll = useCallback(async (countryCode: string, name: string) => {
    setTogglingCode(`clear:${countryCode}`)
    try {
      await Promise.all([
        supabase.from('visited_countries').delete().eq('user_id', userId).eq('country_code', countryCode),
        supabase.from('visited_regions').delete().eq('user_id', userId).eq('country_code', countryCode),
      ])
      setVisited(prev  => { const m = new Map(prev); m.delete(countryCode); return m })
      setVisitedRegions(prev => {
        const m = new Map(prev)
        for (const k of [...m.keys()]) { if (k.startsWith(`${countryCode}:`)) m.delete(k) }
        return m
      })
      toast.success(`${name} cleared`)
    } catch { toast.error('Failed to clear') }
    finally   { setTogglingCode(null) }
  }, [userId, supabase])

  /* ── Country detail dialog ──────────────────────── */
  function openCountryEdit(code: string, name: string, continent: string, region: string) {
    if (migrationPending) { toast.error('Migration pending.'); return }
    const ex = visited.get(code)
    setDetailForm({ visit_count: String(ex?.visit_count ?? 1), first_visit_date: ex?.first_visit_date ?? '', last_visit_date: ex?.last_visit_date ?? '', notes: ex?.notes ?? '', favorite_city: ex?.favorite_city ?? '' })
    setEditCountry({ code, name, continent, region })
  }

  async function saveCountryDetails() {
    if (!editCountry) return
    setSaving(true)
    try {
      const row = { user_id: userId, country_code: editCountry.code, country_name: editCountry.name, continent: editCountry.continent, region: editCountry.region, visit_count: parseInt(detailForm.visit_count) || 1, first_visit_date: detailForm.first_visit_date || null, last_visit_date: detailForm.last_visit_date || null, notes: detailForm.notes || null, favorite_city: detailForm.favorite_city || null }
      const { data, error } = await supabase.from('visited_countries').upsert(row, { onConflict: 'user_id,country_code' }).select().single()
      if (error) throw error
      setVisited(prev => new Map(prev).set(editCountry.code, data))
      toast.success('Saved!')
      setEditCountry(null)
    } catch { toast.error('Failed to save') }
    finally   { setSaving(false) }
  }

  /* ── Region detail dialog ───────────────────────── */
  function openRegionEdit(countryCode: string, regionCode: string, regionName: string) {
    const ex = visitedRegions.get(`${countryCode}:${regionCode}`)
    setRegionForm({ first_visit_date: ex?.first_visit_date ?? '', last_visit_date: ex?.last_visit_date ?? '', notes: ex?.notes ?? '', favorite_city: ex?.favorite_city ?? '' })
    setEditRegion({ countryCode, regionCode, regionName })
  }

  async function saveRegionDetails() {
    if (!editRegion) return
    setSaving(true)
    const { countryCode, regionCode } = editRegion
    const key = `${countryCode}:${regionCode}`
    const ex  = visitedRegions.get(key)
    if (!ex) { toast.error('Region not visited yet'); setSaving(false); return }
    try {
      const row = { ...ex, first_visit_date: regionForm.first_visit_date || null, last_visit_date: regionForm.last_visit_date || null, notes: regionForm.notes || null, favorite_city: regionForm.favorite_city || null }
      const { data, error } = await supabase.from('visited_regions').upsert(row, { onConflict: 'user_id,country_code,region_code' }).select().single()
      if (error) throw error
      setVisitedRegions(prev => new Map(prev).set(key, data))
      toast.success('Saved!')
      setEditRegion(null)
    } catch { toast.error('Failed to save') }
    finally   { setSaving(false) }
  }

  /* ── Migration pending UI ───────────────────────── */
  if (migrationPending) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Database migration required</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Run <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">supabase/migrations/002_visited_countries.sql</code>{' '}
                and <code className="bg-amber-100 dark:bg-amber-500/20 px-1 rounded">003_visited_regions.sql</code>{' '}
                in <strong>Supabase Dashboard → SQL Editor</strong>, then refresh.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ══ Main render ═════════════════════════════════════ */
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Globe2 className="h-8 w-8 text-indigo-500" />
              Visited Countries
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {visitedCount} of {TOTAL_COUNTRIES} countries · {partialCountries.size} partial · {visitedRegionsCount} regions · {continentsVisited} continent{continentsVisited !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowAchievements(v => !v)}
            className="gap-2 rounded-xl border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
            <Trophy className="h-4 w-4" />
            Achievements
            {showAchievements ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.03 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: visitedCount,        label: 'Countries Fully Visited', icon: '🌍', color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' },
            { value: partialCountries.size,label: 'Countries Partial',      icon: '🗺️', color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20' },
            { value: visitedRegionsCount, label: 'Regions • States • Islands', icon: '📍', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
            { value: continentsVisited,   label: 'Continents',              icon: '🌐', color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
          ].map(({ value, label, icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Progress bar ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">World Progress</p>
              <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {visitedCount}
                <span className="text-xl font-normal text-slate-400 dark:text-slate-500"> / {TOTAL_COUNTRIES}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-indigo-500 tabular-nums">{progressPct}%</p>
              {nextAchievement && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {nextAchievement.threshold - visitedCount} more for {nextAchievement.icon} {nextAchievement.label}
                </p>
              )}
            </div>
          </div>
          <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
          </div>
        </motion.div>

        {/* ── Achievements ── */}
        <AnimatePresence>
          {showAchievements && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ACHIEVEMENTS.map(a => {
                  const unlocked = visitedCount >= a.threshold
                  return (
                    <div key={a.id} className={cn('rounded-xl border p-4 text-center transition-all',
                      unlocked ? 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/15 dark:to-violet-500/15 border-indigo-200 dark:border-indigo-500/30'
                               : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 opacity-50')}>
                      <div className="text-3xl mb-2" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{a.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{a.description}</p>
                      {unlocked && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">✓ Unlocked</p>}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Continent breakdown ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CONTINENTS.map(cont => {
            const data = continentCounts[cont] ?? { total: 0, visited: 0 }
            const pct  = data.total > 0 ? Math.round((data.visited / data.total) * 100) : 0
            return (
              <button key={cont} onClick={() => setContinentFilter(f => f === cont ? 'All' : cont)}
                className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-md',
                  continentFilter === cont ? CONTINENT_BG[cont] + ' shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700')}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', CONTINENT_COLORS[cont])} />
                  <span className={cn('text-xs font-semibold', continentFilter === cont ? CONTINENT_TEXT[cont] : 'text-slate-600 dark:text-slate-400')}>{cont}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">
                  {data.visited}<span className="text-sm font-normal text-slate-400 dark:text-slate-500">/{data.total}</span>
                </p>
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', CONTINENT_COLORS[cont])} style={{ width: `${pct}%` }} />
                </div>
              </button>
            )
          })}
        </motion.div>

        {/* ── Filters ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…" className="pl-9 rounded-xl" />
          </div>
          {continentFilter !== 'All' && (
            <Button variant="outline" size="sm" onClick={() => setContinentFilter('All')} className="gap-1.5 rounded-lg text-xs">
              <X className="h-3 w-3" />{continentFilter}
            </Button>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-auto">{filtered.length} countries</p>
        </motion.div>

        {/* ── Countries grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((country, i) => {
            const isVisited  = visited.has(country.code)
            const isPartial  = partialCountries.has(country.code)
            const hasRegs    = hasSubregions(country.code)
            const progress   = hasRegs ? regionProgress(country.code) : null
            const isExpanded = expandedCountry === country.code
            const togKey     = hasRegs ? `all:${country.code}` : country.code
            const isToggling = togglingCode === country.code || togglingCode === togKey || togglingCode === `clear:${country.code}`

            const subRegs    = hasRegs ? COUNTRY_SUBREGIONS[country.code] : null
            const filteredRegions = subRegs ? (regionSearch && isExpanded
              ? subRegs.regions.filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()))
              : subRegs.regions) : []

            return (
              <motion.div key={country.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                className={cn('rounded-2xl border transition-all',
                  isVisited  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                : isPartial  ? 'bg-violet-50 dark:bg-violet-500/8 border-violet-200 dark:border-violet-500/25 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
              )}>
                {/* ── Card header ── */}
                <div className="flex items-center gap-3 p-3">
                  <FlagImg code={country.code} className="w-7 h-[21px]" />
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm leading-tight truncate',
                      isVisited ? 'text-indigo-900 dark:text-indigo-100' : isPartial ? 'text-violet-900 dark:text-violet-100' : 'text-slate-900 dark:text-white')}>
                      {country.name}
                    </p>
                    {/* Continent + visit status — always visible */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{country.continent}</span>
                      {isVisited && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 leading-tight">· ✓ Visited</span>
                      )}
                      {!isVisited && isPartial && (
                        <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 leading-tight">· Partly visited</span>
                      )}
                    </div>
                    {/* Region progress bar — shown only when there are visited regions */}
                    {hasRegs && progress && progress.done > 0 && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {progress.done}/{progress.total} {subregionLabel(country.code)}
                          </span>
                        </div>
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit details (only if visited) */}
                    {isVisited && (
                      <button onClick={() => openCountryEdit(country.code, country.name, country.continent, country.region)}
                        className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-all">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* For subregion countries: expand button */}
                    {hasRegs ? (
                      <button onClick={() => { setExpandedCountry(isExpanded ? null : country.code); setRegionSearch('') }}
                        className={cn('p-1.5 rounded-lg transition-all',
                          isExpanded ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    ) : (
                      /* Simple toggle for countries without subregions */
                      <button onClick={() => toggleCountryVisited(country.code, country.name, country.continent, country.region)}
                        disabled={isToggling}
                        className={cn('p-1.5 rounded-xl transition-all', isVisited
                          ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                          : 'text-slate-300 dark:text-slate-600 hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10')}>
                        {isToggling ? <Loader2 className="h-5 w-5 animate-spin" /> : isVisited ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Expanded region picker ── */}
                <AnimatePresence>
                  {hasRegs && isExpanded && subRegs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60">
                      {/* Region header controls */}
                      <div className="px-3 pt-3 pb-2 space-y-2">
                        {/* Search within regions */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                          <input value={regionSearch} onChange={e => setRegionSearch(e.target.value)}
                            placeholder={`Search ${subRegs.label}…`}
                            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-500" />
                        </div>
                        {/* Action buttons row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isVisited && (
                            <button onClick={() => markWholeCountry(country.code, country.name, country.continent, country.region)}
                              disabled={!!togglingCode}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
                              <CheckCheck className="h-3 w-3" />
                              Mark whole country
                            </button>
                          )}
                          <button onClick={() => markAllRegions(country.code, country.name, country.continent, country.region)}
                            disabled={!!togglingCode}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                            <CheckCheck className="h-3 w-3" />
                            Mark all {subRegs.label}
                          </button>
                          {(isVisited || isPartial) && (
                            <button onClick={() => clearCountryAll(country.code, country.name)}
                              disabled={!!togglingCode}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50">
                              <X className="h-3 w-3" />
                              Clear all
                            </button>
                          )}
                        </div>
                        {/* Progress text */}
                        {progress && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {progress.done} of {progress.total} {subRegs.label} visited
                            {progress.done > 0 && ` (${Math.round((progress.done / progress.total) * 100)}%)`}
                          </p>
                        )}
                      </div>

                      {/* Region grid */}
                      <div className="px-3 pb-3 grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
                        {filteredRegions.map(reg => {
                          const regKey        = `${country.code}:${reg.code}`
                          const isRegVisited  = visitedRegions.has(regKey)
                          const isRegToggling = togglingCode === regKey
                          const isIsland      = reg.type === 'island'
                          return (
                            <div key={reg.code}
                              className={cn(
                                'flex items-center justify-between gap-1.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer group min-h-[40px]',
                                isRegVisited
                                  ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-200'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
                              )}
                              onClick={() => toggleRegionVisited(country.code, country.name, reg.code, reg.name, reg.type)}>
                              <span className="truncate leading-tight font-medium">
                                {isIsland && <span className="mr-1 opacity-70">🏝</span>}
                                {reg.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isRegVisited && (
                                  <button onClick={e => { e.stopPropagation(); openRegionEdit(country.code, reg.code, reg.name) }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-indigo-400 hover:text-indigo-600 transition-all">
                                    <Star className="h-2.5 w-2.5" />
                                  </button>
                                )}
                                {isRegToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                                  : isRegVisited ? <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                                  : <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-300" />}
                              </div>
                            </div>
                          )
                        })}
                        {filteredRegions.length === 0 && (
                          <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 py-3 text-center">No results</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600">
            <Globe2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No countries match your search</p>
          </div>
        )}
      </div>

      {/* ── Country detail dialog ── */}
      <AnimatePresence>
        {editCountry && (
          <Dialog open onOpenChange={() => setEditCountry(null)}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Edit — {editCountry.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Times Visited</Label>
                  <Input type="number" min="1" value={detailForm.visit_count} onChange={e => setDetailForm(f => ({ ...f, visit_count: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><Calendar className="h-3 w-3" />First Visit</Label>
                    <Input type="date" value={detailForm.first_visit_date} onChange={e => setDetailForm(f => ({ ...f, first_visit_date: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><Calendar className="h-3 w-3" />Last Visit</Label>
                    <Input type="date" value={detailForm.last_visit_date} onChange={e => setDetailForm(f => ({ ...f, last_visit_date: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><MapPin className="h-3 w-3" />Favourite City</Label>
                  <Input value={detailForm.favorite_city} onChange={e => setDetailForm(f => ({ ...f, favorite_city: e.target.value }))} placeholder="e.g. Rome" className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</Label>
                  <Textarea value={detailForm.notes} onChange={e => setDetailForm(f => ({ ...f, notes: e.target.value }))} placeholder="Memories, highlights…" rows={3} className="rounded-xl resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={saveCountryDetails} disabled={saving} className="flex-1 rounded-xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditCountry(null)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* ── Region detail dialog ── */}
      <AnimatePresence>
        {editRegion && (
          <Dialog open onOpenChange={() => setEditRegion(null)}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Edit — {editRegion.regionName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><Calendar className="h-3 w-3" />First Visit</Label>
                    <Input type="date" value={regionForm.first_visit_date} onChange={e => setRegionForm(f => ({ ...f, first_visit_date: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><Calendar className="h-3 w-3" />Last Visit</Label>
                    <Input type="date" value={regionForm.last_visit_date} onChange={e => setRegionForm(f => ({ ...f, last_visit_date: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><MapPin className="h-3 w-3" />Favourite City</Label>
                  <Input value={regionForm.favorite_city} onChange={e => setRegionForm(f => ({ ...f, favorite_city: e.target.value }))} placeholder="e.g. Chicago" className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</Label>
                  <Textarea value={regionForm.notes} onChange={e => setRegionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Memories, highlights…" rows={3} className="rounded-xl resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={saveRegionDetails} disabled={saving} className="flex-1 rounded-xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditRegion(null)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
