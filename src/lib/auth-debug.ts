import { Session as SupabaseSession, SupabaseClient } from '@supabase/supabase-js'

export interface SessionDebugInfo {
  hasSession: boolean
  userId?: string
  email?: string
  aud?: string
  role?: string
  lastSignIn?: string
  expiresAt?: string
  provider?: string
  metadata?: any
}

export interface AuthDebugInfo {
  message?: string
  status?: number
  statusText?: string
  name?: string
  code?: string
  details?: string
  hint?: string
}

export interface CookieDebugInfo {
  exists: boolean
  value?: string
  path?: string
  expires?: string
  secure?: boolean
  sameSite?: string
  domain?: string
}

export interface SessionRefreshResult {
  success: boolean
  newSession?: SupabaseSession
  error?: Error
  timestamp: string
}

/**
 * Enhanced session debugging that includes API response details
 * @param supabase Supabase client instance
 * @param context Debug context identifier
 * @returns Promise<SessionDebugInfo>
 */
export async function debugAuthAPI(supabase: SupabaseClient, context: string): Promise<SessionDebugInfo> {
  console.log(`\n=== Auth API Debug [${context}] ===`)
  console.log('Timestamp:', new Date().toISOString())

  try {
    // Get current session state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Log full API response
    console.log('\nAPI Response:', {
      hasSession: !!session,
      error: sessionError ? {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name
      } : null,
      timestamp: new Date().toISOString()
    })

    if (session) {
      // Log detailed session information
      const sessionInfo: SessionDebugInfo = {
        hasSession: true,
        userId: session.user?.id,
        email: session.user?.email,
        aud: session.user?.aud,
        role: session.user?.role,
        lastSignIn: session.user?.last_sign_in_at,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
        provider: session.user?.app_metadata?.provider,
        metadata: {
          user: session.user?.user_metadata,
          app: session.user?.app_metadata
        }
      }

      console.log('\nSession Details:', sessionInfo)
      
      // Check token expiration
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
      const now = new Date()
      const timeUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : null
      
      console.log('\nToken Status:', {
        expiresAt: expiresAt?.toISOString(),
        timeUntilExpiry: timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 60)} minutes` : 'unknown',
        needsRefresh: timeUntilExpiry ? timeUntilExpiry < 300 : false // Less than 5 minutes
      })

      return sessionInfo
    }

    return {
      hasSession: false
    }
  } catch (error) {
    console.error('\nAuth API Error:', error)
    return {
      hasSession: false
    }
  }
}

/**
 * Attempts to refresh the session if needed
 * @param supabase Supabase client instance
 * @returns Promise<SessionRefreshResult>
 */
export async function refreshSessionIfNeeded(supabase: SupabaseClient): Promise<SessionRefreshResult> {
  const result: SessionRefreshResult = {
    success: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('No session to refresh')
      return result
    }

    // Check if refresh is needed (less than 5 minutes remaining)
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
    const now = new Date()
    const timeUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : null

    console.log('\n=== Session Refresh Check ===')
    console.log('Current session expires:', expiresAt?.toISOString())
    console.log('Time until expiry:', timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 60)} minutes` : 'unknown')

    if (timeUntilExpiry && timeUntilExpiry < 300) { // Less than 5 minutes
      console.log('Session needs refresh, attempting...')
      
      const { data: { session: newSession }, error: refreshError } = 
        await supabase.auth.refreshSession()

      if (refreshError) {
        console.error('Session refresh failed:', refreshError)
        result.error = refreshError
        return result
      }

      if (newSession) {
        console.log('Session refreshed successfully')
        console.log('New expiration:', new Date(newSession.expires_at! * 1000).toISOString())
        result.success = true
        result.newSession = newSession
        return result
      }
    } else {
      console.log('Session refresh not needed yet')
    }

    return result
  } catch (error) {
    console.error('Error during session refresh:', error)
    result.error = error as Error
    return result
  }
}

/**
 * Logs detailed session information for debugging purposes
 * @param session The Supabase session object
 * @param context A string describing where this log is coming from
 * @returns The debug information object
 */
export function debugLogSession(session: SupabaseSession | null, context: string): SessionDebugInfo {
  const debugInfo: SessionDebugInfo = {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    aud: session?.user?.aud,
    role: session?.user?.role,
    lastSignIn: session?.user?.last_sign_in_at,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
    provider: session?.user?.app_metadata?.provider,
    metadata: session?.user?.user_metadata
  }

  console.log(`=== Session Debug [${context}] ===`, debugInfo)
  return debugInfo
}

/**
 * Logs error information for debugging purposes
 * @param error The error object
 * @param context A string describing where this log is coming from
 * @returns The debug information object
 */
export function debugLogError(error: unknown, context: string): AuthDebugInfo {
  let debugInfo: AuthDebugInfo = {}

  if (error instanceof Error) {
    debugInfo = {
      message: error.message,
      name: error.name
    }
  } else if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    debugInfo = {
      message: err.message as string,
      status: err.status as number,
      statusText: err.statusText as string,
      name: err.name as string,
      code: err.code as string,
      details: err.details as string,
      hint: err.hint as string
    }
  }

  console.error(`=== Error Debug [${context}] ===`, debugInfo)
  return debugInfo
}

/**
 * Logs cookie information for debugging purposes
 * @param cookie The cookie object
 * @param name The name of the cookie
 * @returns The debug information object
 */
export function debugLogCookie(cookie: { [key: string]: any } | undefined, name: string): CookieDebugInfo {
  const debugInfo: CookieDebugInfo = {
    exists: !!cookie,
    value: cookie?.value ? `${cookie.value.substring(0, 10)}...` : 'Not found',
    path: cookie?.path,
    expires: cookie?.expires,
    secure: cookie?.secure,
    sameSite: cookie?.sameSite,
    domain: cookie?.domain
  }

  console.log(`=== Cookie Debug [${name}] ===`, debugInfo)
  return debugInfo
}

/**
 * Validates a session and returns potential configuration issues
 * @param session The Supabase session object
 * @returns Object containing validation results and potential issues
 */
export function validateSession(session: SupabaseSession) {
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
  const now = new Date()
  const timeUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : null

  const validation = {
    hasValidUser: !!session.user,
    hasUserId: !!session.user?.id,
    isAuthenticated: session.user?.aud === 'authenticated',
    hasValidRole: !!session.user?.role,
    hasValidAccessToken: !!session.access_token,
    hasValidRefreshToken: !!session.refresh_token,
    timeUntilExpiry: timeUntilExpiry ? Math.floor(timeUntilExpiry / 60) : null
  }

  const issues = {
    missingUserMetadata: !session.user?.user_metadata,
    missingAppMetadata: !session.user?.app_metadata,
    invalidAudience: session.user?.aud !== 'authenticated',
    missingProvider: !session.user?.app_metadata?.provider,
    shortExpiration: timeUntilExpiry ? timeUntilExpiry < 3600 : false,
    expired: timeUntilExpiry ? timeUntilExpiry <= 0 : false
  }

  return { validation, issues }
} 