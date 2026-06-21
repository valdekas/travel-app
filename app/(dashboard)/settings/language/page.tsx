import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LanguageSettings } from '@/components/settings/language-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'
import { DEFAULT_USER_SETTINGS } from '@/lib/types'

export default async function LanguagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_settings')
    .select('language,timezone,currency')
    .eq('user_id', user.id)
    .maybeSingle()

  const settings = {
    language: data?.language ?? DEFAULT_USER_SETTINGS.language,
    timezone: data?.timezone ?? DEFAULT_USER_SETTINGS.timezone,
    currency: data?.currency ?? DEFAULT_USER_SETTINGS.currency,
  }

  return (
    <>
      <SettingsMobileHeader title="Language & Region" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Language & Region</h1>
          <p className="text-sm text-muted-foreground mt-1">Set your language, timezone and currency preferences</p>
        </div>
        <LanguageSettings userId={user.id} settings={settings} />
      </div>
    </>
  )
}
