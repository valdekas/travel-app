import { LandingNav } from '@/components/landing/landing-nav'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingMap } from '@/components/landing/landing-map'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingDemo } from '@/components/landing/landing-demo'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingFooter } from '@/components/landing/landing-footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingMap />
        <LandingFeatures />
        <LandingDemo />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  )
}
