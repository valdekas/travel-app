'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const FREE_FEATURES = [
  'Unlimited trips',
  'All core features',
  'World map & statistics',
  'Travel journal',
  'Itinerary builder',
  'Budget tracker',
  'Checklist & packing',
  'AI suggestions',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Priority support',
  'Advanced analytics',
  'Export trips (PDF/CSV)',
  'Trip sharing & collaboration',
  'Custom themes',
]

export function LandingPricing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    toast.success('You\'re on the waitlist! We\'ll be in touch.')
  }

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-500">Start free, upgrade when you're ready.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Free plan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-slate-900 font-bold text-lg mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">€0</span>
                <span className="text-slate-400 text-sm">/ forever</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">No credit card needed. No limits.</p>
            </div>

            <Link href="/auth/login" className="block mb-6">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                Get started free
              </Button>
            </Link>

            <ul className="space-y-2.5">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Coming Soon
              </span>
            </div>

            <div className="mb-5 mt-2">
              <p className="text-slate-900 font-bold text-lg mb-1">Pro</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-violet-600">€X</span>
                <span className="text-slate-400 text-sm">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">For power travelers and frequent flyers.</p>
            </div>

            {/* Waitlist form */}
            {submitted ? (
              <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                <p className="text-emerald-700 font-semibold text-sm">You're on the list! 🎉</p>
                <p className="text-emerald-600 text-xs mt-0.5">We'll notify you at launch.</p>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="mb-6 space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white"
                />
                <Button type="submit" variant="outline" className="w-full border-violet-200 text-violet-700 hover:bg-violet-50">
                  Join waitlist
                </Button>
              </form>
            )}

            <ul className="space-y-2.5">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-violet-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
