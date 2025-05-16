import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Log an error, but don't throw at the module level.
  // This allows the module to be imported. The Supabase client will likely be non-functional
  // if env vars are truly missing, and this should be handled by components using the client.
  console.error(
    'CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Supabase client in src/lib/supabase.ts will not function correctly.'
  )
  // Note: createBrowserClient expects string arguments. Passing potentially undefined values
  // might still lead to issues. It's better to ensure they are present or handle the
  // non-functional client gracefully in the UI.
}

// Create a Supabase client that uses cookies for auth in the browser
export const supabase = createBrowserClient(
  // If supabaseUrl or supabaseAnonKey are undefined here due to missing env vars,
  // createBrowserClient will receive undefined. It's typed to accept string.
  // Passing empty strings as a fallback if they are undefined.
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
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
        'x-client-info': 'fitness-tracker-v2'
      },
    }
  }
) 