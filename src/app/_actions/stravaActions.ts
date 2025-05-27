'use server'

import { createClient } from '@/utils/supabase/server' // Your server-side Supabase client
import { getTokensFromDatabase } from '@/lib/strava-token-store'
import { syncStravaActivities } from '@/lib/strava_sync'
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
