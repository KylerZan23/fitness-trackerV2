'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

/**
 * Standardized response types for server actions
 */
export type StandardResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Simple test server action to verify server actions are working
 */
export async function testServerAction(): Promise<StandardResponse<{ message: string }>> {
  try {
    console.log('testServerAction called')
    return { success: true, data: { message: 'Server action is working!' } }
  } catch (error) {
    console.error('Error in testServerAction:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
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
export type FeedbackResponse = 
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Submit feedback for an AI-generated training program
 * Note: Neural programs generate on-demand, so this function is deprecated.
 * Kept for backwards compatibility but returns an error.
 */
export async function submitProgramFeedback(
  programId: string,
  rating: number,
  comment?: string
): Promise<FeedbackResponse> {
  console.log('submitProgramFeedback called but Neural system does not support persistent program feedback')
  return { 
    success: false, 
    error: 'Program feedback is not supported for Neural-generated programs. Programs are generated on-demand.' 
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
    console.log('submitCoachFeedback called')
    
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
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    console.log('User authenticated for coach feedback:', user.id)

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
        return { success: false, error: 'Recommendation not found or access denied.' }
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
      return { success: false, error: 'Failed to submit feedback. Please try again.' }
    }

    console.log(`Coach feedback submitted successfully: ${feedback.id}`)
    return { success: true, id: feedback.id }

  } catch (error) {
    console.error('Error in submitCoachFeedback:', error)
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ')
      console.error('Validation errors:', error.errors)
      return { success: false, error: `Invalid input: ${errorMessage}` }
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Get aggregated feedback statistics
 */
export async function getFeedbackStats(): Promise<StandardResponse<{
  programFeedback: { averageRating: number; totalCount: number } | null
  coachFeedback: { averageRating: number; totalCount: number } | null
}>> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in getFeedbackStats:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    console.log('Getting feedback stats for user:', user.id)

    // Get program feedback stats
    const { data: programStats, error: programError } = await supabase
      .from('ai_program_feedback')
      .select('rating')
      .eq('user_id', user.id)

    if (programError) {
      console.error('Error fetching program feedback stats:', programError)
      return { success: false, error: 'Failed to retrieve feedback statistics. Please try again.' }
    }

    // Get coach feedback stats
    const { data: coachStats, error: coachError } = await supabase
      .from('ai_coach_feedback')
      .select('rating')
      .eq('user_id', user.id)

    if (coachError) {
      console.error('Error fetching coach feedback stats:', coachError)
      return { success: false, error: 'Failed to retrieve feedback statistics. Please try again.' }
    }

    // Calculate program feedback stats
    const programFeedback = programStats && programStats.length > 0 
      ? {
          averageRating: programStats.reduce((sum, f) => sum + f.rating, 0) / programStats.length,
          totalCount: programStats.length,
        }
      : null

    // Calculate coach feedback stats
    const coachFeedback = coachStats && coachStats.length > 0
      ? {
          averageRating: coachStats.reduce((sum, f) => sum + f.rating, 0) / coachStats.length,
          totalCount: coachStats.length,
        }
      : null

    return {
      success: true,
      data: {
        programFeedback,
        coachFeedback,
      }
    }

  } catch (error) {
    console.error('Error in getFeedbackStats:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Check if feedback tables exist and are accessible
 */
export async function checkFeedbackTable(): Promise<StandardResponse<{ message: string }>> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in checkFeedbackTable:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    console.log('Checking feedback table accessibility for user:', user.id)

    // Test program feedback table
    const { error: programTableError } = await supabase
      .from('ai_program_feedback')
      .select('id')
      .limit(1)

    if (programTableError) {
      console.error('Program feedback table check failed:', programTableError)
      return { success: false, error: 'Feedback system is currently unavailable. Please try again later.' }
    }

    // Test coach feedback table
    const { error: coachTableError } = await supabase
      .from('ai_coach_feedback')
      .select('id')
      .limit(1)

    if (coachTableError) {
      console.error('Coach feedback table check failed:', coachTableError)
      return { success: false, error: 'Feedback system is currently unavailable. Please try again later.' }
    }

    return {
      success: true,
      data: { message: 'Feedback tables are accessible and working correctly.' }
    }

  } catch (error) {
    console.error('Error in checkFeedbackTable:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
} 