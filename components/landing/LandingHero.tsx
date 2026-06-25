'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, ChevronDown } from 'lucide-react'

const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=90',
    label: 'Tokyo, Japan',
  },
  {
    src: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=90',
    label: 'Santorini, Greece',
  },
  {
    src: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1920&q=90',
    label: 'Bali, Indonesia',
  },
  {
    src: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
    label: '🇺🇸 New York City',
  },
  {
    src: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=80',
    label: '🇺🇸 Los Angeles',
  },
  {
    src: 'https://images.unsplash.com/photo-1567967455389-e432b76f53c3?w=1920&q=80',
    label: '🇮🇹 Amalfi Coast',
  },
]

export function LandingHero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden bg-slate-950">
      {/* Background images */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={slide.src}
            alt={slide.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        {/* City badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-1.5 mb-6 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium rounded-full px-4 py-1.5"
          >
            <MapPin className="h-3.5 w-3.5" />
            {SLIDES[current].label}
          </motion.div>
        </AnimatePresence>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] max-w-4xl"
        >
          Plan trips you&apos;ll{' '}
          <span className="text-violet-300">never forget</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed"
        >
          The all-in-one travel planner for itineraries, budgets, journals, and maps.
          Turn wanderlust into your next adventure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 items-center"
        >
          <Link href="/auth/login">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-12 text-base shadow-xl shadow-violet-900/40 gap-2"
            >
              Start planning free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20 px-8 h-12 text-base"
            >
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Slide dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-24 flex gap-2"
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-white/40"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </div>
    </section>
  )
}
