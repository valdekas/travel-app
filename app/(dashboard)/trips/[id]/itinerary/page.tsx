import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ItineraryContent } from '@/components/itinerary/itinerary-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripItineraryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: days }, { data: locations }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('itinerary_days').select('*, items:itinerary_items(*)').eq('trip_id', id).order('date'),
    supabase.from('locations').select('id, name, type').eq('trip_id', id).order('name'),
  ])

  if (!trip) notFound()

  return <ItineraryContent trip={trip} initialDays={days ?? []} locations={locations ?? []} />
}
