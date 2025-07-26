/**
 * Environment Variable Management & Validation
 *
 * This module provides comprehensive environment variable validation using Zod schemas
 * with runtime validation that prevents application startup with broken configuration.
 *
 * Features:
 * - Runtime validation with detailed error messages
 * - Type-safe environment variable access
 * - Environment-specific validation (dev/prod/test)
 * - Client/server-side utilities
 * - Feature availability checking
 *
 * Usage:
 * ```typescript
 * import { validateEnvironmentOrThrow, getServerEnv, isFeatureAvailable } from '@/lib/env'
 *
 * // Validate environment on startup
 * const env = validateEnvironmentOrThrow()
 *
 * // Check if features are available
 * if (isFeatureAvailable('ai')) {
 *   // AI features are configured
 * }
 *
 * // Get validated environment variables
 * const serverEnv = getServerEnv()
 * ```
 */

// Main validation functions
export {
  validateEnvironment,
  validateEnvironmentOrThrow,
  isFeatureAvailable,
  resetValidationCache,
  getCurrentEnvironment,
  isDevelopment,
  isProduction,
  isTest,
} from './validation'

// Import types and functions for internal use
import { validateEnvironmentOrThrow, validateEnvironment, isFeatureAvailable } from './validation'
import type { ValidatedEnvironment } from './types'

// Server-side utilities
export {
  getServerEnv,
  getSupabaseServerConfig,
  getLLMConfig,
  getStravaServerConfig,
  getDatabaseConfig,
  isServerFeatureAvailable,
  getEnvironmentConfig,
  requireServices,
  getServiceConfig,
} from './server'

// Client-side utilities
export {
  getClientEnv,
  isClientFeatureAvailable,
  getSupabaseConfig,
  getStravaConfig,
  isClientDevelopment,
  isClientProduction,
} from './client'

// Schemas and types
export type {
  BaseEnvironment,
  DevelopmentEnvironment,
  ProductionEnvironment,
  TestEnvironment,
  ClientEnvironment,
  ServerEnvironment,
  ValidatedEnvironment,
  EnvironmentType,
  ClientFeature,
  ServerFeature,
  ServiceName,
  SupabaseConfig,
  LLMConfig,
  StravaConfig,
  EnvironmentConfig,
  ValidationResult,
  ValidationSuccess,
  ValidationError,
  RequiredEnvVars,
  OptionalEnvVars,
  AllEnvVars,
  ValidationStatus,
} from './types'

// Export schemas for advanced usage
export {
  BaseEnvironmentSchema,
  DevelopmentEnvironmentSchema,
  ProductionEnvironmentSchema,
  TestEnvironmentSchema,
  ClientEnvironmentSchema,
  ServerEnvironmentSchema,
  EnvironmentSchemas,
} from './schemas'

/**
 * Initialize environment validation
 * Call this at application startup to ensure environment is properly configured
 */
export function initializeEnvironment(): ValidatedEnvironment {
  return validateEnvironmentOrThrow()
}

/**
 * Check application health from environment perspective
 */
export function getEnvironmentHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  details: {
    core: boolean
    ai: boolean
    strava: boolean
  }
  warnings: string[]
} {
  const result = validateEnvironment()

  if (!result.success) {
    return {
      status: 'unhealthy',
      details: {
        core: false,
        ai: false,
        strava: false,
      },
      warnings: result.details,
    }
  }

  const details = {
    core: true, // If validation passed, core is healthy
    ai: isFeatureAvailable('ai'),
    strava: isFeatureAvailable('strava'),
  }

  const hasOptionalFeatures = details.ai || details.strava
  const status = hasOptionalFeatures ? 'healthy' : 'degraded'

  return {
    status,
    details,
    warnings: result.warnings,
  }
}
