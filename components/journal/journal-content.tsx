'use client'

import { useState } from 'react'
import { JournalEntry, Mood, MOOD_EMOJIS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, BookOpen, Calendar, Smile, MapPin, Trash2, Loader2 } from 'lucide-react'

const MOODS: { value: Mood; label: string }[] = [
  { value: 'amazing', label: '🤩 Amazing' },
  { value: 'great', label: '😄 Great' },
  { value: 'good', label: '😊 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'bad', label: '😞 Bad' },
]

interface JournalContentProps {
  tripId: string
  userId: string
  initialEntries: JournalEntry[]
  locations: { id: string; name: string }[]
}

export function JournalContent({ tripId, userId, initialEntries, locations }: JournalContentProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '', content: '', date: '', mood: '' as Mood | '', weather: '', location_id: '', photos: '',
  })
  const set = (k: string, v: string | null) => setForm(f => ({ ...f, [k]: v ?? '' }))

  async function addEntry() {
    if (!form.content.trim()) { toast.error('Content is required'); return }
    setSaving(true)
    try {
      const photos = form.photos.split('\n').map(s => s.trim()).filter(Boolean)
      const { data, error } = await supabase.from('journal_entries').insert({
        trip_id: tripId,
        user_id: userId,
        title: form.title || null,
        content: form.content,
        date: form.date || null,
        mood: form.mood || null,
        weather: form.weather || null,
        location_id: form.location_id || null,
        photos,
      }).select().single()
      if (error) throw error
      setEntries(prev => [data, ...prev])
      setForm({ title: '', content: '', date: '', mood: '', weather: '', location_id: '', photos: '' })
      setAddOpen(false)
      toast.success('Journal entry saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Entry deleted')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Travel Journal</h2>
          <p className="text-sm text-muted-foreground">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">Your journal is empty</p>
            <p className="text-muted-foreground mt-1">Write about your experiences, save memories, and rate places</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Entry list */}
          <div className="lg:col-span-1 space-y-3">
            {entries.map(entry => (
              <Card
                key={entry.id}
                className={`cursor-pointer hover:shadow-md transition-all ${selected?.id === entry.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelected(entry)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {entry.mood && <span className="text-xl">{MOOD_EMOJIS[entry.mood]}</span>}
                      <p className="font-medium text-sm mt-1 truncate">{entry.title || 'Untitled'}</p>
                      {entry.date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.date, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.content}</p>
                  {entry.photos.length > 0 && (
                    <Badge variant="secondary" className="text-xs mt-2">{entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entry detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {selected.mood && (
                        <span className="text-3xl">{MOOD_EMOJIS[selected.mood]}</span>
                      )}
                      <CardTitle className="text-lg mt-1">{selected.title || 'Untitled'}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        {selected.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(selected.date, 'EEEE, MMMM d, yyyy')}
                          </span>
                        )}
                        {selected.weather && <span>☁️ {selected.weather}</span>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                  {selected.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                      {selected.photos.map((url, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed h-48 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Select an entry to read it</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Day in Positano, Amalfi Hike…" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mood</Label>
                <Select value={form.mood} onValueChange={v => set('mood', v)}>
                  <SelectTrigger><SelectValue placeholder="How was it?" /></SelectTrigger>
                  <SelectContent>
                    {MOODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Weather</Label>
                <Input placeholder="Sunny, 28°C" value={form.weather} onChange={e => set('weather', e.target.value)} />
              </div>
              {locations.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Select value={form.location_id} onValueChange={v => set('location_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Where?" /></SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Journal Entry *</Label>
              <Textarea rows={6} placeholder="Write about your day, what you saw, ate, experienced…" value={form.content} onChange={e => set('content', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Photo URLs (one per line)</Label>
              <Textarea rows={3} placeholder="https://…" value={form.photos} onChange={e => set('photos', e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={addEntry} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Entry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
