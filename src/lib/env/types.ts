import type {
  BaseEnvironment,
  DevelopmentEnvironment,
  ProductionEnvironment,
  TestEnvironment,
  ClientEnvironment,
  ServerEnvironment,
  ValidatedEnvironment,
} from './schemas'

// Re-export all environment types
export type {
  BaseEnvironment,
  DevelopmentEnvironment,
  ProductionEnvironment,
  TestEnvironment,
  ClientEnvironment,
  ServerEnvironment,
  ValidatedEnvironment,
}

// Environment-specific type guards
export type EnvironmentType = 'development' | 'production' | 'test'

// Feature availability types
export type ClientFeature = 'strava'
export type ServerFeature = 'ai' | 'strava' | 'database'
export type ServiceName = 'supabase' | 'llm' | 'strava'

// Configuration types
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export interface LLMConfig {
  apiKey: string
  endpoint: string
}

export interface StravaConfig {
  clientId: string
  clientSecret?: string
  redirectUri: string
}

export interface EnvironmentConfig {
  nodeEnv: EnvironmentType
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  isCI: boolean
}

// Validation result types (re-exported for convenience)
export type { ValidationResult, ValidationSuccess, ValidationError } from './validation'

// Environment variable names
export type RequiredEnvVars =
  | 'NODE_ENV'
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'

export type OptionalEnvVars =
  | 'CI'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'LLM_API_KEY'
  | 'LLM_API_ENDPOINT'
  | 'NEXT_PUBLIC_STRAVA_CLIENT_ID'
  | 'STRAVA_CLIENT_SECRET'
  | 'NEXT_PUBLIC_STRAVA_REDIRECT_URI'

export type AllEnvVars = RequiredEnvVars | OptionalEnvVars

// Environment validation status
export interface ValidationStatus {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingRequired: string[]
  missingOptional: string[]
}
