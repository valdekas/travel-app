import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BudgetContent } from '@/components/budget/budget-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripBudgetPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trip }, { data: items }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('budget_items').select('*').eq('trip_id', id).order('created_at'),
  ])

  if (!trip) notFound()

  return <BudgetContent trip={trip} initialItems={items ?? []} />
}
