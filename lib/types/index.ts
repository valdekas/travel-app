export type TripStatus = 'planning' | 'upcoming' | 'active' | 'completed' | 'cancelled'
export type LocationType = 'region' | 'city' | 'attraction' | 'restaurant' | 'beach' | 'viewpoint' | 'hotel' | 'activity' | 'transport' | 'other'
export type ChecklistCategory = 'documents' | 'packing' | 'custom'
export type BudgetCategory = 'flights' | 'hotels' | 'food' | 'activities' | 'transport' | 'shopping' | 'other'
export type ItineraryItemType =
  | 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'beach' | 'viewpoint'
  | 'transport' | 'car_rental' | 'tour' | 'shopping' | 'activity' | 'event' | 'rest' | 'other'
  | 'checkin' | 'checkout' | 'meal' // kept for backward compat with existing rows
export type Mood = 'amazing' | 'great' | 'good' | 'okay' | 'bad'
export type PlaceType = 'attraction' | 'restaurant' | 'beach' | 'viewpoint' | 'hotel' | 'activity' | 'city' | 'region' | 'other'

export interface Trip {
  id: string
  user_id: string
  name: string
  country: string
  country_code?: string
  city?: string
  region?: string
  lat?: number
  lng?: number
  start_date?: string
  end_date?: string
  budget: number
  currency: string
  notes?: string
  cover_photo?: string
  place_id?: string
  status: TripStatus
  is_planning: boolean
  created_at: string
  updated_at: string
  // computed fields
  days_until?: number
  duration_days?: number
  locations?: Location[]
  checklist_items?: ChecklistItem[]
  budget_items?: BudgetItem[]
}

export interface Location {
  id: string
  trip_id: string
  parent_id?: string
  name: string
  type: LocationType
  category?: string
  description?: string
  notes?: string
  estimated_visit_time?: number
  estimated_cost: number
  visited: boolean
  google_maps_link?: string
  lat?: number
  lng?: number
  address?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  trip_id: string
  category: ChecklistCategory
  title: string
  completed: boolean
  due_date?: string
  notes?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ItineraryDay {
  id: string
  trip_id: string
  date: string
  day_number?: number
  title?: string
  notes?: string
  is_completed: boolean
  created_at: string
  items?: ItineraryItem[]
}

export interface ItineraryItem {
  id: string
  day_id: string
  trip_id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  location_id?: string
  type: ItineraryItemType
  cost: number
  confirmation_number?: string
  notes?: string
  order_index: number
  // Google Places location fields (from migration 005)
  location_name?: string
  formatted_address?: string
  city?: string
  region?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  google_place_id?: string
  google_maps_url?: string
  created_at: string
  updated_at: string
  location?: Location
}

export interface BudgetItem {
  id: string
  trip_id: string
  category: BudgetCategory
  title: string
  planned_amount: number
  actual_amount: number
  currency: string
  date?: string
  notes?: string
  paid: boolean
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  trip_id: string
  user_id: string
  date?: string
  time?: string | null
  title?: string
  content?: string
  photos: string[]
  mood?: Mood
  weather?: string
  location_id?: string | null
  linked_to_trip?: boolean
  is_favorite?: boolean
  created_at: string
  updated_at: string
  location?: Location
}

export interface WishlistItem {
  id: string
  user_id: string
  country: string
  country_code?: string
  region?: string
  city?: string
  place_name: string
  place_type: PlaceType
  description?: string
  notes?: string
  google_maps_link?: string
  lat?: number
  lng?: number
  estimated_cost?: number
  converted_to_trip_id?: string
  created_at: string
  updated_at: string
}

export interface VisitedCountry {
  id: string
  user_id: string
  country_code: string
  country_name: string
  continent: string
  region?: string
  visit_count: number
  first_visit_date?: string
  last_visit_date?: string
  notes?: string
  favorite_city?: string
  created_at: string
  updated_at: string
}

export interface VisitedRegion {
  id: string
  user_id: string
  country_code: string
  country_name: string
  region_code: string
  region_name: string
  region_type: string
  first_visit_date?: string
  last_visit_date?: string
  visit_count: number
  notes?: string
  favorite_city?: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_trips: number
  countries_visited: number
  upcoming_trips: Trip[]
  next_trip?: Trip
  days_until_next_trip?: number
  total_places_saved: number
  total_places_visited: number
  wishlist_count: number
}

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'CA$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'Fr' },
  { value: 'PLN', label: 'PLN - Polish Zloty', symbol: 'zł' },
  { value: 'CZK', label: 'CZK - Czech Koruna', symbol: 'Kč' },
  { value: 'HUF', label: 'HUF - Hungarian Forint', symbol: 'Ft' },
]

export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, string> = {
  flights: '#6366f1',
  hotels: '#8b5cf6',
  food: '#f59e0b',
  activities: '#10b981',
  transport: '#3b82f6',
  shopping: '#ec4899',
  other: '#6b7280',
}

export const BUDGET_CATEGORY_ICONS: Record<BudgetCategory, string> = {
  flights: '✈️',
  hotels: '🏨',
  food: '🍽️',
  activities: '🎭',
  transport: '🚗',
  shopping: '🛍️',
  other: '📦',
}

export const LOCATION_TYPE_ICONS: Record<LocationType, string> = {
  region: '🗺️',
  city: '🏙️',
  attraction: '🏛️',
  restaurant: '🍽️',
  beach: '🏖️',
  viewpoint: '👁️',
  hotel: '🏨',
  activity: '🎯',
  transport: '🚗',
  other: '📍',
}

export const ITINERARY_TYPE_ICONS: Record<ItineraryItemType, string> = {
  flight:      '✈️',
  hotel:       '🏨',
  restaurant:  '🍽️',
  attraction:  '🎯',
  beach:       '🏖️',
  viewpoint:   '🏔️',
  transport:   '🚗',
  car_rental:  '🚙',
  tour:        '🗺️',
  shopping:    '🛍️',
  activity:    '⚡',
  event:       '🎪',
  rest:        '😴',
  other:       '📌',
  // legacy
  checkin:     '🏨',
  checkout:    '🏁',
  meal:        '🍽️',
}

export interface UserSettings {
  id: string
  user_id: string
  trip_reminders: boolean
  checklist_reminders: boolean
  budget_alerts: boolean
  journal_reminders: boolean
  email_notifications: boolean
  push_notifications: boolean
  theme: string
  accent_color: string
  compact_mode: boolean
  animations_enabled: boolean
  language: string
  timezone: string
  currency: string
  private_account: boolean
  hide_profile: boolean
  created_at: string
  updated_at: string
}

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  trip_reminders: true,
  checklist_reminders: true,
  budget_alerts: true,
  journal_reminders: false,
  email_notifications: true,
  push_notifications: false,
  theme: 'system',
  accent_color: 'indigo',
  compact_mode: false,
  animations_enabled: true,
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
  private_account: false,
  hide_profile: false,
}

export interface TripSuggestion {
  id: string
  trip_id: string
  user_id: string
  category: string
  name: string
  description?: string
  why_visit?: string
  price_range?: string
  best_time_to_visit?: string
  must_try?: string
  tip?: string
  emoji?: string
  added_to_places: boolean
  added_to_itinerary: boolean
  created_at: string
  // TripAdvisor enrichment fields (nullable — older suggestions may not have these)
  ta_location_id?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  rating?: number | null
  reviews_count?: number | null
  photo_url?: string | null
  google_maps_url?: string | null
  website?: string | null
  phone?: string | null
  hours?: string | null
  price_level?: string | null
}

export const SUGGESTION_CATEGORIES = [
  { key: 'Restaurants',    emoji: '🍽️', label: 'Restaurants'   },
  { key: 'Attractions',    emoji: '🏛️', label: 'Attractions'   },
  { key: 'Viewpoints',     emoji: '🌅', label: 'Viewpoints'    },
  { key: 'Museums',        emoji: '🎨', label: 'Museums'       },
  { key: 'Bars',           emoji: '🍸', label: 'Bars'          },
  { key: 'Parks & Nature', emoji: '🌿', label: 'Parks & Nature'},
] as const

export const MOOD_EMOJIS: Record<Mood, string> = {
  amazing: '😊',
  great: '😍',
  good: '😌',
  okay: '😐',
  bad: '😴',
}

export const MOOD_LABELS: Record<Mood, string> = {
  amazing: 'Amazing',
  great: 'Loved it',
  good:  'Relaxing',
  okay:  'Okay',
  bad:   'Tiring',
}
