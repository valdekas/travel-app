'use client'

import { Trip } from '@/lib/types'
import { EditTripDialog } from './edit-trip-dialog'
import { ExternalLink, BedDouble, Info, MapPin, Calendar } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface HotelsContentProps {
  trip: Trip
}

const enc = encodeURIComponent

function buildUrls(city: string, country: string, startDate: string, endDate: string) {
  return {
    booking:     `https://www.booking.com/searchresults.html?ss=${enc(city)}+${enc(country)}&checkin=${startDate}&checkout=${endDate}&group_adults=2`,
    airbnb:      `https://www.airbnb.com/s/${enc(city)}--${enc(country)}/homes?checkin=${startDate}&checkout=${endDate}`,
    google:      `https://www.google.com/travel/hotels/${enc(city)}?q=hotels+in+${enc(city)}&dates=${startDate}/${endDate}`,
    expedia:     `https://www.expedia.com/Hotel-Search?destination=${enc(city)}+${enc(country)}&startDate=${startDate}&endDate=${endDate}`,
    hotelscom:   `https://www.hotels.com/search.do?q-destination=${enc(city)}&q-check-in=${startDate}&q-check-out=${endDate}`,
    hostelworld: `https://www.hostelworld.com/search?search_keywords=${enc(city)}&dateFrom=${startDate}&dateTo=${endDate}`,
  }
}

const PLATFORMS = [
  {
    id:          'booking',
    name:        'Booking.com',
    tagline:     "World's largest hotel selection",
    description: 'Hotels, apartments, villas & more. Free cancellation on most bookings.',
    color:       '#003580',
    emoji:       '🏨',
    badge:       'Most popular',
  },
  {
    id:          'airbnb',
    name:        'Airbnb',
    tagline:     'Unique stays & experiences',
    description: 'Entire homes, private rooms, and unique stays hosted by locals.',
    color:       '#FF5A5F',
    emoji:       '🏠',
    badge:       'Best for homes',
  },
  {
    id:          'google',
    name:        'Google Hotels',
    tagline:     'Compare prices across all sites',
    description: 'Search and compare hotel prices from dozens of booking sites at once.',
    color:       '#4285F4',
    emoji:       '🔍',
    badge:       'Price comparison',
  },
  {
    id:          'expedia',
    name:        'Expedia',
    tagline:     'Bundle & save',
    description: 'Book flights and hotel together to unlock exclusive package discounts.',
    color:       '#E8A018',
    emoji:       '✈️',
    badge:       'Bundle deals',
  },
  {
    id:          'hotelscom',
    name:        'Hotels.com',
    tagline:     'Earn free nights with every stay',
    description: 'Rewards program: every 10 nights earns 1 free night automatically.',
    color:       '#D03A2F',
    emoji:       '⭐',
    badge:       'Rewards program',
  },
  {
    id:          'hostelworld',
    name:        'Hostelworld',
    tagline:     'Budget stays & hostels',
    description: 'Best selection of hostels, guesthouses, and budget accommodation.',
    color:       '#E8690B',
    emoji:       '🎒',
    badge:       'Budget friendly',
  },
]

const TIPS = [
  { icon: '📅', tip: 'Book early for peak season — prices rise significantly 8–12 weeks out.' },
  { icon: '🔄', tip: 'Check both Booking.com and Google Hotels — prices often differ by platform.' },
  { icon: '💳', tip: 'Many hotels offer lower rates when booked directly on their own website.' },
  { icon: '📍', tip: 'Staying near transit hubs can significantly cut your daily transport costs.' },
]

export function HotelsContent({ trip }: HotelsContentProps) {
  const hasCity  = Boolean(trip.city)
  const hasDates = Boolean(trip.start_date && trip.end_date)

  const city      = trip.city ?? trip.country ?? ''
  const country   = trip.country ?? ''
  const startDate = trip.start_date ?? ''
  const endDate   = trip.end_date   ?? ''

  const nights =
    hasDates
      ? differenceInDays(parseISO(endDate), parseISO(startDate))
      : null

  const urls = hasCity && hasDates ? buildUrls(city, country, startDate, endDate) : null

  const formattedDates =
    hasDates
      ? `${format(parseISO(startDate), 'd MMM')} – ${format(parseISO(endDate), 'd MMM yyyy')}`
      : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BedDouble className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Find Hotels</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick links to top booking platforms — pre-filled with your destination and dates.
        </p>
      </div>

      {/* No city warning */}
      {!hasCity && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No destination set</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Add a city to your trip so we can pre-fill the search links.
            </p>
          </div>
          <EditTripDialog trip={trip} />
        </div>
      )}

      {/* No dates prompt */}
      {hasCity && !hasDates && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">No dates set</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Add trip dates to get pre-filled check-in and check-out links.
            </p>
          </div>
          <EditTripDialog trip={trip} />
        </div>
      )}

      {/* Context pills */}
      {hasCity && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            {city}{country && country !== city ? `, ${country}` : ''}
          </span>
          {formattedDates && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDates}
            </span>
          )}
          {nights !== null && nights > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 font-medium">
              🌙 {nights} night{nights !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const url     = urls?.[platform.id as keyof typeof urls]
          const enabled = Boolean(url)

          const inner = (
            <div
              className={cn(
                'group relative rounded-xl border bg-card p-4 transition-all duration-200',
                'border-l-[3px]',
                enabled
                  ? 'hover:shadow-md hover:-translate-y-0.5'
                  : 'opacity-60'
              )}
              style={{ borderLeftColor: platform.color }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-lg leading-none">{platform.emoji}</span>
                    <span className="font-semibold text-sm">{platform.name}</span>
                    <span
                      className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: `${platform.color}1a`, color: platform.color }}
                    >
                      {platform.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{platform.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{platform.description}</p>
                </div>
                <ExternalLink
                  className={cn(
                    'h-4 w-4 shrink-0 mt-0.5 transition-opacity',
                    enabled ? 'opacity-30 group-hover:opacity-80' : 'opacity-15'
                  )}
                />
              </div>

              {!enabled && (
                <p className="mt-2 text-[11px] text-muted-foreground/60">
                  {!hasCity ? 'Set a destination to enable this link' : 'Set trip dates to enable this link'}
                </p>
              )}
            </div>
          )

          if (!enabled) return <div key={platform.id}>{inner}</div>

          return (
            <a
              key={platform.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline"
            >
              {inner}
            </a>
          )
        })}
      </div>

      {/* Pro tips */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Booking tips</h2>
        </div>
        <ul className="space-y-2.5">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="shrink-0 text-base leading-snug">{tip.icon}</span>
              <span>{tip.tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
