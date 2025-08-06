import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { programGenerator } from '@/services/programGenerator';
import { logger } from '@/lib/logging';
import { 
  NeuralGenerateRequestSchema,
  validateRequest,
  createValidationErrorResponse
} from '@/lib/validation/neuralApiSchemas';
import type { NeuralGenerateRequest } from '@/lib/validation/neuralApiSchemas';
import type { 
  Workout, 
  PrescribedExercise, 
  TrainingWeek,
  DayOfWeek,
  TrainingFocus,
  MuscleGroup,
  EquipmentType,
  ExerciseTier,
  convertWorkoutToWorkoutDay
} from '@/lib/types/workout';
import type { OnboardingData } from '@/types/neural';

/**
 * Neural Program Generation API Endpoint
 * 
 * POST /api/neural/generate
 * 
 * Generates Neural-powered training programs that strictly conform to our
 * workout type system. Returns properly typed Workout and Exercise objects.
 */

/**
 * Neural API Response structure conforming to workout types
 */
interface NeuralResponse {
  success: true;
  program: {
    id: string;
    userId: string;
    programName: string;
    weekNumber: number;
    workouts: Workout[];
    progressionNotes: string;
    createdAt: Date;
    neuralInsights: string;
  };
  reasoning: string;
  progressionPlan: string;
  nextWeekPreview: string;
  message: string;
  requestId: string;
}

interface NeuralErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
  requestId: string;
}

/**
 * Transform Neural API response to conform to our workout types
 */
function transformToWorkoutTypes(neuralProgram: any, userId: string): NeuralResponse['program'] {
  const transformExercise = (exercise: any): PrescribedExercise => ({
    id: exercise.id || crypto.randomUUID(),
    name: exercise.name,
    category: 'compound_movement', // Default, should be inferred from exercise
    primaryMuscles: exercise.targetMuscles?.map((muscle: string) => 
      muscle.toLowerCase().replace(/\s+/g, '_') as MuscleGroup
    ) || ['full_body'],
    secondaryMuscles: [],
    equipment: ['barbell'], // Default, should be inferred
    tier: 'Primary' as ExerciseTier,
    isAnchorLift: exercise.tier === 'Anchor' || false,
    sets: exercise.sets || 3,
    reps: exercise.reps || '8-12',
    load: exercise.load,
    rpe: exercise.rpe,
    restBetweenSets: exercise.rest,
    instructions: exercise.notes,
    formCues: exercise.notes,
    rationale: `Targeted exercise for ${exercise.targetMuscles?.join(', ') || 'general fitness'}`
  });

  const transformWorkout = (workout: any, dayIndex: number): Workout => {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return {
      id: workout.id || crypto.randomUUID(),
      name: workout.name,
      dayOfWeek: days[dayIndex] || 'Monday',
      isRestDay: !workout.mainExercises || workout.mainExercises.length === 0,
      focus: workout.focus,
      estimatedDuration: workout.duration || workout.totalEstimatedTime || 60,
      exercises: [
        ...(workout.warmup?.map(transformExercise) || []),
        ...(workout.mainExercises?.map(transformExercise) || []),
        ...(workout.finisher?.map(transformExercise) || [])
      ],
      instructions: `Focus: ${workout.focus}. Estimated duration: ${workout.duration || 60} minutes.`
    };
  };

  return {
    id: neuralProgram.id || crypto.randomUUID(),
    userId,
    programName: neuralProgram.programName || 'Neural Generated Program',
    weekNumber: neuralProgram.weekNumber || 1,
    workouts: neuralProgram.workouts?.map(transformWorkout) || [],
    progressionNotes: neuralProgram.progressionNotes || 'Progressive overload with neural adaptations',
    createdAt: new Date(),
    neuralInsights: neuralProgram.neuralInsights || 'Program generated using advanced neural analysis'
  };
}
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(NeuralGenerateRequestSchema, body);
    
    if (!validation.success) {
      logger.warn('Invalid neural generate request', {
        operation: 'neuralGenerate',
        component: 'neuralAPI',
        requestId,
        errors: validation.errors
      });
      return createValidationErrorResponse(validation.errors, requestId);
    }

    const { userId, onboardingData, regenerate, weekNumber } = validation.data;

    logger.info('Neural program generation requested', {
      operation: 'neuralGenerate',
      component: 'neuralAPI',
      requestId,
      userId,
      primaryFocus: onboardingData.primaryFocus,
      experienceLevel: onboardingData.experienceLevel,
      sessionDuration: onboardingData.sessionDuration,
      equipmentAccess: onboardingData.equipmentAccess,
      regenerate,
      weekNumber
    });

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthorized neural program generation attempt', {
        operation: 'neuralGenerate',
        component: 'neuralAPI',
        requestId,
        userId,
        error: authError?.message
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          requestId
        },
        { status: 401 }
      );
    }

    // Verify user matches the requested userId
    if (user.id !== userId) {
      logger.warn('User ID mismatch in neural program generation', {
        operation: 'neuralGenerate',
        component: 'neuralAPI',
        requestId,
        authenticatedUser: user.id,
        requestedUser: userId
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Forbidden: User ID mismatch',
          requestId
        },
        { status: 403 }
      );
    }

    // Note: Since we decommissioned training_programs table, 
    // we allow regeneration anytime for the Neural system
    logger.info('Neural program generation proceeding', {
      operation: 'neuralGenerate',
      component: 'neuralAPI',
      requestId,
      userId,
      regenerate
    });

    // Generate program using Neural API service
    const result = await programGenerator.createNewProgram(userId, onboardingData);

    if (!result.success) {
      logger.error('Neural program generation failed', {
        operation: 'neuralGenerate',
        component: 'neuralAPI',
        requestId,
        userId,
        error: result.error,
        details: result.details
      });
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Program generation failed',
        details: result.details,
        requestId
      } as NeuralErrorResponse, { status: 500 });
    }

    // Transform the result to conform to our workout types
    const transformedProgram = transformToWorkoutTypes(result.program, userId);

    // Update user profile to mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_responses: onboardingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      logger.warn('Failed to update user profile after program generation', {
        operation: 'neuralGenerate',
        component: 'neuralAPI',
        requestId,
        userId,
        error: profileError.message
      });
      // Don't fail the request for profile update issues
    }

    const duration = Date.now() - startTime;

    logger.info('Neural program generation completed successfully', {
      operation: 'neuralGenerate',
      component: 'neuralAPI',
      requestId,
      userId,
      programId: transformedProgram.id,
      programName: transformedProgram.programName,
      workoutCount: transformedProgram.workouts.length,
      duration
    });

    // Return response conforming to our workout types
    const response: NeuralResponse = {
      success: true,
      program: transformedProgram,
      reasoning: "Neural has analyzed your onboarding data and created a personalized program tailored to your goals and experience level.",
      progressionPlan: transformedProgram.progressionNotes,
      nextWeekPreview: `Continue with week ${transformedProgram.weekNumber + 1} for progressive overload and adaptation.`,
      message: 'Neural program generated successfully',
      requestId
    };

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Neural program generation endpoint error', {
      operation: 'neuralGenerate',
      component: 'neuralAPI',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Something went wrong generating your program. Please try again.',
      requestId
    } as NeuralErrorResponse, { status: 500 });
  }
}

/**
 * Get Neural program generation status and existing programs
 * 
 * GET /api/neural/generate?userId=<id>
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        requestId
      }, { status: 400 });
    }

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      logger.warn('Unauthorized access to neural generation status', {
        operation: 'neuralGenerateStatus',
        component: 'neuralAPI',
        requestId,
        userId,
        authenticatedUserId: user?.id
      });
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        requestId
      }, { status: 401 });
    }

    // Since training_programs table was decommissioned, we check profile status
    // Neural programs are generated on-demand and not stored in database
    logger.info('Checking Neural generation status for user', {
      operation: 'neuralGenerateStatus',
      component: 'neuralAPI',
      requestId,
      userId
    });
    
    // No stored programs to check since Neural generates on-demand
    const programs = [];

    // Check onboarding completion status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_responses')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.error('Failed to check user profile', {
        operation: 'neuralGenerateStatus',
        component: 'neuralAPI',
        requestId,
        userId,
        error: profileError.message
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to check onboarding status',
        requestId
      }, { status: 500 });
    }

    logger.info('Neural generation status retrieved', {
      operation: 'neuralGenerateStatus',
      component: 'neuralAPI',
      requestId,
      userId,
      onboardingCompleted: profile?.onboarding_completed || false
    });

    return NextResponse.json({
      success: true,
      hasPrograms: false, // Neural generates on-demand, no stored programs
      programs: [],
      latestProgram: null,
      onboardingCompleted: profile?.onboarding_completed || false,
      onboardingData: profile?.onboarding_responses || null,
      canGenerate: true,
      requestId
    });

  } catch (error) {
    logger.error('Neural program status check failed', {
      operation: 'neuralGenerateStatus',
      component: 'neuralAPI',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      requestId
    }, { status: 500 });
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Return 405 for all other methods
const unsupportedMethods = ['PUT', 'DELETE', 'PATCH'];
export const PUT = () => new NextResponse('Method Not Allowed', { status: 405 });
export const DELETE = () => new NextResponse('Method Not Allowed', { status: 405 });
export const PATCH = () => new NextResponse('Method Not Allowed', { status: 405 });
