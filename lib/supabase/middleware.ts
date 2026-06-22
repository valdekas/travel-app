import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Redirect raw-IP access to the configured site URL.
  // This prevents OAuth PKCE state cookie domain mismatches: if the user
  // initiates OAuth from the IP, the code_verifier cookie is set on that IP
  // domain and won't be sent when Google redirects back to travel365.live.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    const hostname = request.nextUrl.hostname
    const isRawIP  = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
    if (isRawIP) {
      const site   = new URL(siteUrl)
      const target = new URL(request.nextUrl.toString())
      target.protocol = site.protocol
      target.hostname  = site.hostname
      target.port      = site.port
      return NextResponse.redirect(target.toString(), { status: 301 })
    }
  }

  const pathname        = request.nextUrl.pathname
  const isAuthRoute     = pathname.startsWith('/auth')
  const isCallbackRoute = pathname === '/auth/callback'
  const isPublicRoute   = pathname === '/'

  // Skip session check entirely on the callback route — calling getUser() here
  // causes @supabase/ssr to clear stale auth cookies, wiping the PKCE
  // code_verifier before the route handler can call exchangeCodeForSession.
  if (isCallbackRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
