import Link from 'next/link'
import { Plane } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <Plane className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-slate-600 text-sm font-medium">Travel Pro © {new Date().getFullYear()}</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Contact</a>
        </div>

        {/* Auth links */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <Link href="/auth/login" className="hover:text-slate-600 transition-colors">Sign in</Link>
          <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
            Get started free →
          </Link>
        </div>
      </div>
    </footer>
  )
}
