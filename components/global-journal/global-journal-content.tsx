'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Search, Star, Camera, ArrowRight,
  MapPin, Plane, Globe2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GlobalJournalEntry {
  id: string
  title: string | null
  content: string | null
  date: string | null
  time: string | null
  mood: string | null
  weather: string | null
  photos: string[]
  is_favorite: boolean | null
  location_id: string | null
  linked_to_trip: boolean | null
  trips: { id: string; name: string; country: string; country_code: string | null; start_date: string | null } | null
  locations: { name: string; address: string | null } | null
}

export interface GlobalJournalTrip {
  id: string
  name: string
  country: string
  country_code: string | null
  start_date: string | null
  cover_photo: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MOOD_EMOJIS: Record<string, string> = {
  amazing: '🤩', great: '😄', good: '😊', okay: '😐', bad: '😞',
}

const CARD_GRADIENTS = [
  'from-violet-500 via-purple-600 to-indigo-700',
  'from-rose-400 via-pink-500 to-rose-600',
  'from-amber-400 via-orange-400 to-red-500',
  'from-teal-500 via-emerald-500 to-green-600',
  'from-sky-500 via-blue-500 to-indigo-600',
  'from-fuchsia-500 via-purple-500 to-violet-600',
  'from-cyan-400 via-teal-500 to-emerald-600',
]

function getGradient(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
}

function getLocationName(entry: GlobalJournalEntry): string | null {
  if (entry.linked_to_trip && entry.trips) return entry.trips.country
  if (entry.locations) return entry.locations.name
  return null
}

function getCountryFlag(code: string | null | undefined): string {
  if (!code) return ''
  try {
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
  } catch { return '' }
}

// ── Featured Memory (hero card) ────────────────────────────────────────────────

function FeaturedMemory({ entry }: { entry: GlobalJournalEntry }) {
  const photos = entry.photos ?? []
  const photo = photos[0]
  const gradient = getGradient(entry.id)
  const locationName = getLocationName(entry)
  const flag = getCountryFlag(entry.trips?.country_code)

  return (
    <Link href={entry.trips ? `/trips/${entry.trips.id}/journal` : '#'} className="block group">
      <div className="relative h-72 sm:h-80 md:h-[22rem] rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/[0.06] dark:ring-white/[0.07]">
        {photo ? (
          <Image
            src={photo}
            alt={entry.title ?? 'Featured memory'}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <BookOpen className="h-32 w-32 text-white" />
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Featured label + mood */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/75 bg-black/30 backdrop-blur-sm border border-white/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Featured Memory
          </span>
          {entry.mood && (
            <span className="text-2xl drop-shadow-lg">{MOOD_EMOJIS[entry.mood]}</span>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 space-y-2">
          {entry.trips && (
            <div className="flex items-center gap-1.5 text-white/65 text-xs font-medium">
              {flag && <span>{flag}</span>}
              <span>{entry.trips.name}</span>
              {entry.date && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{formatDate(entry.date)}</span>
                </>
              )}
            </div>
          )}

          <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug line-clamp-2 drop-shadow-sm">
            {entry.title || 'Untitled Memory'}
          </h2>

          {entry.content && (
            <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
              {entry.content}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {locationName && (
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {locationName}
                </span>
              )}
              {entry.is_favorite && (
                <span className="flex items-center gap-1 text-amber-400 text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  Favorite
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-white text-xs font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 transition-colors">
              Open memory
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Memory Card (grid item) ─────────────────────────────────────────────────────

function MemoryCard({ entry }: { entry: GlobalJournalEntry }) {
  const photos = entry.photos ?? []
  const photo = photos[0]
  const gradient = getGradient(entry.id)
  const locationName = getLocationName(entry)
  const flag = getCountryFlag(entry.trips?.country_code)

  return (
    <Link href={entry.trips ? `/trips/${entry.trips.id}/journal` : '#'} className="block group">
      <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

        {/* Photo or gradient header */}
        <div className="relative h-40 overflow-hidden">
          {photo ? (
            <Image
              src={photo}
              alt={entry.title ?? 'Memory'}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)}>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-white/25" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Mood + favorite overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
            {entry.mood ? (
              <span className="text-xl drop-shadow-md leading-none">{MOOD_EMOJIS[entry.mood]}</span>
            ) : (
              <span />
            )}
            {entry.is_favorite && (
              <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-md flex-shrink-0" />
            )}
          </div>

          {/* Date bottom */}
          {entry.date && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="text-[11px] text-white/80 font-medium leading-none">
                {formatDate(entry.date)}
              </span>
            </div>
          )}

          {/* Photos count badge */}
          {photos.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[11px] text-white/75 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5">
              <Camera className="h-3 w-3" />
              {photos.length}
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {entry.title || 'Untitled Memory'}
          </h3>

          {entry.trips && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <span className="truncate">{entry.trips.name}</span>
            </div>
          )}

          {locationName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0 text-primary/50" />
              <span className="truncate">{locationName}</span>
            </div>
          )}

          {entry.content && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {entry.content}
            </p>
          )}

          <div className="flex items-center justify-end pt-1 border-t border-border/50 mt-2">
            <span className="text-[11px] font-medium text-primary flex items-center gap-1">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Trip group row ──────────────────────────────────────────────────────────────

function TripGroupRow({ trip, entryCount }: { trip: GlobalJournalTrip; entryCount: number }) {
  const flag = getCountryFlag(trip.country_code)

  return (
    <Link href={`/trips/${trip.id}/journal`} className="block group">
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/4 transition-all duration-200">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl leading-none">
          {flag || <Globe2 className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {trip.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{trip.country}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            {entryCount} {entryCount === 1 ? 'memory' : 'memories'}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// ── Stats bar ───────────────────────────────────────────────────────────────────

function StatsBar({ entries }: { entries: GlobalJournalEntry[] }) {
  const totalPhotos = entries.reduce((sum, e) => sum + (e.photos?.length ?? 0), 0)
  const totalFavorites = entries.filter(e => e.is_favorite).length
  const tripsWithMemories = new Set(entries.map(e => e.trips?.id).filter(Boolean)).size

  const stats = [
    { icon: BookOpen, value: entries.length,      label: entries.length === 1 ? 'memory' : 'memories' },
    { icon: Plane,    value: tripsWithMemories,    label: tripsWithMemories === 1 ? 'trip' : 'trips' },
    { icon: Camera,   value: totalPhotos,          label: totalPhotos === 1 ? 'photo' : 'photos' },
    { icon: Star,     value: totalFavorites,       label: totalFavorites === 1 ? 'favorite' : 'favorites' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
          <span className="font-medium text-foreground">{value}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Filter pill types ───────────────────────────────────────────────────────────

type FilterKey = 'all' | 'favorites' | 'photos'

const FILTERS: { key: FilterKey; label: (entries: GlobalJournalEntry[]) => string }[] = [
  { key: 'all',       label: (e) => `All (${e.length})` },
  { key: 'favorites', label: () => '⭐ Favorites' },
  { key: 'photos',    label: () => '📷 With Photos' },
]

// ── Main component ──────────────────────────────────────────────────────────────

interface GlobalJournalContentProps {
  entries: GlobalJournalEntry[]
  trips: GlobalJournalTrip[]
}

export function GlobalJournalContent({ entries, trips }: GlobalJournalContentProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const q = search.toLowerCase().trim()
  const isSearchActive = !!q || filter !== 'all'

  const filtered = useMemo(() => entries.filter(entry => {
    const matchesSearch = !q || [
      entry.title, entry.content, entry.trips?.name,
      entry.locations?.name, entry.trips?.country,
    ].some(s => s?.toLowerCase().includes(q))

    const matchesFilter =
      filter === 'favorites' ? !!entry.is_favorite :
      filter === 'photos'    ? (entry.photos?.length ?? 0) > 0 :
      true

    return matchesSearch && matchesFilter
  }), [entries, q, filter])

  // Featured: first entry with photo when not searching; fall back to most recent
  const featured = useMemo(() => {
    if (entries.length === 0 || isSearchActive) return null
    return entries.find(e => (e.photos?.length ?? 0) > 0) ?? entries[0]
  }, [entries, isSearchActive])

  // Grid: everything except the featured entry (when not searching)
  const gridEntries = useMemo(() =>
    featured ? filtered.filter(e => e.id !== featured.id) : filtered,
  [filtered, featured])

  // Trip groups: only trips that have at least one entry
  const tripGroups = useMemo(() => {
    const countMap = new Map<string, number>()
    entries.forEach(e => {
      if (e.trips?.id) countMap.set(e.trips.id, (countMap.get(e.trips.id) ?? 0) + 1)
    })
    return trips
      .filter(t => countMap.has(t.id))
      .map(t => ({ trip: t, count: countMap.get(t.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [entries, trips])

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Travel Journal</h1>
          <p className="text-muted-foreground mt-1">Your memories from every adventure</p>
        </div>
        <div className="mt-10 flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/10">
            <BookOpen className="h-10 w-10 text-primary/40" />
          </div>
          <h2 className="text-xl font-semibold">Your travel memories will appear here</h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
            Start writing your first journal entry from any trip. Each memory you capture will show up here.
          </p>
          <Link href="/trips" className="mt-6">
            <Button className="gap-2">
              <Plane className="h-4 w-4" /> Go to My Trips
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Travel Journal</h1>
            <p className="text-muted-foreground mt-0.5">Your memories from every adventure</p>
          </div>
        </div>
        <StatsBar entries={entries} />
      </div>

      {/* Featured memory — hidden during search/filter */}
      {featured && (
        <FeaturedMemory entry={featured} />
      )}

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories, trips, locations…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filter === key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground',
              )}
            >
              {label(entries)}
            </button>
          ))}
        </div>
      </div>

      {/* Search result count */}
      {isSearchActive && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground -mt-2">
          {filtered.length} {filtered.length === 1 ? 'memory' : 'memories'} found
        </p>
      )}

      {/* No-results state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No memories found</p>
          <p className="text-sm mt-1">Try different keywords or change the filter</p>
        </div>
      ) : (
        <>
          {/* Memory grid */}
          {gridEntries.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {gridEntries.map(entry => (
                <MemoryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {/* Trips with memories — only when not actively searching and there's more than one trip */}
          {!isSearchActive && tripGroups.length > 1 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base">Memories by Trip</h2>
                <span className="text-sm text-muted-foreground">· {tripGroups.length} trips</span>
              </div>
              <div className="space-y-2">
                {tripGroups.map(({ trip, count }) => (
                  <TripGroupRow key={trip.id} trip={trip} entryCount={count} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
