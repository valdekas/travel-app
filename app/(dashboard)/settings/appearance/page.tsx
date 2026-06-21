import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppearanceSettings } from '@/components/settings/appearance-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'
import { DEFAULT_USER_SETTINGS } from '@/lib/types'

export default async function AppearancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_settings')
    .select('theme,accent_color,compact_mode,animations_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  const settings = {
    theme:              data?.theme              ?? DEFAULT_USER_SETTINGS.theme,
    accent_color:       data?.accent_color       ?? DEFAULT_USER_SETTINGS.accent_color,
    compact_mode:       data?.compact_mode       ?? DEFAULT_USER_SETTINGS.compact_mode,
    animations_enabled: data?.animations_enabled ?? DEFAULT_USER_SETTINGS.animations_enabled,
  }

  return (
    <>
      <SettingsMobileHeader title="Appearance" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Appearance</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize how the app looks and feels</p>
        </div>
        <AppearanceSettings userId={user.id} settings={settings} />
      </div>
    </>
  )
}
