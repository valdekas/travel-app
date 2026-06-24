'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PlaceDetails {
  name: string
  address: string
  lat: number | null
  lng: number | null
  country: string
  countryCode: string
  city: string
  region: string
  googleMapsLink: string
  placeId: string
  photoUrl: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: PlaceDetails) => void
  placeholder?: string
  className?: string
  locationBias?: { lat: number; lng: number; radiusMeters?: number }
}

// Module-level singleton so the script is only injected once
let mapsLoadPromise: Promise<void> | null = null

function ensureGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  // Already loaded
  if ((window as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places) {
    return Promise.resolve()
  }
  if (mapsLoadPromise) return mapsLoadPromise

  mapsLoadPromise = new Promise((resolve, reject) => {
    const cbName = '__gmpscb' + Date.now()
    ;(window as unknown as Record<string, unknown>)[cbName] = () => {
      delete (window as unknown as Record<string, unknown>)[cbName]
      resolve()
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${cbName}`
    script.async = true
    script.defer = true
    script.onerror = (e) => {
      mapsLoadPromise = null
      reject(e)
    }
    document.head.appendChild(script)
  })

  return mapsLoadPromise
}

function extractPlace(place: google.maps.places.PlaceResult): PlaceDetails {
  const ac = place.address_components ?? []
  const get = (type: string, nameType: 'long_name' | 'short_name' = 'long_name') =>
    ac.find(c => c.types.includes(type))?.[nameType] ?? ''

  return {
    name: place.name ?? '',
    address: place.formatted_address ?? '',
    lat: place.geometry?.location?.lat() ?? null,
    lng: place.geometry?.location?.lng() ?? null,
    country: get('country'),
    countryCode: get('country', 'short_name'),
    city: get('locality') || get('administrative_area_level_2') || get('sublocality_level_1'),
    region: get('administrative_area_level_1'),
    googleMapsLink: place.url ?? '',
    placeId: place.place_id ?? '',
    photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 1200, maxHeight: 800 }) ?? '',
  }
}

export function PlacesAutocomplete({ value, onChange, onPlaceSelect, placeholder, className, locationBias }: Props) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [mapsReady, setMapsReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesRef = useRef<google.maps.places.PlacesService | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureGoogleMaps()
      .then(() => {
        setMapsReady(true)
        serviceRef.current = new google.maps.places.AutocompleteService()
        const div = document.createElement('div')
        placesRef.current = new google.maps.places.PlacesService(div)
      })
      .catch(() => {
        // Maps failed to load — degrade silently, input remains usable as plain text
      })
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setPredictions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchPredictions = useCallback((input: string) => {
    if (!serviceRef.current || input.length < 2) {
      setPredictions([])
      setOpen(false)
      return
    }
    setLoading(true)
    const request: google.maps.places.AutocompletionRequest = { input }
    if (locationBias?.lat != null && locationBias?.lng != null) {
      request.location = new google.maps.LatLng(locationBias.lat, locationBias.lng)
      request.radius = locationBias.radiusMeters ?? 50000
    }
    serviceRef.current.getPlacePredictions(request, (preds, status) => {
      setLoading(false)
      if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
        setPredictions(preds)
        setOpen(true)
        setActiveIndex(-1)
      } else {
        setPredictions([])
        setOpen(false)
      }
    })
  }, [locationBias?.lat, locationBias?.lng, locationBias?.radiusMeters])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300)
  }, [onChange, fetchPredictions])

  const selectPrediction = useCallback((pred: google.maps.places.AutocompletePrediction) => {
    if (!placesRef.current) return
    onChange(pred.structured_formatting.main_text)
    setPredictions([])
    setOpen(false)
    placesRef.current.getDetails(
      { placeId: pred.place_id, fields: ['name', 'geometry', 'address_components', 'formatted_address', 'url', 'place_id', 'photos'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(extractPlace(place))
        }
      }
    )
  }, [onChange, onPlaceSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !predictions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, predictions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectPrediction(predictions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setPredictions([])
    }
  }, [open, predictions, activeIndex, selectPrediction])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin pointer-events-none" />
        ) : (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={mapsReady ? placeholder : 'Loading…'}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm',
            'transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            className
          )}
        />
      </div>

      {open && predictions.length > 0 && (
        <div className="absolute z-[200] top-full mt-1.5 left-0 right-0 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          <ul className="py-1 max-h-64 overflow-y-auto">
            {predictions.map((pred, i) => (
              <li
                key={pred.place_id}
                onMouseDown={(e) => { e.preventDefault(); selectPrediction(pred) }}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                  i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
                )}
              >
                <MapPin className="h-4 w-4 text-primary/60 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {pred.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {pred.structured_formatting.secondary_text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20 flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/50">Powered by Google</span>
          </div>
        </div>
      )}
    </div>
  )
}
