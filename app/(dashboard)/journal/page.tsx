import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JournalEntryWithTrip {
  id: string
  title: string | null
  content: string | null
  date: string | null
  mood: string | null
  weather: string | null
  photos: string[]
  trips: { id: string; name: string; country: string } | null
}

const MOOD_EMOJIS: Record<string, string> = {
  amazing: '🤩', great: '😄', good: '😊', okay: '😐', bad: '😞',
}

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, title, content, date, mood, weather, photos, trips(id, name, country)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const typedEntries = (entries ?? []) as unknown as JournalEntryWithTrip[]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Travel Journal</h1>
        <p className="text-muted-foreground mt-1">Your memories from every adventure</p>
      </div>

      {typedEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-lg">No journal entries yet</p>
            <p className="text-muted-foreground mt-1">Open a trip and start writing about your experiences</p>
            <Link href="/trips" className="mt-4">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" /> Go to Trips
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {typedEntries.map(entry => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {entry.mood && (
                    <div className="text-3xl flex-shrink-0">{MOOD_EMOJIS[entry.mood] ?? '📔'}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold">{entry.title || 'Untitled Entry'}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {entry.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.date)}
                            </span>
                          )}
                          {entry.trips && (
                            <span>{entry.trips.name}</span>
                          )}
                          {entry.weather && <span>☁️ {entry.weather}</span>}
                        </div>
                      </div>
                      {entry.trips && (
                        <Link href={`/trips/${entry.trips.id}/journal`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            Open <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{entry.content}</p>
                    {entry.photos && entry.photos.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {entry.photos.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                        ))}
                        {entry.photos.length > 4 && (
                          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                            +{entry.photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
