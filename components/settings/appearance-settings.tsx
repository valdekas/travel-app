'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2, Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserSettings } from '@/lib/types'

interface Props {
  userId: string
  settings: Pick<UserSettings, 'theme' | 'accent_color' | 'compact_mode' | 'animations_enabled'>
}

const THEMES = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

const ACCENT_COLORS = [
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-500' },
  { value: 'sky',    label: 'Sky',    bg: 'bg-sky-500' },
  { value: 'emerald',label: 'Emerald',bg: 'bg-emerald-500' },
  { value: 'rose',   label: 'Rose',   bg: 'bg-rose-500' },
]

export function AppearanceSettings({ userId, settings }: Props) {
  const { setTheme, resolvedTheme } = useTheme()
  const supabase = createClient()

  const [selectedTheme, setSelectedTheme] = useState(settings.theme)
  const [accentColor, setAccentColor] = useState(settings.accent_color)
  const [compactMode, setCompactMode] = useState(settings.compact_mode)
  const [animations, setAnimations] = useState(settings.animations_enabled)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function handleThemeSelect(theme: string) {
    setSelectedTheme(theme)
    setTheme(theme)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          theme: selectedTheme,
          accent_color: accentColor,
          compact_mode: compactMode,
          animations_enabled: animations,
        }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Appearance saved')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-xl space-y-4 pb-24 md:pb-0">

      {/* Theme */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Theme</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-border/40">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = selectedTheme === value
              return (
                <button
                  key={value}
                  onClick={() => handleThemeSelect(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 transition-colors',
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : 'bg-card hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'rounded-xl p-2.5',
                    active
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn('text-xs font-medium', active ? 'text-indigo-700 dark:text-indigo-300' : 'text-muted-foreground')}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Currently using {resolvedTheme === 'dark' ? 'dark' : 'light'} mode
            </p>
          </div>
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Accent Color</p>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            {ACCENT_COLORS.map(({ value, label, bg }) => {
              const active = accentColor === value
              return (
                <button
                  key={value}
                  onClick={() => setAccentColor(value)}
                  title={label}
                  className={cn(
                    'relative h-10 w-10 rounded-full transition-all',
                    bg,
                    active ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  )}
                >
                  {active && <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Interface toggles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Interface</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Compact Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Denser layout with reduced spacing</p>
            </div>
            <Switch checked={compactMode} onCheckedChange={v => setCompactMode(v)} />
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Animations</p>
              <p className="text-xs text-muted-foreground mt-0.5">Smooth transitions and motion effects</p>
            </div>
            <Switch checked={animations} onCheckedChange={v => setAnimations(v)} />
          </div>
        </div>
      </div>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Appearance
        </Button>
      </div>

      {/* Desktop save */}
      <div className="hidden md:flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Appearance
        </Button>
      </div>
    </div>
  )
}
