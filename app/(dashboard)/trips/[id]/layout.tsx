import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TripDetailShell } from '@/components/trips/trip-detail-shell'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function TripDetailLayout({ children, params }: Props) {
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

  return <TripDetailShell trip={trip}>{children}</TripDetailShell>
}
