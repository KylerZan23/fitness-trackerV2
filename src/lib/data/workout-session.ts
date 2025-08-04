// src/lib/data/workout-session.ts
import { createClient } from '@/utils/supabase/server';
import { type WorkoutDay, type DailyReadinessData } from '@/lib/types/program';

interface ProgramContext {
  programId: string;
  phaseIndex: number;
  weekIndex: number;
  dayOfWeek: number;
}

export async function createPendingSession(
  userId: string,
  workout: WorkoutDay,
  context: ProgramContext,
  readiness?: DailyReadinessData
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pending_workout_sessions')
    .insert({
      user_id: userId,
      workout_data: workout,
      context_data: context,
      readiness_data: readiness,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Database error creating pending workout session:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: `Database error: ${error.message} (Code: ${error.code})` };
  }

  if (!data || !data.id) {
    console.error('No data returned from session creation');
    return { success: false, error: 'Failed to create session - no ID returned' };
  }
  
  return { success: true, data };
}

export async function verifyPendingSession(sessionId: string, userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pending_workout_sessions')
        .select('id, created_at')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        console.error('Session verification failed:', {
            verifyError: error,
            sessionId: sessionId,
            userId: userId
        });
        return { success: false, error: 'Session created but verification failed - possible RLS issue' };
    }
    return { success: true, data };
}

export async function getAndClearPendingSession(sessionId: string, userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pending_workout_sessions')
        .select('workout_data, context_data, readiness_data, created_at, user_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching pending session:', {
            error: error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            sessionId: sessionId,
            userId: userId
        });
        return { success: false, error: 'Workout session not found or expired.' };
    }

    if (!data) {
        return { success: false, error: 'Workout session not found or expired.' };
    }

    const { error: deleteError } = await supabase
        .from('pending_workout_sessions')
        .delete()
        .eq('id', sessionId);

    if (deleteError) {
        console.warn('Failed to delete pending session after fetch:', {
            error: deleteError,
            sessionId: sessionId
        });
    }

    return { success: true, data };
}
