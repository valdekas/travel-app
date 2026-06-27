import Link from 'next/link'
import { Plane } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">Travel Pro</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              The all-in-one travel planner for modern explorers.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Product</div>
            <ul className="space-y-2.5">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(l => (
                <li key={l}>
                  <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Company</div>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Press'].map(l => (
                <li key={l}>
                  <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Legal</div>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <li key={l}>
                  <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Travel Pro. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/auth/login">
              <span className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                Get started free →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
