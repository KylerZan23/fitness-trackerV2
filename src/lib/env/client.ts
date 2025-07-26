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
      // Filter to only include client-safe environment variables
      const clientSafeEnv = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => key.startsWith('NEXT_PUBLIC_') || key === 'NODE_ENV'
        )
      )

      clientEnv = ClientEnvironmentSchema.parse(clientSafeEnv)
    } catch (error) {
      console.error('❌ Client environment validation failed:', error)
      throw new Error('Client environment configuration is invalid')
    }
  }

  return clientEnv
}

/**
 * Check if a client-side feature is available
 */
export function isClientFeatureAvailable(feature: 'strava'): boolean {
  try {
    const env = getClientEnv()

    switch (feature) {
      case 'strava':
        return !!(env.NEXT_PUBLIC_STRAVA_CLIENT_ID && env.NEXT_PUBLIC_STRAVA_REDIRECT_URI)
      default:
        return false
    }
  } catch {
    return false
  }
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
 * Get Strava configuration for client-side usage
 */
export function getStravaConfig() {
  const env = getClientEnv()

  if (!isClientFeatureAvailable('strava')) {
    throw new Error('Strava integration is not configured')
  }

  return {
    clientId: env.NEXT_PUBLIC_STRAVA_CLIENT_ID!,
    redirectUri: env.NEXT_PUBLIC_STRAVA_REDIRECT_URI!,
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
