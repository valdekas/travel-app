import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Globe, MapPin, Calendar, CheckSquare, BarChart3, BookOpen, Star, ArrowRight } from 'lucide-react'

const features = [
  { icon: Globe, title: 'Trip Planning', desc: 'Organize countries, regions, cities, and places in a beautiful hierarchy.' },
  { icon: MapPin, title: 'Places Database', desc: 'Save attractions, restaurants, viewpoints with Google Maps integration.' },
  { icon: Calendar, title: 'Itinerary Builder', desc: 'Plan each day with drag-and-drop scheduling and time blocks.' },
  { icon: CheckSquare, title: 'Pre-Trip Checklist', desc: 'Never forget documents, packing, or reservations again.' },
  { icon: BarChart3, title: 'Budget Tracker', desc: 'Track planned vs actual spending across all categories.' },
  { icon: BookOpen, title: 'Travel Journal', desc: 'Capture memories, photos, and ratings for every place visited.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Globe className="h-7 w-7 text-violet-400" />
          <span className="text-xl font-bold">Travel Planner Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="bg-violet-500 hover:bg-violet-400 text-white">Get Started Free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
          <Star className="h-3.5 w-3.5" /> Your complete travel planning companion
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent leading-tight">
          Plan Trips Like a Pro
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          From dreaming about Japan to exploring the Amalfi Coast — organize every detail of your journey in one beautiful place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg" className="bg-violet-500 hover:bg-violet-400 text-white px-8 h-12 text-base">
              Start Planning <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base">
              View Demo
            </Button>
          </Link>
        </div>

        {/* Hero countdown card */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm mx-auto backdrop-blur-sm">
          <p className="text-slate-400 text-sm mb-1">Next Trip: Amalfi Coast 2027</p>
          <div className="text-6xl font-bold text-white mb-1">247</div>
          <p className="text-violet-300 text-lg font-medium">DAYS LEFT</p>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full" />
          </div>
          <p className="text-slate-500 text-xs mt-2">Planning phase · 18 places saved</p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-slate-400 text-center mb-12">A complete toolkit for the serious traveler</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.08] transition-colors">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to plan your next adventure?</h2>
        <p className="text-slate-400 mb-8">Join thousands of travelers who plan smarter with Travel Planner Pro.</p>
        <Link href="/auth/login">
          <Button size="lg" className="bg-violet-500 hover:bg-violet-400 text-white px-10 h-12 text-base">
            Get Started — It&apos;s Free
          </Button>
        </Link>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Travel Planner Pro. Built for explorers.
      </footer>
    </div>
  )
}
