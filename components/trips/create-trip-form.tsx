'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { parseISO, addDays, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { CURRENCY_OPTIONS } from '@/lib/types'
import { getCityOrCountryImage, getDestinationImage } from '@/lib/utils'
import { FlagImg } from '@/components/ui/flag-img'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { toast } from 'sonner'
import { isGooglePhotoUrl, validateHeroImageFile, uploadCustomHeroImage } from '@/lib/utils/trip-hero-image'
import {
  Globe, Calendar, DollarSign, FileText, ImageIcon,
  Loader2, Wand2, Link as LinkIcon, X, MapPin, Upload,
} from 'lucide-react'

interface DestRef {
  lat: number | null
  lng: number | null
  region: string
  city: string
}

export function CreateTripForm() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    country: '',
    country_code: '',
    city: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'EUR',
    notes: '',
    cover_photo: '',
    status: 'planning' as const,
  })

  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))
  const coverManuallySet = useRef(false)
  const destRef = useRef<DestRef>({ lat: null, lng: null, region: '', city: '' })

  function applyDestinationImage(city: string, country: string, tripName: string) {
    const img = getCityOrCountryImage(city) ||
      getDestinationImage({ name: tripName, country }) ||
      ''
    set('cover_photo', img)
    coverManuallySet.current = false
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
    setHeroPreviewUrl(null)
    setHeroFile(null)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateHeroImageFile(file)
    if (err) { toast.error(err); return }
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
    setHeroFile(file)
    setHeroPreviewUrl(URL.createObjectURL(file))
    coverManuallySet.current = true
    setShowUrlInput(false)
    e.target.value = ''
  }

  function clearPhoto() {
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
    setHeroPreviewUrl(null)
    setHeroFile(null)
    set('cover_photo', '')
    coverManuallySet.current = false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.country) {
      toast.error('Trip name and destination are required')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const cover = form.cover_photo ||
        getCityOrCountryImage(form.city) ||
        getDestinationImage({ name: form.name, country: form.country }) ||
        null

      const { data, error } = await supabase.from('trips').insert({
        user_id:      user.id,
        name:         form.name,
        country:      form.country,
        country_code: form.country_code || null,
        city:         form.city || null,
        region:       destRef.current.region || null,
        lat:          destRef.current.lat ?? null,
        lng:          destRef.current.lng ?? null,
        start_date:   form.start_date || null,
        end_date:     form.end_date || null,
        budget:       form.budget ? parseFloat(form.budget) : 0,
        currency:     form.currency,
        notes:        form.notes || null,
        cover_photo:  cover,
        status:       form.status,
      }).select().single()

      if (error) throw error

      // Upload custom hero image (takes priority over Google URL fire-and-forget)
      if (heroFile) {
        const uploaded = await uploadCustomHeroImage(supabase, heroFile, user.id, data.id)
        if (uploaded) {
          await supabase.from('trips').update({ cover_photo: uploaded }).eq('id', data.id)
        } else {
          toast.error('Photo upload failed — trip was created with destination image instead')
        }
      }

      await supabase.from('checklist_items').insert([
        { trip_id: data.id, category: 'documents', title: 'Passport',            order_index: 0 },
        { trip_id: data.id, category: 'documents', title: 'Travel Insurance',    order_index: 1 },
        { trip_id: data.id, category: 'documents', title: 'Boarding Pass',       order_index: 2 },
        { trip_id: data.id, category: 'documents', title: 'Hotel Confirmation',  order_index: 3 },
        { trip_id: data.id, category: 'documents', title: 'Car Rental Booking',  order_index: 4 },
        { trip_id: data.id, category: 'packing',   title: 'Clothes',             order_index: 0 },
        { trip_id: data.id, category: 'packing',   title: 'Charger & Power Bank',order_index: 1 },
        { trip_id: data.id, category: 'packing',   title: 'Medication',          order_index: 2 },
        { trip_id: data.id, category: 'packing',   title: 'Camera',              order_index: 3 },
        { trip_id: data.id, category: 'packing',   title: 'Travel Adapter',      order_index: 4 },
      ])

      if (form.start_date && form.end_date) {
        const start = parseISO(form.start_date)
        const end   = parseISO(form.end_date)
        const totalDays = Math.min(
          Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
          30,
        )
        if (totalDays > 0) {
          const daysArray = Array.from({ length: totalDays }, (_, i) => ({
            trip_id:      data.id,
            day_number:   i + 1,
            date:         format(addDays(start, i), 'yyyy-MM-dd'),
            is_completed: false,
          }))
          const { error: daysError } = await supabase.from('itinerary_days').insert(daysArray)
          if (daysError) console.error('Failed to auto-create itinerary days:', daysError.message)
        }
      }

      // Fire hero image storage in background — only when no custom file was uploaded.
      if (!heroFile && cover && isGooglePhotoUrl(cover)) {
        void fetch('/api/trips/hero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleImageUrl: cover, tripId: data.id }),
        })
      }

      // Fire suggestion generation in background — doesn't block trip creation.
      const duration = (form.start_date && form.end_date)
        ? Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86_400_000) + 1
        : null
      void fetch('/api/suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: data.id,
          city:    form.city || null,
          country: form.country,
          duration,
        }),
      }).catch(() => {})

      toast.success('Trip created!')
      router.push(`/trips/${data.id}/overview`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip')
    } finally {
      setLoading(false)
    }
  }

  const previewSrc = heroPreviewUrl ||
    form.cover_photo ||
    getCityOrCountryImage(form.city) ||
    getDestinationImage({ name: form.name, country: form.country })

  const hasPhoto = !!(heroPreviewUrl || form.cover_photo)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trip Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Trip Details</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Trip Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Chicago Weekend, Tokyo Adventure"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <Label>Destination *</Label>
            <PlacesAutocomplete
              value={form.city}
              onChange={v => set('city', v)}
              onPlaceSelect={p => {
                const city = p.city || p.name
                set('city', city)
                set('country', p.country)
                set('country_code', p.countryCode)
                destRef.current = { lat: p.lat, lng: p.lng, region: p.region, city }
                if (!coverManuallySet.current && !heroFile) {
                  const img = p.photoUrl ||
                    getCityOrCountryImage(city) ||
                    getCityOrCountryImage(p.country) ||
                    ''
                  if (img) set('cover_photo', img)
                }
              }}
              placeholder="Search city, place, or landmark…"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Country and coordinates auto-fill from your selection
            </p>
          </div>

          {/* Country — read-only, auto-filled */}
          <div className="space-y-1.5">
            <Label>Country</Label>
            {form.country ? (
              <div className="flex items-center gap-2.5 h-9 px-3 rounded-md border border-input bg-muted/40 text-sm">
                <span className="text-base leading-none">
                  {form.country_code ? <FlagImg code={form.country_code} className="w-5 h-[15px]" /> : '🌍'}
                </span>
                <span className="flex-1 font-medium text-foreground">{form.country}</span>
                <button
                  type="button"
                  onClick={() => { set('country', ''); set('country_code', ''); destRef.current = { ...destRef.current, lat: null, lng: null } }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear country"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-9 px-3 flex items-center rounded-md border border-dashed border-input text-sm text-muted-foreground/60">
                Auto-filled from destination search above
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Cover Image</h2>
            {heroFile && (
              <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium ml-1">
                · {heroFile.name}
              </span>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden h-40 bg-slate-100 dark:bg-slate-800">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2">
                <ImageIcon className="h-10 w-10" />
                <p className="text-sm">Auto-fills from destination</p>
              </div>
            )}
            {hasPhoto && (
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button type="button" variant="outline" size="sm" className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload photo
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5"
              onClick={() => applyDestinationImage(form.city, form.country, form.name)}>
              <Wand2 className="h-3.5 w-3.5" /> Use destination image
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5"
              onClick={() => setShowUrlInput(v => !v)}>
              <LinkIcon className="h-3.5 w-3.5" /> Paste URL
            </Button>
            {hasPhoto && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive"
                onClick={clearPhoto}>
                <X className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>

          {showUrlInput && (
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input type="url" placeholder="https://images.unsplash.com/…"
                value={form.cover_photo}
                onChange={e => {
                  set('cover_photo', e.target.value)
                  coverManuallySet.current = true
                  // Discard any locally selected file when URL is pasted
                  if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl)
                  setHeroPreviewUrl(null)
                  setHeroFile(null)
                }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Dates</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Departure Date</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Return Date</Label>
              <Input id="end_date" type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Budget</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="budget">Total Budget</Label>
              <Input id="budget" type="number" placeholder="e.g. 3000" value={form.budget}
                onChange={e => set('budget', e.target.value)} min="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select value={form.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.symbol} {c.value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Notes</h2>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Trip Notes</Label>
            <Textarea id="notes" placeholder="Trip ideas, reminders, special occasions…"
              rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
