import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { HotelsContent } from '@/components/trips/hotels-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripHotelsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!trip) notFound()

  return <HotelsContent trip={trip} />
}
