import { NextResponse } from 'next/server'

// This endpoint is retired. Google Places photo URLs return 403 when fetched
// server-side (they are browser-session-scoped). Hero image download + upload
// now runs client-side in create-trip-form.tsx via downloadAndUploadHeroImage().
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is retired. Hero image storage now runs client-side.' },
    { status: 410 },
  )
}
