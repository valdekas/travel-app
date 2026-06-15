import { Card, CardContent } from '@/components/ui/card'
import { Globe, MapPin, Star, Plane, CheckSquare, TrendingUp } from 'lucide-react'

interface StatsGridProps {
  totalTrips: number
  countriesVisited: number
  savedPlaces: number
  visitedPlaces: number
  wishlistCount: number
  upcomingCount: number
}

export function StatsGrid({
  totalTrips, countriesVisited, savedPlaces, visitedPlaces, wishlistCount, upcomingCount
}: StatsGridProps) {
  const stats = [
    {
      label: 'Total Trips',
      value: totalTrips,
      icon: Plane,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Countries Visited',
      value: countriesVisited,
      icon: Globe,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Places Saved',
      value: savedPlaces,
      icon: MapPin,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Places Visited',
      value: visitedPlaces,
      icon: CheckSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Wishlist Items',
      value: wishlistCount,
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: TrendingUp,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
