import { supabase } from './supabase'
import { WorkoutFormData } from './schemas'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'
import { MuscleGroup, findMuscleGroupForExercise } from './types'

export interface Workout extends WorkoutFormData {
  id: string
  user_id: string
  created_at: string
  muscleGroup?: string
}

export interface WorkoutStats {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  averageWeight: number
  averageDuration: number
}

export interface WorkoutTrend {
  date: string
  count: number
  totalWeight: number
  totalDuration: number
}

/**
 * Logs a new workout for the authenticated user
 * @param workout - The workout data to log
 * @returns The newly created workout or null if there's an error
 */
export async function logWorkout(workout: WorkoutFormData): Promise<Workout | null> {
  try {
    console.log('Logging workout, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when logging workout')
      return null
    }

    // Convert weight to a decimal format to match database expectations
    const formattedWeight = parseFloat(workout.weight.toString()).toFixed(2)
    
    // Note: The muscle_group column doesn't exist in the database yet
    // This is just for logging purposes
    const muscleGroup = findMuscleGroupForExercise(workout.exerciseName)
    console.log(`Determined muscle group for "${workout.exerciseName}": ${muscleGroup} (for reference only)`)
    
    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    // Create the workout data object
    const workoutData = {
      user_id: session.user.id,
      exercise_name: workout.exerciseName,
      sets: workout.sets,
      reps: workout.reps,
      weight: formattedWeight,
      duration: workout.duration,
      notes: workout.notes || null,
      // Note: muscle_group column doesn't exist in the database yet
    }
    
    console.log('Attempting to insert workout with data:', workoutData)
    
    const { data, error } = await supabase
      .from('workouts')
      .insert(workoutData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting workout:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      
      // Check for specific error types
      if (error.code === '23502') {
        console.error('NOT NULL constraint violation - a required field is missing')
      } else if (error.code === '23503') {
        console.error('Foreign key constraint violation - referenced record does not exist')
      } else if (error.code === '23505') {
        console.error('Unique constraint violation - record already exists')
      } else if (error.code === '23514') {
        console.error('Check constraint violation - value outside allowed range')
      } else if (error.code === '42501') {
        console.error('Permission denied - RLS policy violation')
      }
      
      throw error
    }

    console.log('Workout logged successfully, returned data:', data)
    return {
      id: data.id,
      user_id: data.user_id,
      exerciseName: data.exercise_name,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      duration: data.duration,
      notes: data.notes,
      created_at: data.created_at,
      muscleGroup: data.muscle_group
    }
  } catch (error) {
    console.error('Error logging workout:', error)
    // Log more details if it's a Supabase error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Supabase error code:', (error as any).code)
      console.error('Supabase error message:', (error as any).message)
      console.error('Supabase error details:', (error as any).details)
    }
    return null
  }
}

/**
 * Retrieves workouts for the authenticated user
 * @param limit - Maximum number of workouts to retrieve
 * @param muscleGroup - Optional muscle group to filter by
 * @returns Array of workouts or empty array if there's an error
 */
export async function getWorkouts(limit = 10, muscleGroup?: MuscleGroup): Promise<Workout[]> {
  try {
    console.log('Getting workouts, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('No active session found when fetching workouts')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    // Build query
    let query = supabase
      .from('workouts')
      .select('*')
      .eq('user_id', session.user.id)
      
    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }
    
    // Complete the query
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.log('Error fetching workouts:', error.message)
      return []
    }

    console.log(`Found ${data.length} workouts for user`)
    return data.map(workout => ({
      id: workout.id,
      user_id: workout.user_id,
      exerciseName: workout.exercise_name,
      sets: workout.sets,
      reps: workout.reps,
      weight: workout.weight,
      duration: workout.duration,
      notes: workout.notes,
      created_at: workout.created_at,
      muscleGroup: workout.muscle_group
    }))
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return []
  }
}

/**
 * Gets workout statistics for the authenticated user
 * @param muscleGroup - Optional muscle group to filter by
 * @returns Workout statistics or null if there's an error
 */
export async function getWorkoutStats(muscleGroup?: MuscleGroup): Promise<WorkoutStats | null> {
  try {
    console.log('Getting workout stats, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when fetching workout stats')
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
      }
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    // Build query
    let query = supabase
      .from('workouts')
      .select('sets, reps, weight, duration')
      .eq('user_id', session.user.id)
      
    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }
    
    // Complete the query
    const { data, error } = await query

    if (error) {
      console.error('Error fetching workout stats:', error)
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
      }
    }

    if (data.length === 0) {
      console.log('No workout data found for user')
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
      }
    }

    console.log(`Found stats data for ${data.length} workouts`)
    const stats = data.reduce((acc, workout) => ({
      totalWorkouts: acc.totalWorkouts + 1,
      totalSets: acc.totalSets + workout.sets,
      totalReps: acc.totalReps + (workout.sets * workout.reps),
      totalWeight: acc.totalWeight + workout.weight,
      totalDuration: acc.totalDuration + workout.duration,
    }), {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalWeight: 0,
      totalDuration: 0,
    })

    return {
      ...stats,
      averageWeight: Math.round((stats.totalWeight / stats.totalWorkouts) * 10) / 10,
      averageDuration: Math.round(stats.totalDuration / stats.totalWorkouts),
    }
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return null
  }
}

/**
 * Gets workout trends over time for the authenticated user
 * @param period - 'day', 'week' or 'month'
 * @returns Array of workout trends or empty array if there's an error
 */
export async function getWorkoutTrends(period: 'day' | 'week' | 'month' = 'week'): Promise<WorkoutTrend[]> {
  try {
    console.log('Getting workout trends, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when fetching workout trends')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    const startDate = period === 'week' ? startOfWeek(new Date()) : 
                     period === 'month' ? startOfMonth(new Date()) :
                     // For 'day', get data for the last 7 days
                     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const endDate = period === 'week' ? endOfWeek(new Date()) : 
                   period === 'month' ? endOfMonth(new Date()) :
                   new Date()

    const { data, error } = await supabase
      .from('workouts')
      .select('created_at, weight, duration')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at')

    if (error) {
      console.error('Error fetching workout trends:', error)
      return []
    }

    if (data.length === 0) {
      console.log('No workout trend data found for user')
      return []
    }

    console.log(`Found trend data for ${data.length} workouts`)
    
    // Group workouts by date
    const trendsMap = data.reduce((acc, workout) => {
      // For 'day' period, include time in the format for individual workout entries
      const date = period === 'day' 
        ? format(new Date(workout.created_at), 'yyyy-MM-dd HH:mm') 
        : format(new Date(workout.created_at), 'yyyy-MM-dd')
      
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalWeight: 0,
          totalDuration: 0,
        }
      }
      acc[date].count++
      acc[date].totalWeight += workout.weight
      acc[date].totalDuration += workout.duration
      return acc
    }, {} as Record<string, WorkoutTrend>)

    return Object.values(trendsMap)
  } catch (error) {
    console.error('Error fetching workout trends:', error)
    return []
  }
}

/**
 * Placeholder for future Apple HealthKit integration
 */
export async function syncWithHealthKit(): Promise<boolean> {
  // TODO: Implement HealthKit integration
  console.log('HealthKit sync not yet implemented')
  return false
}

/**
 * Placeholder for future Google Fit integration
 */
export async function syncWithGoogleFit(): Promise<boolean> {
  // TODO: Implement Google Fit integration
  console.log('Google Fit sync not yet implemented')
  return false
}

/**
 * Gets the user profile for the authenticated user
 * @returns User profile or null if there's an error
 */
export async function getUserProfile() {
  try {
    console.log('Getting user profile, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when fetching user profile')
      return null
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
} 