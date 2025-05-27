import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Please check your environment variables configuration. ' +
      'Supabase client cannot be initialized without these required values.'
  )
}

// Create a Supabase client that uses cookies for auth in the browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    // Debug logging in development environment
    debug: process.env.NODE_ENV !== 'production',
  },
  global: {
    headers: {
      'x-client-info': 'fitness-tracker-v2',
    },
  },
})
