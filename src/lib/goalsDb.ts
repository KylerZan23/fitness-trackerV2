// src/lib/goalsDb.ts - Dedicated file for goal-related DB functions

import { supabase as browserSupabaseClient } from '@/lib/supabase'
import type { GoalWithProgress } from '@/lib/types'
import { startOfWeek, endOfWeek, formatISO } from 'date-fns'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetches active goals for the current user for the current week,
 * including calculated progress.
 * Can use a passed Supabase client (server-side) or defaults to the browser client.
 * @param client Optional SupabaseClient instance
 */
export async function fetchCurrentWeekGoalsWithProgress(
  client?: SupabaseClient
): Promise<GoalWithProgress[]> {
  const supabaseInstance = client || browserSupabaseClient
  console.log('Fetching current week goals from goalsDb.ts using supabaseInstance...')

  const {
    data: { session },
    error: sessionError,
  } = await supabaseInstance.auth.getSession()

  if (sessionError) {
    console.error('Error getting session:', sessionError)
    throw new Error(`Authentication error: ${sessionError.message}`)
  }

  if (!session?.user?.id) {
    console.log('No active session found, cannot fetch goals.')
    throw new Error('User not authenticated')
  }

  const userId = session.user.id
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  console.log(
    `Fetching goals for user ${userId} between ${formatISO(weekStart)} and ${formatISO(weekEnd)}`
  )

  try {
    const { data, error } = await supabaseInstance.rpc('get_goals_with_progress', {
      user_id_param: userId,
      start_date_param: formatISO(weekStart),
      end_date_param: formatISO(weekEnd),
    })

    if (error) {
      console.error('Error calling get_goals_with_progress RPC:', error)
      throw new Error(`Database error fetching goals: ${error.message}`)
    }

    console.log('Successfully fetched goals:', data)
    return (data as GoalWithProgress[] | null) ?? []
  } catch (error) {
    console.error('Unexpected error in fetchCurrentWeekGoalsWithProgress:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching goals.')
  }
}

/**
 * Creates a new goal in the database.
 * Note: This function will now use browserSupabaseClient by default due to the import alias.
 * If it needs to be called from a server context with a server client, it would also need refactoring.
 */
export async function createGoal(goalData: {
  metric_type: string
  target_value: number
  target_unit: string | null
  label?: string | null // Allow null label
}) {
  console.log('Creating goal with data:', goalData)

  // Uses browserSupabaseClient due to import alias unless refactored to accept a client
  const {
    data: { session },
    error: sessionError,
  } = await browserSupabaseClient.auth.getSession()
  if (sessionError || !session?.user) {
    throw new Error(sessionError?.message ?? 'User not authenticated')
  }
  const userId = session.user.id

  // Determine start/end dates for the current week
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const newGoal = {
    user_id: userId,
    metric_type: goalData.metric_type,
    target_value: goalData.target_value,
    target_unit: goalData.target_unit,
    label: goalData.label || null, // Ensure label is null if empty/undefined
    time_period: 'week', // Default to week for now
    start_date: formatISO(weekStart),
    end_date: formatISO(weekEnd),
    is_active: true,
    // created_at and updated_at will be handled by DB defaults
  }

  console.log('Inserting new goal into DB:', newGoal)

  // Perform the actual Supabase insert operation
  const { data, error } = await browserSupabaseClient
    .from('goals') // Target the 'goals' table
    .insert([newGoal]) // Insert the prepared object
    .select() // Select to return the created row(s)
    .single() // Expecting a single row back

  if (error) {
    console.error('Error creating goal in DB:', error)
    // Provide a more specific error message if possible
    throw new Error(`Database error creating goal: ${error.message}`)
  }

  if (!data) {
    console.error('No data returned after goal insert.')
    throw new Error('Failed to create goal: No data returned.')
  }

  console.log('Goal created successfully:', data)
  // Cast to GoalWithProgress, assuming current_value defaults or isn't needed immediately
  return data as GoalWithProgress
}

// Add other goal-related DB functions here later (updateGoal, deleteGoal, etc.)
