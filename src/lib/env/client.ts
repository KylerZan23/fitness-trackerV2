import { ClientEnvironmentSchema, type ClientEnvironment } from './schemas'

// Client-side environment validation and access
let clientEnv: ClientEnvironment | null = null

/**
 * Get validated client-side environment variables
 * Only includes NEXT_PUBLIC_* variables that are safe for the browser
 */
export function getClientEnv(): ClientEnvironment {
  if (!clientEnv) {
    try {
      // Build client environment object from known variables
      const clientSafeEnv = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
        NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL,
      }

      clientEnv = ClientEnvironmentSchema.parse(clientSafeEnv)
    } catch (error) {
      console.error('❌ Client environment validation failed:', error)
      console.log('📊 Available environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasStripeKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      })
      throw new Error('Client environment configuration is invalid. Check console for details.')
    }
  }

  return clientEnv
}

/**
 * Get Supabase configuration for client-side usage
 */
export function getSupabaseConfig() {
  const env = getClientEnv()

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

/**
 * Check if running in development mode (client-side)
 */
export function isClientDevelopment(): boolean {
  const env = getClientEnv()
  return env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode (client-side)
 */
export function isClientProduction(): boolean {
  const env = getClientEnv()
  return env.NODE_ENV === 'production'
}
