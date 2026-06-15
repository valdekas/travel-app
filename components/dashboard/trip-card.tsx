import Link from 'next/link'
import { Trip } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, getTripStatusColor, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Globe, ArrowRight } from 'lucide-react'

interface TripCardProps {
  trip: Trip
}

const COVER_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
]

function getGradient(id: string) {
  const idx = id.charCodeAt(0) % COVER_GRADIENTS.length
  return COVER_GRADIENTS[idx]
}

export function TripCard({ trip }: TripCardProps) {
  const days = daysUntil(trip.start_date)
  const duration = tripDuration(trip.start_date, trip.end_date)
  const flag = trip.country_code
    ? String.fromCodePoint(...trip.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    : null

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer">
        {/* Cover */}
        <div className={`h-28 bg-gradient-to-br ${getGradient(trip.id)} relative overflow-hidden`}>
          {trip.cover_photo ? (
            <img src={trip.cover_photo} alt={trip.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-40">{flag ?? '🌍'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{trip.name}</p>
              <p className="text-white/70 text-xs">{trip.country}</p>
            </div>
            {days !== null && days >= 0 && (
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
                <div className="text-white font-bold text-sm leading-none">{days}</div>
                <div className="text-white/70 text-xs">days</div>
              </div>
            )}
          </div>
        </div>

        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {trip.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(trip.start_date, 'MMM d')}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {duration}d
                  </span>
                )}
              </div>
              {trip.budget > 0 && (
                <p className="text-xs text-muted-foreground">
                  Budget: {formatCurrency(trip.budget, trip.currency)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getTripStatusColor(trip.status)}`} variant="secondary">
                {trip.status}
              </Badge>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
