import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SearchContent } from '@/components/search/search-content'

export default async function SearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trips }, { data: locations }, { data: wishlist }] = await Promise.all([
    supabase.from('trips').select('*').eq('user_id', user.id),
    supabase.from('locations').select('*, trips!inner(user_id)').eq('trips.user_id', user.id),
    supabase.from('wishlist_items').select('*').eq('user_id', user.id),
  ])

  return <SearchContent trips={trips ?? []} locations={locations ?? []} wishlist={wishlist ?? []} />
}
