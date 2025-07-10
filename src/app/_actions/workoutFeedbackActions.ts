'use server'

import { createClient } from '@/utils/supabase/server'

export type WorkoutFeedback = 'easy' | 'good' | 'hard'

export interface SubmitWorkoutFeedbackParams {
  workoutGroupId: string
  feedback: WorkoutFeedback
}

export interface SubmitWorkoutFeedbackResult {
  success: boolean
  error?: string
}

/**
 * Submit feedback for a completed workout session
 */
export async function submitWorkoutFeedback({
  workoutGroupId,
  feedback
}: SubmitWorkoutFeedbackParams): Promise<SubmitWorkoutFeedbackResult> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error in submitWorkoutFeedback:', authError)
      return {
        success: false,
        error: 'Authentication required. Please log in again.'
      }
    }

    console.log('Submitting workout feedback for user:', user.id.substring(0, 6))

    // Validate feedback value
    if (!['easy', 'good', 'hard'].includes(feedback)) {
      console.error('Invalid feedback value provided:', feedback)
      return {
        success: false,
        error: 'Invalid feedback value. Please select easy, good, or hard.'
      }
    }

    // Insert or update workout session feedback
    const { error: insertError } = await supabase
      .from('workout_session_feedback')
      .upsert({
        user_id: user.id,
        workout_group_id: workoutGroupId,
        feedback: feedback
      }, {
        onConflict: 'user_id,workout_group_id'
      })

    if (insertError) {
      console.error('Error submitting workout feedback:', insertError)
      return {
        success: false,
        error: 'Failed to save feedback. Please try again.'
      }
    }

    console.log('Workout feedback submitted successfully')
    return {
      success: true
    }
    
  } catch (error) {
    console.error('Unexpected error in submitWorkoutFeedback:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Get workout session feedback for a specific workout group
 */
export async function getWorkoutFeedback(workoutGroupId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error in getWorkoutFeedback:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    console.log('Fetching workout feedback for user:', user.id.substring(0, 6))

    const { data, error } = await supabase
      .from('workout_session_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_group_id', workoutGroupId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching workout feedback:', error)
      return { success: false, error: 'Failed to fetch feedback. Please try again.' }
    }

    return {
      success: true,
      data: data || null
    }
    
  } catch (error) {
    console.error('Unexpected error in getWorkoutFeedback:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
} 