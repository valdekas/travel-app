import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalJournalContent } from '@/components/global-journal/global-journal-content'
import type { GlobalJournalEntry, GlobalJournalTrip } from '@/components/global-journal/global-journal-content'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: rawEntries }, { data: rawTrips }] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id, title, content, date, time, mood, weather, photos, is_favorite, location_id, linked_to_trip, trips(id, name, country, country_code, start_date), locations(name, address)')
      .eq('user_id', user.id)
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('trips')
      .select('id, name, country, country_code, start_date, cover_photo')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false, nullsFirst: false }),
  ])

  const entries = (rawEntries ?? []) as unknown as GlobalJournalEntry[]
  const trips   = (rawTrips   ?? []) as unknown as GlobalJournalTrip[]

  return <GlobalJournalContent entries={entries} trips={trips} />
}
