'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = '/countries-110m.json'

export function EmptyWorldMap() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 h-56 md:h-72">
      {/* Subtle pulsing glow — CSS only, no JS */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10 animate-pulse"
        style={{ boxShadow: 'inset 0 0 60px rgba(99,102,241,0.07)' }}
      />

      {/* Decorative map — no zoom, no pan, no tooltips */}
      <ComposableMap
        projectionConfig={{ scale: 140, center: [0, 15] }}
        width={800}
        height={380}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                tabIndex={-1}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none', fill: '#1e293b' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {/* Centered overlay text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        <div className="text-center bg-slate-900/75 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-700/40">
          <p className="text-white font-semibold text-base">No adventures yet</p>
          <p className="text-slate-400 text-sm mt-0.5">
            Create your first trip to start building your travel map.
          </p>
        </div>
      </div>

      {/* Bottom pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 text-xs text-slate-400 whitespace-nowrap">
          🌎 197 countries waiting
        </span>
      </div>
    </div>
  )
}
