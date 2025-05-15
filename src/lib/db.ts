import { supabase } from './supabase'
import { WorkoutFormData, WorkoutGroupData, WorkoutExerciseData } from './schemas'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, startOfDay, endOfDay, subWeeks } from 'date-fns'
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

// Define a simpler type for the historical workout view
export interface HistoricalWorkout {
  id: string;
  created_at: string; // ISO string
  duration: number; // minutes
  exerciseName: string;
  type?: 'lift' | 'run' | 'other'; // Add this
  distance?: number; // in meters for runs
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
 * Retrieves aggregated workout trends for the last N weeks for the authenticated user.
 * Data is aggregated per day (YYYY-MM-DD format based on user's timezone).
 *
 * @param numberOfWeeks - The number of past weeks (including the current week) to fetch data for.
 * @param userTimezone - The IANA timezone string of the user (e.g., 'America/New_York'). Defaults to 'UTC'.
 * @returns Array of daily workout trends or empty array if there's an error.
 */
export async function getWorkoutTrends(
  numberOfWeeks = 8, // Default to fetching the last 8 weeks
  userTimezone = 'UTC' // Default to UTC if not provided
): Promise<WorkoutTrend[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('No active session found when fetching workout trends')
      return []
    }
    console.log(`Fetching trends for user ${session.user.id.substring(0, 6)}... Timezone: ${userTimezone}, Weeks: ${numberOfWeeks}`) 

    // 1. Determine Date Range in User's Timezone
    const nowInUserTz = toZonedTime(new Date(), userTimezone)
    // Get the end of the current week (Sunday night) in the user's timezone
    const endOfCurrentWeek = endOfWeek(nowInUserTz, { weekStartsOn: 1 }) // weekStartsOn: 1 for Monday
    // Get the start of the period (Monday N weeks ago) in the user's timezone
    // Subtract (numberOfWeeks - 1) because startOfWeek gives the *current* week's Monday
    const startOfPeriod = startOfWeek(subWeeks(nowInUserTz, numberOfWeeks - 1), { weekStartsOn: 1 })

    // 2. Convert Range to UTC ISO Strings for Database Query
    // The database stores created_at in UTC.
    const startDateUTC = fromZonedTime(startOfPeriod, userTimezone).toISOString()
    const endDateUTC = fromZonedTime(endOfCurrentWeek, userTimezone).toISOString()

    console.log(`Querying workouts from ${startDateUTC} to ${endDateUTC} (UTC)`) 

    // 3. Fetch Raw Workout Data within the UTC date range
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('created_at, duration, weight, exercise_name, notes, workout_group_id') // Select needed fields
      .eq('user_id', session.user.id)
      .gte('created_at', startDateUTC)
      .lte('created_at', endDateUTC)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching workout data for trends:', error.message)
      return []
    }

    if (!workouts || workouts.length === 0) {
      console.log('No workouts found within the date range for trends.')
      return []
    }
    console.log(`Fetched ${workouts.length} raw workouts for trend aggregation.`) 

    // 4. Aggregate Data by Day (in User's Timezone)
    const trendsMap = new Map<string, WorkoutTrend>()

    // Fetch associated workout group names if needed (optimization: fetch once)
    const groupIds = workouts.map(w => w.workout_group_id).filter((id): id is string => !!id);
    let groupNamesMap = new Map<string, string>();
    if (groupIds.length > 0) {
        const { data: groups, error: groupError } = await supabase
            .from('workout_groups')
            .select('id, name')
            .in('id', Array.from(new Set(groupIds)));
        if (groupError) {
            console.error('Error fetching workout group names:', groupError);
            // Proceed without group names if error occurs
        } else if (groups) {
            groups.forEach(group => groupNamesMap.set(group.id, group.name));
            console.log(`Fetched ${groupNamesMap.size} workout group names.`);
        }
    }


    workouts.forEach(workout => {
      // Convert the UTC timestamp from DB back to user's timezone
      const createdAtUserTz = toZonedTime(workout.created_at, userTimezone)
      // Format date as YYYY-MM-DD based on user's timezone
      const dateString = formatTz(createdAtUserTz, 'yyyy-MM-dd', { timeZone: userTimezone })

      const workoutGroupName = workout.workout_group_id ? groupNamesMap.get(workout.workout_group_id) : undefined;

      if (trendsMap.has(dateString)) {
        const existing = trendsMap.get(dateString)!
        existing.count += 1
        existing.totalDuration += workout.duration ?? 0
        existing.totalWeight += workout.weight ?? 0
        if (workout.exercise_name) {
             existing.exerciseNames = [...(existing.exerciseNames ?? []), workout.exercise_name];
        }
         if (workout.notes) {
             existing.notes = [...(existing.notes ?? []), workout.notes];
         }
         if (workoutGroupName) {
             existing.workoutNames = [...(existing.workoutNames ?? []), workoutGroupName];
         }
      } else {
        trendsMap.set(dateString, {
          date: dateString,
          count: 1,
          totalDuration: workout.duration ?? 0,
          totalWeight: workout.weight ?? 0,
          exerciseNames: workout.exercise_name ? [workout.exercise_name] : [],
          notes: workout.notes ? [workout.notes] : [],
          workoutNames: workoutGroupName ? [workoutGroupName] : [],
        })
      }
    })

    // 5. Convert Map to Array
    const trendsArray = Array.from(trendsMap.values())
    // Sort by date just in case (though fetch order should handle it)
    trendsArray.sort((a, b) => a.date.localeCompare(b.date))

    console.log(`Aggregated trends for ${trendsArray.length} days.`) 
    return trendsArray

  } catch (error) {
    console.error('Error in getWorkoutTrends:', error)
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

/**
 * Retrieves all workouts for the authenticated user, ordered by date.
 * Intended for historical views like the monthly calendar log.
 * @returns Array of workouts or empty array if there's an error or no user.
 */
export async function getAllWorkouts(): Promise<HistoricalWorkout[]> {
  try {
    console.log('Getting all workouts, checking for active session...');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No active session found when fetching all workouts');
      return [];
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}... Fetching all workouts.`);

    // Select only necessary fields and order by date
    const { data, error } = await supabase
      .from('workouts')
      .select('id, created_at, duration, exercise_name')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching all workouts:', error);
      return [];
    }

    if (!data) {
        console.log('No workout data found for user.');
        return [];
    }

    console.log(`Found ${data.length} total workouts for user.`);

    // Map database fields to our simpler interface
    return data.map(workout => ({
      id: workout.id,
      created_at: workout.created_at,
      duration: workout.duration ?? 0, // Handle potential null duration
      exerciseName: workout.exercise_name ?? 'Unknown Exercise' // Handle potential null name
    }));

  } catch (error) {
    console.error('Error in getAllWorkouts:', error);
    return [];
  }
}

/**
 * Retrieves all workouts for a specific month and year for the authenticated user.
 * @param year The full year (e.g., 2024)
 * @param monthIndex The month index (0 for January, 11 for December)
 * @returns Array of HistoricalWorkout for the specified month or empty array.
 */
export async function getWorkoutsForMonth(year: number, monthIndex: number): Promise<HistoricalWorkout[]> {
  if (monthIndex < 0 || monthIndex > 11) {
    console.error('Invalid month index provided:', monthIndex);
    return [];
  }

  try {
    console.log(`Getting combined workouts for ${year}-${monthIndex + 1}, checking session...`);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('No active session found when fetching monthly workouts');
      return [];
    }
    const userId = session.user.id;
    console.log(`Found active session for user ${userId.substring(0, 6)}... Fetching workouts for ${year}-${monthIndex + 1}.`);

    const startDateUTC = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const endDateUTC = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0)); // Exclusive end date (start of next month)

    console.log(`Querying monthly lifting workouts between UTC: ${startDateUTC.toISOString()} and ${endDateUTC.toISOString()}`);

    // 1. Fetch Lifting Workouts
    const { data: liftingData, error: liftingError } = await supabase
      .from('workouts')
      .select('id, created_at, duration, exercise_name')
      .eq('user_id', userId)
      .gte('created_at', startDateUTC.toISOString())
      .lt('created_at', endDateUTC.toISOString());
      // No sort here, will sort combined array later

    if (liftingError) {
      console.error(`Error fetching lifting workouts for ${year}-${monthIndex + 1}:`, liftingError);
      // Continue to try fetching runs even if lifts fail for now, or return []
    }

    const liftingWorkouts: HistoricalWorkout[] = (liftingData || []).map(workout => ({
      id: workout.id,
      created_at: workout.created_at,
      duration: workout.duration ?? 0,
      exerciseName: workout.exercise_name ?? 'Unknown Exercise',
      type: 'lift' as const, // Assign type
    }));
    console.log(`Found ${liftingWorkouts.length} lifting workouts for ${year}-${monthIndex + 1}.`);

    // 2. Fetch Strava Runs
    console.log(`Querying monthly Strava runs between UTC: ${startDateUTC.toISOString()} and ${endDateUTC.toISOString()}`);
    const { data: runData, error: runError } = await supabase
      .from('user_strava_activities')
      .select('id, strava_activity_id, name, start_date, moving_time, distance') // Added distance
      .eq('user_id', userId)
      .eq('type', 'Run')
      .gte('start_date', startDateUTC.toISOString())
      .lt('start_date', endDateUTC.toISOString());
      // No sort here, will sort combined array later

    if (runError) {
      console.error(`Error fetching Strava runs for ${year}-${monthIndex + 1}:`, runError);
      // Continue if runs fail for now
    }
    
    const stravaRuns: HistoricalWorkout[] = (runData || []).map(activity => ({
      id: String(activity.strava_activity_id),
      created_at: activity.start_date,
      duration: Math.round((activity.moving_time ?? 0) / 60),
      exerciseName: activity.name ?? 'Strava Run',
      type: 'run' as const,
      distance: activity.distance ?? 0, // Added distance, default to 0 if null
    }));
    console.log(`Found ${stravaRuns.length} Strava runs for ${year}-${monthIndex + 1}.`);

    // 3. Combine and Sort
    const combinedWorkouts = [...liftingWorkouts, ...stravaRuns];
    combinedWorkouts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    console.log(`Total combined workouts for ${year}-${monthIndex + 1}: ${combinedWorkouts.length}`);
    return combinedWorkouts;

  } catch (error) {
    console.error(`Error in getWorkoutsForMonth (${year}-${monthIndex + 1}):`, error);
    return [];
  }
}

/**
 * Retrieves locally stored Strava run activities for a specific year, formatted for calendar display.
 * @param userId The ID of the user.
 * @param year The full year (e.g., 2024).
 * @returns Array of HistoricalWorkout for the specified year or empty array.
 */
export async function getLocalStravaRunsForYear(userId: string, year: number): Promise<HistoricalWorkout[]> {
  if (!userId) {
    console.warn('getLocalStravaRunsForYear: No userId provided.');
    return [];
  }
  console.log(`Fetching local Strava runs for user ${userId.substring(0,6)}... for year ${year}`);

  try {
    const { data, error } = await supabase
      .from('user_strava_activities')
      .select('id, strava_activity_id, name, start_date, moving_time') // Select necessary fields
      .eq('user_id', userId)
      .eq('type', 'Run') // Ensure we only get runs
      .gte('start_date', `${year}-01-01T00:00:00.000Z`) // Activities on or after Jan 1st of the year (UTC)
      .lt('start_date', `${year + 1}-01-01T00:00:00.000Z`) // Activities before Jan 1st of the next year (UTC)
      .order('start_date', { ascending: true });

    if (error) {
      console.error(`Error fetching local Strava runs for user ${userId.substring(0,6)} year ${year}:`, error);
      return [];
    }

    if (!data) {
      console.log(`No local Strava run data found for user ${userId.substring(0,6)} year ${year}.`);
      return [];
    }

    console.log(`Found ${data.length} local Strava runs for user ${userId.substring(0,6)} year ${year}.`);

    return data.map(activity => ({
      id: String(activity.strava_activity_id), // Use Strava's activity ID for keying, but could be our own `id` too
      created_at: activity.start_date, // This is already TIMESTAMPTZ (UTC)
      duration: Math.round((activity.moving_time ?? 0) / 60), // Convert seconds to minutes, handle null
      exerciseName: activity.name ?? 'Strava Run', // Use activity name or default
      type: 'run' as const, // Explicitly type as 'run'
    }));

  } catch (err) {
    console.error(`Exception in getLocalStravaRunsForYear for user ${userId.substring(0,6)} year ${year}:`, err);
    return [];
  }
} 