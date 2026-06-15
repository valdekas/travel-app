'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CURRENCY_OPTIONS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Globe, Calendar, DollarSign, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'

const POPULAR_COUNTRIES = [
  { code: 'IT', name: 'Italy' }, { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'GR', name: 'Greece' }, { code: 'TH', name: 'Thailand' }, { code: 'PT', name: 'Portugal' },
  { code: 'HR', name: 'Croatia' }, { code: 'TR', name: 'Turkey' }, { code: 'MX', name: 'Mexico' },
  { code: 'AU', name: 'Australia' }, { code: 'DE', name: 'Germany' }, { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' }, { code: 'AT', name: 'Austria' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'PL', name: 'Poland' }, { code: 'HU', name: 'Hungary' }, { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' }, { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'ID', name: 'Indonesia' }, { code: 'VN', name: 'Vietnam' }, { code: 'IN', name: 'India' },
  { code: 'MA', name: 'Morocco' }, { code: 'EG', name: 'Egypt' }, { code: 'ZA', name: 'South Africa' },
  { code: 'BR', name: 'Brazil' }, { code: 'AR', name: 'Argentina' }, { code: 'PE', name: 'Peru' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' }, { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'SG', name: 'Singapore' }, { code: 'KR', name: 'South Korea' },
]

function getFlag(code: string) {
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

export function CreateTripForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    country: '',
    country_code: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'EUR',
    notes: '',
    cover_photo: '',
    status: 'planning' as const,
  })

  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.country) {
      toast.error('Trip name and country are required')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('trips').insert({
        user_id: user.id,
        name: form.name,
        country: form.country,
        country_code: form.country_code || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : 0,
        currency: form.currency,
        notes: form.notes || null,
        cover_photo: form.cover_photo || null,
        status: form.status,
      }).select().single()

      if (error) throw error

      // Seed default checklist items
      await supabase.from('checklist_items').insert([
        { trip_id: data.id, category: 'documents', title: 'Passport', order_index: 0 },
        { trip_id: data.id, category: 'documents', title: 'Travel Insurance', order_index: 1 },
        { trip_id: data.id, category: 'documents', title: 'Boarding Pass', order_index: 2 },
        { trip_id: data.id, category: 'documents', title: 'Hotel Confirmation', order_index: 3 },
        { trip_id: data.id, category: 'documents', title: 'Car Rental Booking', order_index: 4 },
        { trip_id: data.id, category: 'packing', title: 'Clothes', order_index: 0 },
        { trip_id: data.id, category: 'packing', title: 'Charger & Power Bank', order_index: 1 },
        { trip_id: data.id, category: 'packing', title: 'Medication', order_index: 2 },
        { trip_id: data.id, category: 'packing', title: 'Camera', order_index: 3 },
        { trip_id: data.id, category: 'packing', title: 'Travel Adapter', order_index: 4 },
      ])

      toast.success('Trip created!')
      router.push(`/trips/${data.id}/overview`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="e.g. Amalfi Coast 2027, Tokyo Adventure"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={form.country_code}
              onValueChange={v => {
                const found = POPULAR_COUNTRIES.find(c => c.code === v)
                set('country_code', v)
                if (found) set('country', found.name)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {POPULAR_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {getFlag(c.code)} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.country && !form.country_code && (
              <Input
                placeholder="Or type country name"
                value={form.country}
                onChange={e => set('country', e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Dates</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Departure Date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Return Date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={e => set('end_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Budget</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="budget">Total Budget</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g. 3000"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select value={form.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.symbol} {c.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Notes & Cover</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trip ideas, reminders, special occasions…"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cover_photo">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Cover Photo URL
              </div>
            </Label>
            <Input
              id="cover_photo"
              type="url"
              placeholder="https://images.unsplash.com/…"
              value={form.cover_photo}
              onChange={e => set('cover_photo', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
          ) : (
            'Create Trip'
          )}
        </Button>
      </div>
    </form>
  )
}
