/**
 * TypeScript types for API key management system
 * Used for trainer API authentication and rate limiting
 */

/**
 * API key scopes/permissions
 */
export type ApiKeyScope = 
  | 'program:generate'
  | 'program:read'
  | 'user:read'
  | 'analytics:read'

/**
 * API key database record
 */
export interface ApiKey {
  id: string
  key_hash: string
  name: string
  description?: string
  key_prefix: string
  scopes: ApiKeyScope[]
  rate_limit_per_hour: number
  rate_limit_per_day: number
  total_requests: number
  last_used_at?: string
  is_active: boolean
  expires_at?: string
  created_by?: string
  client_info?: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * API key usage tracking record
 */
export interface ApiKeyUsage {
  id: string
  api_key_id: string
  request_timestamp: string
  endpoint: string
  response_status?: number
  response_time_ms?: number
  request_ip?: string
  user_agent?: string
  created_at: string
}

/**
 * API key statistics view
 */
export interface ApiKeyStats {
  id: string
  name: string
  description?: string
  key_prefix: string
  scopes: ApiKeyScope[]
  is_active: boolean
  total_requests: number
  last_used_at?: string
  created_at: string
  requests_last_hour: number
  requests_last_24h: number
  requests_last_7d: number
}

/**
 * Request to create a new API key
 */
export interface CreateApiKeyRequest {
  name: string
  description?: string
  scopes: ApiKeyScope[]
  rate_limit_per_hour?: number
  rate_limit_per_day?: number
  expires_at?: string
  client_info?: Record<string, any>
}

/**
 * Response when creating a new API key
 * Note: The actual key is only returned once during creation
 */
export interface CreateApiKeyResponse {
  id: string
  key: string // Full API key - only returned once!
  key_prefix: string
  name: string
  description?: string
  scopes: ApiKeyScope[]
  rate_limit_per_hour: number
  rate_limit_per_day: number
  expires_at?: string
  created_at: string
}

/**
 * Request to update an existing API key
 */
export interface UpdateApiKeyRequest {
  name?: string
  description?: string
  scopes?: ApiKeyScope[]
  rate_limit_per_hour?: number
  rate_limit_per_day?: number
  is_active?: boolean
  expires_at?: string
}

/**
 * Rate limiting check result
 */
export interface RateLimitResult {
  allowed: boolean
  limit_type?: 'hourly' | 'daily'
  requests_made: number
  limit: number
  reset_time: string
  retry_after_seconds?: number
}

/**
 * API key validation result
 */
export interface ApiKeyValidationResult {
  valid: boolean
  api_key?: ApiKey
  error?: string
  rate_limit?: RateLimitResult
}

/**
 * User biometrics for program generation
 */
export interface UserBiometrics {
  age: number
  weight?: number
  height?: number
  weight_unit: 'kg' | 'lbs'
  height_unit?: 'cm' | 'ft_in'
  body_fat_percentage?: number
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

/**
 * Training goals for program generation
 */
export interface TrainingGoals {
  primary_goal: string
  secondary_goals?: string[]
  training_frequency_days: number
  session_duration: string
  available_equipment: string[]
  training_style_preferences?: string[]
  specific_focus_areas?: string[]
}

/**
 * Experience level information
 */
export interface ExperienceLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_training?: number
  previous_injuries?: string[]
  lifting_experience?: {
    squat_1rm?: number
    bench_1rm?: number
    deadlift_1rm?: number
    overhead_press_1rm?: number
  }
}

/**
 * Request body for program generation API
 */
export interface GenerateProgramRequest {
  user_biometrics: UserBiometrics
  training_goals: TrainingGoals
  experience_level: ExperienceLevel
  client_info?: {
    client_name?: string
    client_id?: string
    trainer_name?: string
    trainer_id?: string
  }
}

/**
 * Response from program generation API
 */
export interface GenerateProgramResponse {
  success: boolean
  program?: {
    id: string
    name: string
    duration_weeks: number
    training_days: any[] // Will use the existing TrainingProgram type
    metadata: {
      generated_at: string
      ai_model_used: string
      generation_time_ms: number
      weak_point_analysis?: any
      periodization_model?: string
    }
  }
  error?: string
  generation_time_ms?: number
}

/**
 * API response wrapper for consistent error handling
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    request_id: string
    timestamp: string
    rate_limit?: RateLimitResult
  }
}