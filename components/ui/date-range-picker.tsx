'use client'

import { useState, useEffect } from 'react'
import type { DateRange } from 'react-day-picker'
import { format, differenceInCalendarDays, parseISO, isValid } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRangePickerProps {
  startDate: string | null
  endDate: string | null
  onChange: (start: string | null, end: string | null) => void
  placeholder?: string
  /** Fixed month count. Defaults to 2 on desktop (≥640 px), 1 on mobile. */
  numberOfMonths?: number
  className?: string
}

function safeParse(s: string | null | undefined): Date | undefined {
  if (!s) return undefined
  const d = parseISO(s)
  return isValid(d) ? d : undefined
}

function toISO(d: Date | undefined): string | null {
  return d ? format(d, 'yyyy-MM-dd') : null
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = 'Select dates',
  numberOfMonths,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>({
    from: safeParse(startDate),
    to: safeParse(endDate),
  })
  const [isMobile, setIsMobile] = useState(false)

  // Sync draft when committed values change externally (e.g. parent clears dates)
  useEffect(() => {
    setDraft({ from: safeParse(startDate), to: safeParse(endDate) })
  }, [startDate, endDate])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches)
    update(mq)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const months = numberOfMonths ?? (isMobile ? 1 : 2)

  function handleToggle() {
    if (open) {
      // Discard uncommitted changes
      setDraft({ from: safeParse(startDate), to: safeParse(endDate) })
    }
    setOpen(v => !v)
  }

  function handleConfirm() {
    onChange(toISO(draft?.from), toISO(draft?.to))
    setOpen(false)
  }

  function handleClear() {
    setDraft(undefined)
    onChange(null, null)
    setOpen(false)
  }

  const nights =
    draft?.from && draft?.to
      ? differenceInCalendarDays(draft.to, draft.from)
      : null

  // Trigger label is derived from committed (saved) values
  const from = safeParse(startDate)
  const to = safeParse(endDate)
  const triggerLabel = from
    ? to
      ? `${format(from, 'MMM d')} → ${format(to, 'MMM d, yyyy')}`
      : `From ${format(from, 'MMM d, yyyy')}`
    : null

  const hasValue = !!(startDate || endDate)

  // Hint text shown in the calendar footer
  const hint = (() => {
    if (nights !== null && nights > 0) return `${nights} night${nights !== 1 ? 's' : ''}`
    if (nights === 0) return 'Same day'
    if (draft?.from && !draft?.to) return 'Now pick your return date'
    return 'Click a departure date to start'
  })()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarProps: any = {
    mode: 'range',
    selected: draft,
    onSelect: (range: DateRange | undefined) => setDraft(range),
    numberOfMonths: months,
    defaultMonth: draft?.from ?? new Date(),
    showOutsideDays: false,
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm',
          'transition-colors hover:bg-muted/50',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !triggerLabel && 'text-muted-foreground',
          open && 'border-ring ring-1 ring-ring',
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left truncate">
          {triggerLabel ?? placeholder}
        </span>
        {hasValue && (
          <span
            role="button"
            tabIndex={-1}
            onClick={e => { e.stopPropagation(); handleClear() }}
            className="rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Clear dates"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Inline calendar panel — expands in DOM flow, no z-index/overflow issues */}
      {open && (
        <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <div className="flex justify-center overflow-x-auto">
            <Calendar {...calendarProps} />
          </div>

          {/* Footer: hint + actions */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/50 bg-muted/10">
            <p className={cn(
              'text-sm',
              nights !== null && nights >= 0
                ? 'text-foreground font-medium'
                : 'text-muted-foreground',
            )}>
              {hint}
            </p>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={!draft?.from}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
