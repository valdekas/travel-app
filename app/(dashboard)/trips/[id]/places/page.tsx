import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PlacesContent } from '@/components/trips/places-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripPlacesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: locations }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('locations').select('*').eq('trip_id', id).order('order_index'),
  ])

  if (!trip) notFound()

  return <PlacesContent trip={trip} initialLocations={locations ?? []} />
}
