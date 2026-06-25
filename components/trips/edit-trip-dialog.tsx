'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, CURRENCY_OPTIONS } from '@/lib/types'
import { getDestinationImage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { uploadCustomHeroImage, validateHeroImageFile } from '@/lib/utils/trip-hero-image'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Edit, Loader2, ImageIcon, Wand2, Link as LinkIcon, Upload, X, ClipboardCheck } from 'lucide-react'

interface EditTripDialogProps {
  trip: Trip
  glassMode?: boolean
}

export function EditTripDialog({ trip, glassMode }: EditTripDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingDestImg, setFetchingDestImg] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: trip.name,
    country: trip.country,
    city: trip.city ?? '',
    place_id: trip.place_id ?? '',
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    budget: trip.budget?.toString() ?? '',
    currency: trip.currency ?? 'EUR',
    notes: trip.notes ?? '',
    status: trip.status,
    cover_photo: trip.cover_photo ?? '',
    is_planning: trip.is_planning ?? true,
  })

  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
      setFilePreviewUrl(null)
      setSelectedFile(null)
      setShowUrlInput(false)
    }
    setOpen(next)
  }

  async function applyDestinationImage() {
    const placeId = form.place_id || trip.place_id
    if (!placeId) {
      toast.error('No destination image available — try uploading your own photo')
      return
    }
    setFetchingDestImg(true)
    try {
      const res = await fetch('/api/trips/fetch-hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId:  trip.id,
          placeId,
          city:    form.city || null,
          country: form.country || null,
        }),
      })
      const data = await res.json()
      if (data.url) {
        set('cover_photo', data.url)
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
        setFilePreviewUrl(null)
        setSelectedFile(null)
      } else {
        toast.error('Could not fetch destination image')
      }
    } catch {
      toast.error('Could not fetch destination image')
    } finally {
      setFetchingDestImg(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateHeroImageFile(file)
    if (err) { toast.error(err); return }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setSelectedFile(file)
    setFilePreviewUrl(URL.createObjectURL(file))
    // Clear URL input since file takes over
    setShowUrlInput(false)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function clearPhoto() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setFilePreviewUrl(null)
    setSelectedFile(null)
    set('cover_photo', '')
  }

  async function handleSave() {
    setLoading(true)
    try {
      let coverPhotoUrl = form.cover_photo

      if (selectedFile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const uploaded = await uploadCustomHeroImage(supabase, selectedFile, user.id, trip.id)
        if (uploaded) {
          coverPhotoUrl = uploaded
        } else {
          toast.error('Photo upload failed — other changes were saved')
          // Don't abort the save; fall through with the existing URL
        }
      }

      const { error } = await supabase.from('trips').update({
        name:        form.name,
        country:     form.country,
        city:        form.city || null,
        place_id:    form.place_id || null,
        start_date:  form.start_date || null,
        end_date:    form.end_date || null,
        budget:      parseFloat(form.budget) || 0,
        currency:    form.currency,
        notes:       form.notes || null,
        status:      form.status,
        is_planning: form.is_planning,
        cover_photo: coverPhotoUrl || null,
      }).eq('id', trip.id)

      if (error) throw error
      toast.success('Trip updated')
      handleOpenChange(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const previewSrc = filePreviewUrl ||
    form.cover_photo ||
    getDestinationImage({ name: form.name, country: form.country })

  const hasPhoto = !!(filePreviewUrl || form.cover_photo)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Label>Status override</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['planning', 'upcoming', 'active', 'completed', 'cancelled'].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Upcoming / Active / Completed are auto-derived from dates. Only set manually to override or cancel.
            </p>
          </div>

          {/* Planning flag toggle */}
          <div className="flex items-start justify-between gap-3 py-2.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Still planning</p>
                <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70">
                  {form.is_planning
                    ? 'Trip appears under the "Planning" filter'
                    : 'Trip is confirmed — not shown under "Planning"'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_planning: !f.is_planning }))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                form.is_planning ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={form.is_planning}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                form.is_planning ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
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
              {selectedFile && (
                <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                  · {selectedFile.name}
                </span>
              )}
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
              {hasPhoto && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* City / destination — autocomplete updates place_id for hero fetch */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Destination (updates hero image source)</Label>
              <PlacesAutocomplete
                value={form.city}
                onChange={v => set('city', v)}
                onPlaceSelect={p => {
                  set('city', p.city || p.name)
                  set('place_id', p.placeId)
                }}
                placeholder="Search city or landmark…"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" /> Upload photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={applyDestinationImage}
                disabled={fetchingDestImg}
              >
                {fetchingDestImg
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Fetching…</>
                  : <><Wand2 className="h-3 w-3" /> Use destination image</>
                }
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
              {hasPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={clearPhoto}
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
                  onChange={e => {
                    set('cover_photo', e.target.value)
                    // If user pastes a URL, discard any locally selected file
                    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
                    setFilePreviewUrl(null)
                    setSelectedFile(null)
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />{selectedFile ? 'Uploading…' : 'Saving…'}</>
                : 'Save Changes'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
