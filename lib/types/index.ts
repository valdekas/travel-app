export type TripStatus = 'planning' | 'upcoming' | 'active' | 'completed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high'
export type LocationType = 'region' | 'city' | 'attraction' | 'restaurant' | 'beach' | 'viewpoint' | 'hotel' | 'activity' | 'transport' | 'other'
export type ChecklistCategory = 'documents' | 'packing' | 'custom'
export type BudgetCategory = 'flights' | 'hotels' | 'food' | 'activities' | 'transport' | 'shopping' | 'other'
export type ItineraryItemType = 'flight' | 'transport' | 'checkin' | 'checkout' | 'meal' | 'activity' | 'tour' | 'event' | 'rest' | 'other'
export type Mood = 'amazing' | 'great' | 'good' | 'okay' | 'bad'
export type PlaceType = 'attraction' | 'restaurant' | 'beach' | 'viewpoint' | 'hotel' | 'activity' | 'city' | 'region' | 'other'

export interface Trip {
  id: string
  user_id: string
  name: string
  country: string
  country_code?: string
  start_date?: string
  end_date?: string
  budget: number
  currency: string
  notes?: string
  cover_photo?: string
  status: TripStatus
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
  priority: Priority
  visited: boolean
  google_maps_link?: string
  lat?: number
  lng?: number
  address?: string
  order_index: number
  created_at: string
  updated_at: string
  children?: Location[]
}

export interface ChecklistItem {
  id: string
  trip_id: string
  category: ChecklistCategory
  title: string
  completed: boolean
  priority: Priority
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
  title?: string
  content?: string
  photos: string[]
  mood?: Mood
  weather?: string
  location_id?: string
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
  priority: Priority
  google_maps_link?: string
  lat?: number
  lng?: number
  estimated_cost?: number
  converted_to_trip_id?: string
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
  flight: '✈️',
  transport: '🚗',
  checkin: '🏨',
  checkout: '🏁',
  meal: '🍽️',
  activity: '🎯',
  tour: '🗺️',
  event: '🎪',
  rest: '😴',
  other: '📌',
}

export const MOOD_EMOJIS: Record<Mood, string> = {
  amazing: '🤩',
  great: '😄',
  good: '😊',
  okay: '😐',
  bad: '😞',
}
