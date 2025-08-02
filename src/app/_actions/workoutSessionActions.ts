'use server'

import { createClient } from '@/utils/supabase/server'
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

    const supabase = await createClient()
    
    // Get user with detailed logging
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Auth error in startWorkoutSession:', authError)
      return { success: false, error: `Authentication error: ${authError.message}` }
    }

    if (!user) {
      console.error('❌ No user found in startWorkoutSession')
      return { success: false, error: 'User not authenticated' }
    }

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
      console.error('❌ Database error creating pending workout session:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return {
        success: false,
        error: `Database error: ${error.message} (Code: ${error.code})`,
      }
    }

    if (!data || !data.id) {
      console.error('❌ No data returned from session creation')
      return { success: false, error: 'Failed to create session - no ID returned' }
    }

    console.log('✅ Session created successfully:', {
      sessionId: data.id,
      userId: user.id
    })

    // Verify the session was actually created by attempting to read it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('pending_workout_sessions')
      .select('id, created_at')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (verifyError || !verifyData) {
      console.error('❌ Session verification failed:', {
        verifyError,
        sessionId: data.id,
        userId: user.id
      })
      return { success: false, error: 'Session created but verification failed - possible RLS issue' }
    }

    console.log('✅ Session verified successfully:', {
      sessionId: verifyData.id,
      createdAt: verifyData.created_at
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

  const supabase = await createClient()
  
  // Get user with detailed logging
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('❌ Auth error in getPendingWorkoutSession:', authError)
    return { success: false, error: `Authentication error: ${authError.message}` }
  }

  if (!user) {
    console.error('❌ No user found in getPendingWorkoutSession')
    return { success: false, error: 'User not authenticated' }
  }

  console.log('✅ User authenticated for session retrieval:', {
    userId: user.id,
    userEmail: user.email,
    sessionId: sessionId
  })

  // First, let's see if any sessions exist for this user at all
  const { data: allUserSessions, error: countError } = await supabase
    .from('pending_workout_sessions')
    .select('id, created_at')
    .eq('user_id', user.id)

  if (countError) {
    console.error('❌ Error checking user sessions:', countError)
  } else {
    console.log('📊 User session summary:', {
      totalSessions: allUserSessions?.length || 0,
      sessionIds: allUserSessions?.map(s => s.id) || [],
      searchingFor: sessionId
    })
  }

  // Now check if the specific session exists for any user (without user_id filter)
  const { data: globalSession, error: globalError } = await supabase
    .from('pending_workout_sessions')
    .select('id, user_id, created_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (globalError) {
    console.error('❌ Error checking global session:', globalError)
  } else if (globalSession) {
    console.log('🌍 Global session found:', {
      sessionId: globalSession.id,
      sessionUserId: globalSession.user_id,
      currentUserId: user.id,
      userIdMatch: globalSession.user_id === user.id,
      createdAt: globalSession.created_at
    })
  } else {
    console.log('❌ No global session found with ID:', sessionId)
  }

  // Retrieve the data with the user_id filter
  console.log('🔍 Attempting to retrieve session with filters:', {
    sessionId,
    userId: user.id
  })

  const { data: sessionData, error: selectError } = await supabase
    .from('pending_workout_sessions')
    .select('workout_data, context_data, readiness_data, created_at, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (selectError) {
    console.error('❌ Error fetching pending session:', {
      error: selectError,
      code: selectError.code,
      message: selectError.message,
      details: selectError.details,
      hint: selectError.hint,
      sessionId: sessionId,
      userId: user.id
    })
    
    // Additional debugging based on error code
    if (selectError.code === 'PGRST116') {
      console.error('💡 PGRST116 Analysis: Query returned 0 rows. This means either:')
      console.error('   1. Session with this ID does not exist')
      console.error('   2. Session exists but belongs to different user')
      console.error('   3. RLS policy is blocking access')
      console.error('   4. Session was already deleted')
    }
    
    return { success: false, error: 'Workout session not found or expired.' }
  }

  if (!sessionData) {
    console.error('❌ No session data returned despite no error')
    return { success: false, error: 'Workout session not found or expired.' }
  }

  console.log('✅ Session data retrieved successfully:', {
    sessionId,
    userId: sessionData.user_id,
    createdAt: sessionData.created_at,
    hasWorkoutData: !!sessionData.workout_data,
    hasContextData: !!sessionData.context_data,
    hasReadinessData: !!sessionData.readiness_data
  })

  // Now, delete the record since it has been fetched
  console.log('🗑️ Attempting to delete session after successful retrieval')
  
  const { error: deleteError } = await supabase
    .from('pending_workout_sessions')
    .delete()
    .eq('id', sessionId)

  if (deleteError) {
    console.warn('⚠️ Failed to delete pending session after fetch:', {
      error: deleteError,
      sessionId: sessionId
    })
    // Log the error but don't fail the operation, as the user already has the data
  } else {
    console.log('✅ Session deleted successfully after retrieval')
  }

  return {
    success: true,
    workout: sessionData.workout_data as WorkoutDay,
    context: sessionData.context_data as ProgramContext,
    readiness: sessionData.readiness_data as DailyReadinessData,
  }
} 