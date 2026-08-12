import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignored
          }
        },
      },
    }
  )
}

// For API routes only: accepts either the browser's session cookie or a
// mobile/native client's `Authorization: Bearer <access_token>` header.
// When a bearer token is used, it's attached to the returned client's
// request headers so downstream `.from()`/`.storage` calls carry it too —
// verifying the token alone isn't enough, RLS (`auth.uid()`) needs it on
// every request the client makes, not just the identity check.
export async function createApiClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (token) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return { supabase, user }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}
