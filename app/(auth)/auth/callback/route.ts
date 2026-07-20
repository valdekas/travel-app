import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Recognised mobile deep-link schemes.
// travelappmobile:// → production standalone build
// exp://            → Expo Go during development
function isMobileScheme(next: string): boolean {
  return next.startsWith('travelappmobile://') || next.startsWith('exp://')
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // NEXT_PUBLIC_SITE_URL is authoritative in production.
  // Falling back to `origin` handles local dev but can resolve to
  // http://localhost:3001 when behind Nginx — the env var prevents that.
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin

  const error = searchParams.get('error')
  if (error) {
    const desc     = searchParams.get('error_description') ?? error
    const loginUrl = new URL(`${base}/auth/login`)
    loginUrl.searchParams.set('oauth_error', desc)
    return NextResponse.redirect(loginUrl.toString())
  }

  const code    = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  const isMobileCallback = isMobileScheme(rawNext)

  // MOBILE: do NOT exchange the code server-side — the server doesn't have the
  // PKCE verifier (only the native app does). Pass the code through as-is so
  // the app can complete the exchange itself.
  if (isMobileCallback && code) {
    const mobileUrl    = `${rawNext}?code=${encodeURIComponent(code)}`
    const safeMobileUrl = mobileUrl.replace(/"/g, '&quot;')
    return new Response(
      `<!DOCTYPE html><html><head>` +
      `<meta http-equiv="refresh" content="0;url=${safeMobileUrl}">` +
      `</head><body>` +
      `<script>window.location.href="${safeMobileUrl}"</script>` +
      `<p>Redirecting back to app…</p>` +
      `</body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    )
  }

  // WEB: exchange the code server-side as normal.
  // Only allow relative paths for 'next' to prevent open-redirect.
  const safeNext = rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${base}${safeNext}`)
    }
    const loginUrl = new URL(`${base}/auth/login`)
    loginUrl.searchParams.set('oauth_error', exchangeError.message)
    return NextResponse.redirect(loginUrl.toString())
  }

  // No code and no error — shouldn't happen in normal flow.
  return NextResponse.redirect(`${base}/auth/login`)
}
