'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

/**
 * Simple test server action to verify server actions are working
 */
export async function testServerAction(): Promise<{ success: boolean; message: string }> {
  console.log('testServerAction called')
  return { success: true, message: 'Server action is working!' }
}

/**
 * Zod schemas for validating feedback input data
 */
const ProgramFeedbackSchema = z.object({
  programId: z.string().uuid('Invalid program ID format'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
})

const CoachFeedbackSchema = z.object({
  recommendationCacheKey: z.string().optional(),
  recommendationContentHash: z.string().optional(),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
}).refine(
  (data) => data.recommendationCacheKey || data.recommendationContentHash,
  {
    message: 'Either recommendationCacheKey or recommendationContentHash must be provided',
    path: ['recommendationCacheKey'],
  }
)

/**
 * Response types for feedback actions
 */
type FeedbackResponse = 
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Submit feedback for an AI-generated training program
 */
export async function submitProgramFeedback(
  programId: string,
  rating: number,
  comment?: string
): Promise<FeedbackResponse> {
  try {
    console.log('submitProgramFeedback called with:', { programId, rating, comment })
    
    // Validate input data
    const validatedData = ProgramFeedbackSchema.parse({
      programId,
      rating,
      comment,
    })
    
    console.log('Validation passed:', validatedData)

    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in submitProgramFeedback:', authError)
      return { success: false, error: 'Authentication required' }
    }
    
    console.log('User authenticated:', user.id)

    // Verify the program exists and belongs to the user
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id')
      .eq('id', validatedData.programId)
      .eq('user_id', user.id)
      .single()

    if (programError || !program) {
      console.error('Program verification error:', programError)
      console.error('Program query result:', { program, programError })
      return { success: false, error: 'Program not found or access denied' }
    }
    
    console.log('Program verified:', program.id)

    // Test database connectivity and check if table exists
    console.log('Testing database connectivity...')
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'ai_program_feedback')
        .single()
      
      console.log('Table check result:', { tableCheck, tableError })
      
      if (tableError && tableError.code === 'PGRST116') {
        console.log('Table ai_program_feedback does not exist')
        return { success: false, error: 'Feedback table does not exist. Please contact support.' }
      }
    } catch (tableCheckError) {
      console.error('Error checking table existence:', tableCheckError)
    }

    // Insert feedback
    console.log('Attempting to insert feedback with data:', {
      user_id: user.id,
      program_id: validatedData.programId,
      rating: validatedData.rating,
      comment: validatedData.comment || null,
    })

    const { data: feedback, error: insertError } = await supabase
      .from('ai_program_feedback')
      .insert({
        user_id: user.id,
        program_id: validatedData.programId,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
      })
      .select('id')
      .single()

    console.log('Insert result:', { feedback, insertError })

    if (insertError) {
      console.error('Error inserting program feedback:', insertError)
      console.error('Insert error code:', insertError.code)
      console.error('Insert error message:', insertError.message)
      console.error('Insert error details:', insertError.details)
      console.error('Insert error hint:', insertError.hint)
      return { success: false, error: `Database error: ${insertError.message} (Code: ${insertError.code})` }
    }

    console.log(`Program feedback submitted successfully: ${feedback.id}`)
    return { success: true, id: feedback.id }

  } catch (error) {
    console.error('Error in submitProgramFeedback:', error)
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ')
      console.error('Zod validation errors:', error.errors)
      return { success: false, error: `Validation error: ${errorMessage}` }
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Unexpected error: ${errorMessage}` }
  }
}

/**
 * Submit feedback for an AI Coach recommendation
 */
export async function submitCoachFeedback(
  rating: number,
  comment?: string,
  recommendationCacheKey?: string,
  recommendationContentHash?: string
): Promise<FeedbackResponse> {
  try {
    // Validate input data
    const validatedData = CoachFeedbackSchema.parse({
      recommendationCacheKey,
      recommendationContentHash,
      rating,
      comment,
    })

    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in submitCoachFeedback:', authError)
      return { success: false, error: 'Authentication required' }
    }

    // If cache key is provided, verify it exists and belongs to the user
    if (validatedData.recommendationCacheKey) {
      const { data: cacheEntry, error: cacheError } = await supabase
        .from('ai_coach_cache')
        .select('cache_key')
        .eq('cache_key', validatedData.recommendationCacheKey)
        .eq('user_id', user.id)
        .single()

      if (cacheError || !cacheEntry) {
        console.error('Cache verification error:', cacheError)
        return { success: false, error: 'Recommendation not found or access denied' }
      }
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('ai_coach_feedback')
      .insert({
        user_id: user.id,
        recommendation_cache_key: validatedData.recommendationCacheKey || null,
        recommendation_content_hash: validatedData.recommendationContentHash || null,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting coach feedback:', insertError)
      return { success: false, error: 'Failed to submit feedback' }
    }

    console.log(`Coach feedback submitted successfully: ${feedback.id}`)
    return { success: true, id: feedback.id }

  } catch (error) {
    console.error('Error in submitCoachFeedback:', error)
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ')
      return { success: false, error: `Validation error: ${errorMessage}` }
    }

    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get feedback statistics for analytics (optional helper function)
 */
export async function getFeedbackStats(): Promise<{
  programFeedback: { averageRating: number; totalCount: number } | null
  coachFeedback: { averageRating: number; totalCount: number } | null
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        programFeedback: null,
        coachFeedback: null,
        error: 'Authentication required',
      }
    }

    // Get program feedback stats
    const { data: programStats, error: programStatsError } = await supabase
      .from('ai_program_feedback')
      .select('rating')
      .eq('user_id', user.id)

    // Get coach feedback stats
    const { data: coachStats, error: coachStatsError } = await supabase
      .from('ai_coach_feedback')
      .select('rating')
      .eq('user_id', user.id)

    if (programStatsError || coachStatsError) {
      console.error('Error fetching feedback stats:', { programStatsError, coachStatsError })
      return {
        programFeedback: null,
        coachFeedback: null,
        error: 'Failed to fetch feedback statistics',
      }
    }

    // Calculate program feedback stats
    const programFeedback = programStats && programStats.length > 0 
      ? {
          averageRating: programStats.reduce((sum, item) => sum + item.rating, 0) / programStats.length,
          totalCount: programStats.length,
        }
      : null

    // Calculate coach feedback stats
    const coachFeedback = coachStats && coachStats.length > 0
      ? {
          averageRating: coachStats.reduce((sum, item) => sum + item.rating, 0) / coachStats.length,
          totalCount: coachStats.length,
        }
      : null

    return {
      programFeedback,
      coachFeedback,
    }

  } catch (error) {
    console.error('Error in getFeedbackStats:', error)
    return {
      programFeedback: null,
      coachFeedback: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check if feedback table exists and provide instructions
 */
export async function checkFeedbackTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Checking if feedback table exists...')
    const supabase = await createClient()

    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('ai_program_feedback')
      .select('id')
      .limit(1)

    if (error) {
      console.log('Table check error:', error)
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Table does not exist. Please create it manually via Supabase Dashboard SQL Editor.' 
        }
      }
      return { 
        success: false, 
        message: `Table check failed: ${error.message}` 
      }
    }

    console.log('Feedback table exists and is accessible')
    return { success: true, message: 'Feedback table exists and is ready to use!' }

  } catch (error) {
    console.error('Error in checkFeedbackTable:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Unexpected error: ${errorMessage}` }
  }
} 