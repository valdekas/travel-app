import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChecklistContent } from '@/components/checklist/checklist-content'
import { differenceInDays, parseISO } from 'date-fns'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripChecklistPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: items }, { data: itinItems }] = await Promise.all([
    supabase
      .from('trips')
      .select('id, name, currency, city, country, start_date, end_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('checklist_items')
      .select('*')
      .eq('trip_id', id)
      .order('order_index'),
    supabase
      .from('itinerary_items')
      .select('type')
      .eq('trip_id', id),
  ])

  if (!trip) notFound()

  // Derive trip context for AI suggestions
  const duration =
    trip.start_date && trip.end_date
      ? Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1)
      : 7

  const tripTypes = [...new Set((itinItems ?? []).map(i => i.type).filter(Boolean))]

  const existingItems = (items ?? []).map(i => i.title)

  return (
    <ChecklistContent
      tripId={id}
      initialItems={items ?? []}
      tripContext={{
        city:          trip.city ?? '',
        country:       trip.country ?? '',
        duration,
        startDate:     trip.start_date ?? '',
        tripTypes,
        existingItems,
      }}
    />
  )
}
