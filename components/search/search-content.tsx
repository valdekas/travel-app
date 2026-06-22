'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Trip, Location, WishlistItem, LOCATION_TYPE_ICONS } from '@/lib/types'
import { getTripStatusColor, formatDate, getEffectiveStatus } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Globe, MapPin, Star, Calendar, SlidersHorizontal } from 'lucide-react'

interface SearchContentProps {
  trips: Trip[]
  locations: (Location & { trips?: { user_id: string } })[]
  wishlist: WishlistItem[]
}

export function SearchContent({ trips, locations, wishlist }: SearchContentProps) {
  const [query, setQuery] = useState('')
  const [tripStatusFilter, setTripStatusFilter] = useState('all')
  const [locTypeFilter, setLocTypeFilter] = useState('all')

  const q = query.toLowerCase()

  const filteredTrips = useMemo(() => trips.filter(t => {
    const matchQ = !q || [t.name, t.country, t.notes].some(s => s?.toLowerCase().includes(q))
    const matchStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter
    return matchQ && matchStatus
  }), [trips, q, tripStatusFilter])

  const filteredLocations = useMemo(() => locations.filter(l => {
    const matchQ = !q || [l.name, l.description, l.address].some(s => s?.toLowerCase().includes(q))
    const matchType = locTypeFilter === 'all' || l.type === locTypeFilter
    return matchQ && matchType
  }), [locations, q, locTypeFilter])

  const filteredWishlist = useMemo(() => wishlist.filter(w => {
    const matchQ = !q || [w.place_name, w.country, w.city, w.region, w.description].some(s => s?.toLowerCase().includes(q))
    return matchQ
  }), [wishlist, q])

  const totalResults = filteredTrips.length + filteredLocations.length + filteredWishlist.length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">Find trips, places, and wishlist items</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search trips, cities, attractions, restaurants…"
          className="pl-11 h-12 text-base"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {query && (
        <p className="text-sm text-muted-foreground">
          {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;<strong>{query}</strong>&rdquo;
        </p>
      )}

      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="trips">Trips ({filteredTrips.length})</TabsTrigger>
            <TabsTrigger value="places">Places ({filteredLocations.length})</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist ({filteredWishlist.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={tripStatusFilter} onValueChange={v => setTripStatusFilter(v ?? 'all')}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['planning','upcoming','active','completed','cancelled'].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredTrips.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Trips</h3>
              <div className="space-y-2">
                {filteredTrips.map(t => (
                  <Link key={t.id} href={`/trips/${t.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3 flex items-center gap-3">
                        <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{t.name}</span>
                          <span className="text-muted-foreground text-sm"> — {t.country}</span>
                        </div>
                        <Badge className={`text-xs ${getTripStatusColor(getEffectiveStatus(t))}`} variant="secondary">{getEffectiveStatus(t)}</Badge>
                        {t.start_date && <span className="text-xs text-muted-foreground">{formatDate(t.start_date)}</span>}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {filteredLocations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Places</h3>
              <div className="space-y-2">
                {filteredLocations.slice(0, 10).map(l => (
                  <Link key={l.id} href={`/trips/${l.trip_id}/places`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3 flex items-center gap-3">
                        <span className="text-base">{LOCATION_TYPE_ICONS[l.type]}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{l.name}</span>
                          {l.description && <span className="text-muted-foreground text-xs ml-2">— {l.description}</span>}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{l.type}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {filteredWishlist.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Wishlist</h3>
              <div className="space-y-2">
                {filteredWishlist.slice(0, 10).map(w => (
                  <Link key={w.id} href="/wishlist">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3 flex items-center gap-3">
                        <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{w.place_name}</span>
                          <span className="text-muted-foreground text-sm"> — {w.country}</span>
                          {w.city && <span className="text-muted-foreground text-xs">, {w.city}</span>}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{w.place_type}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {totalResults === 0 && query && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}
          {!query && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Start typing to search</p>
              <p className="text-sm mt-1">Search across trips, places, and your wishlist</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trips">
          <div className="space-y-2">
            {filteredTrips.map(t => (
              <Link key={t.id} href={`/trips/${t.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.country} {t.start_date && `· ${formatDate(t.start_date)}`}</p>
                    </div>
                    <Badge className={`text-xs ${getTripStatusColor(getEffectiveStatus(t))}`} variant="secondary">{getEffectiveStatus(t)}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredTrips.length === 0 && <p className="text-center text-muted-foreground py-8">No trips match</p>}
          </div>
        </TabsContent>

        <TabsContent value="places">
          <div className="mb-3">
            <Select value={locTypeFilter} onValueChange={v => setLocTypeFilter(v ?? 'all')}>
              <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {['region','city','attraction','restaurant','beach','viewpoint','hotel','activity'].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {filteredLocations.map(l => (
              <Link key={l.id} href={`/trips/${l.trip_id}/places`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 flex items-center gap-3">
                    <span className="text-base">{LOCATION_TYPE_ICONS[l.type]}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{l.name}</p>
                      {l.description && <p className="text-xs text-muted-foreground line-clamp-1">{l.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{l.type}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredLocations.length === 0 && <p className="text-center text-muted-foreground py-8">No places match</p>}
          </div>
        </TabsContent>

        <TabsContent value="wishlist">
          <div className="space-y-2">
            {filteredWishlist.map(w => (
              <Link key={w.id} href="/wishlist">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{w.place_name}</p>
                      <p className="text-xs text-muted-foreground">{[w.city, w.region, w.country].filter(Boolean).join(', ')}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{w.place_type}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredWishlist.length === 0 && <p className="text-center text-muted-foreground py-8">No wishlist items match</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
