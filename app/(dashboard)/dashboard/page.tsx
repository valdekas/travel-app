import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { redirect } from 'next/navigation'
import type { RecentActivityItem } from '@/components/dashboard/recent-activity-widget'
import { getEffectiveStatus } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const tripIds = (await supabase.from('trips').select('id').eq('user_id', user.id)).data?.map(t => t.id) ?? []
  const safeIds = tripIds.length ? tripIds : ['']

  /* ── Phase 1: parallel fetch of core data + recent activity ── */
  const [
    { data: trips },
    { data: wishlistItems },
    { data: allLocations },
    { data: visitedCountries },
    { data: visitedRegions },
    { data: recentLocs },
    { data: recentItin },
    { data: recentCheck },
    { data: recentBudg },
    { data: recentJourn },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('wishlist_items').select('id').eq('user_id', user.id),
    supabase.from('locations').select('id, visited, trip_id').in('trip_id', safeIds),
    supabase.from('visited_countries').select('country_code, continent').eq('user_id', user.id),
    supabase.from('visited_regions').select('country_code, region_name').eq('user_id', user.id),
    supabase.from('locations').select('id, name, trip_id, created_at').in('trip_id', safeIds).order('created_at', { ascending: false }).limit(3),
    supabase.from('itinerary_items').select('id, title, trip_id, created_at').in('trip_id', safeIds).order('created_at', { ascending: false }).limit(3),
    supabase.from('checklist_items').select('id, title, trip_id, created_at').in('trip_id', safeIds).order('created_at', { ascending: false }).limit(3),
    supabase.from('budget_items').select('id, title, trip_id, created_at').in('trip_id', safeIds).order('created_at', { ascending: false }).limit(3),
    supabase.from('journal_entries').select('id, title, trip_id, created_at').in('trip_id', safeIds).order('created_at', { ascending: false }).limit(3),
  ])

  /* ── Determine next trip ── */
  const now = new Date()
  const sortedTrips = trips ?? []

  const upcomingTrips = sortedTrips
    .filter(t => getEffectiveStatus(t) === 'upcoming')
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
  const activeTrips = sortedTrips.filter(t => getEffectiveStatus(t) === 'active')
  const nextTrip = upcomingTrips[0] ?? activeTrips[0] ?? null

  /* ── Phase 2: next-trip-specific data ── */
  let nextTripChecklist = { total: 0, completed: 0 }
  let nextTripBudget = { planned: 0, actual: 0 }
  let nextTripItineraryDays = 0

  if (nextTrip) {
    const [
      { data: clItems },
      { data: bdgItems },
      { data: itinDays },
    ] = await Promise.all([
      supabase.from('checklist_items').select('id, completed').eq('trip_id', nextTrip.id),
      supabase.from('budget_items').select('planned_amount, actual_amount').eq('trip_id', nextTrip.id),
      supabase.from('itinerary_days').select('id').eq('trip_id', nextTrip.id),
    ])

    nextTripChecklist = {
      total: clItems?.length ?? 0,
      completed: clItems?.filter(i => i.completed).length ?? 0,
    }
    nextTripBudget = {
      planned: bdgItems?.reduce((s, i) => s + (i.planned_amount ?? 0), 0) ?? 0,
      actual: bdgItems?.reduce((s, i) => s + (i.actual_amount ?? 0), 0) ?? 0,
    }
    nextTripItineraryDays = itinDays?.length ?? 0
  }

  /* ── Build trip name map ── */
  const tripNameMap: Record<string, string> = {}
  for (const t of sortedTrips) tripNameMap[t.id] = t.name

  /* ── Merge & sort recent activity (newest first, max 5) ── */
  const recentActivity: RecentActivityItem[] = [
    ...(recentLocs ?? []).map(r => ({
      id: r.id, type: 'place' as const,
      title: (r.name as string) ?? 'Place',
      trip_id: r.trip_id as string,
      trip_name: tripNameMap[r.trip_id as string],
      created_at: r.created_at as string,
    })),
    ...(recentItin ?? []).map(r => ({
      id: r.id, type: 'itinerary' as const,
      title: (r.title as string) ?? 'Activity',
      trip_id: r.trip_id as string,
      trip_name: tripNameMap[r.trip_id as string],
      created_at: r.created_at as string,
    })),
    ...(recentCheck ?? []).map(r => ({
      id: r.id, type: 'checklist' as const,
      title: (r.title as string) ?? 'Checklist item',
      trip_id: r.trip_id as string,
      trip_name: tripNameMap[r.trip_id as string],
      created_at: r.created_at as string,
    })),
    ...(recentBudg ?? []).map(r => ({
      id: r.id, type: 'budget' as const,
      title: (r.title as string) ?? 'Expense',
      trip_id: r.trip_id as string,
      trip_name: tripNameMap[r.trip_id as string],
      created_at: r.created_at as string,
    })),
    ...(recentJourn ?? []).map(r => ({
      id: r.id, type: 'journal' as const,
      title: (r.title as string) || 'Journal entry',
      trip_id: r.trip_id as string,
      trip_name: tripNameMap[r.trip_id as string],
      created_at: r.created_at as string,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  /* ── Build partial-visit map ── */
  const fullyCodes = new Set((visitedCountries ?? []).map(v => v.country_code))
  const regionsByCountry: Record<string, string[]> = {}
  for (const r of visitedRegions ?? []) {
    if (!regionsByCountry[r.country_code]) regionsByCountry[r.country_code] = []
    regionsByCountry[r.country_code].push(r.region_name)
  }

  const partiallyVisitedRegions: Record<string, string[]> = {}
  for (const [code, names] of Object.entries(regionsByCountry)) {
    if (!fullyCodes.has(code)) partiallyVisitedRegions[code] = names
  }

  return (
    <DashboardContent
      trips={sortedTrips}
      wishlistCount={wishlistItems?.length ?? 0}
      allLocations={allLocations ?? []}
      visitedCountryCodes={(visitedCountries ?? []).map(v => v.country_code)}
      visitedContinents={[...new Set((visitedCountries ?? []).map(v => v.continent))]}
      partiallyVisitedRegions={partiallyVisitedRegions}
      visitedRegionsTotal={(visitedRegions ?? []).length}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Traveler'}
      nextTripChecklist={nextTripChecklist}
      nextTripBudget={nextTripBudget}
      nextTripItineraryDays={nextTripItineraryDays}
      recentActivity={recentActivity}
    />
  )
}
