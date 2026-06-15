import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JournalContent } from '@/components/journal/journal-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripJournalPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: entries }, { data: locations }] = await Promise.all([
    supabase.from('trips').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('journal_entries').select('*').eq('trip_id', id).order('date', { ascending: false }),
    supabase.from('locations').select('id, name').eq('trip_id', id).order('name'),
  ])

  if (!trip) notFound()

  return <JournalContent tripId={id} userId={user.id} initialEntries={entries ?? []} locations={locations ?? []} />
}
