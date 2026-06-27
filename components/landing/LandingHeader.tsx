'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm shadow-violet-900/30">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span
            className={`font-bold text-lg tracking-tight transition-colors duration-300 ${
              scrolled ? 'text-slate-900' : 'text-white'
            }`}
          >
            Travel Pro
          </span>
        </div>

        {/* Actions */}
        <nav className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button
              variant="ghost"
              size="sm"
              className={`transition-colors duration-300 ${
                scrolled
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-white/90 hover:text-white hover:bg-white/15'
              }`}
            >
              Sign in
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-900/20"
            >
              Get started free
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
