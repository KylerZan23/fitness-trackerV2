import { validateEnvironmentOrThrow, isFeatureAvailable } from './validation'
import type { ValidatedEnvironment } from './schemas'

// Server-side environment access with full validation
let serverEnv: ValidatedEnvironment | null = null

/**
 * Get validated server-side environment variables
 * Includes all environment variables (public and private)
 * Throws error if validation fails
 */
export function getServerEnv(): ValidatedEnvironment {
  if (!serverEnv) {
    serverEnv = validateEnvironmentOrThrow()
  }
  return serverEnv
}

/**
 * Get Supabase configuration for server-side usage
 */
export function getSupabaseServerConfig() {
  const env = getServerEnv()

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/**
 * Get LLM service configuration
 */
export function getLLMConfig() {
  const env = getServerEnv()

  if (!isFeatureAvailable('ai')) {
    throw new Error('AI/LLM service is not configured - missing LLM_API_KEY')
  }

  return {
    apiKey: env.LLM_API_KEY!,
    endpoint: env.LLM_API_ENDPOINT,
  }
}

/**
 * Get Strava configuration for server-side usage
 */
export function getStravaServerConfig() {
  const env = getServerEnv()

  if (!isFeatureAvailable('strava')) {
    throw new Error('Strava integration is not configured')
  }

  return {
    clientId: env.NEXT_PUBLIC_STRAVA_CLIENT_ID!,
    clientSecret: env.STRAVA_CLIENT_SECRET!,
    redirectUri: env.NEXT_PUBLIC_STRAVA_REDIRECT_URI!,
  }
}

/**
 * Get database connection configuration
 */
export function getDatabaseConfig() {
  const env = getServerEnv()

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/**
 * Check if a specific server-side feature is available
 */
export function isServerFeatureAvailable(feature: 'ai' | 'strava' | 'database'): boolean {
  try {
    const env = getServerEnv()

    switch (feature) {
      case 'ai':
        return !!env.LLM_API_KEY
      case 'strava':
        return !!(env.NEXT_PUBLIC_STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET)
      case 'database':
        return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      default:
        return false
    }
  } catch {
    return false
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getServerEnv()

  return {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    isCI: env.CI,
  }
}

/**
 * Validate that required services are available for the current operation
 */
export function requireServices(services: Array<'ai' | 'strava' | 'database'>): void {
  const missingServices = services.filter(service => !isServerFeatureAvailable(service))

  if (missingServices.length > 0) {
    throw new Error(
      `Required services are not configured: ${missingServices.join(', ')}. ` +
        'Please check your environment variables.'
    )
  }
}

/**
 * Get service configuration with validation
 */
export function getServiceConfig<T extends 'supabase' | 'llm' | 'strava'>(
  service: T
): T extends 'supabase'
  ? ReturnType<typeof getSupabaseServerConfig>
  : T extends 'llm'
    ? ReturnType<typeof getLLMConfig>
    : T extends 'strava'
      ? ReturnType<typeof getStravaServerConfig>
      : never {
  switch (service) {
    case 'supabase':
      return getSupabaseServerConfig() as any
    case 'llm':
      return getLLMConfig() as any
    case 'strava':
      return getStravaServerConfig() as any
    default:
      throw new Error(`Unknown service: ${service}`)
  }
}
