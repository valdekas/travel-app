'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trip, TripStatus } from '@/lib/types'
import { daysUntil, formatDate, tripDuration, getTripStatusColor, formatCurrency, getEffectiveStatus } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Globe, Calendar, Clock, Filter, SlidersHorizontal } from 'lucide-react'
import { TripCard } from '@/components/dashboard/trip-card'

interface TripsListContentProps {
  trips: Trip[]
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Trips' },
  { value: 'planning', label: 'Planning' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function TripsListContent({ trips }: TripsListContentProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = trips.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.country.toLowerCase().includes(search.toLowerCase())

    let matchesStatus: boolean
    if (statusFilter === 'all') {
      matchesStatus = true
    } else if (statusFilter === 'planning') {
      // Planning is a separate dimension — true while is_planning flag is set
      matchesStatus = (t.is_planning ?? true) && getEffectiveStatus(t) !== 'cancelled'
    } else if (statusFilter === 'cancelled') {
      matchesStatus = getEffectiveStatus(t) === 'cancelled'
    } else {
      // 'upcoming' | 'active' | 'completed' — purely date-derived
      matchesStatus = getEffectiveStatus(t) === statusFilter
    }

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-muted-foreground mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/trips/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips or countries…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-44">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">
              {search || statusFilter !== 'all' ? 'No trips found' : 'No trips yet'}
            </p>
            <p className="text-muted-foreground mt-1">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first trip to get started'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/trips/new" className="mt-4">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Plan Your First Trip
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
