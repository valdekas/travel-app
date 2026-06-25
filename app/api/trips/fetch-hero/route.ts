import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function fetchGooglePlacesHero(placeId: string): Promise<Buffer | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null

  try {
    // Step 1: get photo_reference from Places Details API
    const detailsUrl =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${key}`
    const detailsRes = await fetch(detailsUrl)
    if (!detailsRes.ok) return null
    const details = await detailsRes.json()
    const photoRef: string | undefined = details?.result?.photos?.[0]?.photo_reference
    if (!photoRef) return null

    // Step 2: download the actual photo (Google redirects to the image)
    const photoUrl =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=1200&photo_reference=${encodeURIComponent(photoRef)}&key=${key}`
    const photoRes = await fetch(photoUrl, { redirect: 'follow' })
    if (!photoRes.ok) return null
    const buf = Buffer.from(await photoRes.arrayBuffer())
    if (buf.length === 0) return null
    return buf
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { tripId, placeId } = await req.json() as {
    tripId?: string; placeId?: string; city?: string; country?: string
  }
  if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 })

  // Verify ownership
  const { data: trip } = await supabase
    .from('trips').select('id').eq('id', tripId).eq('user_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  if (!placeId) return NextResponse.json({ success: false, error: 'No place_id provided' })

  // Google Places photo → Supabase Storage
  const imageBuffer = await fetchGooglePlacesHero(placeId)
  if (!imageBuffer) return NextResponse.json({ success: false, error: 'Google Places photo not available' })

  const path = `${user.id}/${tripId}/hero.jpg`
  const { error: uploadErr } = await supabase.storage
    .from('trip-heroes')
    .upload(path, imageBuffer, { contentType: 'image/jpeg', upsert: true })

  if (uploadErr) return NextResponse.json({ success: false, error: 'Storage upload failed' })

  const { data: { publicUrl } } = supabase.storage.from('trip-heroes').getPublicUrl(path)
  await supabase.from('trips').update({ cover_photo: publicUrl }).eq('id', tripId).eq('user_id', user.id)
  return NextResponse.json({ success: true, source: 'google', url: publicUrl })
}
