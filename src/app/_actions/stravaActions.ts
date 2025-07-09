'use server'

import { createClient } from '@/utils/supabase/server' // Your server-side Supabase client
import { getTokensFromDatabase } from '@/lib/strava/token-store'
import { syncStravaActivities } from '@/lib/strava/sync'
import { revalidatePath } from 'next/cache'

interface SyncResult {
  syncedCount: number
  newActivitiesCount: number
  error?: string
  lastActivityDate?: string
}

export async function triggerStravaSync(syncMode: 'recent' | 'full_history'): Promise<SyncResult> {
  const supabase = await createClient() // Use your server client creation function

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error fetching user for Strava sync:', userError)
    return { syncedCount: 0, newActivitiesCount: 0, error: 'User not authenticated' }
  }

  console.log(`User ${user.id.substring(0, 6)} initiated Strava sync with mode: ${syncMode}`)

  const tokens = await getTokensFromDatabase(supabase, user.id)
  if (!tokens) {
    console.warn(`No Strava tokens found for user ${user.id.substring(0, 6)} to initiate sync.`)
    return {
      syncedCount: 0,
      newActivitiesCount: 0,
      error: 'Strava not connected or tokens missing. Please reconnect Strava.',
    }
  }

  // Ensure tokens are fresh enough (getTokensFromDatabase should ideally provide them)
  // If StravaTokens includes expires_at, we could add a quick check here,
  // but getValidStravaToken within getStravaActivities (called by syncStravaActivities) should handle refresh.

  const result = await syncStravaActivities(supabase, user.id, tokens, syncMode)

  if (result.error) {
    console.error(`Strava sync failed for user ${user.id.substring(0, 6)}: ${result.error}`)
  } else {
    console.log(
      `Strava sync completed for user ${user.id.substring(0, 6)}. Synced: ${result.syncedCount}, New: ${result.newActivitiesCount}`
    )
    // If new activities were synced, we might want to revalidate the path
    // for the workouts page so it picks up the new data immediately.
    if (result.newActivitiesCount > 0) {
      revalidatePath('/workouts')
      console.log('Revalidated /workouts path due to new Strava activities.')
    }
  }

  return result
}

export async function refreshStravaToken(): Promise<{ success: boolean; message?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error fetching user for Strava token refresh:', userError)
    return { success: false, error: 'User not authenticated' }
  }

  // Fetch user profile to get Strava connection info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('strava_connected, strava_refresh_token')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError)
    return { success: false, error: 'Failed to fetch user profile' }
  }

  if (!profile.strava_connected || !profile.strava_refresh_token) {
    return { success: false, error: 'User not connected to Strava' }
  }

  try {
    // Call Strava API to refresh token
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: profile.strava_refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Strava token refresh failed:', response.status, response.statusText)
      return { success: false, error: 'Failed to refresh Strava token' }
    }

    const data = await response.json()

    // Update user profile with new tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        strava_access_token: data.access_token,
        strava_refresh_token: data.refresh_token,
        strava_token_expires_at: new Date(data.expires_at * 1000).toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating Strava tokens:', updateError)
      return { success: false, error: 'Failed to save refreshed tokens' }
    }

    return { success: true, message: 'Strava token refreshed successfully' }
  } catch (error) {
    console.error('Unexpected error during Strava token refresh:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function disconnectStrava(): Promise<{ success: boolean; message?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error fetching user for Strava disconnect:', userError)
    return { success: false, error: 'User not authenticated' }
  }

  try {
    // Update user profile to disconnect Strava
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        strava_connected: false,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_athlete_id: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error disconnecting Strava:', updateError)
      return { success: false, error: 'Failed to disconnect Strava' }
    }

    return { success: true, message: 'Strava disconnected successfully' }
  } catch (error) {
    console.error('Unexpected error during Strava disconnect:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
