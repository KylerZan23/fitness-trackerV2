'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  type WorkoutDay,
  type DailyReadinessData,
} from '@/lib/types/program'

interface ProgramContext {
  programId: string
  phaseIndex: number
  weekIndex: number
  dayOfWeek: number
}

// Action to save workout data to a temporary table and return a session ID
export async function startWorkoutSession(
  workout: WorkoutDay,
  context: ProgramContext,
  readiness?: DailyReadinessData
): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('pending_workout_sessions')
      .insert({
        user_id: user.id,
        workout_data: workout,
        context_data: context,
        readiness_data: readiness,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating pending workout session:', error)
      return {
        success: false,
        error: `Database error: ${JSON.stringify(error, null, 2)}`,
      }
    }

    revalidatePath('/program')
    return { success: true, sessionId: data.id }
  } catch (error: any) {
    console.error('Caught exception in startWorkoutSession:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown exception occurred.'
    return { success: false, error: errorMessage }
  }
}

// Action to retrieve and delete the pending workout session data
export async function getPendingWorkoutSession(
  sessionId: string
): Promise<{
  success: boolean
  error?: string
  workout?: WorkoutDay
  context?: ProgramContext
  readiness?: DailyReadinessData
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Retrieve the data first
  const { data: sessionData, error: selectError } = await supabase
    .from('pending_workout_sessions')
    .select('workout_data, context_data, readiness_data')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (selectError || !sessionData) {
    console.error('Error fetching pending session:', selectError)
    return { success: false, error: 'Workout session not found or expired.' }
  }

  // Now, delete the record since it has been fetched
  const { error: deleteError } = await supabase
    .from('pending_workout_sessions')
    .delete()
    .eq('id', sessionId)

  if (deleteError) {
    // Log the error but don't fail the operation, as the user already has the data
    console.warn('Failed to delete pending session after fetch:', deleteError)
  }

  return {
    success: true,
    workout: sessionData.workout_data as WorkoutDay,
    context: sessionData.context_data as ProgramContext,
    readiness: sessionData.readiness_data as DailyReadinessData,
  }
} 