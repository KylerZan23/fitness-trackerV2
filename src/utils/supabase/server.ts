import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies as nextCookies } from 'next/headers'

/**
 * Create a Supabase client for use in server components and server actions.
 * Optionally accepts a pre-fetched cookie store.
 */
export async function createClient(cookieStore?: ReadonlyRequestCookies) {
  const store = cookieStore || await nextCookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll().map(({ name, value }: { name: string; value: string }) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options as CookieOptions)
            )
          } catch (error) {
            console.warn('Supabase server client: Failed to set cookies in setAll. Error:', error)
          }
        },
      },
    }
  )
} 