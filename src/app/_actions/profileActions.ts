'use server'

import { createClient } from '@/utils/supabase/server'
import { getCurrentStrengthLevelsWithOnboarding } from '@/lib/utils/strengthCalculations'
import { calculateE1RM } from '@/lib/metrics/strength'
import { format, subDays, subMonths, parseISO } from 'date-fns'

// Types
export interface ProfileData {
  id: string
  name: string
  email: string
  age: number | null
  fitness_goals: string | null
  primary_training_focus: string | null
  experience_level: string | null
  professional_title: string | null
  bio: string | null
  height_cm: number | null
  weight_kg: number | null
  birth_date: string | null
  profile_picture_url: string | null
  weight_unit: 'kg' | 'lbs'
  onboarding_responses: any
  onboarding_completed: boolean
  followers_count: number
  following_count: number
  training_focuses: string[] | null
}

export interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  monthlyProgress: number
  unit: string
  achievedAt: string
}

export interface ActivityItem {
  id: string
  type: 'workout_completed' | 'pr_achieved' | 'user_followed' | 'post_created'
  data: {
    title: string
    subtitle?: string
    progress?: string
    badge?: string
  }
  created_at: string
}

export interface WorkoutStats {
  totalWorkouts: number
  personalRecordsCount: number
  totalWorkoutsThisMonth: number
  averageWorkoutsPerWeek: number
  mostActiveDay: string
  totalVolumeLifted: number
}

/**
 * Get comprehensive user profile data
 */
export async function getUserProfileData(): Promise<{ success: boolean; data?: ProfileData; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required. Please log in to view your profile.' }
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, name, email, age, fitness_goals, primary_training_focus, 
        experience_level, professional_title, bio, height_cm, weight_kg, 
        birth_date, profile_picture_url, weight_unit, onboarding_responses, 
        onboarding_completed, followers_count, following_count
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      
      // If the profile doesn't exist (PGRST116), create a basic profile
      if (profileError.code === 'PGRST116') {
        
        const basicProfile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          age: null,
          fitness_goals: null,
          primary_training_focus: null,
          experience_level: null,
          professional_title: null,
          bio: null,
          height_cm: null,
          weight_kg: null,
          birth_date: null,
          profile_picture_url: null,
          weight_unit: 'kg' as const,
          onboarding_responses: null,
          onboarding_completed: false
        }
        
        // Try to create the profile in the database
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(basicProfile)
        
        if (insertError) {
          console.error('Failed to create profile in database:', insertError)
        }
        
        // Get real follower counts from database
        const { data: followerCounts } = await supabase
          .from('profiles')
          .select('followers_count, following_count')
          .eq('id', user.id)
          .single()

        // Return the basic profile regardless of insert success
        const enhancedProfile: ProfileData = {
          ...basicProfile,
          followers_count: followerCounts?.followers_count || 0,
          following_count: followerCounts?.following_count || 0,
          training_focuses: null
        }
        
        return { success: true, data: enhancedProfile }
      }
      
      return { success: false, error: `Profile query failed: ${profileError.message}` }
    }

    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }

    // Add computed fields with real follower counts from database
    const enhancedProfile: ProfileData = {
      ...profile,
      weight_unit: profile.weight_unit || 'kg',
      followers_count: profile.followers_count || 0,
      following_count: profile.following_count || 0,
      training_focuses: profile.primary_training_focus ? [
        profile.primary_training_focus.toLowerCase(),
        'strength',
        'progressive'
      ] : null
    }

    return { success: true, data: enhancedProfile }
  } catch (error) {
    console.error('ERROR in getUserProfileData:', error)
    return { success: false, error: 'An unexpected error occurred while loading your profile' }
  }
}

/**
 * Get user workout statistics
 */
export async function getUserWorkoutStats(): Promise<{ success: boolean; data?: WorkoutStats; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get workouts from the last 12 months for statistics
    const oneYearAgo = subMonths(new Date(), 12)
    const oneMonthAgo = subMonths(new Date(), 1)

    const { data: allWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, exercise_name, weight, reps, sets, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneYearAgo.toISOString())
      .order('created_at', { ascending: false })

    if (workoutsError) {
      return { success: false, error: 'Failed to load workout data' }
    }

    const workouts = allWorkouts || []

    // Calculate statistics
    const totalWorkouts = workouts.length
    
    const thisMonthWorkouts = workouts.filter(w => 
      new Date(w.created_at) >= oneMonthAgo
    )
    const totalWorkoutsThisMonth = thisMonthWorkouts.length

    // Calculate average workouts per week (last 8 weeks)
    const eightWeeksAgo = subDays(new Date(), 56)
    const recentWorkouts = workouts.filter(w => 
      new Date(w.created_at) >= eightWeeksAgo
    )
    const averageWorkoutsPerWeek = Math.round(recentWorkouts.length / 8 * 10) / 10

    // Find most active day of the week
    const dayOfWeekCounts: Record<string, number> = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    }
    workouts.forEach(workout => {
      const dayName = format(new Date(workout.created_at), 'EEEE')
      dayOfWeekCounts[dayName]++
    })
    const mostActiveDay = Object.entries(dayOfWeekCounts)
      .reduce((a, b) => dayOfWeekCounts[a[0]] > dayOfWeekCounts[b[0]] ? a : b)[0]

    // Calculate total volume lifted (rough estimate)
    const totalVolumeLifted = workouts.reduce((total, workout) => {
      return total + (workout.weight * workout.reps * workout.sets)
    }, 0)

    // Count personal records (unique exercises with best e1RM)
    const exerciseMap = new Map<string, number>()
    workouts.forEach(workout => {
      const exercise = workout.exercise_name.toLowerCase()
      const e1rm = calculateE1RM(workout.weight, workout.reps)
      if (!exerciseMap.has(exercise) || exerciseMap.get(exercise)! < e1rm) {
        exerciseMap.set(exercise, e1rm)
      }
    })
    const personalRecordsCount = exerciseMap.size

    const stats: WorkoutStats = {
      totalWorkouts,
      personalRecordsCount,
      totalWorkoutsThisMonth,
      averageWorkoutsPerWeek,
      mostActiveDay,
      totalVolumeLifted: Math.round(totalVolumeLifted)
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('ERROR in getUserWorkoutStats:', error)
    return { success: false, error: 'Failed to calculate workout statistics' }
  }
}

/**
 * Get user personal records for main lifts
 */
export async function getUserPersonalRecords(weightUnit: 'kg' | 'lbs' = 'kg'): Promise<{ success: boolean; data?: PersonalRecord[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get recent workouts for strength calculation
    const sixMonthsAgo = subMonths(new Date(), 6)
    
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('exercise_name, weight, reps, sets, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    if (workoutsError) {
      return { success: false, error: 'Failed to load workout data' }
    }

    // Get profile for onboarding data
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_responses')
      .eq('id', user.id)
      .single()

    const workoutData = (workouts || []).map(w => ({
      exercise_name: w.exercise_name,
      weight: parseFloat(w.weight.toString()),
      reps: w.reps,
      sets: w.sets,
      created_at: w.created_at
    }))

    // Calculate current strength levels
    const strengthLevels = getCurrentStrengthLevelsWithOnboarding(
      workoutData,
      profile?.onboarding_responses
    )

    // Convert to PersonalRecord format with monthly progress
    const records: PersonalRecord[] = []
    const exerciseMap = {
      squat: 'Squat',
      bench: 'Bench Press',
      deadlift: 'Deadlift',
      overhead_press: 'Overhead Press'
    }

    for (const [key, displayName] of Object.entries(exerciseMap)) {
      const strengthData = strengthLevels[key]
      if (strengthData && strengthData.value) {
        // Calculate monthly progress by comparing with 30 days ago
        const monthlyProgress = await calculateMonthlyProgress(
          supabase, user.id, key, strengthData.value, weightUnit
        )

        records.push({
          exerciseName: displayName,
          weight: Math.round(strengthData.value),
          reps: 1, // e1RM is always 1 rep
          monthlyProgress,
          unit: weightUnit,
          achievedAt: strengthData.date || new Date().toISOString()
        })
      }
    }

    return { success: true, data: records }
  } catch (error) {
    console.error('ERROR in getUserPersonalRecords:', error)
    return { success: false, error: 'Failed to load personal records' }
  }
}

/**
 * Calculate monthly progress for a specific exercise
 */
async function calculateMonthlyProgress(
  supabase: any,
  userId: string,
  exerciseType: string,
  currentE1RM: number,
  weightUnit: 'kg' | 'lbs'
): Promise<number> {
  try {
    const oneMonthAgo = subMonths(new Date(), 1)
    
    // Get exercise name patterns for the lift type
    const exercisePatterns = {
      squat: ['squat', 'back squat', 'front squat'],
      bench: ['bench press', 'bench', 'barbell bench'],
      deadlift: ['deadlift', 'conventional deadlift', 'sumo deadlift'],
      overhead_press: ['overhead press', 'military press', 'shoulder press', 'ohp']
    }

    const patterns = exercisePatterns[exerciseType as keyof typeof exercisePatterns] || []
    
    const { data: oldWorkouts } = await supabase
      .from('workouts')
      .select('weight, reps')
      .eq('user_id', userId)
      .or(patterns.map(pattern => `exercise_name.ilike.%${pattern}%`).join(','))
      .lte('created_at', oneMonthAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (!oldWorkouts || oldWorkouts.length === 0) {
      return 0
    }

    // Find best e1RM from a month ago
    const bestOldE1RM = Math.max(...oldWorkouts.map((w: { weight: number; reps: number }) => 
      calculateE1RM(parseFloat(w.weight.toString()), w.reps)
    ))

    const progress = currentE1RM - bestOldE1RM
    return Math.round(progress * 10) / 10 // Round to 1 decimal place
  } catch (error) {
    console.error('ERROR in calculateMonthlyProgress:', error)
    return 0
  }
}

/**
 * Get user activity feed from community events and workouts
 */
export async function getUserActivityFeed(limit: number = 10): Promise<{ success: boolean; data?: ActivityItem[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const activities: ActivityItem[] = []

    // Get community feed events
    const { data: feedEvents, error: feedError } = await supabase
      .from('community_feed_events')
      .select('id, event_type, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!feedError && feedEvents) {
      feedEvents.forEach(event => {
        const activity = mapFeedEventToActivity(event)
        if (activity) {
          activities.push(activity)
        }
      })
    }

    // If we don't have enough activities, add recent workouts
    if (activities.length < limit) {
      const workoutLimit = limit - activities.length
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('id, exercise_name, sets, reps, weight, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(workoutLimit)

      if (recentWorkouts) {
        recentWorkouts.forEach(workout => {
          activities.push({
            id: `workout-${workout.id}`,
            type: 'workout_completed',
            data: {
              title: `Completed ${workout.exercise_name}`,
              subtitle: `${workout.sets} sets × ${workout.reps} reps`,
              badge: workout.weight > 100 ? 'Strong' : undefined
            },
            created_at: workout.created_at
          })
        })
      }
    }

    // Sort all activities by date
    activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return { success: true, data: activities.slice(0, limit) }
  } catch (error) {
    console.error('ERROR in getUserActivityFeed:', error)
    return { success: false, error: 'Failed to load activity feed' }
  }
}

/**
 * Update basic profile information
 */
export async function updateProfileBasicInfo(data: {
  age?: number | null
  height_cm?: number | null
  weight_kg?: number | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    if (data.age !== undefined && data.age !== null && (data.age < 13 || data.age > 120)) {
      return { success: false, error: 'Age must be between 13 and 120 years' }
    }

    if (data.height_cm !== undefined && data.height_cm !== null && (data.height_cm < 100 || data.height_cm > 250)) {
      return { success: false, error: 'Height must be between 100cm and 250cm' }
    }

    if (data.weight_kg !== undefined && data.weight_kg !== null && (data.weight_kg < 30 || data.weight_kg > 300)) {
      return { success: false, error: 'Weight must be between 30kg and 300kg' }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { success: false, error: 'Failed to update profile information' }
    }

    return { success: true }

  } catch (error) {
    console.error('ERROR in updateProfileBasicInfo:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update profile picture URL
 */
export async function updateProfilePicture(pictureUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: pictureUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile picture update error:', updateError)
      return { success: false, error: 'Failed to update profile picture' }
    }

    return { success: true }

  } catch (error) {
    console.error('ERROR in updateProfilePicture:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update or create a personal record by adding/updating workout data
 */
export async function updatePersonalRecord(data: {
  exerciseName: string
  weight: number
  reps: number
  achievedAt?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    if (data.weight <= 0 || data.weight > 1000) {
      return { success: false, error: 'Weight must be between 0 and 1000' }
    }

    if (data.reps <= 0 || data.reps > 100) {
      return { success: false, error: 'Reps must be between 1 and 100' }
    }

    const validExercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']
    if (!validExercises.includes(data.exerciseName)) {
      return { success: false, error: 'Invalid exercise name' }
    }

    // Map display names to database names
    const exerciseMap: { [key: string]: string } = {
      'Squat': 'squat',
      'Bench Press': 'bench_press',
      'Deadlift': 'deadlift',
      'Overhead Press': 'overhead_press'
    }

    const dbExerciseName = exerciseMap[data.exerciseName]
    const achievedAt = data.achievedAt ? new Date(data.achievedAt) : new Date()

    // Check if this is actually a better record than existing ones
    const { data: existingWorkouts, error: fetchError } = await supabase
      .from('workouts')
      .select('weight, reps, created_at')
      .eq('user_id', user.id)
      .eq('exercise_name', dbExerciseName)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching existing workouts:', fetchError)
      return { success: false, error: 'Failed to validate personal record' }
    }

    // Calculate E1RM for the new record
    const newE1RM = calculateE1RM(data.weight, data.reps)

    // Check if this is actually a personal record
    if (existingWorkouts && existingWorkouts.length > 0) {
      const bestExistingE1RM = Math.max(...existingWorkouts.map(w => 
        calculateE1RM(parseFloat(w.weight.toString()), w.reps)
      ))

      if (newE1RM <= bestExistingE1RM) {
        return { 
          success: false, 
          error: `This is not a personal record. Your current best E1RM is ${Math.round(bestExistingE1RM)}` 
        }
      }
    }

    // Insert the new workout record
    const { error: insertError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        exercise_name: dbExerciseName,
        weight: data.weight,
        reps: data.reps,
        sets: 1, // Single rep max
        duration: 0, // Required field, set to 0 for PR records
        created_at: achievedAt.toISOString()
      })

    if (insertError) {
      console.error('Error inserting workout record:', insertError)
      return { success: false, error: 'Failed to save personal record' }
    }

    return { success: true }

  } catch (error) {
    console.error('ERROR in updatePersonalRecord:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a personal record by removing the best workout for that exercise
 */
export async function deletePersonalRecord(exerciseName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Map display names to database names
    const exerciseMap: { [key: string]: string } = {
      'Squat': 'squat',
      'Bench Press': 'bench_press',
      'Deadlift': 'deadlift',
      'Overhead Press': 'overhead_press'
    }

    const dbExerciseName = exerciseMap[exerciseName]
    if (!dbExerciseName) {
      return { success: false, error: 'Invalid exercise name' }
    }

    // Find the best workout for this exercise
    const { data: workouts, error: fetchError } = await supabase
      .from('workouts')
      .select('id, weight, reps')
      .eq('user_id', user.id)
      .eq('exercise_name', dbExerciseName)

    if (fetchError) {
      console.error('Error fetching workouts:', fetchError)
      return { success: false, error: 'Failed to find personal record' }
    }

    if (!workouts || workouts.length === 0) {
      return { success: false, error: 'No personal record found for this exercise' }
    }

    // Find the workout with the highest E1RM
    let bestWorkout = workouts[0]
    let bestE1RM = calculateE1RM(parseFloat(bestWorkout.weight.toString()), bestWorkout.reps)

    for (const workout of workouts) {
      const e1rm = calculateE1RM(parseFloat(workout.weight.toString()), workout.reps)
      if (e1rm > bestE1RM) {
        bestE1RM = e1rm
        bestWorkout = workout
      }
    }

    // Delete the best workout
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', bestWorkout.id)

    if (deleteError) {
      console.error('Error deleting workout:', deleteError)
      return { success: false, error: 'Failed to delete personal record' }
    }

    return { success: true }

  } catch (error) {
    console.error('ERROR in deletePersonalRecord:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Map community feed event to activity item
 */
function mapFeedEventToActivity(event: any): ActivityItem | null {
  try {
    const baseActivity = {
      id: event.id,
      created_at: event.created_at
    }

    switch (event.event_type) {
      case 'WORKOUT_COMPLETED':
        return {
          ...baseActivity,
          type: 'workout_completed' as const,
          data: {
            title: event.metadata.title || 'Completed Workout',
            subtitle: event.metadata.exercises ? `${event.metadata.exercises} exercises` : undefined,
            badge: event.metadata.duration > 60 ? 'Strong Session' : undefined
          }
        }
      
      case 'NEW_PB':
        return {
          ...baseActivity,
          type: 'pr_achieved' as const,
          data: {
            title: `New ${event.metadata.exercise || 'Exercise'} PR: ${event.metadata.weight || ''}${event.metadata.unit || ''}`,
            progress: event.metadata.improvement ? `+${event.metadata.improvement}${event.metadata.unit || ''}` : undefined
          }
        }
      
      case 'STREAK_MILESTONE':
        return {
          ...baseActivity,
          type: 'workout_completed' as const,
          data: {
            title: `${event.metadata.streak_days || ''} Day Workout Streak!`,
            badge: 'Streak'
          }
        }
      
      case 'NEW_POST':
        return {
          ...baseActivity,
          type: 'post_created' as const,
          data: {
            title: `Posted: ${event.metadata.title || 'New Post'}`,
            subtitle: event.metadata.group ? `in ${event.metadata.group}` : undefined
          }
        }
      
      default:
        return null
    }
  } catch (error) {
    console.error('ERROR in mapFeedEventToActivity:', error)
    return null
  }
} 

 