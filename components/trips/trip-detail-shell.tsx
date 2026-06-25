'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, getTripStatusColor, getEffectiveStatus } from '@/lib/utils'
import { validateHeroImageFile, uploadCustomHeroImage } from '@/lib/utils/trip-hero-image'
import { FlagImg } from '@/components/ui/flag-img'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard, MapPin, CheckSquare, BarChart3, BookOpen,
  Calendar, ChevronLeft, Trash2, Loader2, ClipboardCheck, Camera, Upload, ImageIcon, RotateCcw, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditTripDialog } from './edit-trip-dialog'

const TABS = [
  { label: 'Overview',     href: 'overview',     icon: LayoutDashboard },
  { label: 'Places',       href: 'places',       icon: MapPin },
  { label: 'Suggestions',  href: 'suggestions',  icon: Sparkles },
  { label: 'Itinerary',    href: 'itinerary',    icon: Calendar },
  { label: 'Checklist',    href: 'checklist',    icon: CheckSquare },
  { label: 'Budget',       href: 'budget',       icon: BarChart3 },
  { label: 'Journal',      href: 'journal',      icon: BookOpen },
]

interface TripDetailShellProps {
  trip: Trip
  children: React.ReactNode
}

export function TripDetailShell({ trip, children }: TripDetailShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const days = daysUntil(trip.start_date)
  const [imgSrc, setImgSrc] = useState(trip.cover_photo || '')
  const [imgError, setImgError] = useState(!trip.cover_photo)

  const countdownBg =
    days === null || days < 0 ? 'bg-black/45' :
    days === 0               ? 'bg-rose-500/85' :
    days <= 7               ? 'bg-orange-500/85' :
    'bg-black/40'

  async function handleConfirm() {
    setConfirming(true)
    try {
      const { error } = await supabase.from('trips').update({ is_planning: false }).eq('id', trip.id)
      if (error) throw error
      toast.success('Trip confirmed — no longer in Planning')
      router.refresh()
    } catch {
      toast.error('Failed to confirm trip')
    } finally {
      setConfirming(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase.from('trips').delete().eq('id', trip.id)
      if (error) throw error
      toast.success('Trip deleted')
      router.push('/trips')
    } catch {
      toast.error('Failed to delete trip')
      setDeleting(false)
    }
  }

  function handlePhotoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateHeroImageFile(file)
    if (err) { toast.error(err); return }
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
    setHeroFile(file)
    setHeroPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  function closePhotoDialog() {
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
    setHeroPreviewUrl(null)
    setHeroFile(null)
    setPhotoOpen(false)
  }

  async function handlePhotoSave() {
    if (!heroFile) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const uploaded = await uploadCustomHeroImage(supabase, heroFile, user.id, trip.id)
      if (!uploaded) throw new Error('Upload failed — please try again')
      const { error } = await supabase.from('trips').update({ cover_photo: uploaded }).eq('id', trip.id)
      if (error) throw error
      setImgSrc(uploaded)
      setImgError(false)
      toast.success('Hero photo updated')
      closePhotoDialog()
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handlePhotoReset() {
    await supabase.from('trips').update({ cover_photo: null }).eq('id', trip.id)
    setImgSrc('')
    setImgError(true)
    closePhotoDialog()

    if (!trip.place_id) {
      toast.success('Cover photo removed')
      return
    }

    // Has a place_id — fetch a real photo in the background
    toast.success('Cover photo removed — fetching destination image…')
    fetch('/api/trips/fetch-hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId:  trip.id,
        placeId: trip.place_id,
        city:    trip.city ?? null,
        country: trip.country ?? null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          setImgSrc(data.url)
          setImgError(false)
        }
      })
      .catch(() => {})
  }

  return (
    <>
      {/* ── Unified Hero + Tabs card ── */}
      <div className="md:max-w-5xl md:mx-auto md:px-5 md:pt-6">

        {/* Card wrapper: clips image corners + unifies hero and tabs on desktop */}
        <div className="md:rounded-2xl md:overflow-hidden md:ring-1 md:ring-black/[0.06] dark:md:ring-white/[0.07] md:shadow-[0_1px_4px_rgba(0,0,0,0.05),0_6px_20px_rgba(0,0,0,0.06)]">

          {/* Hero image */}
          <div className="group relative h-44 sm:h-56 md:h-[320px] overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoFileSelect}
            />
            {/* Photo OR gradient placeholder */}
            {!imgError ? (
              <Image
                src={imgSrc}
                alt={trip.name}
                fill
                sizes="(max-width: 768px) 100vw, 1024px"
                className="object-cover object-center"
                priority
                onError={() => setImgError(true)}
              />
            ) : (
              /* Gradient placeholder — shown when cover_photo is null or fails to load */
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: [
                      'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.45) 0%, transparent 55%)',
                      'radial-gradient(ellipse at 75% 65%, rgba(56,189,248,0.20) 0%, transparent 50%)',
                      'radial-gradient(ellipse at 60% 20%, rgba(168,85,247,0.20) 0%, transparent 45%)',
                    ].join(','),
                  }}
                />
                {/* Destination info — centered in the gradient area */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl font-bold text-white/75 leading-none select-none">
                      {(trip.city || trip.country || trip.name)?.[0]?.toUpperCase() ?? '✈'}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-white/85 text-base font-semibold leading-snug">
                      {trip.city ?? trip.country}
                    </p>
                    {trip.city && trip.country && (
                      <p className="text-white/45 text-xs mt-0.5">{trip.country}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setPhotoOpen(true)}
                    className="flex items-center gap-1.5 mt-1 text-white/50 hover:text-white/85 transition-colors text-xs font-medium border border-white/15 hover:border-white/35 rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10"
                  >
                    <Camera className="h-3 w-3" />
                    Add cover photo
                  </button>
                </div>
              </div>
            )}

            {/* Gradient overlays */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-t to-transparent',
              imgError ? 'from-black/60 via-black/0' : 'from-black/85 via-black/20 to-black/10',
            )} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Change photo — always on mobile, hover on desktop */}
            <button
              onClick={() => setPhotoOpen(true)}
              className="absolute bottom-14 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white rounded-full px-2.5 py-1.5 text-xs font-medium transition-all md:opacity-0 md:group-hover:opacity-100"
              title="Change cover photo"
            >
              <Camera className="h-3 w-3" />
              <span className="hidden sm:inline">Change photo</span>
            </button>

            {/* Top row: back + actions */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <Link href="/trips">
                <button className="flex items-center gap-1 text-white/85 hover:text-white text-xs font-medium bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/15 rounded-full pl-2 pr-3 py-1.5 transition-all">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  All Trips
                </button>
              </Link>
              <div className="flex items-center gap-1.5">
                {/* Planning pill — only shown for upcoming trips still in planning phase */}
                {(trip.is_planning ?? true) && !['active', 'completed'].includes(getEffectiveStatus(trip)) && (
                  <button
                    onClick={trip.start_date ? handleConfirm : undefined}
                    disabled={!trip.start_date || confirming}
                    title={
                      !trip.start_date
                        ? 'Add a start date before confirming'
                        : 'Mark trip as confirmed — removes it from Planning filter'
                    }
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium backdrop-blur-sm border rounded-full px-2.5 py-1.5 transition-all',
                      trip.start_date
                        ? 'bg-amber-500/80 hover:bg-amber-500 border-amber-400/40 text-white cursor-pointer'
                        : 'bg-black/30 border-white/15 text-white/50 cursor-not-allowed',
                    )}
                  >
                    {confirming
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <ClipboardCheck className="h-3 w-3" />
                    }
                    Planning
                  </button>
                )}
                <EditTripDialog trip={trip} glassMode />
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="bg-black/30 hover:bg-red-500/70 backdrop-blur-sm border border-white/15 rounded-full p-1.5 text-white/80 hover:text-white transition-all"
                  title="Delete trip"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom row: trip info + countdown */}
            <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm border border-white/15 text-white/90 ${getTripStatusColor(getEffectiveStatus(trip))} bg-opacity-70`}>
                    {getEffectiveStatus(trip)}
                  </span>
                </div>
                <h1 className="text-white font-bold text-[1.15rem] md:text-xl leading-snug line-clamp-1">{trip.name}</h1>
                <p className="text-white/60 text-xs mt-0.5 truncate">
                  {trip.country_code ? <><FlagImg code={trip.country_code} className="w-4 h-3" />&nbsp;</> : '🌍 '}
                  {trip.city ? `${trip.city} · ` : ''}{trip.country}
                  {trip.start_date && ` · ${formatDate(trip.start_date, 'MMM d')}`}
                  {trip.end_date && ` – ${formatDate(trip.end_date, 'MMM d, yyyy')}`}
                </p>
              </div>

              {days !== null && days >= 0 && (
                <div className={`${countdownBg} backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-center min-w-[52px] flex-shrink-0`}>
                  <div className="text-white font-bold text-2xl leading-none tabular-nums">{days}</div>
                  <div className="text-white/65 text-[9px] font-semibold uppercase tracking-wide mt-0.5">
                    {days === 0 ? 'Today' : 'days'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab bar — sits flush against the hero image bottom, inside the card */}
          <div className="bg-background border-t border-border/20 border-b border-border md:border-b-0">
            <nav className="flex overflow-x-auto scrollbar-hide px-2 md:px-4">
              {TABS.map(({ label, href, icon: Icon }) => {
                const active = pathname.endsWith(`/${href}`)
                return (
                  <Link
                    key={href}
                    href={`/trips/${trip.id}/${href}`}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                      active
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

        </div>
      </div>

      {/* ── Tab content ── */}
      {children}

      {/* ── Change photo dialog ── */}
      <Dialog open={photoOpen} onOpenChange={open => { if (!open) closePhotoDialog() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4" /> Change Cover Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden h-36 bg-slate-100 dark:bg-slate-800">
              {(heroPreviewUrl || (imgSrc && !imgError)) ? (
                <>
                  <img
                    src={heroPreviewUrl || imgSrc}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {heroFile && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-4">
                      <p className="text-white text-[11px] font-medium truncate">{heroFile.name}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-900 flex items-center justify-center">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.4) 0%, transparent 55%)',
                    }}
                  />
                  <span className="relative text-3xl font-bold text-white/20 select-none">
                    {(trip.city || trip.country)?.[0]?.toUpperCase() ?? '✈'}
                  </span>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">Upload from device</span>
                <span className="text-[10px] text-muted-foreground text-center">JPEG, PNG, WebP · max 5 MB</span>
              </button>
              <button
                type="button"
                onClick={handlePhotoReset}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-border/80 hover:bg-muted/50 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-colors">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">Reset to auto</span>
                <span className="text-[10px] text-muted-foreground text-center">Use destination image</span>
              </button>
            </div>

            {!heroFile && (
              <p className="text-xs text-muted-foreground text-center">
                Select an option above, or{' '}
                <button
                  className="underline hover:text-foreground transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </button>
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={closePhotoDialog} className="flex-1" disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handlePhotoSave} disabled={!heroFile || uploading} className="flex-1">
                {uploading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Uploading…</>
                  : <><ImageIcon className="h-4 w-4 mr-1" /> Save Photo</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete &quot;{trip.name}&quot;?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will permanently delete this trip and <strong className="text-foreground">all associated data</strong>:
              itinerary, checklist, budget, places, and journal entries.
            </p>
            <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-sm font-semibold text-destructive">⚠️ This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1" disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
