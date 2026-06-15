import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChecklistContent } from '@/components/checklist/checklist-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripChecklistPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: items }] = await Promise.all([
    supabase.from('trips').select('id, name, currency').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('checklist_items').select('*').eq('trip_id', id).order('order_index'),
  ])

  if (!trip) notFound()

  return <ChecklistContent tripId={id} initialItems={items ?? []} />
}
