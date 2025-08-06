import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { programGenerator } from '@/services/programGenerator'
import { logger } from '@/lib/logging'
import type { OnboardingData } from '@/types/neural'

// Request validation schema
const GenerateProgramRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  onboardingData: z.object({
    primaryFocus: z.enum(['hypertrophy', 'strength', 'general_fitness']),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
    equipmentAccess: z.enum(['full_gym', 'dumbbells_only', 'bodyweight_only']),
    personalRecords: z.object({
      squat: z.number().optional(),
      bench: z.number().optional(),
      deadlift: z.number().optional()
    }).optional(),
    additionalInfo: z.object({
      injuryHistory: z.string().optional(),
      preferences: z.array(z.string()).optional(),
      availableDays: z.number().min(1).max(7).optional()
    }).optional()
  })
})

/**
 * Neural Program Generation API Endpoint
 * 
 * POST /api/neural/generate-program
 * 
 * Creates a new Neural-powered training program based on user onboarding data.
 * This endpoint integrates with the Neural API service and stores the generated
 * program in the database.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse and validate request body
    const body = await request.json()
    const { userId, onboardingData } = GenerateProgramRequestSchema.parse(body)

    logger.info('Neural program generation requested', {
      operation: 'generateProgram',
      component: 'neuralAPI',
      userId,
      primaryFocus: onboardingData.primaryFocus,
      experienceLevel: onboardingData.experienceLevel,
      sessionDuration: onboardingData.sessionDuration,
      equipmentAccess: onboardingData.equipmentAccess
    })

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Unauthorized neural program generation attempt', {
        userId,
        error: authError?.message
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user matches the requested userId
    if (user.id !== userId) {
      logger.warn('User ID mismatch in neural program generation', {
        authenticatedUser: user.id,
        requestedUser: userId
      })
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Generate program using Neural API service
    const result = await programGenerator.createNewProgram(userId, onboardingData)

    if (!result.success) {
      logger.error('Neural program generation failed', {
        userId,
        error: result.error,
        details: result.details
      })
      
      return NextResponse.json(
        { 
          error: result.error || 'Program generation failed',
          details: result.details 
        },
        { status: 500 }
      )
    }

    // Update user profile to mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_responses: onboardingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      logger.warn('Failed to update user profile after program generation', {
        userId,
        error: profileError.message
      })
      // Don't fail the request for profile update issues
    }

    const duration = Date.now() - startTime

    logger.info('Neural program generation completed successfully', {
      operation: 'generateProgram',
      component: 'neuralAPI',
      userId,
      programId: result.program?.id,
      programName: result.program?.programName,
      duration
    })

    return NextResponse.json({
      success: true,
      program: result.program,
      message: 'Neural program generated successfully'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.warn('Invalid neural program generation request', {
        errors: error.errors,
        duration
      })
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    logger.error('Neural program generation endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Something went wrong generating your program. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * Get Neural program generation status
 * 
 * GET /api/neural/generate-program?userId=<id>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Since training_programs table has been decommissioned,
    // we skip the legacy program check for Neural system

    // Check onboarding completion status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_responses')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error('Failed to check user profile', {
        userId,
        error: profileError.message
      })
      return NextResponse.json(
        { error: 'Failed to check onboarding status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasProgram: false, // Neural generates on-demand, no stored programs
      latestProgram: null,
      onboardingCompleted: profile?.onboarding_completed || false,
      onboardingData: profile?.onboarding_responses || null
    })

  } catch (error) {
    logger.error('Neural program status check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
