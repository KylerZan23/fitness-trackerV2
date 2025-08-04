'use server'

import {
    createPendingSession,
    verifyPendingSession,
    getAndClearPendingSession,
} from '@/lib/data/workout-session';
import { getAuthenticatedUser } from '@/lib/data/auth';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isReadOnlyMode } from '@/lib/subscription'
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
    console.log('🚀 startWorkoutSession called with:', {
      workoutFocus: workout.focus,
      contextProgramId: context.programId,
      hasReadiness: !!readiness
    })

    const authResult = await getAuthenticatedUser();
    if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error || 'User not authenticated' };
    }
    const { user } = authResult;

    console.log('✅ User authenticated:', {
      userId: user.id,
      userEmail: user.email
    })

    // Check if user is in read-only mode (trial expired and no premium subscription)
    const isInReadOnlyMode = await isReadOnlyMode(user.id)
    if (isInReadOnlyMode) {
      return { 
        success: false, 
        error: 'Your free trial has expired. Please upgrade to premium to start new workouts.' 
      }
    }

    // Validate input data before insertion
    if (!workout || !context) {
      console.error('❌ Invalid input data:', { hasWorkout: !!workout, hasContext: !!context })
      return { success: false, error: 'Invalid workout or context data' }
    }

    console.log('📝 Attempting to insert session with data:', {
      user_id: user.id,
      workout_data_keys: Object.keys(workout),
      context_data: context,
      has_readiness: !!readiness
    })

    const { success, data, error } = await createPendingSession(user.id, workout, context, readiness);

    if (!success || !data) {
        return { success: false, error: error || 'Failed to create session - no ID returned' };
    }

    const verification = await verifyPendingSession(data.id, user.id);
    if (!verification.success) {
        return { success: false, error: verification.error };
    }

    console.log('✅ Session verified successfully:', {
      sessionId: verification.data?.id,
      createdAt: verification.data?.created_at
    })

    revalidatePath('/program')
    return { success: true, sessionId: data.id }
  } catch (error: any) {
    console.error('❌ Exception in startWorkoutSession:', {
      error: error,
      message: error.message,
      stack: error.stack
    })
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
  console.log('🔍 getPendingWorkoutSession called with sessionId:', sessionId)

  const authResult = await getAuthenticatedUser();
    if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error || 'User not authenticated' };
    }
  const { user } = authResult;

  console.log('✅ User authenticated for session retrieval:', {
    userId: user.id,
    userEmail: user.email,
    sessionId: sessionId
  })

  // First, let's see if any sessions exist for this user at all
  const { success, data: sessionData, error } = await getAndClearPendingSession(sessionId, user.id);

  if (!success || !sessionData) {
    return { success: false, error: error || 'Workout session not found or expired.' };
  }

  return {
    success: true,
    workout: sessionData.workout_data as WorkoutDay,
    context: sessionData.context_data as ProgramContext,
    readiness: sessionData.readiness_data as DailyReadinessData,
  }
} 