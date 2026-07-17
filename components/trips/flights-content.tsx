'use client'

import Link from 'next/link'
import { Trip } from '@/lib/types'
import { EditTripDialog } from './edit-trip-dialog'
import { ExternalLink, Plane, Info, MapPin, Calendar, ArrowRight, Settings } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FlightsContentProps {
  trip:        Trip
  homeCity:    string | null
  homeCountry: string | null
  homeAirport: string | null
}

const enc = encodeURIComponent

function skyscannerDate(iso: string) {
  // YYMMDD format e.g. 250715
  return format(parseISO(iso), 'yyMMdd')
}

function buildUrls(
  homeCity: string,
  homeAirport: string,
  tripCity: string,
  startDate: string,
  endDate: string,
) {
  const origin      = homeAirport || homeCity
  const destination = tripCity

  return {
    google: `https://www.google.com/travel/flights?q=flights+from+${enc(homeCity)}+to+${enc(tripCity)}+on+${startDate}`,
    skyscanner: `https://www.skyscanner.net/transport/flights/${enc(origin)}/${enc(destination)}/${skyscannerDate(startDate)}/`,
    ryanair: `https://www.ryanair.com/gb/en/trip/flights/select?adults=1&teens=0&children=0&infants=0&dateOut=${startDate}&dateIn=${endDate}&isConnectedFlight=false&isReturn=true&originIata=${enc(origin)}&destinationIata=${enc(destination)}`,
    kayak: `https://www.kayak.com/flights/${enc(origin)}-${enc(destination)}/${startDate}/${endDate}`,
    wizzair: `https://wizzair.com/en-gb/flights/search?departureStation=${enc(origin)}&arrivalStation=${enc(destination)}&departureDate=${startDate}`,
    aerlingus: `https://www.aerlingus.com/flights/searchflights/?bookingOrigin=${enc(origin)}&bookingDestination=${enc(destination)}&outboundDate=${startDate}&returnDate=${endDate}&adultPaxCount=1`,
    expedia: `https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${enc(homeCity)},to:${enc(tripCity)},departure:${startDate}&leg2=from:${enc(tripCity)},to:${enc(homeCity)},departure:${endDate}`,
  }
}

const PLATFORMS = [
  {
    id:          'google',
    name:        'Google Flights',
    tagline:     'Best price comparison',
    description: 'Compare prices from all major airlines and booking sites in one place.',
    color:       '#4285F4',
    emoji:       '🌐',
    badge:       'Price comparison',
  },
  {
    id:          'skyscanner',
    name:        'Skyscanner',
    tagline:     'Find the cheapest flights',
    description: 'Search hundreds of airlines, travel agents, and booking sites.',
    color:       '#0770E3',
    emoji:       '✈️',
    badge:       'Cheapest fares',
  },
  {
    id:          'ryanair',
    name:        'Ryanair',
    tagline:     'Budget European flights',
    description: 'Ultra-low-cost carrier with routes across Europe.',
    color:       '#073590',
    emoji:       '🟠',
    badge:       'Budget Europe',
  },
  {
    id:          'kayak',
    name:        'Kayak',
    tagline:     'Compare hundreds of travel sites',
    description: 'Meta-search across airlines, OTAs, and travel agencies.',
    color:       '#FF690F',
    emoji:       '💙',
    badge:       'Meta-search',
  },
  {
    id:          'wizzair',
    name:        'Wizz Air',
    tagline:     'Ultra-low cost flights',
    description: 'Low-cost carrier with extensive Central & Eastern European routes.',
    color:       '#C6007E',
    emoji:       '🟡',
    badge:       'Low-cost',
  },
  {
    id:          'aerlingus',
    name:        'Aer Lingus',
    tagline:     "Ireland's national airline",
    description: 'Transatlantic and European routes from Ireland with competitive fares.',
    color:       '#006837',
    emoji:       '🟢',
    badge:       'Ireland hub',
  },
  {
    id:          'expedia',
    name:        'Expedia',
    tagline:     'Bundle flights + hotels',
    description: 'Book flights and hotels together to unlock exclusive package discounts.',
    color:       '#E8A018',
    emoji:       '🔵',
    badge:       'Bundle deals',
  },
]

const TIPS = [
  { icon: '📅', tip: 'Book 6–8 weeks in advance for the best prices on most routes.' },
  { icon: '💸', tip: 'Tuesday and Wednesday departures are often cheaper than weekends.' },
  { icon: '🔔', tip: 'Set a price alert on Google Flights and wait for a dip.' },
  { icon: '🗺️', tip: 'Check nearby airports — flying from a different hub can cut costs significantly.' },
]

export function FlightsContent({ trip, homeCity, homeCountry, homeAirport }: FlightsContentProps) {
  const hasHome  = Boolean(homeCity)
  const hasCity  = Boolean(trip.city)
  const hasDates = Boolean(trip.start_date && trip.end_date)

  const tripCity   = trip.city ?? trip.country ?? ''
  const startDate  = trip.start_date ?? ''
  const endDate    = trip.end_date   ?? ''

  const nights =
    hasDates
      ? differenceInDays(parseISO(endDate), parseISO(startDate))
      : null

  const urls =
    hasHome && hasCity && hasDates
      ? buildUrls(homeCity!, homeAirport ?? '', tripCity, startDate, endDate)
      : null

  const formattedStart = startDate ? format(parseISO(startDate), 'd MMM yyyy') : null
  const formattedEnd   = endDate   ? format(parseISO(endDate),   'd MMM yyyy') : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Plane className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Find Flights</h1>
        </div>
        {hasHome && hasCity ? (
          <p className="text-sm text-muted-foreground">
            Search flights from <span className="font-medium text-foreground">{homeCity}</span> to{' '}
            <span className="font-medium text-foreground">{tripCity}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Quick links to top flight search platforms — pre-filled with your route and dates.
          </p>
        )}
      </div>

      {/* No home city banner */}
      {!hasHome && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Home city not set</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Set your home city in Settings to get pre-filled flight searches.
            </p>
          </div>
          <Link href="/settings/account">
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </Link>
        </div>
      )}

      {/* No trip dates */}
      {hasHome && hasCity && !hasDates && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">No trip dates set</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Add trip dates to get pre-filled departure and return search links.
            </p>
          </div>
          <EditTripDialog trip={trip} />
        </div>
      )}

      {/* Route summary */}
      {hasHome && hasCity && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{homeCity}</span>
            {homeAirport && <span className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">{homeAirport}</span>}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{tripCity}</span>
            {formattedStart && (
              <span className="text-muted-foreground ml-auto text-xs shrink-0">{formattedStart}</span>
            )}
          </div>
          {hasDates && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{tripCity}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">{homeCity}</span>
              {homeAirport && <span className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">{homeAirport}</span>}
              {formattedEnd && (
                <span className="text-muted-foreground ml-auto text-xs shrink-0">{formattedEnd}</span>
              )}
            </div>
          )}
          {nights !== null && nights > 0 && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
              🌙 {nights} night{nights !== 1 ? 's' : ''} · return trip
            </p>
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
                  {!hasHome  ? 'Set your home city in Settings to enable' :
                   !hasCity  ? 'Set a trip destination to enable' :
                               'Set trip dates to enable'}
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

      {/* Tips */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Flight booking tips</h2>
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
