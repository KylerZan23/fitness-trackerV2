import { supabase } from './supabase'
import { WorkoutFormData, WorkoutGroupData, WorkoutExerciseData } from './schemas'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addDays } from 'date-fns'
import { MuscleGroup, findMuscleGroupForExercise } from './types'

export interface Workout extends WorkoutFormData {
  id: string
  user_id: string
  created_at: string
  muscleGroup?: string
  workout_group_id?: string
}

export interface WorkoutGroup {
  id: string
  user_id: string
  name: string
  duration: number
  notes?: string
  created_at: string
  exercises: Workout[]
}

export interface WorkoutStats {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  averageWeight: number
  averageDuration: number
  totalWeight?: number
  totalDuration?: number
}

export interface WorkoutTrend {
  date: string
  count: number
  totalWeight: number
  totalDuration: number
  exerciseNames?: string[]
  notes?: string[]
  workoutNames?: string[]
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
    
    // Determine the created_at timestamp
    let createdAt = new Date().toISOString()
    
    // If a workout date is provided, set the timestamp to that date at noon (to avoid timezone issues)
    if (workout.workoutDate) {
      const workoutDate = new Date(workout.workoutDate)
      workoutDate.setHours(12, 0, 0, 0) // Set to noon on the specified date
      createdAt = workoutDate.toISOString()
    }
    
    // Create the workout data object
    const workoutData = {
      user_id: session.user.id,
      exercise_name: workout.exerciseName,
      sets: workout.sets,
      reps: workout.reps,
      weight: formattedWeight,
      duration: workout.duration,
      notes: workout.notes || null,
      created_at: createdAt
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
 * @param period - 'day' | 'week' | 'month'
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
    
    // Always get data for the last 7 days for weekly view
    const startDate = period === 'month' ? startOfMonth(new Date()) : 
                     // For 'week', get data for the current week (Monday to Sunday)
                     period === 'week' ? startOfWeek(new Date(), { weekStartsOn: 1 }) :
                     // For 'day', get data for the last 7 days
                     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const endDate = period === 'month' ? endOfMonth(new Date()) : 
                   period === 'week' ? addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6) :
                   new Date()

    // Fetch individual workouts
    const { data, error } = await supabase
      .from('workouts')
      .select('created_at, weight, duration, sets, reps, exercise_name, notes, workout_group_id')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at')

    if (error) {
      console.error('Error fetching workout trends:', error)
      return []
    }

    // Fetch workout groups to get their names
    const { data: workoutGroups, error: groupsError } = await supabase
      .from('workout_groups')
      .select('id, name, created_at, notes')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (groupsError) {
      console.error('Error fetching workout groups:', groupsError)
    }

    // Create a map of workout group IDs to names
    const groupNamesMap = new Map();
    if (workoutGroups && workoutGroups.length > 0) {
      workoutGroups.forEach(group => {
        groupNamesMap.set(group.id, group.name);
      });
    }

    if (data.length === 0 && (!workoutGroups || workoutGroups.length === 0)) {
      console.log('No workout trend data found for user')
      return []
    }

    console.log(`Found trend data for ${data.length} workouts and ${workoutGroups ? workoutGroups.length : 0} workout groups`)
    
    // Group workouts by date (always by day, regardless of period)
    const trendsMap = data.reduce((acc, workout) => {
      // Always format by day for consistent day-to-day tracking
      const date = format(new Date(workout.created_at), 'yyyy-MM-dd')
      
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalWeight: 0,
          totalDuration: 0,
          exerciseNames: [],
          notes: [],
          workoutNames: []
        }
      }
      acc[date].count += workout.sets || 0 // Count sets instead of workouts
      acc[date].totalWeight += workout.weight
      acc[date].totalDuration += workout.duration
      // Add exercise name if it exists and is not already in the array
      if (workout.exercise_name && !acc[date].exerciseNames!.includes(workout.exercise_name)) {
        acc[date].exerciseNames!.push(workout.exercise_name)
      }
      // Add notes if they exist and are not empty
      if (workout.notes) {
        acc[date].notes!.push(workout.notes)
      }
      // Add workout group name if it exists and is not already in the array
      if (workout.workout_group_id && groupNamesMap.has(workout.workout_group_id)) {
        const workoutName = groupNamesMap.get(workout.workout_group_id);
        if (workoutName && !acc[date].workoutNames!.includes(workoutName)) {
          acc[date].workoutNames!.push(workoutName);
        }
      }
      return acc
    }, {} as Record<string, WorkoutTrend>)

    // Add workout groups that might not have associated workouts
    if (workoutGroups && workoutGroups.length > 0) {
      workoutGroups.forEach(group => {
        const date = format(new Date(group.created_at), 'yyyy-MM-dd');
        if (!trendsMap[date]) {
          trendsMap[date] = {
            date,
            count: 0,
            totalWeight: 0,
            totalDuration: 0,
            exerciseNames: [],
            notes: [],
            workoutNames: []
          };
        }
        if (!trendsMap[date].workoutNames!.includes(group.name)) {
          trendsMap[date].workoutNames!.push(group.name);
        }
        // Add workout group notes if they exist and are not empty
        if (group.notes) {
          trendsMap[date].notes!.push(group.notes);
        }
      });
    }

    // For weekly view, ensure we have entries for all 7 days even if no workouts
    if (period === 'week' || period === 'day') {
      const result = [];
      const currentDate = new Date();
      const mondayOfThisWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
      
      // Create entries for Monday to Sunday
      for (let i = 0; i < 7; i++) {
        const date = addDays(mondayOfThisWeek, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (trendsMap[dateStr]) {
          result.push(trendsMap[dateStr]);
        } else {
          // Add empty data point for days with no workouts
          result.push({
            date: dateStr,
            count: 0,
            totalWeight: 0,
            totalDuration: 0,
            exerciseNames: [],
            notes: [],
            workoutNames: []
          });
        }
      }
      
      return result;
    }

    return Object.values(trendsMap)
  } catch (error) {
    console.error('Error fetching workout trends:', error)
    return []
  }
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

/**
 * Logs a workout group with multiple exercises for the authenticated user
 * @param workoutGroup - The workout group data containing multiple exercises
 * @returns The newly created workout group or null if there's an error
 */
export async function logWorkoutGroup(workoutGroup: WorkoutGroupData): Promise<WorkoutGroup | null> {
  try {
    console.log('Logging workout group, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when logging workout group')
      return null
    }
    
    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    // Determine the created_at timestamp
    let createdAt = new Date().toISOString()
    
    // If a workout date is provided, set the timestamp to that date at noon (to avoid timezone issues)
    if (workoutGroup.workoutDate) {
      const workoutDate = new Date(workoutGroup.workoutDate)
      workoutDate.setHours(12, 0, 0, 0) // Set to noon on the specified date
      createdAt = workoutDate.toISOString()
    }
    
    // Start a transaction by creating the workout group first
    const { data: groupData, error: groupError } = await supabase
      .from('workout_groups')
      .insert({
        user_id: session.user.id,
        name: workoutGroup.name,
        duration: workoutGroup.duration,
        notes: workoutGroup.notes || null,
        created_at: createdAt
      })
      .select()
      .single()
    
    if (groupError || !groupData) {
      console.error('Error creating workout group:', groupError)
      return null
    }
    
    console.log('Created workout group:', groupData)
    
    // Now add all the individual exercises linked to this group
    const exercisesData = workoutGroup.exercises.map(exercise => ({
      user_id: session.user.id,
      exercise_name: exercise.exerciseName,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: parseFloat(exercise.weight.toString()).toFixed(2),
      duration: Math.floor(workoutGroup.duration / workoutGroup.exercises.length), // Split duration evenly
      notes: null,
      workout_group_id: groupData.id,
      created_at: createdAt // Use the same created_at timestamp as the workout group
    }))
    
    const { data: exercisesResult, error: exercisesError } = await supabase
      .from('workouts')
      .insert(exercisesData)
      .select()
    
    if (exercisesError) {
      console.error('Error creating workout exercises:', exercisesError)
      // Attempt to delete the workout group since the exercises failed
      await supabase.from('workout_groups').delete().eq('id', groupData.id)
      return null
    }
    
    console.log('Created workout exercises:', exercisesResult)
    
    // Return the complete workout group with exercises
    return {
      ...groupData,
      exercises: exercisesResult as Workout[]
    }
  } catch (err) {
    console.error('Error in logWorkoutGroup:', err)
    return null
  }
}

/**
 * Retrieves workout statistics for the current day only for the authenticated user
 * @param muscleGroup - Optional muscle group to filter by
 * @returns Workout statistics or null if there's an error
 */
export async function getTodayWorkoutStats(muscleGroup?: MuscleGroup): Promise<WorkoutStats | null> {
  try {
    console.log('Getting today\'s workout stats, checking for active session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('No active session found when fetching today\'s workout stats')
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
        totalWeight: 0,
        totalDuration: 0
      }
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    
    // Get today's date at the start of the day (midnight)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISOString = today.toISOString()
    
    // Get tomorrow's date at the start of the day for the upper bound
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISOString = tomorrow.toISOString()
    
    console.log(`Filtering workouts between ${todayISOString} and ${tomorrowISOString}`)
    
    // Build query
    let query = supabase
      .from('workouts')
      .select('sets, reps, weight, duration')
      .eq('user_id', session.user.id)
      .gte('created_at', todayISOString)
      .lt('created_at', tomorrowISOString)
      
    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }
    
    // Complete the query
    const { data, error } = await query

    if (error) {
      console.error('Error fetching today\'s workout stats:', error)
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
        totalWeight: 0,
        totalDuration: 0
      }
    }

    if (data.length === 0) {
      console.log('No workout data found for user today')
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
        totalWeight: 0,
        totalDuration: 0
      }
    }

    console.log(`Found stats data for ${data.length} workouts today`)
    const stats = data.reduce((acc, workout) => ({
      totalWorkouts: acc.totalWorkouts + 1,
      totalSets: acc.totalSets + workout.sets,
      totalReps: acc.totalReps + (workout.sets * workout.reps),
      totalWeight: acc.totalWeight + parseFloat(workout.weight),
      totalDuration: acc.totalDuration + workout.duration,
    }), {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalWeight: 0,
      totalDuration: 0,
    })

    return {
      totalWorkouts: stats.totalWorkouts,
      totalSets: stats.totalSets,
      totalReps: stats.totalReps,
      averageWeight: data.length > 0 ? Math.round(stats.totalWeight / data.length) : 0,
      averageDuration: data.length > 0 ? Math.round(stats.totalDuration / data.length) : 0,
      totalWeight: Math.round(stats.totalWeight),
      totalDuration: stats.totalDuration
    }
  } catch (error) {
    console.error('Error calculating today\'s workout stats:', error)
    return null
  }
} 