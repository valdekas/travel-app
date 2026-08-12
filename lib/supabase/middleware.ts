import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  const match = header?.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

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
  const isApiRoute      = pathname.startsWith('/api/')

  // Skip session check entirely on the callback route — calling getUser() here
  // causes @supabase/ssr to clear stale auth cookies, wiping the PKCE
  // code_verifier before the route handler can call exchangeCodeForSession.
  if (isCallbackRoute) {
    return NextResponse.next({ request })
  }

  // Mobile/native clients have no cookie jar and authenticate with a Supabase
  // access token instead. Verify it against the Auth server and let the
  // request through. A missing or invalid token just falls through to the
  // cookie-based check below, unchanged from before.
  const bearerToken = getBearerToken(request)
  if (bearerToken) {
    const bearerSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data: { user: bearerUser } } = await bearerSupabase.auth.getUser(bearerToken)
    if (bearerUser) return NextResponse.next({ request })
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
    if (isApiRoute) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
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
