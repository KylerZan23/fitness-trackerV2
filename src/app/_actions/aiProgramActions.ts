'use server'

import { createClient } from '@/utils/supabase/server';
import { generateProgram } from '@/lib/ai/generationPipeline';
import { runProgramGenerationPipeline } from '@/lib/ai/programGenerator';
import { UserProfile } from '@/lib/ai/prompts';
import { TrainingProgram } from '@/lib/types/program';
import { redirect } from 'next/navigation';
import { isFeatureEnabled, getFeatureFlagStatus, FEATURE_FLAGS } from '@/lib/featureFlags';

export interface ProgramGenerationResult {
  success: boolean;
  programId?: string;
  error?: string;
  validationDetails?: {
    errors: number;
    warnings: number;
    isValid: boolean;
  };
  metadata?: {
    generationTime: number;
    llmCalls: number;
  };
}

/**
 * Main server action for generating AI training programs
 * Routes between Phoenix and Legacy pipelines based on feature flags
 */
export async function generateTrainingProgram(
  userId: string,
  onboardingData: any // TODO: Type this properly based on your onboarding schema
): Promise<ProgramGenerationResult> {
  
  try {
    console.log(`[generateTrainingProgram] Starting generation for user ${userId}`);
    
    // Step 1: Check feature flag to determine which pipeline to use
    const phoenixEnabled = await isFeatureEnabled(userId, FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED);
    const flagStatus = await getFeatureFlagStatus(userId, FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED);
    
    console.log(`[generateTrainingProgram] Phoenix pipeline enabled: ${phoenixEnabled} (source: ${flagStatus.source})`);
    
    if (phoenixEnabled) {
      return await generateWithPhoenixPipeline(userId, onboardingData);
    } else {
      return await generateWithLegacyPipeline(userId, onboardingData);
    }

  } catch (error) {
    console.error(`[generateTrainingProgram] Unexpected error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during program generation'
    };
  }
}

/**
 * Generate training program using the new Phoenix pipeline
 */
async function generateWithPhoenixPipeline(
  userId: string,
  onboardingData: any
): Promise<ProgramGenerationResult> {
  try {
    const supabase = await createClient();

    // Step 1: Transform onboarding data to UserProfile format
    const userProfile = transformOnboardingToUserProfile(onboardingData);
    
    console.log(`[generateWithPhoenixPipeline] Profile: ${userProfile.name}, ${userProfile.experience_level}, ${userProfile.primaryGoal}`);

    // Step 2: Generate program using the Phoenix pipeline
    const generationResult = await generateProgram(userProfile);

    if (!generationResult.success) {
      console.error(`[generateTrainingProgram] Generation failed:`, generationResult.error);
      return {
        success: false,
        error: generationResult.error || 'Program generation failed',
        metadata: {
          generationTime: generationResult.metadata.totalGenerationTime,
          llmCalls: generationResult.metadata.llmCalls
        }
      };
    }

    const program = generationResult.program!;
    const validation = generationResult.validationResult!;

    console.log(`[generateTrainingProgram] Generation successful:`, {
      programName: program.programName,
      duration: program.durationWeeksTotal,
      phases: program.phases.length,
      validationErrors: validation.errors.length,
      validationWarnings: validation.warnings.length,
      generationTime: generationResult.metadata.totalGenerationTime
    });

    // Step 3: Save program to database
    const { data: savedProgram, error: dbError } = await supabase
      .from('training_programs')
      .insert({
        user_id: userId,
        program_name: program.programName,
        program_details: program, // Store the full Phoenix schema
        created_at: new Date().toISOString(),
        is_active: true,
        generation_metadata: {
          validation_errors: validation.errors.length,
          validation_warnings: validation.warnings.length,
          generation_time_ms: generationResult.metadata.totalGenerationTime,
          llm_calls: generationResult.metadata.llmCalls,
          steps_completed: generationResult.metadata.stepsCompleted,
          phoenix_schema_version: '1.0'
        }
      })
      .select('id')
      .single();

    if (dbError) {
      console.error(`[generateTrainingProgram] Database save failed:`, dbError);
      return {
        success: false,
        error: `Failed to save program: ${dbError.message}`,
        metadata: {
          generationTime: generationResult.metadata.totalGenerationTime,
          llmCalls: generationResult.metadata.llmCalls
        }
      };
    }

    // Step 4: Deactivate any previous programs for this user
    await supabase
      .from('training_programs')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('id', savedProgram.id);

    console.log(`[generateWithPhoenixPipeline] Program saved successfully with ID: ${savedProgram.id}`);

    return {
      success: true,
      programId: savedProgram.id,
      validationDetails: {
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        isValid: validation.isValid
      },
      metadata: {
        generationTime: generationResult.metadata.totalGenerationTime,
        llmCalls: generationResult.metadata.llmCalls
      }
    };

  } catch (error) {
    console.error(`[generateWithPhoenixPipeline] Phoenix pipeline error:`, error);
    
    // Fallback to legacy pipeline on Phoenix failure
    console.log(`[generateWithPhoenixPipeline] Attempting fallback to legacy pipeline for user ${userId}`);
    try {
      return await generateWithLegacyPipeline(userId, onboardingData);
    } catch (fallbackError) {
      console.error(`[generateWithPhoenixPipeline] Fallback also failed:`, fallbackError);
      return {
        success: false,
        error: `Phoenix pipeline failed, fallback also failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Generate training program using the legacy pipeline
 */
async function generateWithLegacyPipeline(
  userId: string,
  onboardingData: any
): Promise<ProgramGenerationResult> {
  try {
    const supabase = await createClient();
    
    console.log(`[generateWithLegacyPipeline] Starting legacy generation for user ${userId}`);
    
    // Step 1: Create training program record with pending status
    const { data: programRecord, error: insertError } = await supabase
      .from('training_programs')
      .insert({
        user_id: userId,
        program_name: `Training Program - ${new Date().toLocaleDateString()}`,
        program_details: {}, // Default empty object to satisfy NOT NULL constraint
        generation_status: 'pending',
        onboarding_data_snapshot: onboardingData,
        created_at: new Date().toISOString(),
        is_active: false // Will be set to true after successful generation
      })
      .select('id')
      .single();

    if (insertError || !programRecord) {
      console.error(`[generateWithLegacyPipeline] Failed to create program record:`, insertError);
      return {
        success: false,
        error: `Failed to create program record: ${insertError?.message || 'Unknown error'}`
      };
    }

    const programId = programRecord.id;
    console.log(`[generateWithLegacyPipeline] Created program record with ID: ${programId}`);

    // Step 2: Check user subscription status for trial vs premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    const isFreeTrial = profile?.subscription_tier === 'free' || !profile?.subscription_tier;
    
    // Step 3: Run the legacy generation pipeline
    console.log(`[generateWithLegacyPipeline] Running legacy pipeline for ${isFreeTrial ? 'FREE TRIAL' : 'PREMIUM'} user`);
    await runProgramGenerationPipeline(programId, isFreeTrial);

    // Step 4: Fetch the updated program from the database
    const { data: updatedProgram, error: fetchError } = await supabase
      .from('training_programs')
      .select('id, program_details')
      .eq('id', programId)
      .single();

    if (fetchError || !updatedProgram) {
      console.error(`[generateWithLegacyPipeline] Failed to fetch updated program:`, fetchError);
      return {
        success: false,
        error: `Failed to fetch updated program: ${fetchError?.message || 'Unknown error'}`,
      };
    }

    // Step 5: Deactivate any previous programs for this user
    await supabase
      .from('training_programs')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('id', updatedProgram.id);

    console.log(`[generateWithLegacyPipeline] Program generated and saved successfully with ID: ${updatedProgram.id}`);

    return {
      success: true,
      programId: updatedProgram.id,
    };
  } catch (error) {
    console.error(`[generateWithLegacyPipeline] Legacy pipeline error:`, error);
    return {
      success: false,
      error: `Legacy pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Transform onboarding data to UserProfile format
 * TODO: Adjust this based on your actual onboarding schema
 */
function transformOnboardingToUserProfile(onboardingData: any): UserProfile {
  return {
    name: onboardingData.name || onboardingData.firstName || 'User',
    age: onboardingData.age || 25,
    experience_level: mapExperienceLevel(onboardingData.experience_level || onboardingData.experienceLevel),
    primaryGoal: onboardingData.primary_goal || onboardingData.primaryGoal || 'General Fitness',
    trainingFrequencyDays: onboardingData.training_frequency_days || onboardingData.trainingFrequency || 3,
    sessionDuration: onboardingData.session_duration || onboardingData.sessionDuration || '60-75 minutes',
    equipment: onboardingData.equipment || ['Barbell', 'Dumbbells', 'Bench'],
    injuriesLimitations: onboardingData.injuries_limitations || onboardingData.injuriesLimitations
  };
}

/**
 * Map various experience level formats to our standard enum
 */
function mapExperienceLevel(experienceLevel: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const level = experienceLevel.toLowerCase();
  
  if (level.includes('beginner') || level.includes('novice') || level === 'new') {
    return 'Beginner';
  }
  
  if (level.includes('advanced') || level.includes('expert')) {
    return 'Advanced';
  }
  
  return 'Intermediate'; // Default to intermediate
}

/**
 * Get user's active training program
 */
export async function getUserActiveProgram(userId: string): Promise<TrainingProgram | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('training_programs')
      .select('program_details')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`[getUserActiveProgram] No active program found for user ${userId}`);
      return null;
    }

    // The program_details column now contains the full Phoenix schema
    return data.program_details as TrainingProgram;

  } catch (error) {
    console.error(`[getUserActiveProgram] Error fetching program:`, error);
    return null;
  }
}

/**
 * Regenerate a user's program (useful for testing or user requests)
 */
export async function regenerateUserProgram(userId: string): Promise<ProgramGenerationResult> {
  try {
    const supabase = await createClient();

    // Get the user's most recent onboarding data
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding') // Adjust table name as needed
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (onboardingError || !onboardingData) {
        return { 
          success: false, 
        error: 'Could not find user onboarding data for regeneration'
      };
    }

    // Generate new program using existing onboarding data
    return await generateTrainingProgram(userId, onboardingData);

  } catch (error) {
    console.error(`[regenerateUserProgram] Error:`, error);
        return { 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate program'
    };
  }
}

/**
 * Get program generation statistics for admin/monitoring
 */
export async function getProgramGenerationStats(): Promise<{
  totalPrograms: number;
  successRate: number;
  averageGenerationTime: number;
  validationStats: { errors: number; warnings: number };
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
          .from('training_programs')
      .select('generation_metadata')
      .not('generation_metadata', 'is', null);

    if (error || !data) {
      throw new Error('Failed to fetch generation statistics');
    }

    const stats = data.reduce((acc: any, program: any) => {
      const metadata = program.generation_metadata;
      if (metadata) {
        acc.totalPrograms++;
        acc.totalGenerationTime += metadata.generation_time_ms || 0;
        acc.totalErrors += metadata.validation_errors || 0;
        acc.totalWarnings += metadata.validation_warnings || 0;
      }
      return acc;
    }, {
      totalPrograms: 0,
      totalGenerationTime: 0,
      totalErrors: 0,
      totalWarnings: 0
    });

          return {
      totalPrograms: stats.totalPrograms,
      successRate: stats.totalPrograms > 0 ? 100 : 0, // All saved programs are successful
      averageGenerationTime: stats.totalPrograms > 0 
        ? stats.totalGenerationTime / stats.totalPrograms 
        : 0,
      validationStats: {
        errors: stats.totalErrors,
        warnings: stats.totalWarnings
      }
    };

  } catch (error) {
    console.error(`[getProgramGenerationStats] Error:`, error);
    throw error;
  }
}

/**
 * Archive old programs (cleanup utility)
 */
export async function archiveOldPrograms(olderThanDays: number = 30): Promise<number> {
  try {
    const supabase = await createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('training_programs')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to archive programs: ${error.message}`);
    }

    console.log(`[archiveOldPrograms] Archived ${data?.length || 0} programs older than ${olderThanDays} days`);
    return data?.length || 0;

  } catch (error) {
    console.error(`[archiveOldPrograms] Error:`, error);
    throw error;
  }
}

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 * These functions maintain compatibility with existing code while using the new pipeline
 */

/**
 * Get a user's current active training program (legacy compatibility)
 */
export async function getCurrentTrainingProgram(
  userId?: string
): Promise<{ program?: any; error?: string }> {
  try {
    const supabase = await createClient()

    let targetUserId: string
    if (userId) {
      targetUserId = userId
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error in getCurrentTrainingProgram:', authError)
        return { error: 'Authentication required. Please log in again.' }
      }
      targetUserId = user.id
    }

    const { data: program, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching current training program:', error)
      return { error: 'Failed to load your training program. Please try again.' }
    }

    if (!program) {
      return { error: 'No active training program found. Please generate a new program.' }
    }

    return { program }
  } catch (error) {
    console.error('ERROR in getCurrentTrainingProgram:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Server action to fetch the active training program for client components
 */
export async function fetchActiveProgramAction(): Promise<{
  program: any | null
  completedDays: CompletedDayIdentifier[]
  error?: string
}> {
  try {
    // Import here to avoid circular dependencies
    const { getActiveTrainingProgram } = await import('@/lib/db/program')

    const program = await getActiveTrainingProgram()

    if (!program) {
      return { program: null, completedDays: [] }
    }

    // Fetch completed workout days for this program
    const supabase = await createClient()

    const { data: completedWorkouts, error: completedError } = await supabase
      .from('workout_groups')
      .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week')
      .eq('linked_program_id', program.id)
      .not('linked_program_phase_index', 'is', null)
      .not('linked_program_week_index', 'is', null)
      .not('linked_program_day_of_week', 'is', null)

    if (completedError) {
      console.error('Error fetching completed workouts:', completedError)
      // Don't fail the entire request if completion data fetch fails
      return { program, completedDays: [] }
    }

    // Map the database results to our CompletedDayIdentifier interface
    const completedDays: CompletedDayIdentifier[] = (completedWorkouts || []).map((workout: any) => ({
      phaseIndex: workout.linked_program_phase_index,
      weekIndex: workout.linked_program_week_index,
      dayOfWeek: workout.linked_program_day_of_week,
    }))

    console.log(`Found ${completedDays.length} completed workout days for program ${program.id}`)

    return { program, completedDays }
  } catch (error) {
    console.error('ERROR in fetchActiveProgramAction:', error)
    return {
      program: null,
      completedDays: [],
      error: 'Failed to fetch your training program. Please try again.',
    }
  }
}

/**
 * Interface for tracking completed workout days
 */
export interface CompletedDayIdentifier {
  phaseIndex: number
  weekIndex: number // Index of the week within that phase (0-based)
  dayOfWeek: number // 1-7, matching DayOfWeek enum
}

/**
 * Adapt the next week's training based on user feedback
 */
export async function adaptNextWeek(feedback: 'good' | 'hard' | 'easy'): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, message: 'Authentication required', error: 'Please log in again' }
    }

    // Get the user's active program
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (programError || !program) {
      return { success: false, message: 'No active program found', error: 'Please generate a new program' }
    }

    // For now, return a simple success message
    // TODO: Implement actual program adaptation logic
    const messages = {
      good: 'Great! Your program is working well. We\'ll maintain the current intensity.',
      hard: 'We\'ll reduce the intensity for next week to help with recovery.',
      easy: 'We\'ll increase the intensity for next week to continue your progress.'
    }

    return {
      success: true,
      message: messages[feedback]
    }

  } catch (error) {
    console.error('Error in adaptNextWeek:', error)
    return {
      success: false,
      message: 'Failed to adapt program',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
