import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SuggestionsContent } from '@/components/trips/suggestions-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripSuggestionsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: trip },
    { data: suggestions },
    { data: itineraryDays },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase
      .from('trip_suggestions')
      .select('*')
      .eq('trip_id', id)
      .order('created_at'),
    supabase
      .from('itinerary_days')
      .select('id, date, day_number, title')
      .eq('trip_id', id)
      .order('day_number'),
  ])

  if (!trip) notFound()

  return (
    <SuggestionsContent
      trip={trip}
      initialSuggestions={suggestions ?? []}
      itineraryDays={itineraryDays ?? []}
    />
  )
}
