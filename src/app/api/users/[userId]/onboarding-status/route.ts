import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logging'

interface RouteParams {
  params: {
    userId: string
  }
}

/**
 * Check User Onboarding Status API Endpoint
 * 
 * GET /api/users/[userId]/onboarding-status
 * 
 * Returns whether a user has completed the Neural onboarding process.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.warn('Unauthorized onboarding status check', {
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
      logger.warn('User ID mismatch in onboarding status check', {
        authenticatedUser: user.id,
        requestedUser: userId
      })
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user profile and onboarding status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_responses, created_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error('Failed to fetch user profile for onboarding status', {
        userId,
        error: profileError.message
      })
      return NextResponse.json(
        { error: 'Failed to check onboarding status' },
        { status: 500 }
      )
    }

    // Since training_programs table has been decommissioned, we'll determine
    // program status based on profile completion for Neural system
    const hasPrograms = false // Always false since we decommissioned training programs
    const onboardingCompleted = profile?.onboarding_completed || false

    logger.info('Onboarding status checked', {
      userId,
      onboardingCompleted,
      hasPrograms,
      hasOnboardingData: Boolean(profile?.onboarding_responses)
    })

    return NextResponse.json({
      completed: onboardingCompleted,
      hasPrograms,
      onboardingData: profile?.onboarding_responses || null,
      profileCreatedAt: profile?.created_at
    })

  } catch (error) {
    logger.error('Onboarding status check failed', {
      userId: params.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to check onboarding status'
      },
      { status: 500 }
    )
  }
}

/**
 * Update User Onboarding Status API Endpoint
 * 
 * PATCH /api/users/[userId]/onboarding-status
 * 
 * Manually update a user's onboarding completion status.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params
    const body = await request.json()
    const { completed, onboardingData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed status must be a boolean' },
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

    // Update user profile
    const updateData: any = {
      onboarding_completed: completed,
      updated_at: new Date().toISOString()
    }

    if (onboardingData) {
      updateData.onboarding_responses = onboardingData
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      logger.error('Failed to update onboarding status', {
        userId,
        error: updateError.message
      })
      return NextResponse.json(
        { error: 'Failed to update onboarding status' },
        { status: 500 }
      )
    }

    logger.info('Onboarding status updated', {
      userId,
      completed,
      hasOnboardingData: Boolean(onboardingData)
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding status updated successfully'
    })

  } catch (error) {
    logger.error('Onboarding status update failed', {
      userId: params.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
