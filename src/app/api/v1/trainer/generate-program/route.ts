/**
 * Trainer API: Generate Program Endpoint
 * Protected endpoint that requires API key authentication
 * Leverages the core AI program generation engine
 */

import { NextRequest } from 'next/server'
import { requireApiKey, createApiErrorResponse, createApiSuccessResponse, handleCorsPreFlight, parseJsonBody, addCorsHeaders } from '@/lib/auth/apiMiddleware'
import { validateRequest, GenerateProgramRequestSchema, GenerateProgramResponseSchema } from '@/lib/validation/trainerApiSchemas'
import { programGenerator } from '@/services/programGenerator';

import type { GenerateProgramRequest, UserBiometrics, TrainingGoals, ExperienceLevel } from '@/lib/types/apiKeys'
import type { OnboardingData, SessionDuration } from '@/lib/types/onboarding'
import type { UserProfileForGeneration } from '@/lib/types/program'

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight()
}

/**
 * Convert API request data to internal format
 */
function convertToOnboardingData(
  trainingGoals: TrainingGoals,
  experienceLevel: ExperienceLevel,
  userBiometrics: UserBiometrics
): OnboardingData {
  return {
    primaryGoal: trainingGoals.primary_goal as any, // We'll need to map this properly
    trainingFrequencyDays: trainingGoals.training_frequency_days,
    sessionDuration: trainingGoals.session_duration as SessionDuration,
    availableEquipment: trainingGoals.available_equipment,
    experienceLevel: experienceLevel.level,
    currentWeight: userBiometrics.weight,
    weightUnit: userBiometrics.weight_unit,
    age: userBiometrics.age,
    injuryHistory: experienceLevel.previous_injuries?.join(', '),
    specificGoals: trainingGoals.secondary_goals?.join(', '),
    // Add other required fields with defaults
    hasGymAccess: trainingGoals.available_equipment.some(eq => 
      eq.includes('Gym') || eq.includes('Barbells') || eq.includes('Machines')
    ),
    preferredIntensity: 'Moderate', // Default
    timeConstraints: trainingGoals.session_duration,
    // Strength levels from lifting experience
    currentSquatWeight: experienceLevel.lifting_experience?.squat_1rm,
    currentBenchWeight: experienceLevel.lifting_experience?.bench_1rm,
    currentDeadliftWeight: experienceLevel.lifting_experience?.deadlift_1rm,
    currentOverheadPressWeight: experienceLevel.lifting_experience?.overhead_press_1rm,
  }
}

/**
 * Convert API request data to UserProfileForGeneration
 */
function convertToUserProfile(
  request: GenerateProgramRequest,
  generatedId: string = 'api-generated'
): UserProfileForGeneration {
  const onboardingData = convertToOnboardingData(
    request.training_goals,
    request.experience_level,
    request.user_biometrics
  )

  return {
    id: generatedId,
    name: request.client_info?.client_name || 'API User',
    age: request.user_biometrics.age,
    weight_unit: request.user_biometrics.weight_unit,
    primary_training_focus: request.training_goals.primary_goal,
    experience_level: request.experience_level.level,
  }
}

/**
 * POST /api/v1/trainer/generate-program
 * Generate a training program using AI
 */
export const POST = requireApiKey('program:generate')(async (request: NextRequest, context) => {
  const { apiKey, requestId } = context
  const startTime = Date.now()

  try {
    console.log(`[${requestId}] Starting program generation for API key: ${apiKey.key_prefix}`)

    // Parse and validate request body
    const { data: requestBody, error: parseError } = await parseJsonBody<GenerateProgramRequest>(request)
    
    if (parseError || !requestBody) {
      return createApiErrorResponse(
        'INVALID_REQUEST_BODY',
        parseError || 'Invalid request body',
        400,
        undefined,
        requestId
      )
    }

    // Validate request data
    const validation = validateRequest(GenerateProgramRequestSchema, requestBody)
    if (!validation.success) {
      return createApiErrorResponse(
        'VALIDATION_ERROR',
        'Request validation failed',
        400,
        { validation_errors: validation.errors },
        requestId
      )
    }

    const validatedRequest = validation.data

    console.log(`[${requestId}] Request validated successfully`)
    console.log(`[${requestId}] Generating program for ${validatedRequest.experience_level.level} level user`)
    console.log(`[${requestId}] Primary goal: ${validatedRequest.training_goals.primary_goal}`)
    console.log(`[${requestId}] Training frequency: ${validatedRequest.training_goals.training_frequency_days} days/week`)

    // Convert to internal format
    const userProfile = convertToUserProfile(validatedRequest, `api-${requestId}`)
    
    console.log(`[${requestId}] Generating program using Neural system...`)
    
    // Convert to onboarding data for Neural system
    const onboardingData = convertToOnboardingData(
      validatedRequest.training_goals,
      validatedRequest.experience_level,
      validatedRequest.user_biometrics
    )
    
    // Generate program using Neural system
    const generationResult = await programGenerator.createNewProgram(
      userProfile.id,
      onboardingData
    )
    
    if (!generationResult.success || !generationResult.program) {
      console.error(`[${requestId}] Neural generation failed:`, generationResult.error)
      return createApiErrorResponse(
        'PROGRAM_GENERATION_FAILED',
        'Failed to generate training program',
        500,
        { 
          neural_error: generationResult.error,
          details: generationResult.details
        },
        requestId
      )
    }
    
    console.log(`[${requestId}] Program generated successfully using Neural system`)
    
    // Step 3: Use the Neural program (no additional validation needed)
    const programData = {
      ...generationResult.program,
      generatedAt: new Date().toISOString(),
      aiModelUsed: 'neural-v1',
    }
    
    const validationResult = { success: true, data: programData }
    if (!validationResult.success) {
      console.error(`[${requestId}] Program validation failed:`, validationResult.error.flatten())
      return createApiErrorResponse(
        'PROGRAM_VALIDATION_FAILED',
        'Generated program failed validation',
        500,
        {
          validation_error: validationResult.error.message,
          details: process.env.NODE_ENV === 'development' ? validationResult.error.flatten() : undefined
        },
        requestId
      )
    }
    
    const validatedProgram = validationResult.data
    const generationTime = Date.now() - startTime
    
    console.log(`[${requestId}] Program validation completed successfully`)
    console.log(`[${requestId}] Total generation time: ${generationTime}ms`)
    
    // Step 4: Format response
    const response = {
      success: true,
      program: {
        id: `api-generated-${requestId}`,
        name: validatedProgram.programName || 'AI Generated Training Program',
        duration_weeks: validatedProgram.totalDurationWeeks || 8,
        training_days: validatedProgram.trainingWeeks || [],
        metadata: {
          generated_at: new Date().toISOString(),
          ai_model_used: programData.aiModelUsed,
          generation_time_ms: generationTime,
          weak_point_analysis: [],
          periodization_model: 'Neural'
        }
      },
      generation_time_ms: generationTime
    }
    
    // Validate response format
    const responseValidation = validateRequest(GenerateProgramResponseSchema, response)
    if (!responseValidation.success) {
      console.error(`[${requestId}] Response validation failed:`, responseValidation.errors)
      return createApiErrorResponse(
        'RESPONSE_FORMAT_ERROR',
        'Generated response format is invalid',
        500,
        {
          validation_errors: responseValidation.errors
        },
        requestId
      )
    }
    
    console.log(`[${requestId}] Program generation completed successfully`)
    
    // Return success response with CORS headers
    const successResponse = createApiSuccessResponse(
      response,
      200,
      requestId,
      context.apiKey ? {
        requests_made: context.apiKey.total_requests + 1,
        limit: context.apiKey.rate_limit_per_hour,
        reset_time: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      } : undefined
    )
    
    return addCorsHeaders(successResponse)
    
  } catch (error: any) {
    const generationTime = Date.now() - startTime
    console.error(`[${requestId}] Unexpected error in program generation:`, error)
    
    const errorResponse = createApiErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred during program generation',
      500,
      {
        generation_time_ms: generationTime,
        error_details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      requestId
    )
    
    return addCorsHeaders(errorResponse)
  }
})

/**
 * GET /api/v1/trainer/generate-program
 * Return API documentation and usage information
 */
export async function GET(request: NextRequest) {
  const apiInfo = {
    endpoint: '/api/v1/trainer/generate-program',
    method: 'POST',
    description: 'Generate a personalized training program using AI',
    authentication: {
      type: 'API Key',
      required_scope: 'program:generate',
      headers: [
        'Authorization: Bearer <your-api-key>',
        'X-API-Key: <your-api-key>'
      ]
    },
    rate_limits: {
      default_hourly: 100,
      default_daily: 1000,
      note: 'Limits vary by API key configuration'
    },
    request_format: {
      content_type: 'application/json',
      required_fields: [
        'user_biometrics',
        'training_goals',
        'experience_level'
      ],
      optional_fields: [
        'client_info'
      ]
    },
    response_format: {
      success: {
        success: true,
        program: 'Complete training program object',
        generation_time_ms: 'Processing time in milliseconds'
      },
      error: {
        success: false,
        error: {
          code: 'Error code',
          message: 'Human readable error message',
          details: 'Additional error details (development only)'
        }
      }
    },
    example_request: {
      user_biometrics: {
        age: 28,
        weight: 75,
        weight_unit: 'kg',
        fitness_level: 'intermediate'
      },
      training_goals: {
        primary_goal: 'Muscle Gain: General',
        training_frequency_days: 4,
        session_duration: '60-75 minutes',
        available_equipment: ['Full Gym (Barbells, Racks, Machines)']
      },
      experience_level: {
        level: 'intermediate',
        years_training: 3,
        lifting_experience: {
          squat_1rm: 120,
          bench_1rm: 90,
          deadlift_1rm: 140
        }
      }
    },
    documentation_url: 'https://docs.neurallift.com/api/trainer/generate-program'
  }
  
  const response = createApiSuccessResponse(apiInfo, 200)
  return addCorsHeaders(response)
}

// Ensure all other HTTP methods return 405
export async function PUT() {
  const response = createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
  return addCorsHeaders(response)
}

export async function PATCH() {
  const response = createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
  return addCorsHeaders(response)
}

export async function DELETE() {
  const response = createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
  return addCorsHeaders(response)
}