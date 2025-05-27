import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { saveTokensToDatabase } from '@/lib/strava-token-store'

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

/**
 * Server-side token refresh for Strava API
 * This endpoint securely handles token refresh using server-side credentials
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get the refresh token from request body
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Get server-side environment variables
    const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      console.error('Strava client credentials not configured on server')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Call Strava API to refresh token
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Strava token refresh failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to refresh Strava token' },
        { status: response.status }
      )
    }

    const tokenData = await response.json()
    
    const newTokens: StravaTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    }

    // Save new tokens to database
    await saveTokensToDatabase(supabase, user.id, newTokens)

    console.log(`Token refreshed successfully for user ${user.id.substring(0, 6)}`)

    // Return new tokens (without exposing sensitive data in logs)
    return NextResponse.json({
      access_token: newTokens.access_token,
      expires_at: newTokens.expires_at,
      // Note: Don't return refresh_token in response for security
    })

  } catch (error) {
    console.error('Error in token refresh API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 