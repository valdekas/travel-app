'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { EditTripDialog } from './edit-trip-dialog'
import { ExternalLink, Plane, Info, MapPin, Calendar, ArrowRight, Settings, Copy, Check } from 'lucide-react'
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

function buildDeepLinks(
  homeCity: string,
  homeAirport: string,
  tripCity: string,
  startDate: string,
  endDate: string,
) {
  const origin = homeAirport || homeCity
  return {
    google:  `https://www.google.com/travel/flights?q=flights+from+${enc(homeCity)}+to+${enc(tripCity)}+on+${startDate}`,
    kayak:   `https://www.kayak.com/flights/${enc(origin)}-${enc(tripCity)}/${startDate}/${endDate}`,
    momondo: `https://www.momondo.com/flight-search/${enc(origin)}-${enc(tripCity)}/${startDate}/${endDate}`,
  }
}

const DEEP_LINK_PLATFORMS = [
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
    id:          'kayak',
    name:        'Kayak',
    tagline:     'Compare hundreds of travel sites',
    description: 'Meta-search across airlines, OTAs, and travel agencies with one click.',
    color:       '#FF690F',
    emoji:       '🔎',
    badge:       'Meta-search',
  },
  {
    id:          'momondo',
    name:        'Momondo',
    tagline:     'Find the best flight deals',
    description: 'Searches hundreds of sites to find the cheapest available fares.',
    color:       '#6B48FF',
    emoji:       '🔮',
    badge:       'Cheapest fares',
  },
]

const MANUAL_PLATFORMS = [
  {
    id:          'skyscanner',
    name:        'Skyscanner',
    tagline:     'Find the cheapest flights',
    description: 'Search hundreds of airlines and booking sites.',
    color:       '#0770E3',
    emoji:       '✈️',
    badge:       'Popular',
    homepageUrl: 'https://www.skyscanner.net',
  },
  {
    id:          'ryanair',
    name:        'Ryanair',
    tagline:     "Europe's largest low-cost airline",
    description: 'Ultra-low-cost routes across Europe.',
    color:       '#073590',
    emoji:       '🟠',
    badge:       'Budget Europe',
    homepageUrl: 'https://www.ryanair.com',
  },
  {
    id:          'expedia',
    name:        'Expedia',
    tagline:     'Bundle flights + hotels',
    description: 'Book flights and hotels together to unlock package discounts.',
    color:       '#E8A018',
    emoji:       '🔵',
    badge:       'Bundle deals',
    homepageUrl: 'https://www.expedia.com/Flights',
  },
]

const TIPS = [
  { icon: '📅', tip: 'Book 6–8 weeks in advance for the best prices on most routes.' },
  { icon: '💸', tip: 'Tuesday and Wednesday departures are often cheaper than weekends.' },
  { icon: '🔔', tip: 'Set a price alert on Google Flights and wait for a dip.' },
  { icon: '🗺️', tip: 'Check nearby airports — flying from a different hub can cut costs significantly.' },
]

export function FlightsContent({ trip, homeCity, homeCountry, homeAirport }: FlightsContentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const hasHome  = Boolean(homeCity)
  const hasCity  = Boolean(trip.city)
  const hasDates = Boolean(trip.start_date && trip.end_date)

  const tripCity  = trip.city ?? trip.country ?? ''
  const startDate = trip.start_date ?? ''
  const endDate   = trip.end_date   ?? ''

  const nights =
    hasDates ? differenceInDays(parseISO(endDate), parseISO(startDate)) : null

  const deepLinks =
    hasHome && hasCity && hasDates
      ? buildDeepLinks(homeCity!, homeAirport ?? '', tripCity, startDate, endDate)
      : null

  const formattedStart = startDate ? format(parseISO(startDate), 'd MMM yyyy') : null
  const formattedEnd   = endDate   ? format(parseISO(endDate),   'd MMM yyyy') : null

  // Compact search info shown on manual cards and in copy text
  const searchOrigin = homeAirport || homeCity || ''
  const searchInfo =
    hasHome && hasCity
      ? `${searchOrigin} → ${tripCity}${
          hasDates
            ? ` · ${format(parseISO(startDate), 'd MMM')} – ${format(parseISO(endDate), 'd MMM')}`
            : ''
        }`
      : null

  function copySearchInfo(id: string) {
    if (!searchInfo) return
    navigator.clipboard.writeText(searchInfo).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

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

      {/* Pre-filled search cards */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
          Pre-filled searches
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEEP_LINK_PLATFORMS.map((platform) => {
            const url     = deepLinks?.[platform.id as keyof typeof deepLinks]
            const enabled = Boolean(url)

            const inner = (
              <div
                className={cn(
                  'group relative rounded-xl border bg-card p-4 transition-all duration-200 border-l-[3px]',
                  enabled ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-55'
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
                    {!hasHome ? 'Set your home city in Settings to enable' :
                     !hasCity ? 'Set a trip destination to enable' :
                                'Set trip dates to enable'}
                  </p>
                )}
              </div>
            )

            if (!enabled) return <div key={platform.id}>{inner}</div>

            return (
              <a key={platform.id} href={url} target="_blank" rel="noopener noreferrer" className="block no-underline">
                {inner}
              </a>
            )
          })}
        </div>
      </div>

      {/* Manual search cards */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
          Open &amp; search manually
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MANUAL_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="rounded-xl border bg-card p-4 border-l-[3px] space-y-3"
              style={{ borderLeftColor: platform.color }}
            >
              {/* Name row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg leading-none">{platform.emoji}</span>
                <span className="font-semibold text-sm">{platform.name}</span>
                <span
                  className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${platform.color}1a`, color: platform.color }}
                >
                  {platform.badge}
                </span>
              </div>

              {/* Copyable search info */}
              {searchInfo ? (
                <button
                  onClick={() => copySearchInfo(platform.id)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                    'bg-muted/60 hover:bg-muted border border-border/50'
                  )}
                  title="Click to copy search details"
                >
                  <span className="text-sm font-mono font-medium text-foreground truncate">
                    {searchInfo}
                  </span>
                  {copiedId === platform.id
                    ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    : <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  }
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">{platform.description}</p>
              )}

              {/* Open button */}
              <div className="flex items-center gap-2">
                <a
                  href={platform.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    Open {platform.name}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
                {searchInfo && (
                  <span className="text-[11px] text-muted-foreground">
                    Search details shown above
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
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
