'use client'

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = '/countries-110m.json'

// Demo countries for the landing page map
const VISITED = new Set(['FRA', 'ITA', 'ESP', 'DEU', 'GBR', 'JPN', 'USA', 'AUS', 'NLD', 'BEL'])
const PLANNED = new Set(['THA', 'NZL', 'PRT', 'GRC', 'HRV'])

const MARKERS: { name: string; coords: [number, number]; flag: string }[] = [
  { name: 'Paris', coords: [2.35, 48.85], flag: '🇫🇷' },
  { name: 'Tokyo', coords: [139.69, 35.69], flag: '🇯🇵' },
  { name: 'New York', coords: [-74.01, 40.71], flag: '🇺🇸' },
  { name: 'Sydney', coords: [151.21, -33.87], flag: '🇦🇺' },
]

const STATS = [
  { value: '197', label: 'Countries supported' },
  { value: '6', label: 'Continents to explore' },
  { value: '∞', label: 'Adventures ahead' },
]

export function LandingMap() {
  return (
    <section className="bg-slate-50 py-20 px-6 border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">World Map</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Your world, beautifully mapped
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Track visited countries, plan upcoming trips, visualize your journey across the globe.
          </p>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-[#EFF6FF] shadow-sm relative">
          <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              Visited (demo)
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-200" />
              Planned (demo)
            </div>
          </div>

          <ComposableMap
            projectionConfig={{ scale: 140, center: [15, 10] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const code = geo.properties.ISO_A3
                  const isVisited = VISITED.has(code)
                  const isPlanned = PLANNED.has(code)
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isVisited ? '#7c3aed' : isPlanned ? '#ddd6fe' : '#e2e8f0'}
                      stroke="#fff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: isVisited ? '#6d28d9' : isPlanned ? '#c4b5fd' : '#cbd5e1' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {MARKERS.map(({ name, coords, flag }) => (
              <Marker key={name} coordinates={coords}>
                <text textAnchor="middle" fontSize={14} style={{ userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
                  {flag}
                </text>
              </Marker>
            ))}
          </ComposableMap>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-violet-600">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
