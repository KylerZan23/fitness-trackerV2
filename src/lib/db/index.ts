import { createClient as createBrowserClient } from '@/utils/supabase/client'
const browserSupabaseClient = createBrowserClient()
import { WorkoutFormData, WorkoutGroupData, WorkoutExerciseData } from '../schemas'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  startOfDay,
  endOfDay,
  subWeeks,
} from 'date-fns'
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz'
import { MuscleGroup, findMuscleGroupForExercise } from '../types'
import { SupabaseClient } from '@supabase/supabase-js'

type DbResult<T> = { success: true; data: T } | { success: false; error: string }

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
  // Program linking fields (optional)
  linked_program_id?: string
  linked_program_phase_index?: number
  linked_program_week_index?: number
  linked_program_day_of_week?: number
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
  totalSets: number
  exerciseNames?: string[]
  notes?: string[]
  workoutNames?: string[]
}

// Define a simpler type for the historical workout view
export interface HistoricalWorkout {
  id: string
  created_at: string // ISO string
  duration: number // minutes
  exerciseName: string
  type?: 'lift' | 'run' | 'other' // Add this
  distance?: number // in meters for runs
}

// New Interfaces for Weekly Muscle Comparison
export interface MuscleGroupWeeklySnapshot {
  muscleGroup: string
  totalSets: number
}

export interface WeeklyMuscleComparisonItem {
  muscleGroup: MuscleGroup // Changed from string to MuscleGroup
  currentWeekSets: number
  previousWeekSets: number
  changeInSets: number
  percentageChange: number
}

/**
 * Logs a new workout for the authenticated user
 * @param workout - The workout data to log
 * @returns The newly created workout or null if there's an error
 */
export async function logWorkout(workout: WorkoutFormData): Promise<Workout | null> {
  try {
    console.log('Logging workout, checking for active session...')
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      console.log('No active session found when logging workout')
      return null
    }

    // Convert weight to a decimal format to match database expectations
    const formattedWeight = parseFloat(workout.weight.toString()).toFixed(2)

    // Note: The muscle_group column doesn't exist in the database yet
    // This is just for logging purposes
    const muscleGroup = findMuscleGroupForExercise(workout.exerciseName)
    console.log(
      `Determined muscle group for "${workout.exerciseName}": ${muscleGroup} (for reference only)`
    )

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)

    // Determine the created_at timestamp
    let createdAt: Date
    let createdAtISO: string

    // If a workout date is provided, use it (interpreting it as local date)
    if (workout.workoutDate) {
      // The workoutDate is 'YYYY-MM-DD'. Create Date object.
      // IMPORTANT: new Date('YYYY-MM-DD') can be problematic as it assumes UTC midnight.
      // Better: Split and construct to avoid timezone pitfalls during Date creation from string.
      const [year, month, day] = workout.workoutDate.split('-').map(Number)
      // Create date representing noon in the user's local timezone
      // This ensures the workout is logged on the correct date regardless of timezone
      // We set it to noon to avoid most date boundary issues when converting to ISOString.
      createdAt = new Date(year, month - 1, day, 12, 0, 0)
      createdAtISO = createdAt.toISOString() // Convert to UTC ISO string for DB storage
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
      created_at: createdAtISO, // Store the UTC timestamp
      // Note: muscle_group column doesn't exist in the database yet
    }

    console.log('Attempting to insert workout with data:', workoutData)

    try {
      const { data, error } = await browserSupabaseClient
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
        workoutDate: workout.workoutDate, // Pass back the original date string if provided
      }
    } catch (insertError) {
      console.error('Error during database insert operation:', insertError)
      throw insertError
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
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()
    if (!session?.user) {
      console.log('No active session found when fetching workouts')
      return []
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)

    // Build query
    let query = browserSupabaseClient.from('workouts').select('*').eq('user_id', session.user.id)

    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }

    // Complete the query
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

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
      muscleGroup: workout.muscle_group,
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
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

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
    let query = browserSupabaseClient
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
    const stats = data.reduce(
      (acc, workout) => ({
        totalWorkouts: acc.totalWorkouts + 1,
        totalSets: acc.totalSets + workout.sets,
        totalReps: acc.totalReps + workout.sets * workout.reps,
        totalWeight: acc.totalWeight + workout.weight,
        totalDuration: acc.totalDuration + workout.duration,
      }),
      {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        totalDuration: 0,
      }
    )

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
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()
    if (!session?.user) {
      console.log('No active session found when fetching workout trends')
      return []
    }
    console.log(
      `Fetching trends for user ${session.user.id.substring(0, 6)}... Timezone: ${userTimezone}, Weeks: ${numberOfWeeks}`
    )

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
    const { data: workouts, error } = await browserSupabaseClient
      .from('workouts')
      .select('created_at, duration, weight, sets, exercise_name, notes, workout_group_id') // Added 'sets'
      .eq('user_id', session.user.id)
      .gte('created_at', startDateUTC)
      .lte('created_at', endDateUTC)

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
    const groupIds = workouts.map(w => w.workout_group_id).filter((id): id is string => !!id)
    const groupNamesMap = new Map<string, string>()
    if (groupIds.length > 0) {
      const { data: groups, error: groupError } = await browserSupabaseClient
        .from('workout_groups')
        .select('id, name')
        .in('id', Array.from(new Set(groupIds)))
      if (groupError) {
        console.error('Error fetching workout group names:', groupError)
        // Proceed without group names if error occurs
      } else if (groups) {
        groups.forEach(group => groupNamesMap.set(group.id, group.name))
        console.log(`Fetched ${groupNamesMap.size} workout group names.`)
      }
    }

    workouts.forEach(workout => {
      // Convert the UTC timestamp from DB back to user's timezone
      const createdAtUserTz = toZonedTime(workout.created_at, userTimezone)
      // Format date as YYYY-MM-DD based on user's timezone
      const dateString = formatTz(createdAtUserTz, 'yyyy-MM-dd', { timeZone: userTimezone })

      const workoutGroupName = workout.workout_group_id
        ? groupNamesMap.get(workout.workout_group_id)
        : undefined

      if (trendsMap.has(dateString)) {
        const existing = trendsMap.get(dateString)!
        existing.count += 1
        existing.totalDuration += workout.duration ?? 0
        existing.totalWeight += workout.weight ?? 0
        existing.totalSets += workout.sets ?? 0 // Added aggregation for sets
        if (workout.exercise_name) {
          existing.exerciseNames = [...(existing.exerciseNames ?? []), workout.exercise_name]
        }
        if (workout.notes) {
          existing.notes = [...(existing.notes ?? []), workout.notes]
        }
        if (workoutGroupName) {
          existing.workoutNames = [...(existing.workoutNames ?? []), workoutGroupName]
        }
      } else {
        trendsMap.set(dateString, {
          date: dateString,
          count: 1,
          totalDuration: workout.duration ?? 0,
          totalWeight: workout.weight ?? 0,
          totalSets: workout.sets ?? 0, // Added initialization for sets
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
 * Retrieves the profile for the authenticated user.
 * Can use a passed Supabase client (server-side) or defaults to the browser client.
 * @param client Optional SupabaseClient instance
 * @returns The user profile or null if not found or error.
 */
export async function getUserProfile(client?: SupabaseClient) {
  const supabaseInstance = client || browserSupabaseClient

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabaseInstance.auth.getSession()

    if (sessionError) {
      console.error('Error getting session for profile:', sessionError.message)
      return null
    }

    if (!session?.user) {
      console.log('No active session found when fetching user profile.')
      return null
    }

    const { user } = session
    
    // --- START: ATOMIC SELF-HEALING LOGIC ---
    // This block ensures a profile exists without a race condition.
    console.log(`Ensuring profile exists for user ${user.id} using atomic upsert...`);
    
    const minimalProfile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'New User',
      onboarding_completed: false,
    };
    
    // Use upsert with ignoreDuplicates: true. This is equivalent to
    // an 'INSERT ... ON CONFLICT DO NOTHING' statement. It's atomic.
    const { error: upsertError } = await supabaseInstance
      .from('profiles')
      .upsert(minimalProfile, { ignoreDuplicates: true });
    
    if (upsertError) {
      console.error('FATAL: Failed to upsert profile during self-healing:', upsertError.message);
      return null; // If this atomic operation fails, we cannot proceed.
    }
    
    // Now that we are CERTAIN a profile exists, fetch the definitive record.
    // We use .single() because it SHOULD exist.
    const { data: profileData, error: profileError } = await supabaseInstance
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      // This would be an unexpected error (e.g., RLS policy change, network failure).
      console.error('FATAL: Failed to fetch profile immediately after upsert:', profileError.message);
      return null;
    }
    
    console.log('Self-healing successful. Definitive profile fetched for user:', profileData.id);
    return profileData;
    // --- END: ATOMIC SELF-HEALING LOGIC ---

  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`getUserProfile failed: ${message}`)
    return null
  }
}

/**
 * Creates a community feed event for the authenticated user
 * @param eventType - Type of event (WORKOUT_COMPLETED, NEW_PB, STREAK_MILESTONE)
 * @param metadata - Event-specific data
 * @returns Success status
 */
export async function createCommunityFeedEvent(
  eventType: 'WORKOUT_COMPLETED' | 'NEW_PB' | 'STREAK_MILESTONE',
  metadata: Record<string, any>
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      console.log('No active session found when creating community feed event')
      return false
    }

    console.log(`Creating community feed event: ${eventType}`, metadata)

    const { error } = await browserSupabaseClient
      .from('community_feed_events')
      .insert({
        user_id: session.user.id,
        event_type: eventType,
        metadata: metadata,
      })

    if (error) {
      console.error('Error creating community feed event:', error)
      return false
    }

    console.log(`Community feed event created successfully: ${eventType}`)
    return true
  } catch (error) {
    console.error('Error in createCommunityFeedEvent:', error)
    return false
  }
}

/**
 * Logs a workout group with multiple exercises for the authenticated user
 * @param workoutGroup - The workout group data containing multiple exercises
 * @returns The newly created workout group or null if there's an error
 */
export async function logWorkoutGroup(
  workoutGroup: WorkoutGroupData
): Promise<DbResult<WorkoutGroup>> {
  try {
    console.log('Logging workout group, checking for active session...')
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      const errorMsg = 'No active session found when logging workout group'
      console.log(errorMsg)
      return { success: false, error: errorMsg }
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)
    console.log('Workout group exercises count:', workoutGroup.exercises.length)

    // Determine the created_at timestamp (similar logic to logWorkout)
    let createdAt: Date
    let createdAtISO: string

    if (workoutGroup.workoutDate) {
      const [year, month, day] = workoutGroup.workoutDate.split('-').map(Number)
      // Create date representing noon in the user's local timezone
      // This ensures the workout is logged on the correct date regardless of timezone
      createdAt = new Date(year, month - 1, day, 12, 0, 0)
      createdAtISO = createdAt.toISOString()
      console.log(
        `Using provided date ${workoutGroup.workoutDate} for group, stored as UTC: ${createdAtISO}`
      )
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
      created_at: createdAtISO, // Use consistent UTC timestamp
      // Program linking fields (optional)
      linked_program_id: workoutGroup.linked_program_id || null,
      linked_program_phase_index: workoutGroup.linked_program_phase_index ?? null,
      linked_program_week_index: workoutGroup.linked_program_week_index ?? null,
      linked_program_day_of_week: workoutGroup.linked_program_day_of_week ?? null,
    }

    console.log('Creating workout group with data:', workoutGroupData)

    // Start a transaction by creating the workout group first
    try {
      const { data: groupData, error: groupError } = await browserSupabaseClient
        .from('workout_groups')
        .insert(workoutGroupData)
        .select()
        .single()

      if (groupError || !groupData) {
        console.error('Error creating workout group:', groupError)
        return { success: false, error: groupError?.message || 'Error creating workout group' }
      }

      console.log('Created workout group:', groupData)

      // Now add all the individual exercises linked to this group
      const exercisesData = workoutGroup.exercises.map((exercise, index) => {
        // Validate the exercise data before insertion
        if (!exercise.exerciseName || exercise.exerciseName.trim() === '') {
          const errorMsg = `Exercise ${index + 1} has an empty or missing name.`
          console.error(errorMsg, exercise)
          throw new Error(errorMsg)
        }
        if (typeof exercise.sets !== 'number' || exercise.sets <= 0) {
          const errorMsg = `Exercise "${exercise.exerciseName}" must have at least 1 set.`
          console.error(errorMsg, exercise)
          throw new Error(errorMsg)
        }
        if (typeof exercise.reps !== 'number' || exercise.reps <= 0) {
          const errorMsg = `Exercise "${exercise.exerciseName}" must have at least 1 rep.`
          console.error(errorMsg, exercise)
          throw new Error(errorMsg)
        }
        if (typeof exercise.weight !== 'number' || exercise.weight < 0) {
          const errorMsg = `Exercise "${exercise.exerciseName}" must have a non-negative weight.`
          console.error(errorMsg, exercise)
          throw new Error(errorMsg)
        }

        return {
          user_id: session.user.id,
          exercise_name: exercise.exerciseName.trim(),
          sets: exercise.sets,
          reps: exercise.reps,
          weight: parseFloat(exercise.weight.toString()).toFixed(2),
          duration: Math.floor(workoutGroup.duration / workoutGroup.exercises.length), // Split duration evenly
          notes: null, // Individual exercise notes not currently captured in group mode form
          workout_group_id: groupData.id,
          created_at: createdAtISO, // Use the *same UTC timestamp* as the workout group
          // Add explicit muscle_group as fallback in case the database trigger isn't working
          muscle_group: findMuscleGroupForExercise(exercise.exerciseName.trim()),
        }
      })

      console.log('Creating workout exercises with data:')
      exercisesData.forEach((exercise, index) => {
        console.log(`  Exercise ${index}:`, {
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          muscle_group: exercise.muscle_group,
          user_id: exercise.user_id.substring(0, 6) + '...',
          workout_group_id: exercise.workout_group_id,
          created_at: exercise.created_at
        })
      })

      const { data: exercisesResult, error: exercisesError } = await browserSupabaseClient
        .from('workouts')
        .insert(exercisesData)
        .select()

      if (exercisesError) {
        console.error('Error creating workout exercises:')
        console.error('Error object:', exercisesError)
        console.error('Error message:', exercisesError.message || 'No message')
        console.error('Error code:', exercisesError.code || 'No code')
        console.error('Error details:', exercisesError.details || 'No details')
        console.error('Error hint:', exercisesError.hint || 'No hint')
        
        // Log the full error object as JSON to see all properties
        try {
          console.error('Full error JSON:', JSON.stringify(exercisesError, null, 2))
        } catch (jsonError) {
          console.error('Error serializing error object:', jsonError)
          console.error('Error object keys:', Object.keys(exercisesError))
        }
        
        // Check for specific error types and provide better error messages
        if (exercisesError.code === '23502') {
          console.error('NOT NULL constraint violation - a required field is missing')
          console.error('This might be due to missing muscle_group or other required fields')
        } else if (exercisesError.code === '23503') {
          console.error('Foreign key constraint violation - referenced record does not exist')
          console.error('This might be due to invalid workout_group_id or user_id')
        } else if (exercisesError.code === '23505') {
          console.error('Unique constraint violation - record already exists')
        } else if (exercisesError.code === '23514') {
          console.error('Check constraint violation - value outside allowed range')
          console.error('This might be due to invalid sets, reps, weight, or duration values')
        } else if (exercisesError.code === '42501') {
          console.error('Permission denied - RLS policy violation')
        }
        
        // Attempt to delete the workout group since the exercises failed
        await browserSupabaseClient.from('workout_groups').delete().eq('id', groupData.id)
        return { success: false, error: exercisesError.message || 'Error creating workout exercises' }
      }

      console.log(`${exercisesResult.length} workout exercises created successfully.`)

      // Create community feed event for workout completion
      await createCommunityFeedEvent('WORKOUT_COMPLETED', {
        workoutName: workoutGroup.name,
        exerciseCount: workoutGroup.exercises.length,
        duration: workoutGroup.duration,
        exercises: workoutGroup.exercises.map(ex => ex.exerciseName),
      })

      // Return the complete workout group with exercises
      return {
        success: true,
        data: {
          id: groupData.id,
          user_id: groupData.user_id,
          name: groupData.name,
          duration: groupData.duration,
          notes: groupData.notes,
          created_at: groupData.created_at,
          exercises: exercisesResult.map(e => ({
            id: e.id,
            user_id: e.user_id,
            exerciseName: e.exercise_name,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            duration: e.duration,
            notes: e.notes,
            created_at: e.created_at,
            muscleGroup: e.muscle_group,
          })),
          linked_program_id: groupData.linked_program_id,
          linked_program_phase_index: groupData.linked_program_phase_index,
          linked_program_week_index: groupData.linked_program_week_index,
          linked_program_day_of_week: groupData.linked_program_day_of_week,
        },
      }
    } catch (dbError) {
      console.error('Database error in logWorkoutGroup:', dbError)
      throw dbError
    }
  } catch (error: any) {
    const errorMessage =
      error.message || 'An unexpected error occurred while logging the workout group.'
    console.error('Error in logWorkoutGroup:', errorMessage)
    return { success: false, error: errorMessage }
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
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      console.log('No active session found')
      // Return empty stats object matching the expected structure
      return {
        totalWorkouts: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        averageDuration: 0,
        totalWeight: 0,
        totalDuration: 0,
      }
    }

    console.log(`Found active session for user ${session.user.id.substring(0, 6)}...`)

    // --- Timezone Calculation ---
    const now = new Date() // Current time in UTC
    // Get the start of the user's local day
    const startOfUserDay = startOfDay(toZonedTime(now, userTimezone))
    // Get the end of the user's local day (start of next day)
    const startOfUserNextDay = addDays(startOfUserDay, 1)

    // Convert these user-local start/end times back to UTC ISO strings for the query
    const startUtcISO = fromZonedTime(startOfUserDay, userTimezone).toISOString()
    const endUtcISO = fromZonedTime(startOfUserNextDay, userTimezone).toISOString()

    console.log(`Querying today's stats between UTC: ${startUtcISO} and ${endUtcISO}`)
    // --- End Timezone Calculation ---

    // Build query
    let query = browserSupabaseClient
      .from('workouts')
      .select('sets, reps, weight, duration')
      .eq('user_id', session.user.id)
      .gte('created_at', startUtcISO) // Use calculated UTC start
      .lt('created_at', endUtcISO) // Use calculated UTC end (exclusive)

    // Add muscle group filter if provided
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup)
    }

    // Complete the query
    const { data, error } = await query

    // Define the empty stats object once
    const emptyReturnStats: WorkoutStats = {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      averageWeight: 0,
      averageDuration: 0,
      totalWeight: 0,
      totalDuration: 0,
    }

    if (error) {
      console.error(`Error fetching today's workout stats (tz: ${userTimezone}):`, error)
      return emptyReturnStats
    }

    if (data.length === 0) {
      console.log(`No workout data found for user today (tz: ${userTimezone})`)
      return emptyReturnStats
    }

    console.log(`Found stats data for ${data.length} workouts today (tz: ${userTimezone})`)
    const stats = data.reduce(
      (acc, workout) => ({
        // Ensure weight is parsed as float for correct summing
        totalWeight: acc.totalWeight + parseFloat(workout.weight?.toString() || '0'),
        totalDuration: acc.totalDuration + (workout.duration || 0),
        totalSets: acc.totalSets + (workout.sets || 0),
        // Calculate total reps correctly
        totalReps: acc.totalReps + (workout.sets || 0) * (workout.reps || 0),
        // Count actual workout entries returned
        totalWorkouts: acc.totalWorkouts + 1, // Correctly increment workout count
      }),
      {
        totalWorkouts: 0, // Start count from 0
        totalSets: 0,
        totalReps: 0,
        totalWeight: 0,
        totalDuration: 0,
      }
    )

    // Avoid division by zero if somehow stats.totalWorkouts is 0 despite data.length > 0
    const numWorkouts = stats.totalWorkouts || 1 // Use 1 to prevent NaN if 0

    return {
      totalWorkouts: stats.totalWorkouts,
      totalSets: stats.totalSets,
      totalReps: stats.totalReps,
      // Calculate average based on the counted workouts
      averageWeight: Math.round((stats.totalWeight / numWorkouts) * 10) / 10,
      averageDuration: Math.round(stats.totalDuration / numWorkouts),
      // Return the calculated totals
      totalWeight: Math.round(stats.totalWeight),
      totalDuration: stats.totalDuration,
    }
  } catch (error) {
    console.error(`Error calculating today's workout stats (tz: ${userTimezone}):`, error)
    // Return consistent empty object on catch
    return {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      averageWeight: 0,
      averageDuration: 0,
      totalWeight: 0,
      totalDuration: 0,
    }
  }
}

/**
 * Retrieves all workouts for the authenticated user, ordered by date.
 * Intended for historical views like the monthly calendar log.
 * @returns Array of workouts or empty array if there's an error or no user.
 */
export async function getAllWorkouts(): Promise<HistoricalWorkout[]> {
  try {
    console.log('Getting all workouts, checking for active session...')
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      console.log('No active session found when fetching all workouts')
      return []
    }

    console.log(
      `Found active session for user ${session.user.id.substring(0, 6)}... Fetching all workouts.`
    )

    // Select only necessary fields and order by date
    const { data, error } = await browserSupabaseClient
      .from('workouts')
      .select('id, created_at, duration, exercise_name')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching all workouts:', error)
      return []
    }

    if (!data) {
      console.log('No workout data found for user.')
      return []
    }

    console.log(`Found ${data.length} total workouts for user.`)

    // Map database fields to our simpler interface
    return data.map(workout => ({
      id: workout.id,
      created_at: workout.created_at,
      duration: workout.duration ?? 0, // Handle potential null duration
      exerciseName: workout.exercise_name ?? 'Unknown Exercise', // Handle potential null name
    }))
  } catch (error) {
    console.error('Error in getAllWorkouts:', error)
    return []
  }
}

/**
 * Retrieves all workouts for a specific month and year for the authenticated user.
 * @param year The full year (e.g., 2024)
 * @param monthIndex The month index (0 for January, 11 for December)
 * @returns Array of HistoricalWorkout for the specified month or empty array.
 */
export async function getWorkoutsForMonth(
  year: number,
  monthIndex: number
): Promise<HistoricalWorkout[]> {
  if (monthIndex < 0 || monthIndex > 11) {
    console.error('Invalid month index provided:', monthIndex)
    return []
  }

  try {
    console.log(`Getting combined workouts for ${year}-${monthIndex + 1}, checking session...`)
    const {
      data: { session },
    } = await browserSupabaseClient.auth.getSession()

    if (!session?.user) {
      console.log('No active session found when fetching monthly workouts')
      return []
    }
    const userId = session.user.id
    console.log(
      `Found active session for user ${userId.substring(0, 6)}... Fetching workouts for ${year}-${monthIndex + 1}.`
    )

    const startDateUTC = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0))
    const endDateUTC = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0)) // Exclusive end date (start of next month)

    console.log(
      `Querying monthly lifting workouts between UTC: ${startDateUTC.toISOString()} and ${endDateUTC.toISOString()}`
    )

    // 1. Fetch Lifting Workouts
    const { data: liftingData, error: liftingError } = await browserSupabaseClient
      .from('workouts')
      .select('id, created_at, duration, exercise_name')
      .eq('user_id', userId)
      .gte('created_at', startDateUTC.toISOString())
      .lt('created_at', endDateUTC.toISOString())
    // No sort here, will sort combined array later

    if (liftingError) {
      console.error(`Error fetching lifting workouts for ${year}-${monthIndex + 1}:`, liftingError)
      // Continue to try fetching runs even if lifts fail for now, or return []
    }

    const liftingWorkouts: HistoricalWorkout[] = (liftingData || []).map(workout => ({
      id: workout.id,
      created_at: workout.created_at,
      duration: workout.duration ?? 0,
      exerciseName: workout.exercise_name ?? 'Unknown Exercise',
      type: 'lift' as const, // Assign type
    }))
    console.log(`Found ${liftingWorkouts.length} lifting workouts for ${year}-${monthIndex + 1}.`)

    // Sort lifting workouts by date
    liftingWorkouts.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    console.log(`Total workouts for ${year}-${monthIndex + 1}: ${liftingWorkouts.length}`)
    return liftingWorkouts
  } catch (error) {
    console.error(`Error in getWorkoutsForMonth (${year}-${monthIndex + 1}):`, error)
    return []
  }
}



// Function to get weekly muscle comparison data
/**
 * Calculates the current workout streak for a user
 * Counts consecutive days with at least one workout logged
 * @param userId - The user ID to calculate streak for
 * @param supabaseClient - Optional Supabase client
 * @returns The current workout streak in days
 */
export async function calculateWorkoutStreak(
  userId: string,
  supabaseClient: SupabaseClient = browserSupabaseClient
): Promise<number> {
  try {
    console.log(`Calculating workout streak for user: ${userId}`)

    // Get all workout groups for the user, ordered by date (most recent first)
    const { data: workoutGroups, error } = await supabaseClient
      .from('workout_groups')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workout groups for streak calculation:', error)
      return 0
    }

    if (!workoutGroups || workoutGroups.length === 0) {
      console.log('No workout groups found for user')
      return 0
    }

    // Convert dates to local date strings for comparison
    const workoutDates = workoutGroups.map(group => {
      const date = new Date(group.created_at)
      return date.toISOString().split('T')[0] // Get YYYY-MM-DD format
    })

    // Remove duplicates (multiple workouts on same day count as one)
    const uniqueWorkoutDates = Array.from(new Set(workoutDates))

    // Sort dates in descending order (most recent first)
    uniqueWorkoutDates.sort((a, b) => b.localeCompare(a))

    console.log('Unique workout dates:', uniqueWorkoutDates)

    // Calculate streak starting from today
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    let streak = 0
    let currentDate = new Date(today)

    // Check each day backwards from today
    for (let i = 0; i < 365; i++) { // Max 365 days to prevent infinite loop
      const checkDateString = currentDate.toISOString().split('T')[0]
      
      if (uniqueWorkoutDates.includes(checkDateString)) {
        streak++
        console.log(`Found workout on ${checkDateString}, streak: ${streak}`)
      } else {
        // If we haven't started the streak yet (no workout today), continue checking
        if (streak === 0 && checkDateString === todayString) {
          // No workout today, but continue checking yesterday
        } else if (streak === 0) {
          // Still no workout found, continue checking
        } else {
          // Streak is broken
          console.log(`Streak broken on ${checkDateString}, final streak: ${streak}`)
          break
        }
      }

      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    }

    console.log(`Final workout streak: ${streak} days`)
    return streak
  } catch (error) {
    console.error('Error calculating workout streak:', error)
    return 0
  }
}

export async function getWeeklyMuscleComparisonData(
  userId: string,
  userTimezone: string,
  supabaseClient: SupabaseClient = browserSupabaseClient, // Allow passing a client, default to browser
  weekOffset: number = 0 // 0 for current week vs prev, 1 for last week vs week before, etc.
): Promise<WeeklyMuscleComparisonItem[]> {
  // Determine the base date for comparison by applying the offset
  const baseDateForComparison = subWeeks(new Date(), weekOffset)
  const baseDateInUserTz = toZonedTime(baseDateForComparison, userTimezone)

  // "Current" week for comparison (which could be a past week if offset > 0)
  const currentComparisonWeekStartUserTz = startOfWeek(baseDateInUserTz, { weekStartsOn: 1 })
  const currentComparisonWeekEndUserTz = endOfWeek(baseDateInUserTz, { weekStartsOn: 1 })
  const currentComparisonWeekStartUtc = fromZonedTime(
    currentComparisonWeekStartUserTz,
    userTimezone
  )
  const currentComparisonWeekEndUtc = fromZonedTime(currentComparisonWeekEndUserTz, userTimezone)

  // "Previous" week relative to the "current" comparison week
  const previousComparisonWeekBaseDate = subWeeks(baseDateForComparison, 1)
  const previousComparisonWeekBaseDateInUserTz = toZonedTime(
    previousComparisonWeekBaseDate,
    userTimezone
  )
  const previousComparisonWeekStartUserTz = startOfWeek(previousComparisonWeekBaseDateInUserTz, {
    weekStartsOn: 1,
  })
  const previousComparisonWeekEndUserTz = endOfWeek(previousComparisonWeekBaseDateInUserTz, {
    weekStartsOn: 1,
  })
  const previousComparisonWeekStartUtc = fromZonedTime(
    previousComparisonWeekStartUserTz,
    userTimezone
  )
  const previousComparisonWeekEndUtc = fromZonedTime(previousComparisonWeekEndUserTz, userTimezone)

  try {
    // Fetch workouts for current and previous comparison weeks in parallel
    const [currentWeekWorkoutsResponse, previousWeekWorkoutsResponse] = await Promise.all([
      supabaseClient
        .from('workouts')
        .select('exercise_name, sets')
        .eq('user_id', userId)
        .gte('created_at', currentComparisonWeekStartUtc.toISOString())
        .lte('created_at', currentComparisonWeekEndUtc.toISOString()),
      supabaseClient
        .from('workouts')
        .select('exercise_name, sets')
        .eq('user_id', userId)
        .gte('created_at', previousComparisonWeekStartUtc.toISOString())
        .lte('created_at', previousComparisonWeekEndUtc.toISOString()),
    ])

    if (currentWeekWorkoutsResponse.error) throw currentWeekWorkoutsResponse.error
    if (previousWeekWorkoutsResponse.error) throw previousWeekWorkoutsResponse.error

    // Explicitly type the data after fetching
    const currentWeekRawData: { exercise_name: string; sets: number }[] =
      currentWeekWorkoutsResponse.data || []
    const previousWeekRawData: { exercise_name: string; sets: number }[] =
      previousWeekWorkoutsResponse.data || []

    // Aggregate data by muscle group
    const aggregateSetsByMuscleGroup = (
      workouts: { exercise_name: string; sets: number }[]
    ): Map<MuscleGroup, number> => {
      const aggregation = new Map<MuscleGroup, number>()
      workouts.forEach(workout => {
        const muscleGroup = findMuscleGroupForExercise(workout.exercise_name)
        aggregation.set(muscleGroup, (aggregation.get(muscleGroup) || 0) + (workout.sets || 0))
      })
      return aggregation
    }

    const currentWeekAggregated = aggregateSetsByMuscleGroup(currentWeekRawData)
    const previousWeekAggregated = aggregateSetsByMuscleGroup(previousWeekRawData)

    // Get all unique muscle groups involved
    const allMuscleGroups = new Set<MuscleGroup>([
      ...Array.from(currentWeekAggregated.keys()),
      ...Array.from(previousWeekAggregated.keys()),
    ])

    const comparisonData: WeeklyMuscleComparisonItem[] = []

    allMuscleGroups.forEach(muscleGroup => {
      const currentWeekSets = currentWeekAggregated.get(muscleGroup) || 0
      const previousWeekSets = previousWeekAggregated.get(muscleGroup) || 0
      const changeInSets = currentWeekSets - previousWeekSets
      let percentageChange = 0

      if (previousWeekSets > 0) {
        percentageChange = changeInSets / previousWeekSets // Store as fraction, format later
      } else if (currentWeekSets > 0) {
        percentageChange = Infinity // Indicates new activity
      }
      // If both are 0, percentageChange remains 0.

      comparisonData.push({
        muscleGroup,
        currentWeekSets,
        previousWeekSets,
        changeInSets,
        percentageChange,
      })
    })

    return comparisonData
  } catch (error) {
    console.error('Error fetching weekly muscle comparison data:', error)
    // Optionally, rethrow or return an empty array/specific error structure
    throw error // Rethrow to be caught by the caller in dashboard page
  }
}
