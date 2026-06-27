import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingWorldMap } from '@/components/landing/LandingWorldMap'
import { LandingDashboardShowcase } from '@/components/landing/LandingDashboardShowcase'
import { LandingPhoneShowcase } from '@/components/landing/LandingPhoneShowcase'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 overflow-x-hidden">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingWorldMap />
        <LandingDashboardShowcase />
        <LandingPhoneShowcase />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  )
}
