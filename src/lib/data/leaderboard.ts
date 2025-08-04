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
    const { data, error } = await supabase
      .from('workouts')
      .select('user_id, exercise_name, weight, reps, created_at, profiles(name, profile_picture_url)')
      .ilike('exercise_name', pattern)

    if (error) {
      console.error('Error fetching leaderboard workouts:', error)
      return { success: false, error: 'Failed to load leaderboard workouts.' }
    }

    return { success: true, data: data as WorkoutWithProfile[] }
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
