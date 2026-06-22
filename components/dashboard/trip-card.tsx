'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, getDestinationImage, getCityOrCountryImage } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Calendar, Clock, Trash2, Loader2, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'

interface TripCardProps {
  trip: Trip
}

export function TripCard({ trip }: TripCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const days = daysUntil(trip.start_date)
  const duration = tripDuration(trip.start_date, trip.end_date)

  // Three-level fallback: cover_photo/auto-url → country image → global fallback
  const primarySrc  = getDestinationImage(trip)
  const countrySrc  = getCityOrCountryImage(trip.country ?? '')
  const fallbackSrc = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80'
  const [imgSrc, setImgSrc] = useState(primarySrc)

  const countdownColor =
    days === null || days < 0 ? 'bg-slate-800/60' :
    days === 0               ? 'bg-rose-500/80' :
    days <= 7               ? 'bg-orange-500/80' :
    'bg-black/50'

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase.from('trips').delete().eq('id', trip.id)
      if (error) throw error
      toast.success('Trip deleted')
      setDeleteOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to delete trip')
      setDeleting(false)
    }
  }

  return (
    <div className="relative group/card">
      {/* Card link */}
      <Link href={`/trips/${trip.id}`} className="block">
        <motion.div
          whileHover={{ y: -4, scale: 1.012 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl h-52 cursor-pointer shadow-md shadow-slate-200/60 dark:shadow-black/20 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-black/40 transition-shadow duration-300"
        >
          {/* Background image — three-level fallback via React state */}
          <Image
            src={imgSrc}
            alt={trip.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.08]"
            onError={() => {
              if (imgSrc !== countrySrc) setImgSrc(countrySrc)
              else if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc)
            }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

          {/* Top: flag + countdown */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1">
              {trip.country_code ? <FlagImg code={trip.country_code} className="w-5 h-[15px]" /> : <span className="text-sm">✈️</span>}
            </div>
            {days !== null && days >= 0 && (
              <div className={`${countdownColor} backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1 text-center min-w-[44px]`}>
                <div className="text-white text-sm font-bold leading-none tabular-nums">{days}</div>
                <div className="text-white/65 text-[9px] leading-none mt-0.5 font-medium">days</div>
              </div>
            )}
          </div>

          {/* Bottom: trip info */}
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">{trip.city ? `${trip.city} · ${trip.country}` : trip.country}</p>
            <h3 className="text-white font-bold text-base leading-tight mb-1.5 line-clamp-1">{trip.name}</h3>
            <div className="flex items-center gap-3 text-white/65 text-xs">
              {trip.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(trip.start_date, 'MMM d')}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {duration} days
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Desktop: hover-revealed delete button */}
      <button
        onClick={() => setDeleteOpen(true)}
        className="hidden md:block absolute bottom-3 right-3 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-1.5 text-white hover:bg-red-500/90 hover:border-red-400/30"
        title="Delete trip"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Mobile: always-visible three-dot menu */}
      <div className="block md:hidden absolute bottom-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button
              className="bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-2 text-white"
              aria-label="Trip options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          } />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete Trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
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
              <p className="text-sm font-semibold text-destructive">
                ⚠️ This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1" disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
