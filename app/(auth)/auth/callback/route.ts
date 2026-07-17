import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MOBILE_SCHEME = 'travelappmobile://'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  // NEXT_PUBLIC_SITE_URL is authoritative in production.
  // Falling back to `origin` (derived from request.url) handles local dev but
  // can resolve to http://localhost:3001 when behind Nginx, producing an
  // unreachable redirect. The env var prevents that.
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin

  // Supabase redirects here with error params when OAuth state validation fails.
  const error = searchParams.get('error')
  if (error) {
    const desc     = searchParams.get('error_description') ?? error
    const loginUrl = new URL(`${base}/auth/login`)
    loginUrl.searchParams.set('oauth_error', desc)
    return NextResponse.redirect(loginUrl.toString())
  }

  const code    = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Allow deep-link redirects only for our own mobile scheme (prevents open-redirect).
  // For everything else, enforce relative paths.
  const isMobileCallback = rawNext.startsWith(MOBILE_SCHEME)
  const safeNext = isMobileCallback || rawNext.startsWith('/')
    ? rawNext
    : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      // Mobile deep-link: redirect to custom scheme so the OS hands control
      // back to the native app with the session already established.
      if (isMobileCallback) {
        return NextResponse.redirect(safeNext)
      }
      return NextResponse.redirect(`${base}${safeNext}`)
    }
    // Exchange failed — send user back to login with a readable error.
    const loginUrl = new URL(`${base}/auth/login`)
    loginUrl.searchParams.set('oauth_error', exchangeError.message)
    return NextResponse.redirect(loginUrl.toString())
  }

  // No code and no error — shouldn't happen in normal flow.
  return NextResponse.redirect(`${base}/auth/login`)
}
