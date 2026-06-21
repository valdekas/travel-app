'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WishlistItem, PlaceType, LOCATION_TYPE_ICONS, CURRENCY_OPTIONS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Plus, Star, ExternalLink, Trash2, MapPin, Loader2, Search, ArrowRight, CheckCircle2, MoreVertical } from 'lucide-react'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { CountrySelect } from '@/components/ui/country-select'
import { getCountryByName } from '@/lib/data/countries'

const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'beach', label: 'Beach' },
  { value: 'viewpoint', label: 'Viewpoint' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'activity', label: 'Activity' },
  { value: 'city', label: 'City' },
  { value: 'region', label: 'Region' },
  { value: 'other', label: 'Other' },
]

function getCountryCode(countryName: string): string {
  return getCountryByName(countryName)?.code ?? ''
}

interface WishlistContentProps {
  userId: string
  initialItems: WishlistItem[]
  trips: { id: string; name: string }[]
}

export function WishlistContent({ userId, initialItems }: WishlistContentProps) {
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>(initialItems)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const [form, setForm] = useState({
    country: '', country_code: '', region: '', city: '', place_name: '',
    place_type: 'attraction' as PlaceType,
    description: '', notes: '', google_maps_link: '',
  })
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))
  const coordsRef = useRef<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })

  // Convert-to-trip dialog state
  const [convertItem, setConvertItem] = useState<WishlistItem | null>(null)
  const [converting, setConverting] = useState(false)
  const [convertForm, setConvertForm] = useState({
    name: '', country: '', country_code: '', start_date: '', end_date: '', budget: '', currency: 'EUR',
  })
  const setC = (k: string, v: string | null) => setConvertForm(f => ({ ...f, [k]: v ?? '' }))

  const filtered = useMemo(() =>
    items.filter(item =>
      [item.country, item.place_name, item.city, item.region].some(
        v => v?.toLowerCase().includes(search.toLowerCase())
      )
    ), [items, search])

  const grouped = useMemo(() => {
    const map = new Map<string, WishlistItem[]>()
    filtered.forEach(item => {
      const key = item.country
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })
    return map
  }, [filtered])

  function openConvert(item: WishlistItem) {
    const code = getCountryCode(item.country)
    setConvertForm({
      name: item.city ? `${item.city}, ${item.country}` : item.country,
      country: item.country,
      country_code: code,
      start_date: '',
      end_date: '',
      budget: '',
      currency: 'EUR',
    })
    setConvertItem(item)
  }

  async function submitConvert() {
    if (!convertItem) return
    if (!convertForm.name.trim() || !convertForm.country.trim()) {
      toast.error('Trip name and country are required')
      return
    }
    setConverting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: trip, error: tripError } = await supabase.from('trips').insert({
        user_id: user.id,
        name: convertForm.name,
        country: convertForm.country,
        country_code: convertForm.country_code || null,
        start_date: convertForm.start_date || null,
        end_date: convertForm.end_date || null,
        budget: convertForm.budget ? parseFloat(convertForm.budget) : 0,
        currency: convertForm.currency,
        status: 'planning',
      }).select().single()

      if (tripError) throw tripError

      // Seed default checklist items
      await supabase.from('checklist_items').insert([
        { trip_id: trip.id, category: 'documents', title: 'Passport', order_index: 0 },
        { trip_id: trip.id, category: 'documents', title: 'Travel Insurance', order_index: 1 },
        { trip_id: trip.id, category: 'documents', title: 'Boarding Pass', order_index: 2 },
        { trip_id: trip.id, category: 'documents', title: 'Hotel Confirmation', order_index: 3 },
        { trip_id: trip.id, category: 'documents', title: 'Car Rental Booking', order_index: 4 },
        { trip_id: trip.id, category: 'packing', title: 'Clothes', order_index: 0 },
        { trip_id: trip.id, category: 'packing', title: 'Charger & Power Bank', order_index: 1 },
        { trip_id: trip.id, category: 'packing', title: 'Medication', order_index: 2 },
        { trip_id: trip.id, category: 'packing', title: 'Camera', order_index: 3 },
        { trip_id: trip.id, category: 'packing', title: 'Travel Adapter', order_index: 4 },
      ])

      // Mark wishlist item as converted
      await supabase
        .from('wishlist_items')
        .update({ converted_to_trip_id: trip.id })
        .eq('id', convertItem.id)

      setItems(prev => prev.map(i =>
        i.id === convertItem.id ? { ...i, converted_to_trip_id: trip.id } : i
      ))

      toast.success('Trip created! Redirecting…')
      setConvertItem(null)
      router.push(`/trips/${trip.id}/overview`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip')
    } finally {
      setConverting(false)
    }
  }

  async function addItem() {
    if (!form.place_name.trim() || !form.country.trim()) {
      toast.error('Place name and country are required')
      return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('wishlist_items').insert({
        user_id: userId,
        country: form.country,
        country_code: form.country_code || null,
        region: form.region || null,
        city: form.city || null,
        place_name: form.place_name,
        place_type: form.place_type,
        description: form.description || null,
        notes: form.notes || null,
        google_maps_link: form.google_maps_link || null,
        lat: coordsRef.current.lat,
        lng: coordsRef.current.lng,
      }).select().single()
      if (error) throw error
      setItems(prev => [data, ...prev])
      setForm({ country: '', country_code: '', region: '', city: '', place_name: '', place_type: 'attraction', description: '', notes: '', google_maps_link: '' })
      coordsRef.current = { lat: null, lng: null }
      setAddOpen(false)
      toast.success('Added to wishlist!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    await supabase.from('wishlist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Removed from wishlist')
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wishlist</h1>
          <p className="text-muted-foreground mt-1">{items.length} places you dream of visiting</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Place
        </Button>
      </div>

      {items.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wishlist…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {grouped.size === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">Your wishlist is empty</p>
            <p className="text-muted-foreground mt-1">Save places you dream of visiting — from Tokyo to Lauterbrunnen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([country, countryItems]) => (
            <div key={country}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {country}
                <Badge variant="secondary" className="text-xs">{countryItems.length}</Badge>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {countryItems.map(item => (
                  <Card key={item.id} className={`group hover:shadow-md transition-all ${item.converted_to_trip_id ? 'opacity-75' : ''}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-sm">{LOCATION_TYPE_ICONS[item.place_type as keyof typeof LOCATION_TYPE_ICONS] ?? '📍'}</span>
                            <span className="font-semibold text-sm truncate">{item.place_name}</span>
                          </div>
                          {(item.city || item.region) && (
                            <p className="text-xs text-muted-foreground">
                              {[item.city, item.region].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">{item.place_type}</Badge>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                          )}
                          {item.google_maps_link && (
                            <a
                              href={item.google_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Open in Maps
                            </a>
                          )}
                          <div className="mt-3">
                            {item.converted_to_trip_id ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <a
                                  href={`/trips/${item.converted_to_trip_id}/overview`}
                                  className="hover:underline font-medium"
                                >
                                  View trip
                                </a>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 w-full"
                                onClick={() => openConvert(item)}
                              >
                                <ArrowRight className="h-3 w-3" /> Convert to Trip
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Desktop: hover-revealed delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden md:inline-flex h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm('Remove from wishlist?')) deleteItem(item.id) }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>

                        {/* Mobile: three-dot overflow menu */}
                        <div className="flex md:hidden flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More options">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="min-w-44">
                              {item.google_maps_link ? (
                                <DropdownMenuItem onClick={() => window.open(item.google_maps_link!, '_blank', 'noopener,noreferrer')}>
                                  <ExternalLink className="h-4 w-4" />
                                  Open in Maps
                                </DropdownMenuItem>
                              ) : null}
                              {!item.converted_to_trip_id ? (
                                <DropdownMenuItem onClick={() => openConvert(item)}>
                                  <ArrowRight className="h-4 w-4" />
                                  Convert to Trip
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => { if (confirm('Remove from wishlist?')) deleteItem(item.id) }}>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Wishlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Place Name *</Label>
              <PlacesAutocomplete
                value={form.place_name}
                onChange={v => set('place_name', v)}
                onPlaceSelect={p => {
                  set('place_name', p.name)
                  if (p.country) set('country', p.country)
                  if (p.countryCode) set('country_code', p.countryCode)
                  if (p.region) set('region', p.region)
                  if (p.city) set('city', p.city)
                  set('google_maps_link', p.googleMapsLink)
                  coordsRef.current = { lat: p.lat, lng: p.lng }
                }}
                placeholder="Search for a place…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <CountrySelect
                  value={form.country_code}
                  onSelect={c => { set('country', c.name); set('country_code', c.code) }}
                  placeholder="Select country"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input placeholder="Bern Canton" value={form.region} onChange={e => set('region', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input placeholder="Lauterbrunnen" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.place_type} onValueChange={v => set('place_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Why do you want to visit?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Google Maps Link</Label>
              <Input placeholder="https://maps.google.com/…" value={form.google_maps_link} onChange={e => set('google_maps_link', e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={addItem} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Trip dialog */}
      <Dialog open={!!convertItem} onOpenChange={open => { if (!open) setConvertItem(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Trip</DialogTitle>
          </DialogHeader>
          {convertItem && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Creating a trip from <span className="font-medium text-foreground">{convertItem.place_name}</span>.
                Fill in the details — you can update everything later.
              </p>
              <Separator />
              <div className="space-y-1.5">
                <Label>Trip Name *</Label>
                <Input
                  placeholder="e.g. Japan Adventure 2027"
                  value={convertForm.name}
                  onChange={e => setC('name', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <CountrySelect
                  value={convertForm.country_code}
                  onSelect={c => { setC('country_code', c.code); setC('country', c.name) }}
                  placeholder="Select country"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure Date</Label>
                  <Input type="date" value={convertForm.start_date} onChange={e => setC('start_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Return Date</Label>
                  <Input type="date" value={convertForm.end_date} min={convertForm.start_date} onChange={e => setC('end_date', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Budget</Label>
                  <Input type="number" placeholder="e.g. 3000" min="0" value={convertForm.budget} onChange={e => setC('budget', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={convertForm.currency} onValueChange={v => setC('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.symbol} {c.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setConvertItem(null)} className="flex-1">Cancel</Button>
                <Button onClick={submitConvert} disabled={converting} className="flex-1 gap-2">
                  {converting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><ArrowRight className="h-4 w-4" /> Create Trip</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
