'use client'

import Link from 'next/link'
import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm shadow-violet-200">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="text-slate-900 font-bold text-lg tracking-tight">Travel Pro</span>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200">
              Get started free
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
