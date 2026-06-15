import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WishlistContent } from '@/components/wishlist/wishlist-content'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: items }, { data: trips }] = await Promise.all([
    supabase.from('wishlist_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('trips').select('id, name').eq('user_id', user.id).order('name'),
  ])

  return <WishlistContent userId={user.id} initialItems={items ?? []} trips={trips ?? []} />
}
