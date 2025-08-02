/**
 * API Key Management Utilities
 * Handles creation, validation, and rate limiting for trainer API keys
 */

import { createHash, randomBytes } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import type {
  ApiKey,
  ApiKeyUsage,
  ApiKeyStats,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UpdateApiKeyRequest,
  RateLimitResult,
  ApiKeyValidationResult,
  ApiKeyScope
} from '@/lib/types/apiKeys'

/**
 * Generate a secure API key
 * Format: neurallift_sk_[32 random bytes as hex]
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(32).toString('hex')
  return `neurallift_sk_${randomPart}`
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Extract the key prefix (first 8 characters after the prefix)
 */
export function getKeyPrefix(key: string): string {
  if (key.startsWith('neurallift_sk_')) {
    return key.substring(0, 22) // neurallift_sk_ + first 8 chars
  }
  return key.substring(0, 8)
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^neurallift_sk_[a-f0-9]{64}$/.test(key)
}

/**
 * Create a new API key
 */
export async function createApiKey(
  request: CreateApiKeyRequest,
  createdBy?: string
): Promise<CreateApiKeyResponse> {
  const supabase = createClient()
  
  // Generate the API key
  const apiKey = generateApiKey()
  const keyHash = hashApiKey(apiKey)
  const keyPrefix = getKeyPrefix(apiKey)
  
  // Prepare the database record
  const apiKeyRecord = {
    key_hash: keyHash,
    name: request.name,
    description: request.description,
    key_prefix: keyPrefix,
    scopes: request.scopes,
    rate_limit_per_hour: request.rate_limit_per_hour ?? 100,
    rate_limit_per_day: request.rate_limit_per_day ?? 1000,
    expires_at: request.expires_at,
    created_by: createdBy,
    client_info: request.client_info,
  }
  
  // Insert into database
  const { data, error } = await supabase
    .from('api_keys')
    .insert(apiKeyRecord)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`)
  }
  
  return {
    id: data.id,
    key: apiKey, // Only returned once!
    key_prefix: keyPrefix,
    name: request.name,
    description: request.description,
    scopes: request.scopes,
    rate_limit_per_hour: apiKeyRecord.rate_limit_per_hour,
    rate_limit_per_day: apiKeyRecord.rate_limit_per_day,
    expires_at: request.expires_at,
    created_at: data.created_at,
  }
}

/**
 * Validate an API key and check rate limits
 */
export async function validateApiKey(
  key: string,
  requiredScope?: ApiKeyScope,
  endpoint?: string
): Promise<ApiKeyValidationResult> {
  // First, check key format
  if (!isValidApiKeyFormat(key)) {
    return {
      valid: false,
      error: 'Invalid API key format'
    }
  }
  
  const supabase = createClient()
  const keyHash = hashApiKey(key)
  
  // Fetch the API key record
  const { data: apiKeyData, error: fetchError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()
  
  if (fetchError || !apiKeyData) {
    return {
      valid: false,
      error: 'API key not found or inactive'
    }
  }
  
  const apiKey = apiKeyData as ApiKey
  
  // Check if key has expired
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return {
      valid: false,
      error: 'API key has expired'
    }
  }
  
  // Check if key has required scope
  if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
    return {
      valid: false,
      error: `API key does not have required scope: ${requiredScope}`
    }
  }
  
  // Check rate limits
  const rateLimitResult = await checkRateLimit(apiKey.id, apiKey.rate_limit_per_hour, apiKey.rate_limit_per_day)
  
  if (!rateLimitResult.allowed) {
    return {
      valid: false,
      error: 'Rate limit exceeded',
      rate_limit: rateLimitResult
    }
  }
  
  // Update last used timestamp and total requests
  await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      total_requests: apiKey.total_requests + 1
    })
    .eq('id', apiKey.id)
  
  // Log the usage if endpoint is provided
  if (endpoint) {
    await logApiKeyUsage(apiKey.id, endpoint)
  }
  
  return {
    valid: true,
    api_key: apiKey,
    rate_limit: rateLimitResult
  }
}

/**
 * Check rate limits for an API key
 */
export async function checkRateLimit(
  apiKeyId: string,
  hourlyLimit: number,
  dailyLimit: number
): Promise<RateLimitResult> {
  const supabase = createClient()
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Check hourly rate limit
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('request_timestamp', oneHourAgo.toISOString())
  
  if (hourlyError) {
    console.error('Error checking hourly rate limit:', hourlyError)
  }
  
  if ((hourlyCount ?? 0) >= hourlyLimit) {
    const resetTime = new Date(oneHourAgo.getTime() + 60 * 60 * 1000)
    return {
      allowed: false,
      limit_type: 'hourly',
      requests_made: hourlyCount ?? 0,
      limit: hourlyLimit,
      reset_time: resetTime.toISOString(),
      retry_after_seconds: Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
    }
  }
  
  // Check daily rate limit
  const { count: dailyCount, error: dailyError } = await supabase
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('request_timestamp', oneDayAgo.toISOString())
  
  if (dailyError) {
    console.error('Error checking daily rate limit:', dailyError)
  }
  
  if ((dailyCount ?? 0) >= dailyLimit) {
    const resetTime = new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000)
    return {
      allowed: false,
      limit_type: 'daily',
      requests_made: dailyCount ?? 0,
      limit: dailyLimit,
      reset_time: resetTime.toISOString(),
      retry_after_seconds: Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
    }
  }
  
  return {
    allowed: true,
    requests_made: Math.max(hourlyCount ?? 0, dailyCount ?? 0),
    limit: Math.min(hourlyLimit, dailyLimit),
    reset_time: new Date(oneHourAgo.getTime() + 60 * 60 * 1000).toISOString()
  }
}

/**
 * Log API key usage for analytics and rate limiting
 */
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  responseStatus?: number,
  responseTimeMs?: number,
  requestIp?: string,
  userAgent?: string
): Promise<void> {
  const supabase = createClient()
  
  const usageRecord: Partial<ApiKeyUsage> = {
    api_key_id: apiKeyId,
    endpoint,
    response_status: responseStatus,
    response_time_ms: responseTimeMs,
    request_ip: requestIp,
    user_agent: userAgent,
  }
  
  const { error } = await supabase
    .from('api_key_usage')
    .insert(usageRecord)
  
  if (error) {
    console.error('Error logging API key usage:', error)
  }
}

/**
 * Update an existing API key
 */
export async function updateApiKey(
  apiKeyId: string,
  updates: UpdateApiKeyRequest
): Promise<ApiKey> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', apiKeyId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update API key: ${error.message}`)
  }
  
  return data as ApiKey
}

/**
 * Delete/deactivate an API key
 */
export async function deactivateApiKey(apiKeyId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', apiKeyId)
  
  if (error) {
    throw new Error(`Failed to deactivate API key: ${error.message}`)
  }
}

/**
 * List API keys with optional filtering
 */
export async function listApiKeys(
  filters?: {
    is_active?: boolean
    created_by?: string
    scope?: ApiKeyScope
  }
): Promise<ApiKey[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  
  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by)
  }
  
  if (filters?.scope) {
    query = query.contains('scopes', [filters.scope])
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`)
  }
  
  return data as ApiKey[]
}

/**
 * Get API key statistics
 */
export async function getApiKeyStats(apiKeyId?: string): Promise<ApiKeyStats[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('api_key_stats')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (apiKeyId) {
    query = query.eq('id', apiKeyId)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to get API key stats: ${error.message}`)
  }
  
  return data as ApiKeyStats[]
}

/**
 * Clean up old usage records (called via cron job or manually)
 */
export async function cleanupOldUsageRecords(): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('cleanup_api_key_usage')
  
  if (error) {
    throw new Error(`Failed to cleanup usage records: ${error.message}`)
  }
  
  return data as number
}