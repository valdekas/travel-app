'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { UserSettings } from '@/lib/types'

interface Props {
  userId: string
  settings: Pick<UserSettings,
    | 'trip_reminders' | 'checklist_reminders' | 'budget_alerts'
    | 'journal_reminders' | 'email_notifications' | 'push_notifications'
  >
}

type Prefs = Props['settings']

export function NotificationsSettings({ userId, settings }: Props) {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<Prefs>(settings)
  const [saving, setSaving] = useState(false)

  function toggle(key: keyof Prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Notification preferences saved')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inAppItems: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: 'trip_reminders',       label: 'Trip Reminders',       desc: 'Reminded before your trip starts' },
    { key: 'checklist_reminders',  label: 'Checklist Reminders',  desc: 'Reminder to complete checklist items' },
    { key: 'budget_alerts',        label: 'Budget Alerts',        desc: 'Alert when spending exceeds budget' },
    { key: 'journal_reminders',    label: 'Journal Reminders',    desc: 'Prompt to write on travel days' },
  ]

  const emailPushItems: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: 'email_notifications', label: 'Email Notifications', desc: 'Summaries and alerts by email' },
    { key: 'push_notifications',  label: 'Push Notifications',  desc: 'Browser push (requires permission)' },
  ]

  function ToggleRow({ item }: { item: { key: keyof Prefs; label: string; desc: string } }) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
        </div>
        <Switch
          checked={prefs[item.key]}
          onCheckedChange={() => toggle(item.key)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-4 pb-24 md:pb-0">

      {/* In-app */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">In-App</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          {inAppItems.map(item => <ToggleRow key={item.key} item={item} />)}
        </div>
      </div>

      {/* Email & Push */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Email & Push</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          {emailPushItems.map(item => <ToggleRow key={item.key} item={item} />)}
        </div>
      </div>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>

      {/* Desktop save */}
      <div className="hidden md:flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
