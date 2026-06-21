'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap } from 'lucide-react'

const FREE_FEATURES = [
  'Up to 5 trips',
  'Basic itinerary planning',
  'Checklists & budgets',
  'Journal entries',
  'Places wishlist',
]

const PRO_FEATURES = [
  'Unlimited trips',
  'AI itinerary suggestions',
  'Advanced budget analytics',
  'Photo uploads (5 GB)',
  'Collaboration & sharing',
  'Priority support',
  'Export to PDF',
  'Offline access',
]

export function SubscriptionSettings() {
  return (
    <div className="max-w-2xl space-y-4">

      {/* Current plan */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-foreground">Free Plan</p>
              <Badge variant="secondary" className="text-xs">Current</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Upgrade to unlock all features</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">$0</p>
            <p className="text-xs text-muted-foreground">/ month</p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Free */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div>
            <p className="font-semibold text-foreground">Free</p>
            <p className="text-xl font-bold text-foreground mt-0.5">$0 <span className="text-sm font-normal text-muted-foreground">/ mo</span></p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>Current Plan</Button>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border-2 border-indigo-500/60 dark:border-indigo-400/50 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 space-y-3 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Popular
            </Badge>
          </div>
          <div>
            <p className="font-semibold text-indigo-700 dark:text-indigo-300">Pro</p>
            <p className="text-xl font-bold text-foreground mt-0.5">$9 <span className="text-sm font-normal text-muted-foreground">/ mo</span></p>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing</p>
        </div>
        <button disabled className="w-full flex items-center justify-between px-4 py-3.5 text-left opacity-50 cursor-not-allowed">
          <p className="text-sm font-medium text-foreground">Manage Subscription</p>
          <p className="text-xs text-muted-foreground">Available on paid plans</p>
        </button>
        <button disabled className="w-full flex items-center justify-between px-4 py-3.5 text-left opacity-50 cursor-not-allowed">
          <p className="text-sm font-medium text-foreground">Download Invoice</p>
          <p className="text-xs text-muted-foreground">Available on paid plans</p>
        </button>
      </div>

    </div>
  )
}
