'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, getDestinationImage, getTripStatusColor } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard, MapPin, CheckSquare, BarChart3, BookOpen,
  Calendar, ChevronLeft, Trash2, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditTripDialog } from './edit-trip-dialog'

const TABS = [
  { label: 'Overview',  href: 'overview',  icon: LayoutDashboard },
  { label: 'Places',    href: 'places',    icon: MapPin },
  { label: 'Itinerary', href: 'itinerary', icon: Calendar },
  { label: 'Checklist', href: 'checklist', icon: CheckSquare },
  { label: 'Budget',    href: 'budget',    icon: BarChart3 },
  { label: 'Journal',   href: 'journal',   icon: BookOpen },
]

interface TripDetailShellProps {
  trip: Trip
  children: React.ReactNode
}

export function TripDetailShell({ trip, children }: TripDetailShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const days = daysUntil(trip.start_date)
  const imgSrc = getDestinationImage(trip)

  const countdownBg =
    days === null || days < 0 ? 'bg-black/45' :
    days === 0               ? 'bg-rose-500/85' :
    days <= 7               ? 'bg-orange-500/85' :
    'bg-black/40'

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

  return (
    <>
      {/* ── Unified Hero + Tabs card ── */}
      <div className="md:max-w-5xl md:mx-auto md:px-5 md:pt-6">

        {/* Card wrapper: clips image corners + unifies hero and tabs on desktop */}
        <div className="md:rounded-2xl md:overflow-hidden md:ring-1 md:ring-black/[0.06] dark:md:ring-white/[0.07] md:shadow-[0_1px_4px_rgba(0,0,0,0.05),0_6px_20px_rgba(0,0,0,0.06)]">

          {/* Hero image */}
          <div className="relative h-44 sm:h-56 md:h-[320px] overflow-hidden">
            <Image
              src={imgSrc}
              alt={trip.name}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover object-center"
              priority
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Top row: back + actions */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <Link href="/trips">
                <button className="flex items-center gap-1 text-white/85 hover:text-white text-xs font-medium bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/15 rounded-full pl-2 pr-3 py-1.5 transition-all">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  All Trips
                </button>
              </Link>
              <div className="flex items-center gap-1.5">
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
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm border border-white/15 text-white/90 ${getTripStatusColor(trip.status)} bg-opacity-70`}>
                    {trip.status}
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
