import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: trips },
    { data: wishlistItems },
    { data: allLocations },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('wishlist_items').select('id').eq('user_id', user.id),
    supabase.from('locations').select('id, visited, trip_id').in(
      'trip_id',
      (await supabase.from('trips').select('id').eq('user_id', user.id)).data?.map(t => t.id) ?? []
    ),
  ])

  return (
    <DashboardContent
      trips={trips ?? []}
      wishlistCount={wishlistItems?.length ?? 0}
      allLocations={allLocations ?? []}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Traveler'}
    />
  )
}
