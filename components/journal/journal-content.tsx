'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { JournalEntry, Mood, MOOD_EMOJIS, MOOD_LABELS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { uploadJournalPhoto, validateImageFile } from '@/lib/utils/journal-photos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus, BookOpen, Calendar, MapPin, Trash2, Loader2,
  Star, Search, ExternalLink, ImageOff, Clock, X,
  Pencil, Cloud, ChevronDown, Upload, Camera, Globe2,
  Link as LinkIcon,
} from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

// ── Constants ──────────────────────────────────────────────────────────────────

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'amazing', emoji: MOOD_EMOJIS.amazing, label: MOOD_LABELS.amazing },
  { value: 'great',   emoji: MOOD_EMOJIS.great,   label: MOOD_LABELS.great   },
  { value: 'good',    emoji: MOOD_EMOJIS.good,     label: MOOD_LABELS.good    },
  { value: 'okay',    emoji: MOOD_EMOJIS.okay,     label: MOOD_LABELS.okay    },
  { value: 'bad',     emoji: MOOD_EMOJIS.bad,      label: MOOD_LABELS.bad     },
]

const MOOD_COLORS: Record<Mood, string> = {
  amazing: '#22c55e',
  great:   '#a855f7',
  good:    '#3b82f6',
  okay:    '#f59e0b',
  bad:     '#94a3b8',
}

// Sentinel: user picked "Trip destination" — NOT stored in DB (linked_to_trip column stores it)
const TRIP_SENTINEL = '_trip'

// ── Types ──────────────────────────────────────────────────────────────────────

interface JournalLocation {
  id: string
  name: string
  google_maps_link?: string | null
  address?: string | null
}

// Unified location resolved from either linked_to_trip or location_id
interface ResolvedLocation {
  name: string
  address?: string | null
  google_maps_link?: string | null
  isTripDestination: boolean
}

interface JournalContentProps {
  tripId: string
  userId: string
  tripName: string
  tripCountry: string
  tripStartDate: string | null
  initialEntries: JournalEntry[]
  locations: JournalLocation[]
}

interface EntryFormState {
  title: string
  date: string
  time: string
  mood: Mood | ''
  weather: string
  // '' = none | TRIP_SENTINEL = trip destination | uuid = saved place
  location_id: string
  content: string
  is_favorite: boolean
}

const EMPTY_FORM: EntryFormState = {
  title: '', date: '', time: '', mood: '',
  weather: '', location_id: '', content: '', is_favorite: false,
}

// ── Photo item types ───────────────────────────────────────────────────────────

type PhotoItem =
  | { id: string; type: 'saved';     url: string }
  | { id: string; type: 'uploading'; blobUrl: string; name: string; progress: number }
  | { id: string; type: 'done';      url: string }
  | { id: string; type: 'error';     blobUrl: string; name: string; error: string }

function photoUrl(item: PhotoItem): string {
  return item.type === 'saved' || item.type === 'done' ? item.url : item.blobUrl
}

function genId() { return Math.random().toString(36).slice(2) }

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcDayNumber(entryDate: string, tripStartDate: string | null): number | null {
  if (!tripStartDate || !entryDate) return null
  try { return differenceInDays(parseISO(entryDate), parseISO(tripStartDate)) + 1 }
  catch { return null }
}

function groupByDate(entries: JournalEntry[]): { date: string | null; label: string; items: JournalEntry[] }[] {
  const sorted = [...entries].sort((a, b) => {
    const da = a.date ?? '9999-12-31'
    const db = b.date ?? '9999-12-31'
    if (da !== db) return da.localeCompare(db)
    return (a.time ?? '').localeCompare(b.time ?? '')
  })
  const groups: { date: string | null; label: string; items: JournalEntry[] }[] = []
  for (const entry of sorted) {
    const date = entry.date ?? null
    const last = groups[groups.length - 1]
    if (last && last.date === date) last.items.push(entry)
    else {
      const label = date ? formatDate(date, 'EEEE, MMMM d, yyyy') : 'No Date'
      groups.push({ date, label, items: [entry] })
    }
  }
  return groups
}

// ── Trip Day Badge ─────────────────────────────────────────────────────────────

function TripDayBadge({ date, tripStartDate }: { date: string; tripStartDate: string | null }) {
  if (!date || !tripStartDate) return null
  try {
    const diff = differenceInDays(parseISO(date), parseISO(tripStartDate))
    if (diff < 0) return (
      <span className="inline-flex items-center text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
        Before trip
      </span>
    )
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full border border-primary/20">
        Day {diff + 1}
      </span>
    )
  } catch { return null }
}

// ── Mood Picker ────────────────────────────────────────────────────────────────

function MoodPicker({ value, onChange }: { value: Mood | ''; onChange: (v: Mood | '') => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOODS.map(m => {
        const selected = value === m.value
        return (
          <button key={m.value} type="button"
            onClick={() => onChange(selected ? '' : m.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border py-3 px-1 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[64px]',
              selected
                ? 'border-primary bg-primary/8 shadow-sm ring-1 ring-primary/25 scale-[1.03]'
                : 'border-border/60 bg-card hover:border-primary/30 hover:bg-primary/4 hover:scale-[1.02]',
            )}>
            <span className={cn('text-2xl leading-none transition-transform', selected && 'scale-110')}>{m.emoji}</span>
            <span className={cn('text-[10px] font-medium leading-tight text-center', selected ? 'text-primary' : 'text-muted-foreground')}>
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Location Picker ────────────────────────────────────────────────────────────
// Uses an inline expandable list — NOT a nested Dialog.
// Nested <Dialog> inside <Dialog> causes interaction events on the outer dialog
// to fire when clicking inside the inner one, losing the selection.

function LocationPicker({
  value, tripName, tripCountry, locations, onChange,
}: {
  value: string
  tripName: string
  tripCountry: string
  locations: JournalLocation[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)

  const isTrip = value === TRIP_SENTINEL
  const hasSelection = !!value
  const selectedPlace = !isTrip && value ? locations.find(l => l.id === value) : undefined

  function choose(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      {/* ── Current selection preview card ── */}
      {hasSelection ? (
        <div className={cn(
          'rounded-xl border bg-card transition-colors',
          isTrip ? 'border-primary/30' : 'border-border/70',
        )}>
          <div className="flex items-start gap-3 p-3">
            <div className={cn('mt-0.5 flex-shrink-0 p-1.5 rounded-lg',
              isTrip ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              {isTrip ? <Globe2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug">
                {isTrip ? tripName : (selectedPlace?.name ?? 'Unknown place')}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant={isTrip ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                  {isTrip ? 'Trip destination' : 'Saved place'}
                </Badge>
                {isTrip && tripCountry && (
                  <span className="text-[11px] text-muted-foreground">{tripCountry}</span>
                )}
                {!isTrip && selectedPlace?.address && (
                  <span className="text-[11px] text-muted-foreground truncate">{selectedPlace.address}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isTrip && selectedPlace?.google_maps_link && (
                <a href={selectedPlace.google_maps_link} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors" title="Open in Maps">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button type="button" onClick={() => setOpen(v => !v)}
                className="px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-medium">
                Change
              </button>
              <button type="button" onClick={() => { onChange(''); setOpen(false) }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── No selection: trigger button ── */
        <button type="button" onClick={() => setOpen(v => !v)}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-muted-foreground',
            'hover:bg-muted/30 hover:text-foreground transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]',
            open ? 'border-primary/40 bg-primary/4' : 'border-dashed border-border/60',
          )}>
          <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
          <span className="flex-1 text-left">Link a location…</span>
          <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      )}

      {/* ── Inline expandable list (no nested Dialog) ── */}
      {open && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {/* No location */}
          <button type="button" onClick={() => choose('')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors min-h-[44px] border-b border-border/40',
              !value ? 'bg-primary/8 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50',
            )}>
            <X className="h-4 w-4 flex-shrink-0" />
            No location
          </button>

          {/* Trip destination */}
          {tripName && (
            <>
              <div className="px-3 py-1.5 bg-muted/40 border-b border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Trip destination</p>
              </div>
              <button type="button" onClick={() => choose(TRIP_SENTINEL)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors min-h-[44px] border-b border-border/40',
                  isTrip ? 'bg-primary/8' : 'hover:bg-muted/50',
                )}>
                <div className={cn('mt-0.5 p-1 rounded-lg flex-shrink-0', isTrip ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Globe2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium leading-snug', isTrip && 'text-primary')}>{tripName}</p>
                  {tripCountry && <p className="text-[11px] text-muted-foreground mt-0.5">{tripCountry}</p>}
                </div>
                {isTrip && <div className="ml-auto mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
              </button>
            </>
          )}

          {/* Saved places */}
          {locations.length > 0 && (
            <>
              <div className="px-3 py-1.5 bg-muted/40 border-b border-border/40">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Saved places</p>
              </div>
              {locations.map((loc, i) => {
                const isSel = value === loc.id
                return (
                  <button key={loc.id} type="button" onClick={() => choose(loc.id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors min-h-[44px]',
                      i < locations.length - 1 && 'border-b border-border/40',
                      isSel ? 'bg-primary/8' : 'hover:bg-muted/50',
                    )}>
                    <div className={cn('mt-0.5 p-1 rounded-lg flex-shrink-0', isSel ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium leading-snug', isSel && 'text-primary')}>{loc.name}</p>
                      {loc.address && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{loc.address}</p>}
                    </div>
                    {isSel && <div className="ml-auto mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                )
              })}
            </>
          )}

          {!tripName && locations.length === 0 && (
            <div className="px-3 py-5 text-sm text-muted-foreground text-center">
              No saved places in this trip yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Photos Editor ──────────────────────────────────────────────────────────────

function PhotosEditor({
  initialUrls, userId, tripId, onChange, onUploadingChange,
}: {
  initialUrls: string[]
  userId: string
  tripId: string
  onChange: (urls: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    initialUrls.map(url => ({ id: genId(), type: 'saved' as const, url }))
  )
  const [showUrl, setShowUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const readyUrls = items.filter(i => i.type === 'saved' || i.type === 'done').map(i => photoUrl(i))
    onChange(readyUrls)
    onUploadingChange?.(items.some(i => i.type === 'uploading'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const valid: File[] = []
    for (const file of arr) {
      const err = validateImageFile(file)
      if (err) { toast.error(err); continue }
      valid.push(file)
    }
    if (valid.length === 0) return
    const newItems: PhotoItem[] = valid.map(file => ({
      id: genId(), type: 'uploading' as const,
      blobUrl: URL.createObjectURL(file), name: file.name, progress: 0,
    }))
    setItems(prev => [...prev, ...newItems])
    await Promise.all(valid.map(async (file, i) => {
      const placeholder = newItems[i]
      setItems(prev => prev.map(p => p.id === placeholder.id && p.type === 'uploading' ? { ...p, progress: 25 } : p))
      try {
        const url = await uploadJournalPhoto(file, userId, tripId)
        if (placeholder.type === 'uploading') URL.revokeObjectURL(placeholder.blobUrl)
        setItems(prev => prev.map(p => p.id === placeholder.id ? { id: p.id, type: 'done', url } : p))
        toast.success('Photo uploaded')
      } catch (err: unknown) {
        setItems(prev => prev.map(p =>
          p.id === placeholder.id && p.type === 'uploading'
            ? { id: p.id, type: 'error', blobUrl: p.blobUrl, name: p.name, error: err instanceof Error ? err.message : 'Upload failed' }
            : p
        ))
        toast.error(`Failed to upload ${file.name}`)
      }
    }))
  }

  function removeItem(id: string) {
    setItems(prev => {
      const item = prev.find(p => p.id === id)
      if (item && 'blobUrl' in item) URL.revokeObjectURL((item as { blobUrl: string }).blobUrl)
      return prev.filter(p => p.id !== id)
    })
  }

  function addUrl() {
    const url = urlInput.trim()
    if (!url) return
    setItems(prev => [...prev, { id: genId(), type: 'saved', url }])
    setUrlInput('')
  }

  const hasItems = items.length > 0
  const isUploading = items.some(i => i.type === 'uploading')

  return (
    <div className="space-y-3">
      {hasItems && (
        <div className="grid grid-cols-3 gap-2">
          {items.map(item => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group/photo">
              <img src={photoUrl(item)} alt=""
                className={cn('w-full h-full object-cover transition-all',
                  item.type === 'uploading' && 'opacity-50 blur-sm scale-105',
                  item.type === 'error' && 'opacity-30 grayscale')}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              {item.type === 'uploading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <Loader2 className="h-5 w-5 animate-spin text-white drop-shadow" />
                  <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              )}
              {item.type === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 p-1 text-center">
                  <ImageOff className="h-4 w-4 text-red-400" />
                  <p className="text-[9px] text-red-300 leading-tight line-clamp-2">{item.error}</p>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-[9px] text-white underline">Remove</button>
                </div>
              )}
              {(item.type === 'saved' || item.type === 'done') && (
                <button type="button" onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-100 md:opacity-0 md:group-hover/photo:opacity-100 hover:bg-red-500 transition-all">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />

      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
          disabled={isUploading} className="gap-2 h-9 flex-1">
          <Upload className="h-4 w-4 flex-shrink-0" /> Upload from device
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading} className="gap-2 h-9">
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Take photo</span>
        </Button>
      </div>

      {isUploading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
        </p>
      )}

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <button type="button" onClick={() => setShowUrl(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
          <span className="flex items-center gap-1.5 font-medium"><LinkIcon className="h-3.5 w-3.5" /> Paste image link</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', showUrl && 'rotate-180')} />
        </button>
        {showUrl && (
          <div className="border-t border-border/60 px-3 pb-3 pt-2 flex gap-2">
            <Input placeholder="https://example.com/photo.jpg" value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
              className="flex-1 text-sm h-9" />
            <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!urlInput.trim()} className="shrink-0 h-9">Add</Button>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">Max 10 MB · JPEG, PNG, WebP, GIF, HEIC</p>
    </div>
  )
}

// ── Entry card (timeline) ──────────────────────────────────────────────────────

function EntryCard({
  entry, isSelected, location, tripStartDate, onClick, onFavorite,
}: {
  entry: JournalEntry
  isSelected: boolean
  location?: ResolvedLocation
  tripStartDate: string | null
  onClick: () => void
  onFavorite: (e: React.MouseEvent) => void
}) {
  const moodColor = entry.mood ? MOOD_COLORS[entry.mood] : undefined
  const dayNum = entry.date ? calcDayNumber(entry.date, tripStartDate) : null

  return (
    <button onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border/60 bg-card hover:border-border hover:shadow-sm',
      )}
      style={moodColor ? { borderLeftColor: moodColor, borderLeftWidth: 3 } : undefined}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          {entry.mood && <span className="text-base leading-none mt-0.5 flex-shrink-0">{MOOD_EMOJIS[entry.mood]}</span>}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className={cn('font-medium text-sm leading-snug', isSelected ? 'text-primary' : 'text-foreground')}>
                {entry.title || 'Untitled'}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                {entry.time && <span className="text-[10px] text-muted-foreground font-mono">{entry.time.slice(0, 5)}</span>}
                <button onClick={onFavorite}
                  className={cn('p-0.5 rounded transition-colors',
                    entry.is_favorite ? 'text-amber-400 hover:text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400')}>
                  <Star className="h-3.5 w-3.5" fill={entry.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            {dayNum !== null && dayNum > 0 && <p className="text-[10px] text-primary/70 font-medium mt-0.5">Day {dayNum}</p>}
          </div>
        </div>

        {/* Location chip */}
        {location && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5">
            {location.isTripDestination
              ? <Globe2 className="h-3 w-3 flex-shrink-0 text-primary/60" />
              : <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
            }
            {location.name}
            {location.isTripDestination && location.address && (
              <span className="text-muted-foreground/60">· {location.address}</span>
            )}
          </p>
        )}

        {entry.content && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{entry.content}</p>}
        {entry.photos.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">📷 {entry.photos.length}</Badge>
          </div>
        )}
      </div>
    </button>
  )
}

// ── Entry detail panel ─────────────────────────────────────────────────────────

function EntryDetail({
  entry, location, tripStartDate, onEdit, onDelete, onFavorite, onClose,
}: {
  entry: JournalEntry
  location?: ResolvedLocation
  tripStartDate: string | null
  onEdit: () => void
  onDelete: () => void
  onFavorite: () => void
  onClose?: () => void
}) {
  const dayNum = entry.date ? calcDayNumber(entry.date, tripStartDate) : null
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {entry.mood && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{MOOD_EMOJIS[entry.mood]}</span>
              <span className="text-sm text-muted-foreground">{MOOD_LABELS[entry.mood]}</span>
            </div>
          )}
          <h2 className="text-lg font-bold leading-snug">{entry.title || 'Untitled'}</h2>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
            {entry.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dayNum && dayNum > 0 ? `Day ${dayNum} — ` : ''}{formatDate(entry.date, 'EEEE, MMMM d, yyyy')}
              </span>
            )}
            {entry.time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{entry.time.slice(0, 5)}</span>}
            {entry.weather && <span className="flex items-center gap-1"><Cloud className="h-3.5 w-3.5" />{entry.weather}</span>}
          </div>

          {/* Location display */}
          {location && (
            <div className="mt-2">
              {location.google_maps_link ? (
                <a href={location.google_maps_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/8 px-2.5 py-1 rounded-full">
                  <MapPin className="h-3 w-3" />{location.name}<ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full',
                  location.isTripDestination
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground bg-muted',
                )}>
                  {location.isTripDestination
                    ? <Globe2 className="h-3 w-3" />
                    : <MapPin className="h-3 w-3" />
                  }
                  {location.name}
                  {location.isTripDestination && location.address && (
                    <span className="text-muted-foreground ml-0.5">· {location.address}</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onFavorite}
            className={cn('p-2 rounded-lg transition-colors',
              entry.is_favorite ? 'text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100' : 'text-muted-foreground hover:bg-muted')}
            title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Star className="h-4 w-4" fill={entry.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {entry.content && <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.content}</p>}

      {entry.photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photos · {entry.photos.length}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {entry.photos.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
                {!imgErrors.has(i) ? (
                  <img src={url} alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={() => setImgErrors(prev => new Set([...prev, i]))} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground/40">
                    <ImageOff className="h-6 w-6" /><span className="text-[10px]">Not found</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add / Edit dialog ──────────────────────────────────────────────────────────

function EntryDialog({
  open, onOpenChange, form, setForm,
  photoUrls, setPhotoUrls, photosUploading, setPhotosUploading,
  tripName, tripCountry, tripStartDate, userId, tripId, locations,
  onSave, saving, isEdit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  form: EntryFormState
  setForm: React.Dispatch<React.SetStateAction<EntryFormState>>
  photoUrls: string[]
  setPhotoUrls: (urls: string[]) => void
  photosUploading: boolean
  setPhotosUploading: (v: boolean) => void
  tripName: string
  tripCountry: string
  tripStartDate: string | null
  userId: string
  tripId: string
  locations: JournalLocation[]
  onSave: () => void
  saving: boolean
  isEdit: boolean
}) {
  const set = useCallback((k: keyof EntryFormState, v: string | boolean | null) =>
    setForm(f => ({ ...f, [k]: v ?? '' })), [setForm])

  const [showMore, setShowMore] = useState(false)
  useEffect(() => { if (open) setShowMore(false) }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 1. Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</Label>
            <Input placeholder="Morning at the Colosseum, Hiking Cinque Terre…"
              value={form.title} onChange={e => set('title', e.target.value)} className="h-10" />
          </div>

          {/* 2. Date & Time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date & Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="h-10" />
              <Input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="h-10" />
            </div>
            {form.date && <div className="mt-1"><TripDayBadge date={form.date} tripStartDate={tripStartDate} /></div>}
          </div>

          {/* 3. Mood */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mood</Label>
            <MoodPicker value={form.mood} onChange={v => set('mood', v)} />
          </div>

          {/* 4. Linked Location — inline picker, no nested Dialog */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Linked Location</Label>
            <LocationPicker
              value={form.location_id}
              tripName={tripName}
              tripCountry={tripCountry}
              locations={locations}
              onChange={v => set('location_id', v)}
            />
          </div>

          {/* 5. Journal Entry */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Journal Entry <span className="text-destructive">*</span>
            </Label>
            <Textarea rows={7} placeholder="Write about what you saw, tasted, felt, or want to remember…"
              value={form.content} onChange={e => set('content', e.target.value)} className="resize-none leading-relaxed" />
          </div>

          {/* 6. Photos */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photos</Label>
            <PhotosEditor
              key={`${open}-${isEdit}`}
              initialUrls={photoUrls}
              userId={userId}
              tripId={tripId}
              onChange={setPhotoUrls}
              onUploadingChange={setPhotosUploading}
            />
          </div>

          {/* 7. More Options */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <button type="button" onClick={() => setShowMore(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors">
              <span>More Options</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', showMore && 'rotate-180')} />
            </button>
            {showMore && (
              <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weather</Label>
                  <div className="relative">
                    <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Input placeholder="Auto-filled in future" value={form.weather}
                      onChange={e => set('weather', e.target.value)} className="pl-9 h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Favorite</Label>
                  <button type="button" onClick={() => set('is_favorite', !form.is_favorite)}
                    className={cn('flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[44px]',
                      form.is_favorite
                        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/40')}>
                    <Star className="h-4 w-4 flex-shrink-0" fill={form.is_favorite ? 'currentColor' : 'none'} />
                    {form.is_favorite ? 'Marked as favorite ★' : 'Mark as favorite'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || photosUploading} className="flex-1 h-11">
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : photosUploading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
                  : isEdit ? 'Save Changes' : 'Save Entry'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function JournalContent({
  tripId, userId, tripName, tripCountry, tripStartDate, initialEntries, locations,
}: JournalContentProps) {
  const supabase = createClient()

  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState<EntryFormState>(EMPTY_FORM)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photosUploading, setPhotosUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Resolve linked location (handles both trip destination and saved place) ──

  function resolveLocation(entry: JournalEntry): ResolvedLocation | undefined {
    if (entry.linked_to_trip) {
      return { name: tripName, address: tripCountry || null, google_maps_link: null, isTripDestination: true }
    }
    if (!entry.location_id) return undefined
    const loc = locations.find(l => l.id === entry.location_id)
    if (!loc) return undefined
    return {
      name: loc.name,
      address: loc.address ?? null,
      google_maps_link: loc.google_maps_link ?? null,
      isTripDestination: false,
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e => {
      const loc = resolveLocation(e)
      return (
        e.title?.toLowerCase().includes(q) ||
        e.content?.toLowerCase().includes(q) ||
        loc?.name.toLowerCase().includes(q) ||
        loc?.address?.toLowerCase().includes(q)
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, search, locations, tripName, tripCountry])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])
  const favorites = useMemo(() => entries.filter(e => e.is_favorite), [entries])

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setEditEntry(null)
    setForm(EMPTY_FORM)
    setPhotoUrls([])
    setPhotosUploading(false)
    setDialogOpen(true)
  }

  function openEdit(entry: JournalEntry) {
    setEditEntry(entry)
    setForm({
      title:       entry.title ?? '',
      date:        entry.date ?? '',
      time:        entry.time ?? '',
      mood:        entry.mood ?? '',
      weather:     entry.weather ?? '',
      // Restore _trip sentinel when linked_to_trip was true
      location_id: entry.linked_to_trip ? TRIP_SENTINEL : (entry.location_id ?? ''),
      content:     entry.content ?? '',
      is_favorite: entry.is_favorite ?? false,
    })
    setPhotoUrls([...(entry.photos ?? [])])
    setPhotosUploading(false)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditEntry(null)
    setForm(EMPTY_FORM)
    setPhotoUrls([])
    setPhotosUploading(false)
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.content.trim()) { toast.error('Write something in your journal entry'); return }
    if (photosUploading) { toast.error('Please wait for photo uploads to finish'); return }
    setSaving(true)
    try {
      const isTripDest = form.location_id === TRIP_SENTINEL
      const payload = {
        trip_id:       tripId,
        user_id:       userId,
        title:         form.title || null,
        date:          form.date || null,
        time:          form.time || null,
        mood:          form.mood || null,
        weather:       form.weather || null,
        location_id:   isTripDest ? null : (form.location_id || null),
        linked_to_trip: isTripDest,
        content:       form.content,
        photos:        photoUrls.filter(Boolean),
        is_favorite:   form.is_favorite,
      }

      if (editEntry) {
        const { data, error } = await supabase
          .from('journal_entries').update(payload).eq('id', editEntry.id).select().single()
        if (error) throw error
        setEntries(prev => prev.map(e => e.id === editEntry.id ? data : e))
        if (selected?.id === editEntry.id) setSelected(data)
        toast.success('Entry updated!')
      } else {
        const { data, error } = await supabase
          .from('journal_entries').insert(payload).select().single()
        if (error) throw error
        setEntries(prev => [...prev, data])
        setSelected(data)
        toast.success('Journal entry saved!')
      }
      closeDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) { setSelected(null); setDetailOpen(false) }
    toast.success('Entry deleted')
  }

  async function toggleFavorite(entry: JournalEntry) {
    const newVal = !entry.is_favorite
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_favorite: newVal } : e))
    if (selected?.id === entry.id) setSelected(s => s ? { ...s, is_favorite: newVal } : s)
    const { error } = await supabase.from('journal_entries').update({ is_favorite: newVal }).eq('id', entry.id)
    if (error) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_favorite: !newVal } : e))
      toast.error('Failed to update favorite')
    }
  }

  function selectEntry(entry: JournalEntry) {
    setSelected(entry)
    setDetailOpen(true)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 md:px-5 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary"><BookOpen className="h-4 w-4" /></div>
          <div>
            <h2 className="font-semibold text-base leading-tight">Journal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {favorites.length > 0 && ` · ${favorites.length} ★`}
            </p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> New Entry
        </Button>
      </div>

      {/* Search */}
      {entries.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input placeholder="Search title, content, location…" className="pl-9 h-9 text-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground p-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Empty / no-results states */}
      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <p className="font-semibold text-lg">Your travel diary is empty</p>
            <p className="text-muted-foreground mt-1 text-sm max-w-sm">Write about your day, capture memories, and build your personal travel story.</p>
            <Button onClick={openAdd} className="mt-5 gap-2"><Plus className="h-4 w-4" /> Write First Entry</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-medium">No entries match &ldquo;{search}&rdquo;</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearch('')}>Clear search</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-5 lg:items-start">
          {/* Timeline */}
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.date ?? 'undated'}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/60" />
                    {group.date && tripStartDate && (calcDayNumber(group.date, tripStartDate) ?? 0) > 0
                      ? <>Day {calcDayNumber(group.date, tripStartDate)} — {group.label}</>
                      : group.label}
                  </div>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className="space-y-2">
                  {group.items.map(entry => (
                    <EntryCard key={entry.id} entry={entry}
                      isSelected={selected?.id === entry.id}
                      location={resolveLocation(entry)}
                      tripStartDate={tripStartDate}
                      onClick={() => selectEntry(entry)}
                      onFavorite={e => { e.stopPropagation(); toggleFavorite(entry) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop detail panel */}
          <div className="hidden lg:block sticky top-4">
            {selected ? (
              <Card>
                <CardContent className="pt-5 pb-5">
                  <EntryDetail entry={selected}
                    location={resolveLocation(selected)}
                    tripStartDate={tripStartDate}
                    onEdit={() => openEdit(selected)}
                    onDelete={() => handleDelete(selected.id)}
                    onFavorite={() => toggleFavorite(selected)} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Select an entry to read it</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Mobile detail dialog */}
      <Dialog open={detailOpen && !!selected} onOpenChange={open => { if (!open) setDetailOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {selected && (
            <EntryDetail entry={selected}
              location={resolveLocation(selected)}
              tripStartDate={tripStartDate}
              onEdit={() => { setDetailOpen(false); openEdit(selected) }}
              onDelete={() => handleDelete(selected.id)}
              onFavorite={() => toggleFavorite(selected)}
              onClose={() => setDetailOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit dialog */}
      <EntryDialog
        open={dialogOpen}
        onOpenChange={open => { if (!open) closeDialog(); else setDialogOpen(true) }}
        form={form} setForm={setForm}
        photoUrls={photoUrls} setPhotoUrls={setPhotoUrls}
        photosUploading={photosUploading} setPhotosUploading={setPhotosUploading}
        tripName={tripName} tripCountry={tripCountry} tripStartDate={tripStartDate}
        userId={userId} tripId={tripId}
        locations={locations}
        onSave={handleSave} saving={saving} isEdit={!!editEntry}
      />
    </div>
  )
}
