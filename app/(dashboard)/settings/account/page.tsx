import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountSettings } from '@/components/settings/account-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('home_city,home_country,home_airport')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <>
      <SettingsMobileHeader title="Account" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and credentials</p>
        </div>
        <AccountSettings
          user={user}
          userId={user.id}
          homeSettings={{
            home_city:    settings?.home_city    ?? null,
            home_country: settings?.home_country ?? null,
            home_airport: settings?.home_airport ?? null,
          }}
        />
      </div>
    </>
  )
}
