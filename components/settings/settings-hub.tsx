'use client'

import Link from 'next/link'
import { User, CreditCard, Bell, Palette, Globe, Shield, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  {
    href: '/settings/account',
    icon: User,
    label: 'Account',
    desc: 'Profile, photo, password',
    color: 'bg-indigo-500',
  },
  {
    href: '/settings/subscription',
    icon: CreditCard,
    label: 'Subscription',
    desc: 'Free Plan',
    color: 'bg-violet-500',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    label: 'Notifications',
    desc: 'Alerts and reminders',
    color: 'bg-amber-500',
  },
  {
    href: '/settings/appearance',
    icon: Palette,
    label: 'Appearance',
    desc: 'Theme, colors, layout',
    color: 'bg-pink-500',
  },
  {
    href: '/settings/language',
    icon: Globe,
    label: 'Language & Region',
    desc: 'Language, timezone, currency',
    color: 'bg-sky-500',
  },
  {
    href: '/settings/privacy',
    icon: Shield,
    label: 'Privacy',
    desc: 'Account security & data',
    color: 'bg-emerald-500',
  },
] as const

export function SettingsHub() {
  return (
    <div className="px-4 py-6 space-y-2">
      <div className="rounded-2xl overflow-hidden border border-border/60 bg-card divide-y divide-border/60">
        {CATEGORIES.map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3.5 px-4 py-3.5 active:bg-muted/60 transition-colors"
          >
            <div className={`${color} rounded-[10px] p-2 flex-shrink-0`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
