/**
 * Client-Side Strava Token Management
 * ------------------------------------------------
 * This module provides client-side utilities for managing Strava tokens
 * without exposing server-side secrets. All sensitive operations are
 * delegated to server-side API routes.
 */

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  start_date: string
  start_date_local: string
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  map?: {
    id: string
    summary_polyline: string
  }
}

const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3'

/**
 * Refreshes Strava tokens using the server-side API endpoint
 * This ensures client secrets are never exposed to the browser
 */
export const refreshStravaTokenClient = async (refreshToken: string): Promise<{
  access_token: string
  expires_at: number
} | null> => {
  try {
    const response = await fetch('/api/strava/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Client token refresh failed:', errorData)
      return null
    }

    const tokenData = await response.json()
    return {
      access_token: tokenData.access_token,
      expires_at: tokenData.expires_at,
    }
  } catch (error) {
    console.error('Error refreshing token from client:', error)
    return null
  }
}

/**
 * Validates if a token is still valid (with 60 second buffer)
 */
export const isTokenValid = (expiresAt: number): boolean => {
  const currentTime = Math.floor(Date.now() / 1000)
  return expiresAt > currentTime + 60
}

/**
 * Gets a valid access token, refreshing if necessary
 * This function handles token validation and refresh automatically
 */
export const getValidAccessToken = async (
  tokens: StravaTokens,
  onTokenUpdate?: (newTokens: { access_token: string; expires_at: number }) => void
): Promise<string | null> => {
  // Check if current token is still valid
  if (isTokenValid(tokens.expires_at)) {
    return tokens.access_token
  }

  // Token is expired or about to expire, refresh it
  console.log('Token expired, refreshing...')
  const refreshedTokens = await refreshStravaTokenClient(tokens.refresh_token)
  
  if (!refreshedTokens) {
    console.error('Failed to refresh token')
    return null
  }

  // Notify caller of token update so they can update their state/storage
  if (onTokenUpdate) {
    onTokenUpdate(refreshedTokens)
  }

  return refreshedTokens.access_token
}

/**
 * Makes an authenticated request to the Strava API
 * Automatically handles token refresh if needed
 */
export const makeStravaApiRequest = async <T>(
  url: string,
  tokens: StravaTokens,
  options: RequestInit = {},
  onTokenUpdate?: (newTokens: { access_token: string; expires_at: number }) => void
): Promise<T | null> => {
  const accessToken = await getValidAccessToken(tokens, onTokenUpdate)
  
  if (!accessToken) {
    throw new Error('Unable to get valid access token for Strava API')
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Strava API request failed: ${response.status} ${errorData}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Strava API request error:', error)
    return null
  }
}

/**
 * Fetches activities from Strava API (client-side)
 */
export const getStravaActivitiesClient = async (
  tokens: StravaTokens,
  page = 1,
  perPage = 30,
  after?: number,
  before?: number,
  onTokenUpdate?: (newTokens: { access_token: string; expires_at: number }) => void
): Promise<StravaActivity[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  if (after) {
    params.append('after', after.toString())
  }
  if (before) {
    params.append('before', before.toString())
  }

  const url = `${STRAVA_API_BASE_URL}/athlete/activities?${params.toString()}`
  
  const activities = await makeStravaApiRequest<StravaActivity[]>(
    url,
    tokens,
    { method: 'GET' },
    onTokenUpdate
  )

  return activities ?? []
}

/**
 * Fetches a specific activity with polyline data
 */
export const getStravaActivityWithPolylineClient = async (
  tokens: StravaTokens,
  activityId: number,
  onTokenUpdate?: (newTokens: { access_token: string; expires_at: number }) => void
): Promise<StravaActivity | null> => {
  const url = `${STRAVA_API_BASE_URL}/activities/${activityId}?include_all_efforts=true`
  
  return await makeStravaApiRequest<StravaActivity>(
    url,
    tokens,
    { method: 'GET' },
    onTokenUpdate
  )
} 