import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { neuralAPI } from '@/services/neuralAPI';
import { logger } from '@/lib/logging';
// Removed import for decommissioned programs module
import { 
  NeuralProgressRequestSchema,
  validateRequest,
  createValidationErrorResponse
} from '@/lib/validation/neuralApiSchemas';
import type { NeuralRequest, ProgressData } from '@/types/neural';

/**
 * Neural Program Progression API Endpoint
 * 
 * POST /api/neural/progress
 * 
 * Advances a user's training program to the next week based on performance
 * data and Neural's adaptive programming logic. Handles week-to-week
 * progression with intelligent load and volume adjustments.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(NeuralProgressRequestSchema, body);
    
    if (!validation.success) {
      logger.warn('Invalid neural progress request', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        errors: validation.errors
      });
      return createValidationErrorResponse(validation.errors, requestId);
    }

    const { 
      userId, 
      programId, 
      currentWeek, 
      progressData, 
      targetWeek, 
      progressionType 
    } = validation.data;

    logger.info('Neural program progression requested', {
      operation: 'neuralProgress',
      component: 'neuralAPI',
      requestId,
      userId,
      programId,
      currentWeek,
      targetWeek: targetWeek || currentWeek + 1,
      progressionType
    });

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Unauthorized neural program progression attempt', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        userId,
        error: authError?.message
      });
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        requestId
      }, { status: 401 });
    }

    // Verify user matches the requested userId
    if (user.id !== userId) {
      logger.warn('User ID mismatch in neural program progression', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        authenticatedUser: user.id,
        requestedUser: userId
      });
      return NextResponse.json({
        success: false,
        error: 'Forbidden: User ID mismatch',
        requestId
      }, { status: 403 });
    }

    // Get the existing program with authorization check
    const programResult = await getProgramById(programId, userId);
    if (!programResult.success || !programResult.data) {
      logger.error('Failed to retrieve program for progression', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        userId,
        programId,
        error: programResult.error
      });
      return NextResponse.json({
        success: false,
        error: programResult.error || 'Program not found',
        requestId
      }, { status: programResult.error?.includes('Unauthorized') ? 403 : 404 });
    }

    const currentProgram = programResult.data;

    // Validate current week matches program state
    if (currentProgram.weekNumber !== currentWeek) {
      logger.warn('Week number mismatch in program progression', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        userId,
        programId,
        programWeek: currentProgram.weekNumber,
        requestedWeek: currentWeek
      });
      return NextResponse.json({
        success: false,
        error: `Week mismatch: Program is on week ${currentProgram.weekNumber}, but progression requested for week ${currentWeek}`,
        currentProgramWeek: currentProgram.weekNumber,
        requestId
      }, { status: 400 });
    }

    // Get onboarding data for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_responses')
      .eq('id', userId)
      .single();

    if (!profile?.onboarding_responses) {
      logger.error('Missing onboarding data for program progression', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        userId,
        programId
      });
      return NextResponse.json({
        success: false,
        error: 'Missing user onboarding data required for progression',
        requestId
      }, { status: 400 });
    }

    // Build Neural request for program progression
    const neuralRequest: NeuralRequest = {
      onboardingData: profile.onboarding_responses,
      currentWeek: targetWeek || currentWeek + 1,
      previousProgress: progressData
    };

    // Generate the next week's program using Neural
    logger.info('Generating next week program with Neural', {
      operation: 'neuralProgress',
      component: 'neuralAPI',
      requestId,
      userId,
      programId,
      fromWeek: currentWeek,
      toWeek: neuralRequest.currentWeek
    });

    const neuralResponse = await neuralAPI.generateProgram(neuralRequest);

    // Analyze the progression made
    const progressionAnalysis = analyzeProgression(
      currentProgram,
      neuralResponse.program,
      progressData,
      progressionType
    );

    // Update the program in the database
    const updateResult = await updateProgram(programId, userId, {
      weekNumber: neuralResponse.program.weekNumber,
      workouts: neuralResponse.program.workouts,
      progressionNotes: neuralResponse.program.progressionNotes,
      neuralInsights: neuralResponse.program.neuralInsights
    });

    if (!updateResult.success) {
      logger.error('Failed to update program after progression', {
        operation: 'neuralProgress',
        component: 'neuralAPI',
        requestId,
        userId,
        programId,
        error: updateResult.error
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to save program progression',
        details: updateResult.error,
        requestId
      }, { status: 500 });
    }

    // Store progression analytics for future reference
    await storeProgressionAnalytics(supabase, {
      userId,
      programId,
      fromWeek: currentWeek,
      toWeek: neuralResponse.program.weekNumber,
      progressData,
      progressionType,
      adaptationsMade: progressionAnalysis.adaptationsMade,
      requestId
    });

    const duration = Date.now() - startTime;

    logger.info('Neural program progression completed successfully', {
      operation: 'neuralProgress',
      component: 'neuralAPI',
      requestId,
      userId,
      programId,
      fromWeek: currentWeek,
      toWeek: neuralResponse.program.weekNumber,
      adaptationsCount: progressionAnalysis.adaptationsMade.length,
      duration
    });

    return NextResponse.json({
      success: true,
      program: updateResult.data,
      progressionAnalysis: progressionAnalysis.analysis,
      adaptationsMade: progressionAnalysis.adaptationsMade,
      nextWeekPreview: neuralResponse.nextWeekPreview,
      weekNumber: neuralResponse.program.weekNumber,
      message: `Successfully progressed to week ${neuralResponse.program.weekNumber}`,
      requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Neural program progression endpoint error', {
      operation: 'neuralProgress',
      component: 'neuralAPI',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Something went wrong progressing your program. Please try again.',
      requestId
    }, { status: 500 });
  }
}

/**
 * Analyze the progression between two program versions
 */
function analyzeProgression(
  previousProgram: any,
  newProgram: any,
  progressData: ProgressData,
  progressionType: string
): { analysis: string; adaptationsMade: string[] } {
  const adaptationsMade: string[] = [];
  
  // Compare workout structures
  if (newProgram.workouts.length !== previousProgram.workouts.length) {
    adaptationsMade.push(`Workout count changed from ${previousProgram.workouts.length} to ${newProgram.workouts.length}`);
  }

  // Analyze exercise changes
  const newExerciseNames = new Set(
    newProgram.workouts.flatMap((w: any) => w.mainExercises.map((e: any) => e.name))
  );
  const oldExerciseNames = new Set(
    previousProgram.workouts.flatMap((w: any) => w.mainExercises.map((e: any) => e.name))
  );

  const addedExercises = [...newExerciseNames].filter(name => !oldExerciseNames.has(name));
  const removedExercises = [...oldExerciseNames].filter(name => !newExerciseNames.has(name));

  if (addedExercises.length > 0) {
    adaptationsMade.push(`Added exercises: ${addedExercises.join(', ')}`);
  }
  if (removedExercises.length > 0) {
    adaptationsMade.push(`Removed exercises: ${removedExercises.join(', ')}`);
  }

  // Analyze based on progress data
  if (progressData.workoutFeedback) {
    const { averageFatigue, averageMotivation, completionRate } = progressData.workoutFeedback;
    
    if (averageFatigue > 7) {
      adaptationsMade.push('Reduced training intensity due to high fatigue levels');
    } else if (averageFatigue < 4 && averageMotivation > 7) {
      adaptationsMade.push('Increased training intensity based on good recovery');
    }
    
    if (completionRate < 0.8) {
      adaptationsMade.push('Simplified workout structure to improve completion rate');
    }
  }

  if (progressData.strengthProgress) {
    const progressEntries = Object.entries(progressData.strengthProgress);
    const improvingExercises = progressEntries.filter(([_, data]) => data.current > data.previousBest);
    
    if (improvingExercises.length > 0) {
      adaptationsMade.push(`Progressed load for exercises showing strength gains: ${improvingExercises.length} exercises`);
    }
  }

  // Generate analysis summary
  let analysis = `Progressed from week ${previousProgram.weekNumber} to week ${newProgram.weekNumber}. `;
  
  if (progressionType === 'deload') {
    analysis += 'Implemented deload week with reduced volume and intensity for recovery. ';
  } else if (adaptationsMade.length === 0) {
    analysis += 'Maintained similar structure with minor load progressions. ';
  } else {
    analysis += `Made ${adaptationsMade.length} key adaptations based on your performance data. `;
  }

  if (progressData.workoutFeedback) {
    analysis += `Considered your average fatigue (${progressData.workoutFeedback.averageFatigue}/10) and motivation (${progressData.workoutFeedback.averageMotivation}/10) levels. `;
  }

  return { analysis, adaptationsMade };
}

/**
 * Store progression analytics for data insights
 */
async function storeProgressionAnalytics(
  supabase: any,
  data: {
    userId: string;
    programId: string;
    fromWeek: number;
    toWeek: number;
    progressData: ProgressData;
    progressionType: string;
    adaptationsMade: string[];
    requestId: string;
  }
) {
  try {
    await supabase
      .from('program_progressions')
      .insert({
        user_id: data.userId,
        program_id: data.programId,
        from_week: data.fromWeek,
        to_week: data.toWeek,
        progress_data: data.progressData,
        progression_type: data.progressionType,
        adaptations_made: data.adaptationsMade,
        request_id: data.requestId,
        created_at: new Date().toISOString()
      });

    logger.info('Stored progression analytics', {
      operation: 'storeProgressionAnalytics',
      component: 'neuralAPI',
      requestId: data.requestId,
      userId: data.userId,
      programId: data.programId
    });
  } catch (error) {
    // Don't fail the request if analytics storage fails
    logger.warn('Failed to store progression analytics', {
      operation: 'storeProgressionAnalytics',
      component: 'neuralAPI',
      requestId: data.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method Not Allowed',
    message: 'Use POST to progress a program'
  }, { status: 405 });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Return 405 for all other methods
export const PUT = () => new NextResponse('Method Not Allowed', { status: 405 });
export const DELETE = () => new NextResponse('Method Not Allowed', { status: 405 });
export const PATCH = () => new NextResponse('Method Not Allowed', { status: 405 });
