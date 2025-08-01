import { ZodError } from 'zod'
import { EnvironmentSchemas, type ValidatedEnvironment } from './schemas'

// Validation result types
export interface ValidationSuccess<T> {
  success: true
  data: T
  warnings: string[]
}

export interface ValidationError {
  success: false
  error: string
  details: string[]
  suggestions: string[]
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

// Environment validation cache
let cachedEnvironment: ValidatedEnvironment | null = null
let validationPerformed = false

/**
 * Get the current environment type from NODE_ENV
 */
function getEnvironmentType(): 'development' | 'production' | 'test' {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'test') return 'test'
  return 'development'
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatValidationError(error: ZodError): { details: string[]; suggestions: string[] } {
  const details: string[] = []
  const suggestions: string[] = []

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    const message = issue.message

    details.push(`❌ ${path}: ${message}`)

    // Add specific suggestions based on the field
    switch (path) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        suggestions.push(
          'Get your Supabase URL from: https://supabase.com/dashboard → Settings → API'
        )
        break
      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        suggestions.push(
          'Get your Supabase anon key from: https://supabase.com/dashboard → Settings → API'
        )
        break
      case 'SUPABASE_SERVICE_ROLE_KEY':
        suggestions.push(
          'Get your Supabase service role key from: https://supabase.com/dashboard → Settings → API'
        )
        suggestions.push('⚠️  Keep this key secure - never expose it on the client side')
        break
      case 'LLM_API_KEY':
        suggestions.push('Get your OpenAI API key from: https://platform.openai.com/api-keys')
        suggestions.push('Alternative: Use Anthropic API key from: https://console.anthropic.com/')
        break
    }
  }

  return { details, suggestions }
}

/**
 * Create detailed error message for development environment
 */
function createDevelopmentErrorMessage(
  error: string,
  details: string[],
  suggestions: string[]
): string {
  const separator = '─'.repeat(80)

  return `
${separator}
🚨 ENVIRONMENT CONFIGURATION ERROR
${separator}

${error}

DETAILS:
${details.map(detail => `  ${detail}`).join('\n')}

SETUP INSTRUCTIONS:
${suggestions.map(suggestion => `  ${suggestion}`).join('\n')}

NEXT STEPS:
  1. Create or update your .env.local file
  2. Add the missing environment variables
  3. Restart your development server
  4. Run 'yarn validate:env' to verify your configuration

EXAMPLE .env.local:
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  LLM_API_KEY=sk-...

${separator}
`
}

/**
 * Create secure error message for production environment
 */
function createProductionErrorMessage(): string {
  return 'Environment configuration error. Please check deployment settings and contact support if the issue persists.'
}

/**
 * Validate environment variables for the current environment
 */
export function validateEnvironment(): ValidationResult<ValidatedEnvironment> {
  // Return cached result if already validated
  if (validationPerformed && cachedEnvironment) {
    return {
      success: true,
      data: cachedEnvironment,
      warnings: [],
    }
  }

  const envType = getEnvironmentType()
  const schema = EnvironmentSchemas[envType]
  const warnings: string[] = []

  try {
    // Parse and validate environment variables
    const result = schema.parse(process.env)

    // Check for optional but recommended variables in development
    if (envType === 'development') {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        warnings.push('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - some server actions may not work')
      }
      if (!process.env.LLM_API_KEY) {
        warnings.push('⚠️  LLM_API_KEY not set - AI features will be disabled')
      }
    }

    // Cache successful validation
    cachedEnvironment = result as ValidatedEnvironment
    validationPerformed = true

    return {
      success: true,
      data: result as ValidatedEnvironment,
      warnings,
    }
  } catch (error) {
    validationPerformed = true

    if (error instanceof ZodError) {
      const { details, suggestions } = formatValidationError(error)
      const errorMessage = `Environment validation failed for ${envType} environment`

      return {
        success: false,
        error:
          envType === 'production'
            ? createProductionErrorMessage()
            : createDevelopmentErrorMessage(errorMessage, details, suggestions),
        details,
        suggestions,
      }
    }

    // Unexpected error
    return {
      success: false,
      error:
        envType === 'production'
          ? createProductionErrorMessage()
          : `Unexpected error during environment validation: ${error}`,
      details: [String(error)],
      suggestions: ['Contact the development team for assistance'],
    }
  }
}

/**
 * Validate environment and throw error if invalid (for startup validation)
 */
export function validateEnvironmentOrThrow(): ValidatedEnvironment {
  const result = validateEnvironment()

  if (!result.success) {
    throw new Error(result.error)
  }

  // Log warnings in development
  if (result.warnings.length > 0 && getEnvironmentType() === 'development') {
    console.warn('\n🟡 Environment Warnings:')
    result.warnings.forEach(warning => console.warn(`  ${warning}`))
    console.warn('')
  }

  return result.data
}

/**
 * Check if a specific feature is available based on environment configuration
 */
export function isFeatureAvailable(feature: 'ai'): boolean {
  const result = validateEnvironment()

  if (!result.success) {
    return false
  }

  const env = result.data

  switch (feature) {
    case 'ai':
      return !!env.LLM_API_KEY
    default:
      return false
  }
}

/**
 * Reset validation cache (useful for testing)
 */
export function resetValidationCache(): void {
  cachedEnvironment = null
  validationPerformed = false
}

/**
 * Get current environment type
 */
export function getCurrentEnvironment(): 'development' | 'production' | 'test' {
  return getEnvironmentType()
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentType() === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentType() === 'production'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironmentType() === 'test'
}
