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
  ExerciseCategory,
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
 * Transform Neural AI-generated program to conform to our workout types
 */
function transformToWorkoutTypes(aiProgram: any): Workout[] {
  // Helper function to map AI exercise to PrescribedExercise
  const transformExercise = (exercise: any): PrescribedExercise => {
    // Infer exercise category from name
    const inferCategory = (name: string): ExerciseCategory => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('squat') || lowerName.includes('deadlift') || lowerName.includes('bench')) {
        return 'compound_movement';
      }
      if (lowerName.includes('curl') || lowerName.includes('extension') || lowerName.includes('fly')) {
        return 'isolation';
      }
      if (lowerName.includes('plank') || lowerName.includes('crunch') || lowerName.includes('abs')) {
        return 'core';
      }
      return 'compound_movement'; // Default
    };

    // Infer primary muscles from exercise name
    const inferMuscles = (name: string): MuscleGroup[] => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('squat') || lowerName.includes('lunge')) return ['quads', 'glutes'];
      if (lowerName.includes('deadlift')) return ['hamstrings', 'glutes', 'back'];
      if (lowerName.includes('bench') || lowerName.includes('chest')) return ['chest'];
      if (lowerName.includes('row') || lowerName.includes('pull')) return ['back'];
      if (lowerName.includes('shoulder') || lowerName.includes('press')) return ['shoulders'];
      if (lowerName.includes('curl') || lowerName.includes('bicep')) return ['biceps'];
      if (lowerName.includes('tricep') || lowerName.includes('extension')) return ['triceps'];
      if (lowerName.includes('calf')) return ['calves'];
      return ['full_body'];
    };

    // Infer equipment from exercise name
    const inferEquipment = (name: string): EquipmentType[] => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('barbell')) return ['barbell'];
      if (lowerName.includes('dumbbell')) return ['dumbbell'];
      if (lowerName.includes('cable')) return ['cable'];
      if (lowerName.includes('machine')) return ['machine'];
      if (lowerName.includes('bodyweight') || lowerName.includes('push-up') || lowerName.includes('pull-up')) {
        return ['bodyweight'];
      }
      return ['barbell']; // Default
    };

    // Infer exercise tier from sets/reps
    const inferTier = (sets: number, reps: string): ExerciseTier => {
      if (sets >= 4 || reps.includes('1-') || reps.includes('2-') || reps.includes('3-')) {
        return 'Primary';
      }
      if (sets === 3) return 'Secondary';
      return 'Accessory';
    };

    const exerciseName = exercise.name || 'Untitled Exercise';
    const sets = exercise.sets || 3;
    const reps = exercise.reps || '8-12';

    return {
      id: exercise.id || crypto.randomUUID(),
      name: exerciseName,
      category: inferCategory(exerciseName),
      primaryMuscles: inferMuscles(exerciseName),
      secondaryMuscles: [],
      equipment: inferEquipment(exerciseName),
      tier: inferTier(sets, reps),
      isAnchorLift: exerciseName.toLowerCase().includes('squat') || 
                    exerciseName.toLowerCase().includes('deadlift') || 
                    exerciseName.toLowerCase().includes('bench'),
      sets,
      reps,
      load: exercise.weight || exercise.load,
      rpe: exercise.rpe,
      restBetweenSets: exercise.rest || (exercise.restMinutes ? `${exercise.restMinutes} minutes` : undefined),
      instructions: exercise.notes,
      formCues: exercise.notes,
      rationale: `AI-generated exercise targeting ${inferMuscles(exerciseName).join(', ')}`
    };
  };

  // Helper function to map string workout focus to TrainingFocus
  const mapWorkoutFocus = (focus: string): string => {
    const lowerFocus = focus.toLowerCase();
    if (lowerFocus.includes('strength')) return 'strength';
    if (lowerFocus.includes('hypertrophy') || lowerFocus.includes('muscle')) return 'hypertrophy';
    if (lowerFocus.includes('endurance') || lowerFocus.includes('cardio')) return 'endurance';
    if (lowerFocus.includes('power')) return 'power';
    return 'general_fitness';
  };

  // Get day names for mapping
  const dayNames: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const workouts: Workout[] = [];

  // Iterate over the day-based keys (day1, day2, etc.)
  Object.keys(aiProgram).forEach((dayKey, index) => {
    // Skip non-day keys (like reasoning, progressionPlan, etc.)
    if (!dayKey.startsWith('day')) return;

    const dayData = aiProgram[dayKey];
    
    // Handle case where day might be null or empty (rest day)
    if (!dayData || !dayData.exercises || dayData.exercises.length === 0) {
      // Create a rest day
      workouts.push({
        id: crypto.randomUUID(),
        name: 'Rest Day',
        dayOfWeek: dayNames[index] || 'Monday',
        isRestDay: true,
        focus: 'general_fitness',
        estimatedDuration: 0,
        exercises: [],
        instructions: 'Rest and recovery day'
      });
      return;
    }

    // Transform exercises
    const exercises = dayData.exercises.map(transformExercise);

    // Create workout object
    const workout: Workout = {
      id: dayData.id || crypto.randomUUID(),
      name: dayData.name || `Day ${index + 1} Workout`,
      dayOfWeek: dayNames[index] || 'Monday',
      isRestDay: false,
      focus: mapWorkoutFocus(dayData.focus || dayData.name || 'general_fitness'),
      estimatedDuration: dayData.duration || dayData.estimatedDuration || 
                        (exercises.length * 15), // Estimate based on exercise count
      exercises,
      instructions: dayData.instructions || `Complete all exercises with proper form and adequate rest.`
    };

    workouts.push(workout);
  });

  return workouts;
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
    const transformedWorkouts = transformToWorkoutTypes(result.program);

    try {
      // Update user profile to mark onboarding as completed
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_responses: onboardingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .throwOnError();

      const duration = Date.now() - startTime;

      // Create program structure with transformed workouts
      const transformedProgram = {
        id: crypto.randomUUID(),
        userId,
        programName: 'Neural Generated Program',
        weekNumber: weekNumber || 1,
        workouts: transformedWorkouts,
        progressionNotes: 'Progressive overload with neural adaptations',
        createdAt: new Date(),
        neuralInsights: 'Program generated using advanced neural analysis'
      };

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
      console.error('Failed to generate program:', error);
      return NextResponse.json(
        { error: "Failed to generate program." },
        { status: 500 }
      );
    }

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
