'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Bell, Palette, Globe, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/settings/account',       icon: User,       label: 'Account' },
  { href: '/settings/subscription',  icon: CreditCard, label: 'Subscription' },
  { href: '/settings/notifications', icon: Bell,       label: 'Notifications' },
  { href: '/settings/appearance',    icon: Palette,    label: 'Appearance' },
  { href: '/settings/language',      icon: Globe,      label: 'Language & Region' },
  { href: '/settings/privacy',       icon: Shield,     label: 'Privacy' },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-border/60 py-6 px-3 gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">Settings</p>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')} />
              {label}
            </Link>
          )
        })}
      </aside>

    </>
  )
}
