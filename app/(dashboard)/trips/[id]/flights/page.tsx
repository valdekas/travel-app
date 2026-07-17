import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FlightsContent } from '@/components/trips/flights-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripFlightsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: settings }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('user_settings').select('home_city,home_country,home_airport').eq('user_id', user.id).maybeSingle(),
  ])

  if (!trip) notFound()

  return (
    <FlightsContent
      trip={trip}
      homeCity={settings?.home_city    ?? null}
      homeCountry={settings?.home_country ?? null}
      homeAirport={settings?.home_airport ?? null}
    />
  )
}
