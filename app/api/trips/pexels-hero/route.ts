import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPexelsHeroImage } from '@/lib/utils/pexels-hero'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { tripId, city, country } = await req.json() as {
    tripId?: string; city?: string; country?: string
  }
  if (!tripId || !country) {
    return NextResponse.json({ error: 'tripId and country are required' }, { status: 400 })
  }

  // Verify ownership before updating
  const { data: trip } = await supabase
    .from('trips').select('id').eq('id', tripId).eq('user_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const photoUrl = await fetchPexelsHeroImage(city || country, country)
  if (!photoUrl) return NextResponse.json({ error: 'No Pexels photo found' }, { status: 404 })

  const { error } = await supabase
    .from('trips').update({ cover_photo: photoUrl }).eq('id', tripId).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'DB update failed' }, { status: 500 })

  return NextResponse.json({ photoUrl })
}
