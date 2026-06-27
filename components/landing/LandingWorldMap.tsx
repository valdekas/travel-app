'use client'

import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { motion } from 'framer-motion'

const GEO_URL = '/countries-110m.json'

const VISITED = ['IRL', 'ESP', 'USA', 'ITA', 'FRA', 'DEU', 'GBR', 'PRT']
const UPCOMING = ['JPN', 'AUS', 'BRA', 'THA']

const MARKERS = [
  { name: 'Dublin', coords: [-6.2603, 53.3498] as [number, number], type: 'visited' },
  { name: 'Madrid', coords: [-3.7038, 40.4168] as [number, number], type: 'visited' },
  { name: 'New York', coords: [-74.006, 40.7128] as [number, number], type: 'visited' },
  { name: 'Rome', coords: [12.4964, 41.9028] as [number, number], type: 'visited' },
  { name: 'Tokyo', coords: [139.6917, 35.6895] as [number, number], type: 'upcoming' },
  { name: 'Sydney', coords: [151.2093, -33.8688] as [number, number], type: 'upcoming' },
  { name: 'Bangkok', coords: [100.5018, 13.7563] as [number, number], type: 'upcoming' },
]

const STATS = [
  { label: 'Countries visited', value: '24' },
  { label: 'Trips planned', value: '47' },
  { label: 'Cities explored', value: '138' },
  { label: 'Miles traveled', value: '68k' },
]

export function LandingWorldMap() {
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <section className="bg-slate-950 py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5 mb-4">
            Your world
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Track every country you&apos;ve conquered
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Watch your travel map fill up as you explore. See visited countries in purple, upcoming trips in amber.
          </p>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#0d1b2a]"
        >
          <ComposableMap
            projectionConfig={{ scale: 145, center: [15, 10] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={3}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const iso = geo.properties.ISO_A3 as string
                    const isVisited = VISITED.includes(iso)
                    const isUpcoming = UPCOMING.includes(iso)
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => isVisited || isUpcoming ? setTooltip(geo.properties.NAME) : null}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          default: {
                            fill: isVisited
                              ? '#7c3aed'
                              : isUpcoming
                              ? '#d97706'
                              : '#1e293b',
                            stroke: '#0d1b2a',
                            strokeWidth: 0.4,
                            outline: 'none',
                          },
                          hover: {
                            fill: isVisited
                              ? '#8b5cf6'
                              : isUpcoming
                              ? '#f59e0b'
                              : '#334155',
                            stroke: '#0d1b2a',
                            strokeWidth: 0.4,
                            outline: 'none',
                          },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {MARKERS.map(m => (
                <Marker key={m.name} coordinates={m.coords}>
                  <circle
                    r={4}
                    fill={m.type === 'visited' ? '#a78bfa' : '#fbbf24'}
                    stroke={m.type === 'visited' ? '#7c3aed' : '#d97706'}
                    strokeWidth={1.5}
                    className="cursor-pointer"
                    onMouseEnter={() => setTooltip(m.name)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <circle
                    r={7}
                    fill="transparent"
                    stroke={m.type === 'visited' ? '#a78bfa' : '#fbbf24'}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none shadow-xl">
              {tooltip}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-violet-600" />
              <span className="text-white/60 text-xs">Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-600" />
              <span className="text-white/60 text-xs">Upcoming</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
