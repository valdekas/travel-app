import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountSettings } from '@/components/settings/account-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <>
      <SettingsMobileHeader title="Account" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and credentials</p>
        </div>
        <AccountSettings user={user} />
      </div>
    </>
  )
}
