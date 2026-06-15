'use client'

import Link from 'next/link'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, ArrowRight, Globe } from 'lucide-react'

interface CountdownCardProps {
  trip: Trip
}

export function CountdownCard({ trip }: CountdownCardProps) {
  const days = daysUntil(trip.start_date)
  const duration = tripDuration(trip.start_date, trip.end_date)

  const urgencyColor =
    days === null ? 'from-violet-500 to-indigo-500' :
    days <= 7 ? 'from-rose-500 to-orange-500' :
    days <= 30 ? 'from-amber-500 to-orange-400' :
    'from-violet-500 to-indigo-500'

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className={`bg-gradient-to-br ${urgencyColor} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Next Trip</p>
            <h2 className="text-xl font-bold">{trip.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-white/80 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {trip.country}
            </div>
          </div>
          <div className="text-right">
            {days !== null && days >= 0 ? (
              <>
                <div className="text-5xl font-bold leading-none">{days}</div>
                <div className="text-white/80 text-sm font-medium mt-1">
                  {days === 0 ? "TODAY!" : days === 1 ? "DAY LEFT" : "DAYS LEFT"}
                </div>
              </>
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Globe className="h-7 w-7" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(trip.start_date)}
          </div>
          {duration && (
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Clock className="h-3.5 w-3.5" />
              {duration} days
            </div>
          )}
          {trip.budget > 0 && (
            <div className="flex items-center gap-1.5 text-white/80 text-sm ml-auto">
              Budget: {formatCurrency(trip.budget, trip.currency)}
            </div>
          )}
        </div>
      </div>

      <CardContent className="pt-4 pb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {days !== null && days > 0
            ? `Departs ${formatDate(trip.start_date, 'EEEE, MMMM d')}`
            : 'No departure date set'}
        </p>
        <Link href={`/trips/${trip.id}`}>
          <Button size="sm" variant="outline" className="gap-1">
            View Trip <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
