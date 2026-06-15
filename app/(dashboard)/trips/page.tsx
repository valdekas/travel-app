import { createClient } from '@/lib/supabase/server'
import { TripsListContent } from '@/components/trips/trips-list-content'
import { redirect } from 'next/navigation'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <TripsListContent trips={trips ?? []} />
}
