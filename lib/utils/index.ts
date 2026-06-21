import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO, isValid, startOfDay, isAfter, isBefore } from 'date-fns'

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

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

/**
 * Derives the real trip status from dates, overriding the stored DB value for
 * date-determinable states.  "cancelled" is always manual and never overridden.
 * Without a start_date the stored status is returned as-is.
 *
 * Rules (all comparisons at day granularity, local time):
 *   start_date > today          → 'upcoming'
 *   start_date ≤ today
 *     AND (end_date ≥ today OR no end_date)  → 'active'
 *   end_date < today            → 'completed'
 */
export function getEffectiveStatus(
  trip: { status: string; start_date?: string | null; end_date?: string | null },
): string {
  if (trip.status === 'cancelled') return 'cancelled'
  if (!trip.start_date) return trip.status

  const today = startOfDay(new Date())
  const startDay = startOfDay(parseISO(trip.start_date))
  const endDay = trip.end_date ? startOfDay(parseISO(trip.end_date)) : null

  if (isAfter(startDay, today)) return 'upcoming'
  if (endDay && isBefore(endDay, today)) return 'completed'
  return 'active'
}

const CITY_IMAGES: Record<string, string> = {
  /* United States */
  chicago:          'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1200&q=80',
  'new york':       'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  'new york city':  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  nyc:              'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  manhattan:        'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  'los angeles':    'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1200&q=80',
  miami:            'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80',
  'las vegas':      'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1200&q=80',
  'san francisco':  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
  /* Spain */
  barcelona:        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
  madrid:           'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=1200&q=80',
  valencia:         'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&q=80',
  /* Italy */
  rome:             'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
  naples:           'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1200&q=80',
  positano:         'https://images.unsplash.com/photo-1571408834042-7de78f9eb7c9?w=1200&q=80',
  amalfi:           'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=1200&q=80',
  /* France */
  paris:            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  /* United Kingdom */
  london:           'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  /* Ireland */
  dublin:           'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=1200&q=80',
  /* Japan */
  tokyo:            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  kyoto:            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  osaka:            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  /* Indonesia */
  bali:             'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  /* Switzerland */
  zurich:           'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80',
  geneva:           'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80',
  /* Iceland */
  reykjavik:        'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1200&q=80',
  /* Other popular destinations */
  amsterdam:        'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&q=80',
  prague:           'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80',
  budapest:         'https://images.unsplash.com/photo-1565019011521-b1e0e4f2a3cd?w=1200&q=80',
  vienna:           'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80',
  berlin:           'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80',
  lisbon:           'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80',
  dubai:            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  singapore:        'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
  bangkok:          'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
  sydney:           'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
  istanbul:         'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
  marrakech:        'https://images.unsplash.com/photo-1539020140153-e479b8791e6d?w=1200&q=80',
  cairo:            'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&q=80',
}

const COUNTRY_IMAGES: Record<string, string> = {
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  italy: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80',
  france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  switzerland: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  iceland: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  indonesia: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  greece: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
  spain: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
  'united states': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  usa: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  portugal: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80',
  morocco: 'https://images.unsplash.com/photo-1539020140153-e479b8791e6d?w=1200&q=80',
  peru: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80',
  'new zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=80',
  australia: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
  brazil: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&q=80',
  mexico: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80',
  turkey: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
  india: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80',
  norway: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200&q=80',
  croatia: 'https://images.unsplash.com/photo-1555990538-1ebdd5e2bfe3?w=1200&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
  vietnam: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
  canada: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
  'south korea': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=80',
  egypt: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&q=80',
  nepal: 'https://images.unsplash.com/photo-1461958508236-9a742665a0d5?w=1200&q=80',
  ireland: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=1200&q=80',
  scotland: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
  'united kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  germany: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80',
  austria: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80',
  netherlands: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&q=80',
  sweden: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200&q=80',
  'czech republic': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80',
  hungary: 'https://images.unsplash.com/photo-1565019011521-b1e0e4f2a3cd?w=1200&q=80',
  china: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
  'united arab emirates': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80'

export function getDestinationImage(trip: {
  cover_photo?: string
  country?: string
  name?: string
  city?: string
}): string {
  if (trip.cover_photo) return trip.cover_photo

  // Check explicit city field
  if (trip.city) {
    const cityKey = trip.city.toLowerCase().trim()
    if (CITY_IMAGES[cityKey]) return CITY_IMAGES[cityKey]
  }

  // Check trip name for city keywords (longest key first to avoid 'la' matching 'las vegas')
  if (trip.name) {
    const nameLower = trip.name.toLowerCase()
    const sortedKeys = Object.keys(CITY_IMAGES).sort((a, b) => b.length - a.length)
    for (const key of sortedKeys) {
      if (nameLower.includes(key)) return CITY_IMAGES[key]
    }
  }

  // Fall back to country
  const countryKey = (trip.country ?? '').toLowerCase().trim()
  return COUNTRY_IMAGES[countryKey] ?? FALLBACK_IMAGE
}

/** Returns the best available static image URL for a city/country string without a full trip object */
export function getCityOrCountryImage(query: string): string {
  const q = query.toLowerCase().trim()
  return CITY_IMAGES[q] ?? COUNTRY_IMAGES[q] ?? FALLBACK_IMAGE
}

export function generateGoogleMapsLink(lat: number, lng: number, name?: string): string {
  if (name) {
    return `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},15z`
  }
  return `https://www.google.com/maps?q=${lat},${lng}`
}


