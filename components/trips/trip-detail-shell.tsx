'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, getTripStatusColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, MapPin, CheckSquare, BarChart3, BookOpen,
  Calendar, ChevronLeft, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Overview', href: 'overview', icon: LayoutDashboard },
  { label: 'Places', href: 'places', icon: MapPin },
  { label: 'Itinerary', href: 'itinerary', icon: Calendar },
  { label: 'Checklist', href: 'checklist', icon: CheckSquare },
  { label: 'Budget', href: 'budget', icon: BarChart3 },
  { label: 'Journal', href: 'journal', icon: BookOpen },
]

interface TripDetailShellProps {
  trip: Trip
  children: React.ReactNode
}

export function TripDetailShell({ trip, children }: TripDetailShellProps) {
  const pathname = usePathname()
  const days = daysUntil(trip.start_date)
  const flag = trip.country_code
    ? String.fromCodePoint(...trip.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    : '🌍'

  return (
    <div className="flex flex-col h-full">
      {/* Trip header */}
      <div className="border-b border-border bg-background px-6 pt-5 pb-0">
        <div className="flex items-start gap-4 mb-4">
          <Link href="/trips">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 mt-0.5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{flag}</span>
              <h1 className="text-xl font-bold truncate">{trip.name}</h1>
              <Badge className={`text-xs ${getTripStatusColor(trip.status)}`} variant="secondary">
                {trip.status}
              </Badge>
              {days !== null && days >= 0 && (
                <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary">
                  {days === 0 ? 'Today!' : `${days} days away`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {trip.country}
              {trip.start_date && ` · ${formatDate(trip.start_date, 'MMM d')}`}
              {trip.end_date && ` – ${formatDate(trip.end_date, 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
          {TABS.map(({ label, href, icon: Icon }) => {
            const active = pathname.endsWith(`/${href}`)
            return (
              <Link
                key={href}
                href={`/trips/${trip.id}/${href}`}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
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

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
