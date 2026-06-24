import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { downloadAndStoreHeroImage, isGooglePhotoUrl } from '@/lib/utils/trip-hero-image'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { googleImageUrl, tripId } = await req.json() as { googleImageUrl?: string; tripId?: string }

    if (!googleImageUrl || !tripId) {
      return NextResponse.json({ error: 'Missing googleImageUrl or tripId' }, { status: 400 })
    }

    if (!isGooglePhotoUrl(googleImageUrl)) {
      return NextResponse.json({ error: 'Not a Google photo URL' }, { status: 400 })
    }

    const permanentUrl = await downloadAndStoreHeroImage(supabase, googleImageUrl, user.id, tripId)
    if (!permanentUrl) {
      return NextResponse.json({ error: 'Failed to download or store image' }, { status: 500 })
    }

    // Update the trip — only the owner's trip (RLS enforced, user_id guard is belt-and-suspenders)
    const { error } = await supabase
      .from('trips')
      .update({ cover_photo: permanentUrl })
      .eq('id', tripId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })

    return NextResponse.json({ permanentUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
