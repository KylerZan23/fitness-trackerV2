'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type LeaderboardLift = 'squat' | 'bench' | 'deadlift';
export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  profile_picture_url: string | null;
  best_e1rm: number;
  weight: number;
  reps: number;
  lift_date: string;
};

export type UserRankData = {
  rank: number;
  best_e1rm: number;
};

export async function getLeaderboardData(liftType: LeaderboardLift): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
  const supabase = await createClient()

  // Map the simple lift type to a SQL ILIKE pattern
  const liftPatterns = {
    squat: '%squat%',
    bench: '%bench%',
    deadlift: '%deadlift%',
  }

  const pattern = liftPatterns[liftType]
  if (!pattern) {
    return { success: false, error: "Invalid lift type" }
  }

  const { data, error } = await supabase.rpc('get_strength_leaderboard', {
    lift_type_pattern: pattern,
  })

  if (error) {
    console.error("Error fetching leaderboard data:", error)
    return { success: false, error: "Failed to load leaderboard." }
  }

  return { success: true, data: data as LeaderboardEntry[] }
}

// Action to get the current user's rank for a specific lift type
export async function getUserRankForLift(liftType: LeaderboardLift): Promise<{ success: boolean; data?: UserRankData; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "User not authenticated." }
  }

  // Map the simple lift type to a SQL ILIKE pattern
  const liftPatterns = {
    squat: '%squat%',
    bench: '%bench%',
    deadlift: '%deadlift%',
  }

  const pattern = liftPatterns[liftType]
  if (!pattern) {
    return { success: false, error: "Invalid lift type" }
  }

  const { data, error } = await supabase.rpc('get_user_rank_for_lift', {
    p_user_id: user.id,
    lift_type_pattern: pattern,
  })

  if (error) {
    console.error("Error fetching user rank:", error)
    return { success: false, error: "Failed to load user rank." }
  }

  // The function returns an array, but we expect only one result
  const userRank = data?.[0]
  if (!userRank) {
    return { success: false, error: "No rank found for this lift type." }
  }

  return { 
    success: true, 
    data: {
      rank: parseInt(userRank.rank.toString()),
      best_e1rm: parseFloat(userRank.best_e1rm.toString())
    }
  }
}

// Action to get the current user's rank for a specific lift type (improved naming)
export async function getCurrentUserRank(liftType: LeaderboardLift) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  // Map the simple lift type to a SQL ILIKE pattern
  const liftPatterns = {
    squat: '%squat%',
    bench: '%bench%',
    deadlift: '%deadlift%',
  }

  const pattern = liftPatterns[liftType]
  if (!pattern) {
    return { success: false, error: "Invalid lift type" }
  }

  const { data, error } = await supabase.rpc('get_user_rank_for_lift', {
    p_user_id: user.id,
    lift_type_pattern: pattern,
  })

  if (error || !data || data.length === 0) {
    return { success: true, data: null } // No rank found
  }

  return { success: true, data: data[0] }
}

// Action to get leaderboard for common strength exercises
export async function getCommonStrengthLeaderboards() {
  const supabase = await createClient()
  const exercises = [
    { name: 'Bench Press', pattern: '%bench%' },
    { name: 'Deadlift', pattern: '%deadlift%' },
    { name: 'Squat', pattern: '%squat%' },
    { name: 'Overhead Press', pattern: '%overhead%' },
    { name: 'Pull-ups', pattern: '%pull%up%' }
  ]

  const results = await Promise.allSettled(
    exercises.map(async (exercise) => {
      const { data, error } = await supabase.rpc('get_strength_leaderboard', {
        lift_type_pattern: exercise.pattern,
        result_limit: 10
      })
      return {
        exercise: exercise.name,
        success: !error,
        data: error ? null : data,
        error: error ? error.message : null
      }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        exercise: exercises[index].name,
        success: false,
        error: 'Failed to load data'
      }
    }
  })
}

// Action to get user's personal best for a specific exercise
export async function getUserPersonalBest(exercisePattern: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated.' }
  }

  try {
    const { data, error } = await supabase.rpc('get_strength_leaderboard', {
      lift_type_pattern: exercisePattern,
      result_limit: 1000 // Get all results to find user's rank
    })

    if (error) {
      console.error('Error fetching personal best:', error)
      return { success: false, error: 'Failed to load personal best data.' }
    }

    // Find the user's entry in the leaderboard
    const userEntry = data?.find((entry: LeaderboardEntry) => entry.user_id === user.id)
    
    if (!userEntry) {
      return { success: false, error: 'No personal best found for this exercise.' }
    }

    return { success: true, data: userEntry }
  } catch (error) {
    console.error('Unexpected error in getUserPersonalBest:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// Action to get overall strength leaderboard (combines multiple exercises)
export async function getOverallStrengthLeaderboard(limit: number = 20) {
  const supabase = await createClient()

  try {
    // This would require a more complex function that aggregates across multiple exercises
    // For now, we'll use a simple approach with the most common compound movements
    const exercises = ['%bench%', '%deadlift%', '%squat%']
    
    const results = await Promise.all(
      exercises.map(pattern => 
        supabase.rpc('get_strength_leaderboard', {
          lift_type_pattern: pattern,
          result_limit: 100
        })
      )
    )

    // Aggregate results by user and calculate total strength score
    const userScores = new Map<string, { 
      user_id: string; 
      name: string; 
      profile_picture_url: string | null; 
      total_e1rm: number; 
      lifts: number 
    }>()

    results.forEach((result, index) => {
      if (result.data) {
        result.data.forEach((entry: LeaderboardEntry) => {
          const existing = userScores.get(entry.user_id)
          if (existing) {
            existing.total_e1rm += entry.best_e1rm
            existing.lifts += 1
          } else {
            userScores.set(entry.user_id, {
              user_id: entry.user_id,
              name: entry.name,
              profile_picture_url: entry.profile_picture_url,
              total_e1rm: entry.best_e1rm,
              lifts: 1
            })
          }
        })
      }
    })

    // Convert to array and sort by total e1RM
    const sortedUsers = Array.from(userScores.values())
      .filter(user => user.lifts >= 2) // Only include users with at least 2 lifts
      .sort((a, b) => b.total_e1rm - a.total_e1rm)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        name: user.name,
        profile_picture_url: user.profile_picture_url,
        total_e1rm: Math.round(user.total_e1rm),
        lifts: user.lifts
      }))

    return { success: true, data: sortedUsers }
  } catch (error) {
    console.error('Unexpected error in getOverallStrengthLeaderboard:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
} 