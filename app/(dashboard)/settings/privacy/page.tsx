import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrivacySettings } from '@/components/settings/privacy-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'
import { DEFAULT_USER_SETTINGS } from '@/lib/types'

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_settings')
    .select('private_account,hide_profile')
    .eq('user_id', user.id)
    .maybeSingle()

  const settings = {
    private_account: data?.private_account ?? DEFAULT_USER_SETTINGS.private_account,
    hide_profile:    data?.hide_profile    ?? DEFAULT_USER_SETTINGS.hide_profile,
  }

  return (
    <>
      <SettingsMobileHeader title="Privacy" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Privacy</h1>
          <p className="text-sm text-muted-foreground mt-1">Control your data and account visibility</p>
        </div>
        <PrivacySettings userId={user.id} userEmail={user.email ?? ''} settings={settings} />
      </div>
    </>
  )
}
