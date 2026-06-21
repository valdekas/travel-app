'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, CURRENCY_OPTIONS } from '@/lib/types'
import { getCityOrCountryImage, getDestinationImage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Edit, Loader2, ImageIcon, Wand2, Link as LinkIcon, X } from 'lucide-react'

interface EditTripDialogProps {
  trip: Trip
  glassMode?: boolean
}

export function EditTripDialog({ trip, glassMode }: EditTripDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [form, setForm] = useState({
    name: trip.name,
    country: trip.country,
    city: trip.city ?? '',
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    budget: trip.budget?.toString() ?? '',
    currency: trip.currency ?? 'EUR',
    notes: trip.notes ?? '',
    status: trip.status,
    cover_photo: trip.cover_photo ?? '',
  })

  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  function applyDestinationImage() {
    const img =
      getCityOrCountryImage(form.city) ||
      getDestinationImage({ name: form.name, country: form.country })
    set('cover_photo', img)
  }

  async function handleSave() {
    setLoading(true)
    try {
      const { error } = await supabase.from('trips').update({
        name: form.name,
        country: form.country,
        city: form.city || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: parseFloat(form.budget) || 0,
        currency: form.currency,
        notes: form.notes || null,
        status: form.status,
        cover_photo: form.cover_photo || null,
      }).eq('id', trip.id)

      if (error) throw error
      toast.success('Trip updated')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const previewSrc = form.cover_photo || getDestinationImage({ name: form.name, country: form.country })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={glassMode ? (
        <button className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-medium bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5 transition-all">
          <Edit className="h-3.5 w-3.5" /> Edit
        </button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5">
          <Edit className="h-3.5 w-3.5" /> Edit Trip
        </Button>
      )} />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">

          {/* Basic info */}
          <div className="space-y-1.5">
            <Label>Trip Name</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.country} onChange={e => set('country', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.symbol} {c.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['planning', 'upcoming', 'active', 'completed', 'cancelled'].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          {/* Cover image */}
          <div className="space-y-3 pt-1 border-t border-border/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cover Image</span>
            </div>

            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden h-32 bg-slate-100 dark:bg-slate-800">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/30">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              {form.cover_photo && (
                <button
                  type="button"
                  onClick={() => set('cover_photo', '')}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* City input for existing trips */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">City (for destination image)</Label>
              <Input
                placeholder="e.g. Chicago, Barcelona, Tokyo…"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={applyDestinationImage}
              >
                <Wand2 className="h-3 w-3" /> Use destination image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowUrlInput(v => !v)}
              >
                <LinkIcon className="h-3 w-3" /> Paste URL
              </Button>
              {form.cover_photo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => set('cover_photo', '')}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              )}
            </div>

            {showUrlInput && (
              <div className="space-y-1">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/…"
                  value={form.cover_photo}
                  onChange={e => set('cover_photo', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
