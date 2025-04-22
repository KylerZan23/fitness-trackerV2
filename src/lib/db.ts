import { supabase } from './supabase'
import { WorkoutFormData, WorkoutGroupData, WorkoutExerciseData } from './schemas'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz'
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
    let createdAt: Date
    let createdAtISO: string

    // If a workout date is provided, use it (interpreting it as local date)
    if (workout.workoutDate) {
      // The workoutDate is 'YYYY-MM-DD'. Create Date object.
      // IMPORTANT: new Date('YYYY-MM-DD') can be problematic as it assumes UTC midnight.
      // Better: Split and construct to avoid timezone pitfalls during Date creation from string.
      const [year, month, day] = workout.workoutDate.split('-').map(Number);
      // Create date representing noon in the *local* timezone of the server running this code.
      // This is still not perfect, but better than UTC midnight interpretation.
      // Ideally, we'd get the *user's* timezone here too, but logWorkout doesn't have it yet.
      // We set it to noon to avoid most date boundary issues when converting to ISOString.
      createdAt = new Date(year, month - 1, day, 12, 0, 0);
      createdAtISO = createdAt.toISOString(); // Convert to UTC ISO string for DB storage
      console.log(`Using provided date ${workout.workoutDate}, stored as UTC: ${createdAtISO}`)
    } else {
      // If no date provided, use current time (which will be UTC)
      createdAt = new Date()
      createdAtISO = createdAt.toISOString()
      console.log(`No date provided, using current time, stored as UTC: ${createdAtISO}`)
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
      created_at: createdAtISO // Store the UTC timestamp
      // Note: muscle_group column doesn't exist in the database yet
    }
    
    console.log('Attempting to insert workout with data:', workoutData)
    
    try {
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
      // Return the workout data, created_at remains the ISO string from DB
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
        muscleGroup: data.muscle_group,
        workoutDate: workout.workoutDate // Pass back the original date string if provided
      }
    } catch (insertError) {
      console.error('Error during database insert operation:', insertError);
      throw insertError;
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
      created_at: workout.created_at, // Return ISO string
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
 * Gets workout trends over time for the authenticated user, respecting user timezone
 * @param period - 'day' | 'week' | 'month'
 * @param userTimezone - IANA timezone name (e.g., 'America/Los_Angeles')
 * @returns Array of workout trends or empty array if there's an error
 */
export async function getWorkoutTrends(
  period: 'day' | 'week' | 'month' = 'week',
  userTimezone = 'UTC' // Default to UTC if not provided
): Promise<WorkoutTrend[]> {
  try {
    console.log(`Getting workout trends for period ${period}, timezone ${userTimezone}...`)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      console.log('No active session found when fetching workout trends')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)

    const now = new Date() // Current time in UTC
    const nowZoned = toZonedTime(now, userTimezone) // Use imported toZonedTime

    let startOfPeriodZoned: Date;
    let endOfPeriodZoned: Date; // Use end of period for fetching data range

    if (period === 'month') {
        startOfPeriodZoned = startOfMonth(nowZoned);
        endOfPeriodZoned = endOfMonth(nowZoned);
    } else if (period === 'week') {
        // Use Monday as the start of the week
        startOfPeriodZoned = startOfWeek(nowZoned, { weekStartsOn: 1 });
        // Ensure the end date captures the full week relative to the start
        endOfPeriodZoned = addDays(startOfPeriodZoned, 6);
        // We actually want end of the last day for the query
        endOfPeriodZoned = endOfDay(endOfPeriodZoned);
    } else { // 'day' - show last 7 days ending today
        endOfPeriodZoned = endOfDay(nowZoned); // End of today in user's timezone
        startOfPeriodZoned = startOfDay(addDays(nowZoned, -6)); // Start of 7 days ago in user's timezone
    }

    // Convert the period start/end from user's timezone back to UTC for the database query
    const startDateUTC = fromZonedTime(startOfPeriodZoned, userTimezone)
    const endDateUTC = fromZonedTime(endOfPeriodZoned, userTimezone)

    console.log(`Querying trends between UTC: ${startDateUTC.toISOString()} and ${endDateUTC.toISOString()}`)

    // Fetch individual workouts within the UTC range
    const { data, error } = await supabase
      .from('workouts')
      .select('created_at, weight, duration, sets, reps, exercise_name, notes, workout_group_id')
      .eq('user_id', session.user.id)
      .gte('created_at', startDateUTC.toISOString())
      .lte('created_at', endDateUTC.toISOString()) // Use lte for end of period
      .order('created_at')

    if (error) {
      console.error('Error fetching workout trends:', error)
      return []
    }

    // Fetch workout groups within the same UTC range
    const { data: workoutGroups, error: groupsError } = await supabase
      .from('workout_groups')
      .select('id, name, created_at, notes') // Include created_at for potential grouping later if needed
      .eq('user_id', session.user.id)
      .gte('created_at', startDateUTC.toISOString())
      .lte('created_at', endDateUTC.toISOString())

    if (groupsError) {
      console.error('Error fetching workout groups:', groupsError)
      // Continue without group names if there's an error
    }

    // Create a map of workout group IDs to names
    const groupNamesMap = new Map();
    if (workoutGroups && workoutGroups.length > 0) {
      workoutGroups.forEach(group => {
        groupNamesMap.set(group.id, group.name);
      });
    }

    if (data.length === 0 && (!workoutGroups || workoutGroups.length === 0)) {
      console.log('No workout trend data found for user in the period')
      // Still return empty array for the requested period if 'week' or 'day'
    } else {
       console.log(`Found trend data for ${data.length} workouts and ${workoutGroups ? workoutGroups.length : 0} workout groups`)
    }


    // Group workouts by the *user's local date*
    const trendsMap = data.reduce((acc, workout) => {
      // Convert the UTC timestamp from DB to the user's local date string
      const localDateStr = formatTz(toZonedTime(workout.created_at, userTimezone), 'yyyy-MM-dd', { timeZone: userTimezone })

      if (!acc[localDateStr]) {
        acc[localDateStr] = {
          date: localDateStr,
          count: 0,
          totalWeight: 0,
          totalDuration: 0,
          exerciseNames: [],
          notes: [],
          workoutNames: []
        }
      }
      acc[localDateStr].count += workout.sets || 0 // Count sets instead of workouts
      acc[localDateStr].totalWeight += workout.weight
      acc[localDateStr].totalDuration += workout.duration
      // Add exercise name if it exists and is not already in the array
      if (workout.exercise_name && !acc[localDateStr].exerciseNames!.includes(workout.exercise_name)) {
        acc[localDateStr].exerciseNames!.push(workout.exercise_name)
      }
      // Add notes if they exist and are not empty
      if (workout.notes) {
        acc[localDateStr].notes!.push(workout.notes)
      }
      // Add workout group name if it exists and is not already in the array
      if (workout.workout_group_id && groupNamesMap.has(workout.workout_group_id)) {
        const workoutName = groupNamesMap.get(workout.workout_group_id);
        if (workoutName && !acc[localDateStr].workoutNames!.includes(workoutName)) {
          acc[localDateStr].workoutNames!.push(workoutName);
        }
      }
      return acc
    }, {} as Record<string, WorkoutTrend>)

    // --- Generate result array, ensuring all days in the period are present ---

    const result: WorkoutTrend[] = [];
    let currentDate = startOfPeriodZoned; // Start iterating from the beginning of the period in user's timezone

    // Iterate day by day until the end of the period (use <= for end date comparison)
    while (currentDate <= endOfPeriodZoned) {
        const dateStr = formatTz(currentDate, 'yyyy-MM-dd', { timeZone: userTimezone });

        if (trendsMap[dateStr]) {
            result.push(trendsMap[dateStr]);
        } else {
            // Add empty data point for days with no workouts within the period
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
        // Move to the next day
        currentDate = addDays(currentDate, 1);
    }


    // If period is 'week' or 'day', the result array already contains the correct range.
    // If period is 'month', the result array also contains the full month.
    // The filtering logic now ensures we only return days within the calculated range.

    console.log(`Returning ${result.length} trend data points for period ${period}`);
    return result;

  } catch (error) {
    console.error(`Error fetching workout trends (tz: ${userTimezone}):`, error)
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
      // It's okay if profile doesn't exist yet (code PGRST116)
      if (error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
      }
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
    console.log('Workout group exercises count:', workoutGroup.exercises.length)
    
    // Determine the created_at timestamp (similar logic to logWorkout)
    let createdAt: Date
    let createdAtISO: string

    if (workoutGroup.workoutDate) {
      const [year, month, day] = workoutGroup.workoutDate.split('-').map(Number);
      // Create date representing noon in the *local* timezone of the server
      createdAt = new Date(year, month - 1, day, 12, 0, 0);
      createdAtISO = createdAt.toISOString();
      console.log(`Using provided date ${workoutGroup.workoutDate} for group, stored as UTC: ${createdAtISO}`)
    } else {
      createdAt = new Date()
      createdAtISO = createdAt.toISOString()
      console.log(`No date provided for group, using current time, stored as UTC: ${createdAtISO}`)
    }

    const workoutGroupData = {
      user_id: session.user.id,
      name: workoutGroup.name,
      duration: workoutGroup.duration,
      notes: workoutGroup.notes || null,
      created_at: createdAtISO // Use consistent UTC timestamp
    };
    
    console.log('Creating workout group with data:', workoutGroupData);
    
    // Start a transaction by creating the workout group first
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('workout_groups')
        .insert(workoutGroupData)
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
        notes: null, // Individual exercise notes not currently captured in group mode form
        workout_group_id: groupData.id,
        created_at: createdAtISO // Use the *same UTC timestamp* as the workout group
      }))
      
      console.log('Creating workout exercises:', exercisesData);
      
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
        id: groupData.id,
        user_id: groupData.user_id,
        name: groupData.name,
        duration: groupData.duration,
        notes: groupData.notes,
        created_at: groupData.created_at, // Return ISO string
        exercises: exercisesResult.map(ex => ({ ...ex, exerciseName: ex.exercise_name })) as Workout[] // Map db columns
      }
    } catch (dbError) {
      console.error('Database error in logWorkoutGroup:', dbError);
      throw dbError;
    }
  } catch (err) {
    console.error('Error in logWorkoutGroup:', err)
    return null
  }
}

/**
 * Retrieves workout statistics for the user's current local day, respecting timezone.
 * @param muscleGroup - Optional muscle group to filter by
 * @param userTimezone - IANA timezone name (e.g., 'America/Los_Angeles')
 * @returns Workout statistics or null if there's an error
 */
export async function getTodayWorkoutStats(
  userTimezone = 'UTC', // Default to UTC if not provided
  muscleGroup?: MuscleGroup
): Promise<WorkoutStats | null> {
  try {
    console.log(`Getting today's workout stats (tz: ${userTimezone})...`)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      console.log('No active session found')
      // Return empty stats object matching the expected structure
      return { totalWorkouts: 0, totalSets: 0, totalReps: 0, averageWeight: 0, averageDuration: 0, totalWeight: 0, totalDuration: 0 }
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)

    // --- Timezone Calculation ---
    const now = new Date(); // Current time in UTC
    // Get the start of the user's local day
    const startOfUserDay = startOfDay(toZonedTime(now, userTimezone));
    // Get the end of the user's local day (start of next day)
    const startOfUserNextDay = addDays(startOfUserDay, 1);

    // Convert these user-local start/end times back to UTC ISO strings for the query
    const startUtcISO = fromZonedTime(startOfUserDay, userTimezone).toISOString();
    const endUtcISO = fromZonedTime(startOfUserNextDay, userTimezone).toISOString();

    console.log(`Querying today's stats between UTC: ${startUtcISO} and ${endUtcISO}`)
    // --- End Timezone Calculation ---

    // Build query
    let query = supabase
      .from('workouts')
      .select('sets, reps, weight, duration')
      .eq('user_id', session.user.id)
      .gte('created_at', startUtcISO) // Use calculated UTC start
      .lt('created_at', endUtcISO)    // Use calculated UTC end (exclusive)

    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }

    // Complete the query
    const { data, error } = await query

    // Define the empty stats object once
    const emptyReturnStats: WorkoutStats = {
        totalWorkouts: 0, totalSets: 0, totalReps: 0, averageWeight: 0,
        averageDuration: 0, totalWeight: 0, totalDuration: 0
    };


    if (error) {
      console.error(`Error fetching today's workout stats (tz: ${userTimezone}):`, error)
      return emptyReturnStats;
    }

    if (data.length === 0) {
      console.log(`No workout data found for user today (tz: ${userTimezone})`)
      return emptyReturnStats;
    }

    console.log(`Found stats data for ${data.length} workouts today (tz: ${userTimezone})`)
    const stats = data.reduce((acc, workout) => ({
      // Ensure weight is parsed as float for correct summing
      totalWeight: acc.totalWeight + parseFloat(workout.weight?.toString() || '0'),
      totalDuration: acc.totalDuration + (workout.duration || 0),
      totalSets: acc.totalSets + (workout.sets || 0),
      // Calculate total reps correctly
      totalReps: acc.totalReps + ((workout.sets || 0) * (workout.reps || 0)),
      // Count actual workout entries returned
      totalWorkouts: acc.totalWorkouts + 1, // Correctly increment workout count
    }), {
      totalWorkouts: 0, // Start count from 0
      totalSets: 0,
      totalReps: 0,
      totalWeight: 0,
      totalDuration: 0,
    })

    // Avoid division by zero if somehow stats.totalWorkouts is 0 despite data.length > 0
    const numWorkouts = stats.totalWorkouts || 1; // Use 1 to prevent NaN if 0

    return {
      totalWorkouts: stats.totalWorkouts,
      totalSets: stats.totalSets,
      totalReps: stats.totalReps,
      // Calculate average based on the counted workouts
      averageWeight: Math.round((stats.totalWeight / numWorkouts) * 10) / 10,
      averageDuration: Math.round(stats.totalDuration / numWorkouts),
      // Return the calculated totals
      totalWeight: Math.round(stats.totalWeight),
      totalDuration: stats.totalDuration
    }
  } catch (error) {
    console.error(`Error calculating today's workout stats (tz: ${userTimezone}):`, error)
    // Return consistent empty object on catch
    return { totalWorkouts: 0, totalSets: 0, totalReps: 0, averageWeight: 0, averageDuration: 0, totalWeight: 0, totalDuration: 0 };
  }
} 