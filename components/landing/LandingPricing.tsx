'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ArrowRight } from 'lucide-react'

const FREE_FEATURES = [
  'Up to 5 trips',
  'Itinerary planner',
  'Packing checklists',
  'Budget tracker',
  'Travel journal',
  'Google Maps integration',
  'World map tracker',
]

const PRO_FEATURES = [
  'Unlimited trips',
  'AI trip suggestions',
  'AI itinerary builder',
  'Offline access',
  'Export to PDF',
  'Calendar sync',
  'Priority support',
]

export function LandingPricing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5 mb-4">
            Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Free to start, always
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-lg mx-auto">
            Everything you need to plan your first trips is completely free. Pro is coming soon.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8"
          >
            <div className="mb-6">
              <div className="text-slate-400 text-sm font-medium mb-2">Free</div>
              <div className="text-5xl font-bold text-white">€0</div>
              <div className="text-slate-400 text-sm mt-1">Forever free, no credit card needed</div>
            </div>

            <Link href="/auth/login" className="block mb-8">
              <Button
                className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 gap-2"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <div className="space-y-3">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900 border border-violet-500/30 rounded-2xl p-8 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-violet-300 text-sm font-medium">Pro</span>
                <span className="bg-violet-500/20 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-violet-500/30">
                  Coming soon
                </span>
              </div>
              <div className="text-5xl font-bold text-white">€9<span className="text-2xl text-slate-400 font-normal">/mo</span></div>
              <div className="text-slate-400 text-sm mt-1">Billed monthly, cancel anytime</div>
            </div>

            {/* Waitlist */}
            <div className="relative mt-6 mb-8">
              {submitted ? (
                <div className="w-full bg-violet-600/20 border border-violet-500/30 text-violet-200 rounded-xl py-3 px-4 text-sm text-center font-medium">
                  <Sparkles className="h-4 w-4 inline mr-1.5" />
                  You&apos;re on the list! We&apos;ll notify you.
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                  />
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white shrink-0 gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Join waitlist
                  </Button>
                </form>
              )}
            </div>

            <div className="relative space-y-3">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Everything in Free, plus:</div>
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-violet-400" />
                  </div>
                  <span className="text-slate-300 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          Trusted by travellers in 40+ countries · No credit card required · Free forever
        </motion.div>
      </div>
    </section>
  )
}
