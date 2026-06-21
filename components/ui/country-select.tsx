'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES, type Country } from '@/lib/data/countries'
import { FlagImg } from '@/components/ui/flag-img'

interface Props {
  value: string              // ISO alpha-2 code
  onSelect: (country: Country) => void
  placeholder?: string
  className?: string
  clearable?: boolean
}

export function CountrySelect({ value, onSelect, placeholder = 'Select country…', className, clearable }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = COUNTRIES.find(c => c.code === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.continent.toLowerCase().includes(q)
    )
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) {
        onSelect(filtered[activeIndex])
        setOpen(false)
        setQuery('')
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }, [open, filtered, activeIndex, onSelect])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setActiveIndex(0)
  }

  function pick(country: Country) {
    onSelect(country)
    setOpen(false)
    setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect({ code: '', name: '', flag: '', continent: '', region: '' })
  }

  // Group filtered results by continent
  const grouped = useMemo(() => {
    const map = new Map<string, Country[]>()
    filtered.forEach(c => {
      if (!map.has(c.continent)) map.set(c.continent, [])
      map.get(c.continent)!.push(c)
    })
    return map
  }, [filtered])

  // Flat list for keyboard navigation (matches visual order)
  const flat = useMemo(() => {
    const result: Country[] = []
    const continentOrder = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania']
    continentOrder.forEach(cont => {
      if (grouped.has(cont)) result.push(...grouped.get(cont)!)
    })
    // Append any continents not in the ordered list
    grouped.forEach((countries, cont) => {
      if (!continentOrder.includes(cont)) result.push(...countries)
    })
    return result
  }, [grouped])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1',
          'text-sm shadow-sm transition-colors hover:bg-muted/30',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !selected && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <FlagImg code={selected.code} className="w-6 h-[18px]" />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </span>
        <span className="flex items-center gap-1 ml-2 flex-shrink-0">
          {clearable && selected && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={clear}
            />
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[200] top-full mt-1.5 left-0 right-0 rounded-xl border border-border bg-background shadow-xl overflow-hidden flex flex-col max-h-80">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-muted/20 flex-shrink-0">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Search countries…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {query && (
              <button onClick={() => { setQuery(''); setActiveIndex(0) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results */}
          <ul ref={listRef} className="overflow-y-auto py-1 flex-1">
            {flat.length === 0 ? (
              <li className="px-3 py-6 text-sm text-center text-muted-foreground">No countries found</li>
            ) : (
              (() => {
                let flatIdx = -1
                const continentOrder = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania']
                const orderedContinents = [
                  ...continentOrder.filter(c => grouped.has(c)),
                  ...[...grouped.keys()].filter(c => !continentOrder.includes(c)),
                ]

                return orderedContinents.map(continent => {
                  const countries = grouped.get(continent)!
                  return (
                    <li key={continent}>
                      <div className="sticky top-0 px-3 py-1 bg-muted/60 backdrop-blur-sm border-b border-border/30">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                          {continent}
                        </span>
                      </div>
                      <ul>
                        {countries.map(country => {
                          flatIdx++
                          const idx = flatIdx
                          const isActive = idx === activeIndex
                          const isSelected = country.code === value
                          return (
                            <li
                              key={country.code}
                              onMouseDown={(e) => { e.preventDefault(); pick(country) }}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors text-sm',
                                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/40',
                                isSelected && 'font-medium'
                              )}
                            >
                              <FlagImg code={country.code} className="w-6 h-[18px] flex-shrink-0" />
                              <span className="flex-1 truncate">{country.name}</span>
                              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 font-mono">{country.code}</span>
                              {isSelected && <span className="text-primary text-xs flex-shrink-0">✓</span>}
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  )
                })
              })()
            )}
          </ul>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground/50">
              {filtered.length} {filtered.length === 1 ? 'country' : 'countries'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
