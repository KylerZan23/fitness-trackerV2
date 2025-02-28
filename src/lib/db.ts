import { supabase } from './supabase'
import { WorkoutFormData } from './schemas'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

export interface Workout extends WorkoutFormData {
  id: string
  user_id: string
  created_at: string
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

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: session.user.id,
        exercise_name: workout.exerciseName,
        sets: workout.sets,
        reps: workout.reps,
        weight: workout.weight,
        duration: workout.duration,
        notes: workout.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting workout:', error)
      throw error
    }

    console.log('Workout logged successfully')
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
    }
  } catch (error) {
    console.error('Error logging workout:', error)
    return null
  }
}

/**
 * Retrieves workouts for the authenticated user
 * @param limit - Maximum number of workouts to retrieve
 * @returns Array of workouts or empty array if there's an error
 */
export async function getWorkouts(limit = 10): Promise<Workout[]> {
  try {
    console.log('Getting workouts, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('No active session found when fetching workouts')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', session.user.id)
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
    }))
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return []
  }
}

/**
 * Gets workout statistics for the authenticated user
 * @returns Workout statistics or null if there's an error
 */
export async function getWorkoutStats(): Promise<WorkoutStats | null> {
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
    const { data, error } = await supabase
      .from('workouts')
      .select('sets, reps, weight, duration')
      .eq('user_id', session.user.id)

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
 * @param period - 'week' or 'month'
 * @returns Array of workout trends or empty array if there's an error
 */
export async function getWorkoutTrends(period: 'week' | 'month' = 'week'): Promise<WorkoutTrend[]> {
  try {
    console.log('Getting workout trends, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when fetching workout trends')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    const startDate = period === 'week' ? startOfWeek(new Date()) : startOfMonth(new Date())
    const endDate = period === 'week' ? endOfWeek(new Date()) : endOfMonth(new Date())

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
      const date = format(new Date(workout.created_at), 'yyyy-MM-dd')
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