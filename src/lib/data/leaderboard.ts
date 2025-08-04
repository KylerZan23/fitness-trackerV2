// src/lib/data/leaderboard.ts
import { createClient } from '@/utils/supabase/server'
import { type LeaderboardLift } from '@/app/_actions/leaderboardActions'

type WorkoutWithProfile = {
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  created_at: string;
  profiles: {
    name: string | null;
    profile_picture_url: string | null;
  } | null;
}

type ProfileWithOnboarding = {
    id: string;
    name: string | null;
    profile_picture_url: string | null;
    weight_unit: string | null;
    onboarding_responses: Record<string, any> | null;
}

export async function getWorkoutsForLeaderboard(liftType: LeaderboardLift): Promise<{ success: boolean; data?: WorkoutWithProfile[]; error?: string }> {
  const supabase = await createClient()

  const liftPatterns = {
    squat: '%squat%',
    bench: '%bench%',
    deadlift: '%deadlift%',
  }

  const pattern = liftPatterns[liftType]
  if (!pattern) {
    return { success: false, error: 'Invalid lift type' }
  }

  try {
    // First get the workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('user_id, exercise_name, weight, reps, created_at')
      .ilike('exercise_name', pattern)

    if (workoutsError) {
      console.error('Error fetching leaderboard workouts:', workoutsError)
      return { success: false, error: 'Failed to load leaderboard workouts.' }
    }

    if (!workouts || workouts.length === 0) {
      return { success: true, data: [] }
    }

    // Get unique user IDs
    const userIds = [...new Set(workouts.map(w => w.user_id))]

    // Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles for leaderboard:', profilesError)
      return { success: false, error: 'Failed to load user profiles.' }
    }

    // Create a map of user_id to profile
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Combine workouts with profiles
    const workoutsWithProfiles: WorkoutWithProfile[] = workouts.map(workout => ({
      ...workout,
      profiles: profileMap.get(workout.user_id) || null
    }))

    return { success: true, data: workoutsWithProfiles }
  } catch (error) {
    console.error('Unexpected error in getWorkoutsForLeaderboard:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

export async function getProfilesForOneRMLeaderboard(): Promise<{ success: boolean, data?: ProfileWithOnboarding[], error?: string}> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, profile_picture_url, weight_unit, onboarding_responses')
            .not('onboarding_responses', 'is', null);

        if (error) {
            console.error('Error fetching 1RM leaderboard data:', error);
            return { success: false, error: 'Failed to load 1RM leaderboard profiles.' };
        }

        return { success: true, data: data as ProfileWithOnboarding[] };
    } catch (error) {
        console.error('Unexpected error in getProfilesForOneRMLeaderboard:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
