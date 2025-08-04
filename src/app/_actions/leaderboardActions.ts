'use server'

import { getWorkoutsForLeaderboard, getProfilesForOneRMLeaderboard } from '@/lib/data/leaderboard'
import { getAuthenticatedUser } from '@/lib/data/auth';

import { revalidatePath } from 'next/cache'
import { calculateE1RM, isValidForE1RM } from '@/lib/utils/strengthCalculations'

export type LeaderboardLift = 'squat' | 'bench' | 'deadlift'
export type LeaderboardMode = 'e1rm' | '1rm'

export type LeaderboardEntry = {
  rank: number
  user_id: string
  name: string
  profile_picture_url: string | null
  best_e1rm: number
  weight: number
  reps: number
  lift_date: string
}

export type OneRMLeaderboardEntry = {
  rank: number
  user_id: string
  name: string
  profile_picture_url: string | null
  one_rm_value: number
  assessment_type: 'actual_1rm' | 'estimated_1rm' | 'unsure'
  weight_unit: 'kg' | 'lbs'
}

export type UserRankData = {
  rank: number
  best_e1rm: number
}

export type UserOneRMRankData = {
  rank: number
  one_rm_value: number
  assessment_type: 'actual_1rm' | 'estimated_1rm' | 'unsure'
}

// Refactored e1RM leaderboard function
export async function getLeaderboardData(
  liftType: LeaderboardLift,
  limit: number = 100
): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {


  const { success, data: workouts, error } = await getWorkoutsForLeaderboard(liftType);

  if (!success || !workouts) {
    return { success: false, error: error || 'Failed to load leaderboard.' };
  }

  try {

    const userBestLifts: { [key: string]: LeaderboardEntry } = {}

    for (const workout of workouts) {
      if (isValidForE1RM(workout.weight, workout.reps)) {
        const e1rm = calculateE1RM(workout.weight, workout.reps)

        if (!userBestLifts[workout.user_id] || e1rm > userBestLifts[workout.user_id].best_e1rm) {
          const profile = Array.isArray(workout.profiles) ? workout.profiles[0] : workout.profiles;
          userBestLifts[workout.user_id] = {
            rank: 0,
            user_id: workout.user_id,
            name: profile?.name || 'Anonymous',
            profile_picture_url: profile?.profile_picture_url,
            best_e1rm: e1rm,
            weight: workout.weight,
            reps: workout.reps,
            lift_date: workout.created_at,
          }
        }
      }
    }

    const leaderboard = Object.values(userBestLifts)
      .sort((a, b) => b.best_e1rm - a.best_e1rm)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return { success: true, data: leaderboard }
  } catch (error) {
    console.error('Unexpected error in getLeaderboardData:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// New 1RM leaderboard function
export async function getOneRMLeaderboardData(
  liftType: LeaderboardLift
): Promise<{ success: boolean; data?: OneRMLeaderboardEntry[]; error?: string }> {


  const { success, data, error } = await getProfilesForOneRMLeaderboard();

  if (!success || !data) {
    return { success: false, error: error || 'Failed to load 1RM leaderboard.' };
  }

  try {

    const leaderboardEntries: OneRMLeaderboardEntry[] = []

    // Map lift type to response key
    const liftKeyMap: Record<LeaderboardLift, string> = {
      squat: 'squat1RMEstimate',
      bench: 'benchPress1RMEstimate',
      deadlift: 'deadlift1RMEstimate'
    }

    const liftKey = liftKeyMap[liftType]

    data.forEach(profile => {
      const responses = profile.onboarding_responses
      if (!responses) return

      const oneRMValue = responses[liftKey]
      const assessmentType = responses.strengthAssessmentType || 'unsure'

      if (oneRMValue && oneRMValue > 0 && assessmentType === 'actual_1rm') {
        let weightInKg = Number(oneRMValue)
        const userUnit = profile.weight_unit || 'lbs'

        if (userUnit === 'lbs') {
          weightInKg = weightInKg * 0.453592
        }

        leaderboardEntries.push({
          rank: 0,
          user_id: profile.id,
          name: profile.name || 'Anonymous',
          profile_picture_url: profile.profile_picture_url,
          one_rm_value: weightInKg,
          assessment_type: assessmentType as 'actual_1rm' | 'estimated_1rm' | 'unsure',
          weight_unit: userUnit as 'kg' | 'lbs',
        })
      }
    })

    leaderboardEntries.sort((a, b) => b.one_rm_value - a.one_rm_value)
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return { success: true, data: leaderboardEntries }
  } catch (error) {
    console.error('Unexpected error in getOneRMLeaderboardData:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// Refactored function to get user's rank
export async function getUserRankForLift(
  liftType: LeaderboardLift
): Promise<{ success: boolean; data?: UserRankData; error?: string }> {

  const { success: authSuccess, user, error: authError } = await getAuthenticatedUser();

  if (!authSuccess || !user) {
    return { success: false, error: authError || 'User not authenticated.' };
  }

  const leaderboardResult = await getLeaderboardData(liftType, 1000) // Fetch a larger limit to find the user

  if (!leaderboardResult.success || !leaderboardResult.data) {
    return { success: false, error: 'Failed to calculate rank.' }
  }

  const userEntry = leaderboardResult.data.find(entry => entry.user_id === user.id)

  if (!userEntry) {
    return { success: false, error: 'No rank found for this lift type.' }
  }

  return {
    success: true,
    data: {
      rank: userEntry.rank,
      best_e1rm: userEntry.best_e1rm,
    },
  }
}

// New function to get user's 1RM rank
export async function getUserOneRMRank(
  liftType: LeaderboardLift
): Promise<{ success: boolean; data?: UserOneRMRankData; error?: string }> {

  const { success: authSuccess, user, error: authError } = await getAuthenticatedUser();

  if (!authSuccess || !user) {
    return { success: false, error: authError || 'User not authenticated.' };
  }

  const leaderboardResult = await getOneRMLeaderboardData(liftType)

  if (!leaderboardResult.success || !leaderboardResult.data) {
    return { success: false, error: 'Failed to calculate rank.' }
  }

  const userEntry = leaderboardResult.data.find(entry => entry.user_id === user.id)

  if (!userEntry) {
    return {
      success: false,
      error: 'No actual 1RM data found for this lift. Only tested 1RM values are included in this leaderboard.',
    }
  }

  return {
    success: true,
    data: {
      rank: userEntry.rank,
      one_rm_value: userEntry.one_rm_value,
      assessment_type: userEntry.assessment_type,
    },
  }
}

// Refactored action to get user's rank
export async function getCurrentUserRank(liftType: LeaderboardLift) {
  const result = await getUserRankForLift(liftType)
  if (!result.success) {
    return { success: true, data: null } // No rank found
  }
  return result
}

// Refactored action to get leaderboards for common exercises
export async function getCommonStrengthLeaderboards() {
  const exercises = [
    { name: 'Bench Press', liftType: 'bench' as LeaderboardLift },
    { name: 'Deadlift', liftType: 'deadlift' as LeaderboardLift },
    { name: 'Squat', liftType: 'squat' as LeaderboardLift },
  ]

  const results = await Promise.allSettled(
    exercises.map(async exercise => {
      const result = await getLeaderboardData(exercise.liftType, 10)
      return {
        exercise: exercise.name,
        success: result.success,
        data: result.data || null,
        error: result.error || null,
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
        error: 'Failed to load data',
      }
    }
  })
}

// Refactored action to get user's personal best
export async function getUserPersonalBest(exercisePattern: string) {
  // This function is now redundant with getUserRankForLift, but we can keep it for compatibility
  const liftType = exercisePattern.includes('squat')
    ? 'squat'
    : exercisePattern.includes('bench')
    ? 'bench'
    : 'deadlift'
  const result = await getUserRankForLift(liftType)
  if (result.success && result.data) {
    // Find the full entry from the leaderboard to return all data
    const leaderboardResult = await getLeaderboardData(liftType, 1000)
    const userEntry = leaderboardResult.data?.find(entry => entry.rank === result.data?.rank)
    return { success: true, data: userEntry }
  }
  return { success: false, error: 'No personal best found for this exercise.' }
}

// Refactored action for overall strength leaderboard
export async function getOverallStrengthLeaderboard(limit: number = 20) {
  const exercises: LeaderboardLift[] = ['bench', 'deadlift', 'squat']

  const results = await Promise.all(exercises.map(liftType => getLeaderboardData(liftType, 500)))

  const userScores = new Map<
    string,
    {
      user_id: string
      name: string
      profile_picture_url: string | null
      total_e1rm: number
      lifts: number
    }
  >()

  results.forEach(result => {
    if (result.success && result.data) {
      result.data.forEach(entry => {
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
            lifts: 1,
          })
        }
      })
    }
  })

  const sortedUsers = Array.from(userScores.values())
    .filter(user => user.lifts >= 2) // Only include users with at least 2 lifts
    .sort((a, b) => b.total_e1rm - a.total_e1rm)
    .slice(0, limit)
    .map((user, index) => ({
      rank: index + 1,
      ...user,
      total_e1rm: Math.round(user.total_e1rm),
    }))

  return { success: true, data: sortedUsers }
}
