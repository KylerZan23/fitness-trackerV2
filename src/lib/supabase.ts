import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'fitness-tracker-auth',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') {
            return null
          }
          try {
            const value = window.localStorage.getItem(key)
            console.log(`Auth storage: Retrieved key ${key}, value exists: ${!!value}`)
            return value
          } catch (error) {
            console.error(`Error retrieving auth item from localStorage:`, error)
            return null
          }
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') {
            return
          }
          try {
            console.log(`Auth storage: Setting key ${key}`)
            window.localStorage.setItem(key, value)
          } catch (error) {
            console.error(`Error setting auth item in localStorage:`, error)
          }
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') {
            return
          }
          try {
            console.log(`Auth storage: Removing key ${key}`)
            window.localStorage.removeItem(key)
          } catch (error) {
            console.error(`Error removing auth item from localStorage:`, error)
          }
        },
      },
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV !== 'production',
    },
    global: {
      headers: {
        'x-client-info': 'fitness-tracker-v2'
      },
    }
  }
) 