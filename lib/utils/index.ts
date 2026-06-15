import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, fmt) : '—'
}

export function daysUntil(date: string | undefined): number | null {
  if (!date) return null
  const d = parseISO(date)
  if (!isValid(d)) return null
  return differenceInDays(d, new Date())
}

export function tripDuration(start?: string, end?: string): number | null {
  if (!start || !end) return null
  const s = parseISO(start)
  const e = parseISO(end)
  if (!isValid(s) || !isValid(e)) return null
  return differenceInDays(e, s) + 1
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(c => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function getTripStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    upcoming: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[status] ?? colors.planning
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-green-500',
  }
  return colors[priority] ?? colors.medium
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

export function generateGoogleMapsLink(lat: number, lng: number, name?: string): string {
  if (name) {
    return `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},15z`
  }
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function buildLocationHierarchy<T extends { id: string; parent_id?: string; children?: T[] }>(
  items: T[]
): T[] {
  const map = new Map<string, T>()
  const roots: T[] = []

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  items.forEach(item => {
    const node = map.get(item.id)!
    if (item.parent_id && map.has(item.parent_id)) {
      const parent = map.get(item.parent_id)!
      parent.children = parent.children ?? []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}
