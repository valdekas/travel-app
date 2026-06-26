import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTripForm } from '@/components/trips/create-trip-form'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('currency')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Trip</h1>
        <p className="text-muted-foreground mt-1">Plan your next adventure from start to finish</p>
      </div>
      <CreateTripForm defaultCurrency={userSettings?.currency ?? 'EUR'} />
    </div>
  )
}
