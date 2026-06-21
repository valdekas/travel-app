import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionSettings } from '@/components/settings/subscription-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <>
      <SettingsMobileHeader title="Subscription" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your plan and billing</p>
        </div>
        <SubscriptionSettings />
      </div>
    </>
  )
}
