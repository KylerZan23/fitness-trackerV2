import type { SupabaseClient } from '@supabase/supabase-js'; // Ensure type is imported
import { getStravaActivities, StravaActivity, StravaTokens, refreshStravaToken, getValidStravaToken } from './strava'; // Assuming getValidStravaToken is exported or we replicate logic

// Interface matching the public.user_strava_activities table structure
export interface UserStravaActivity {
  user_id: string;
  strava_activity_id: number;
  name?: string | null;
  type?: string | null;
  distance?: number | null; // meters
  moving_time?: number | null; // seconds
  elapsed_time?: number | null; // seconds
  start_date: string; // TIMESTAMPTZ as ISO string
  start_date_local?: string | null; // TIMESTAMPTZ as ISO string
  timezone?: string | null;
  total_elevation_gain?: number | null;
  map_summary_polyline?: string | null;
  metadata?: object | null; // JSONB
  // 'id' and 'synced_at' are handled by the database
}

const SYNC_DELAY_MS = 2000; // 2 seconds delay between Strava API calls to be very conservative
const MAX_PAGES_PER_SYNC_JOB = 100; // Safety break for extremely long syncs, can be adjusted
const ACTIVITIES_PER_PAGE = 50; // Number of activities to fetch per page from Strava

/**
 * Delays execution for a specified number of milliseconds.
 * @param ms - The number of milliseconds to delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Syncs Strava activities for a user to the local database.
 * Fetches activities from Strava and upserts them into the user_strava_activities table.
 * Handles pagination and rate limiting by introducing delays.
 *
 * @param supabaseClient - The Supabase client instance.
 * @param userId - The ID of the user.
 * @param tokens - The user's current Strava tokens.
 * @param syncMode - 'recent' to fetch activities after the last synced one, or 'full_history' to attempt a full sync.
 * @returns An object indicating the number of activities processed/synced and any error message.
 */
export async function syncStravaActivities(
  supabaseClient: SupabaseClient, // Added SupabaseClient parameter
  userId: string,
  tokens: StravaTokens,
  syncMode: 'recent' | 'full_history' = 'recent'
): Promise<{ syncedCount: number; newActivitiesCount: number; error?: string; lastActivityDate?: string }> {
  console.log(`Starting Strava sync for user ${userId.substring(0,6)}. Mode: ${syncMode}`);
  let currentTokens = { ...tokens };
  let totalSyncedCount = 0;
  let totalNewActivitiesCount = 0;
  let lastProcessedActivityDate: string | undefined;

  try {
    let afterTimestamp: number | undefined;

    if (syncMode === 'recent') {
      // Use passed supabaseClient
      const { data: lastSyncedActivity, error: lastSyncError } = await supabaseClient
        .from('user_strava_activities')
        .select('start_date')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (lastSyncError && lastSyncError.code !== 'PGRST116') { // PGRST116: no rows found
        console.error('Error fetching last synced activity:', lastSyncError);
        // Decide if we should proceed or return error. For now, proceed as if no history.
      }
      if (lastSyncedActivity?.start_date) {
        afterTimestamp = Math.floor(new Date(lastSyncedActivity.start_date).getTime() / 1000) + 1; // +1 to avoid re-fetching the same activity
        console.log(`Syncing activities after last synced date: ${new Date(afterTimestamp * 1000).toISOString()}`);
      } else {
        // No recent activity, fetch last 3 months as a starting point for 'recent'
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        afterTimestamp = Math.floor(threeMonthsAgo.getTime() / 1000);
        console.log('No previous sync found for recent mode, fetching last 3 months.');
      }
    } else if (syncMode === 'full_history') {
      console.log('Starting full history sync. This may take a long time and many API calls.');
      // No initial afterTimestamp, will fetch all pages from the beginning (oldest first, if API allows, or just all pages)
      // Strava API fetches newest first by default. So for full_history, we just paginate until no more data.
    }

    let page = 1;
    let continueFetching = true;
    let pagesFetched = 0;

    while (continueFetching && pagesFetched < MAX_PAGES_PER_SYNC_JOB) {
      console.log(`Fetching page ${page} for user ${userId.substring(0,6)}...`);
      
      // Ensure token is valid before API call, especially for long syncs
      // This assumes getValidStravaToken can update tokens and these changes are propagated if needed.
      // For a server-side process, token refresh and storage would be more complex.
      // Here, we assume tokens are fresh enough for a batch or get refreshed by getStravaActivities internally.
      // If getValidStravaToken modifies `currentTokens`, we need to handle that.
      // For simplicity, `getStravaActivities` internally calls `getValidStravaToken`.

      const activities = await getStravaActivities(
        currentTokens,
        page,
        ACTIVITIES_PER_PAGE,
        syncMode === 'recent' ? afterTimestamp : undefined // Only use 'after' for recent mode to get newest
        // For 'full_history', we fetch all pages, newest first. Strava API doesn't easily support "oldest first" without specific date anchoring.
      );

      if (activities.length > 0) {
        const transformedActivities: UserStravaActivity[] = activities.map(act => ({
          user_id: userId,
          strava_activity_id: act.id,
          name: act.name,
          type: act.type,
          distance: act.distance,
          moving_time: act.moving_time,
          elapsed_time: act.elapsed_time,
          start_date: act.start_date, // Assuming this is ISO UTC string
          start_date_local: act.start_date_local, // Assuming this is ISO UTC string
          timezone: act.map?.id, // Strava API activity map.id sometimes contains timezone string like 'America/Los_Angeles'. Or this could be from user profile.
          total_elevation_gain: act.total_elevation_gain,
          map_summary_polyline: act.map?.summary_polyline,
          metadata: act, // Store the whole raw activity for future use
        }));

        if (transformedActivities.length > 0) {
            lastProcessedActivityDate = transformedActivities[0].start_date; // Activities are newest first
        }

        // Use passed supabaseClient for upsert
        const { error: upsertError, count } = await supabaseClient
          .from('user_strava_activities')
          .upsert(transformedActivities, { onConflict: 'user_id, strava_activity_id', ignoreDuplicates: false });

        if (upsertError) {
          console.error('Error upserting Strava activities:', upsertError);
          return { syncedCount: totalSyncedCount, newActivitiesCount: totalNewActivitiesCount, error: 'Database upsert error: ' + upsertError.message, lastActivityDate: lastProcessedActivityDate };
        }
        
        totalSyncedCount += transformedActivities.length;
        // The `count` from upsert might represent affected rows (inserts + updates).
        // A more accurate `newActivitiesCount` would involve checking if it was an insert or update.
        // For simplicity, we can estimate or assume most fetched are new during a sync operation.
        // A pre-check for existence could give exact new count but adds DB calls.
        if (count !== null) totalNewActivitiesCount += count; 

        console.log(`Page ${page}: Upserted ${count ?? 0} activities. Total synced this job: ${totalSyncedCount}.`);

        page++;
        pagesFetched++;
        await delay(SYNC_DELAY_MS); // Wait before fetching the next page
      } else {
        // No more activities found
        console.log('No more activities found from Strava API.');
        continueFetching = false;
      }
    }

    if (pagesFetched >= MAX_PAGES_PER_SYNC_JOB) {
        console.warn(`Reached max pages (${MAX_PAGES_PER_SYNC_JOB}) for sync job. More activities might be available.`);
    }

    console.log(`Sync finished for user ${userId.substring(0,6)}. Total activities processed/synced in this job: ${totalSyncedCount}. New: ${totalNewActivitiesCount}`);
    return { syncedCount: totalSyncedCount, newActivitiesCount: totalNewActivitiesCount, lastActivityDate: lastProcessedActivityDate };

  } catch (error: any) {
    console.error(`Error during Strava sync for user ${userId.substring(0,6)}:`, error);
    // Check if it's a rate limit error from the underlying getStravaActivities call
    if (error.message && error.message.includes('Rate Limit Exceeded')) {
        return { syncedCount: totalSyncedCount, newActivitiesCount: totalNewActivitiesCount, error: 'Strava API rate limit exceeded during sync.', lastActivityDate: lastProcessedActivityDate };
    }
    return { syncedCount: totalSyncedCount, newActivitiesCount: totalNewActivitiesCount, error: error.message || 'An unknown error occurred during sync.', lastActivityDate: lastProcessedActivityDate };
  }
} 