import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TripOverviewContent } from '@/components/trips/trip-overview-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripOverviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: trip },
    { data: checklist },
    { data: locations },
    { data: budgetItems },
    { data: itineraryDays },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('checklist_items').select('*').eq('trip_id', id),
    supabase.from('locations').select('*').eq('trip_id', id),
    supabase.from('budget_items').select('*').eq('trip_id', id),
    supabase.from('itinerary_days').select('id, itinerary_items(id)').eq('trip_id', id),
  ])

  if (!trip) notFound()

  type DayWithItems = { id: string; itinerary_items: { id: string }[] }
  const days = itineraryDays as DayWithItems[] | null
  const daysWithActivities = (days ?? []).filter(d => d.itinerary_items.length > 0).length

  return (
    <TripOverviewContent
      trip={trip!}
      checklist={checklist ?? []}
      locations={locations ?? []}
      budgetItems={budgetItems ?? []}
      itineraryDaysCount={itineraryDays?.length ?? 0}
      itineraryDaysWithActivities={daysWithActivities}
    />
  )
}
