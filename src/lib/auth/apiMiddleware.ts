/**
 * API Key Authentication Middleware
 * Handles API key validation and rate limiting for trainer endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiKeyUsage } from './apiKeys'
import type { ApiKeyScope, ApiResponse } from '@/lib/types/apiKeys'

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }
  
  return null
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to connection IP (may not be accurate behind proxies)
  return request.ip || 'unknown'
}

/**
 * Create standardized API error response
 */
export function createApiErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  requestId?: string
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      request_id: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create standardized API success response
 */
export function createApiSuccessResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string,
  rateLimit?: any
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      request_id: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rate_limit: rateLimit
    }
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: any
): NextResponse {
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', 
      Math.max(0, rateLimitResult.limit - rateLimitResult.requests_made).toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset_time)
    
    if (rateLimitResult.retry_after_seconds) {
      response.headers.set('Retry-After', rateLimitResult.retry_after_seconds.toString())
    }
  }
  
  return response
}

/**
 * API Key authentication middleware function
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: { apiKey: any; requestId: string }) => Promise<NextResponse>,
  options: {
    requiredScope?: ApiKeyScope
    endpoint?: string
  } = {}
): Promise<NextResponse> {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  try {
    // Extract API key from request
    const apiKey = extractApiKey(request)
    
    if (!apiKey) {
      return createApiErrorResponse(
        'MISSING_API_KEY',
        'API key is required. Provide it in Authorization header as "Bearer <key>" or X-API-Key header.',
        401,
        {
          headers_checked: ['Authorization', 'X-API-Key']
        },
        requestId
      )
    }
    
    // Validate API key and check rate limits
    const validationResult = await validateApiKey(
      apiKey,
      options.requiredScope,
      options.endpoint
    )
    
    if (!validationResult.valid) {
      const response = createApiErrorResponse(
        validationResult.error?.includes('rate limit') ? 'RATE_LIMIT_EXCEEDED' : 'INVALID_API_KEY',
        validationResult.error || 'Invalid API key',
        validationResult.error?.includes('rate limit') ? 429 : 401,
        validationResult.rate_limit,
        requestId
      )
      
      if (validationResult.rate_limit) {
        addRateLimitHeaders(response, validationResult.rate_limit)
      }
      
      return response
    }
    
    // Call the actual handler
    const response = await handler(request, {
      apiKey: validationResult.api_key,
      requestId
    })
    
    // Add rate limit headers to successful responses
    if (validationResult.rate_limit) {
      addRateLimitHeaders(response, validationResult.rate_limit)
    }
    
    // Log successful API usage
    const responseTime = Date.now() - startTime
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Fire and forget - don't await to avoid slowing down response
    if (validationResult.api_key && options.endpoint) {
      logApiKeyUsage(
        validationResult.api_key.id,
        options.endpoint,
        response.status,
        responseTime,
        clientIP,
        userAgent
      ).catch(error => {
        console.error('Error logging API usage:', error)
      })
    }
    
    return response
    
  } catch (error) {
    console.error('API middleware error:', error)
    
    // Log failed request if we have endpoint info
    if (options.endpoint) {
      const responseTime = Date.now() - startTime
      const clientIP = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || undefined
      
      // Try to extract api key for logging even if validation failed
      const apiKey = extractApiKey(request)
      if (apiKey) {
        try {
          const keyHash = require('crypto').createHash('sha256').update(apiKey).digest('hex')
          // We'd need the API key ID to log, but we might not have it if validation failed
          // This is a limitation we can accept for now
        } catch (e) {
          // Ignore errors in error logging
        }
      }
    }
    
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'Internal server error occurred',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : undefined,
      requestId
    )
  }
}

/**
 * Simple middleware wrapper that just checks for valid API key
 */
export function requireApiKey(requiredScope?: ApiKeyScope) {
  return (handler: (request: NextRequest, context: { apiKey: any; requestId: string }) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const endpoint = new URL(request.url).pathname
      return withApiKeyAuth(request, handler, {
        requiredScope,
        endpoint
      })
    }
  }
}

/**
 * CORS headers for API endpoints
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleCorsPreFlight(): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

/**
 * Validate request content type
 */
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): boolean {
  const contentType = request.headers.get('content-type')
  return contentType?.includes(expectedType) || false
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<{ data?: T; error?: string }> {
  try {
    if (!validateContentType(request)) {
      return { error: 'Content-Type must be application/json' }
    }
    
    const body = await request.json()
    return { data: body as T }
  } catch (error) {
    return { error: 'Invalid JSON in request body' }
  }
}