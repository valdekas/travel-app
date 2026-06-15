import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarContent } from '@/components/calendar/calendar-content'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)

  const { data: checklistItems } = await supabase
    .from('checklist_items')
    .select('id, title, due_date, trip_id, completed')
    .eq('completed', false)
    .not('due_date', 'is', null)
    .in('trip_id', trips?.map(t => t.id) ?? [])

  return <CalendarContent trips={trips ?? []} checklistItems={checklistItems ?? []} />
}
