'use client'

import { useState, useEffect } from 'react'
import { GripVertical, X } from 'lucide-react'

const HINT_KEY = 'dnd_reorder_hint_v1'

/**
 * One-time mobile hint that teaches users about drag-to-reorder.
 * Uses localStorage so it shows only once across the whole app.
 * Invisible on desktop (md+) since hover already reveals handles there.
 */
export function DragHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Only show on touch / narrow screens
    if (!window.matchMedia('(max-width: 767px)').matches) return
    if (localStorage.getItem(HINT_KEY)) return

    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      localStorage.setItem(HINT_KEY, '1')
    }, 4500)

    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(HINT_KEY, '1')
  }

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="md:hidden flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/90 border border-border/60 text-xs text-muted-foreground mb-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
      <span className="flex-1">Hold the drag handle to reorder items</span>
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-1 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="Dismiss hint"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
