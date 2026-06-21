'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { CURRENCY_OPTIONS } from '@/lib/types'
import type { UserSettings } from '@/lib/types'

interface Props {
  userId: string
  settings: Pick<UserSettings, 'language' | 'timezone' | 'currency'>
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'lt', label: 'Lietuvių (Lithuanian)' },
  { value: 'pl', label: 'Polski (Polish)' },
  { value: 'ru', label: 'Русский (Russian)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'es', label: 'Español (Spanish)' },
]

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Warsaw',
  'Europe/Vilnius',
  'Europe/Riga',
  'Europe/Helsinki',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export function LanguageSettings({ userId, settings }: Props) {
  const supabase = createClient()
  const [language, setLanguage] = useState(settings.language)
  const [timezone, setTimezone] = useState(settings.timezone)
  const [currency, setCurrency] = useState(settings.currency)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, language, timezone, currency }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Language & Region saved')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4 pb-24 md:pb-0">

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="divide-y divide-border/40">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="language" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Language</Label>
            <Select value={language} onValueChange={v => setLanguage(v ?? 'en')}>
              <SelectTrigger id="language" className="border-0 shadow-none p-0 h-auto focus:ring-0 text-sm bg-transparent text-left flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="timezone" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Timezone</Label>
            <Select value={timezone} onValueChange={v => setTimezone(v ?? 'UTC')}>
              <SelectTrigger id="timezone" className="border-0 shadow-none p-0 h-auto focus:ring-0 text-sm bg-transparent text-left flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="currency" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Currency</Label>
            <Select value={currency} onValueChange={v => setCurrency(v ?? 'USD')}>
              <SelectTrigger id="currency" className="border-0 shadow-none p-0 h-auto focus:ring-0 text-sm bg-transparent text-left flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Language translation coming soon. Timezone and currency apply to new trips.
      </p>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
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
