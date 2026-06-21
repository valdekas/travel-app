import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitedCountriesContent } from '@/components/visited/visited-countries-content'
import type { VisitedCountry, VisitedRegion } from '@/lib/types'

export default async function VisitedCountriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: countriesData, error: countriesError },
    { data: regionsData,   error: regionsError },
  ] = await Promise.all([
    supabase
      .from('visited_countries')
      .select('*')
      .eq('user_id', user.id)
      .order('country_name'),
    supabase
      .from('visited_regions')
      .select('*')
      .eq('user_id', user.id)
      .order('country_code, region_name'),
  ])

  const visitedCountries: VisitedCountry[] = countriesError ? [] : (countriesData ?? [])
  const visitedRegions:   VisitedRegion[]  = regionsError   ? [] : (regionsData   ?? [])

  /* Both tables might be missing during the migration-pending phase */
  const migrationPending = !!countriesError

  return (
    <VisitedCountriesContent
      userId={user.id}
      initialVisited={visitedCountries}
      initialVisitedRegions={visitedRegions}
      migrationPending={migrationPending}
      regionsMigrationPending={!!regionsError}
    />
  )
}
