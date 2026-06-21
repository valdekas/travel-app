import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsSettings } from '@/components/settings/notifications-settings'
import { SettingsMobileHeader } from '@/components/settings/settings-mobile-header'
import { DEFAULT_USER_SETTINGS } from '@/lib/types'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('user_settings')
    .select('trip_reminders,checklist_reminders,budget_alerts,journal_reminders,email_notifications,push_notifications')
    .eq('user_id', user.id)
    .maybeSingle()

  const settings = {
    trip_reminders:       data?.trip_reminders       ?? DEFAULT_USER_SETTINGS.trip_reminders,
    checklist_reminders:  data?.checklist_reminders  ?? DEFAULT_USER_SETTINGS.checklist_reminders,
    budget_alerts:        data?.budget_alerts         ?? DEFAULT_USER_SETTINGS.budget_alerts,
    journal_reminders:    data?.journal_reminders     ?? DEFAULT_USER_SETTINGS.journal_reminders,
    email_notifications:  data?.email_notifications  ?? DEFAULT_USER_SETTINGS.email_notifications,
    push_notifications:   data?.push_notifications   ?? DEFAULT_USER_SETTINGS.push_notifications,
  }

  return (
    <>
      <SettingsMobileHeader title="Notifications" />
      <div className="p-4 md:p-8">
        <div className="mb-5 hidden md:block">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose what you want to be notified about</p>
        </div>
        <NotificationsSettings userId={user.id} settings={settings} />
      </div>
    </>
  )
}
