/**
 * Program Generator Service
 * ------------------------------------------------
 * High-level orchestrator for AI-powered training program generation and progression.
 * Handles the complete workflow from user onboarding data to stored training programs,
 * integrating with the Neural API and Data Access Layer.
 * 
 * Features:
 * - New program creation from onboarding data
 * - Program progression based on performance feedback
 * - Integration with database through DAL patterns
 * - Business logic validation and enhancement
 * - Comprehensive error handling and logging
 * - Support for both new users and program progression
 */

import { logger } from '@/lib/logging';
import { createClient } from '@/utils/supabase/server';
import { neuralAPI, NeuralAPI, NeuralAPIError, NeuralAPIErrorType } from './neuralAPI';
import { ENHANCED_PROGRAM_VALIDATION } from '@/lib/validation/enhancedProgramSchema';
import type {
  OnboardingData,
  ProgressData,
  TrainingProgram,
  NeuralRequest,
  NeuralResponse,
} from '@/types/neural';

/**
 * Program generation result with success/error states
 */
export interface ProgramGenerationResult {
  success: boolean;
  program?: TrainingProgram;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Program progression result with success/error states
 */
export interface ProgramProgressionResult {
  success: boolean;
  program?: TrainingProgram;
  previousProgram?: TrainingProgram;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Enhanced error types for program generation
 */
export enum ProgramGeneratorErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NEURAL_API_ERROR = 'NEURAL_API_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROGRAM_NOT_FOUND = 'PROGRAM_NOT_FOUND',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Program Generator specific error
 */
export class ProgramGeneratorError extends Error {
  constructor(
    public type: ProgramGeneratorErrorType,
    message: string,
    public context?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProgramGeneratorError';
  }
}

/**
 * Program Generator Service Class
 * 
 * Orchestrates the complete training program generation and progression workflow,
 * from user input validation to database storage.
 */
export class ProgramGenerator {
  private neuralAPI: NeuralAPI;
  private metrics: {
    programsGenerated: number;
    programsProgressed: number;
    totalGenerationTime: number;
    errorCount: number;
  };

  constructor(api?: NeuralAPI) {
    this.neuralAPI = api ?? neuralAPI;
    this.metrics = {
      programsGenerated: 0,
      programsProgressed: 0,
      totalGenerationTime: 0,
      errorCount: 0,
    };

    logger.info('Program Generator service initialized', {
      operation: 'init',
      component: 'programGenerator',
    });
  }

  /**
   * Create a new training program for a user based on onboarding data
   * 
   * @param userId - Unique user identifier
   * @param onboardingData - User's fitness goals, experience, and preferences
   * @returns Promise resolving to program generation result
   */
  async createNewProgram(
    userId: string,
    onboardingData: OnboardingData
  ): Promise<ProgramGenerationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId('create');

    logger.info('Starting new program creation', {
      operation: 'createNewProgram',
      component: 'programGenerator',
      requestId,
      userId,
      primaryFocus: onboardingData.primaryFocus,
      experienceLevel: onboardingData.experienceLevel,
    });

    try {
      // Validate input data
      const validatedOnboardingData = this.validateOnboardingData(onboardingData);
      
      // Check if user exists and has valid profile
      await this.validateUser(userId);

      // Build Neural request for new program
      const neuralRequest: NeuralRequest = {
        onboardingData: validatedOnboardingData,
        currentWeek: 1, // New programs start at week 1
        // No previous progress for new programs
      };

      // Generate program using Neural API
      let neuralResponse;
      try {
        neuralResponse = await this.neuralAPI.generateProgram(neuralRequest);
      } catch (error) {
        logger.error('Neural API program generation failed', {
          operation: 'createNewProgram',
          component: 'programGenerator',
          requestId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error("Neural API failed to generate a program.");
      }
      
      // Enhance and validate the generated program
      const enhancedProgram = this.enhanceProgramForUser(neuralResponse.program, userId);
      
      // Neural programs are generated on-demand, no database storage needed
      const storedProgram = enhancedProgram;

      const duration = Date.now() - startTime;
      this.metrics.programsGenerated++;
      this.metrics.totalGenerationTime += duration;

      logger.info('New program creation completed successfully', {
        operation: 'createNewProgram',
        component: 'programGenerator',
        requestId,
        userId,
        duration,
        programId: storedProgram.id,
        programName: storedProgram.programName,
        workoutCount: storedProgram.workouts.length,
      });

      return {
        success: true,
        program: storedProgram,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.errorCount++;
      this.metrics.totalGenerationTime += duration;

      logger.error('New program creation failed', {
        operation: 'createNewProgram',
        component: 'programGenerator',
        requestId,
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      return this.handleError(error, {
        operation: 'createNewProgram',
        userId,
        requestId,
        duration,
      });
    }
  }

  /**
   * Progress an existing training program based on performance data
   * 
   * @param currentProgram - User's current training program
   * @param progressData - Performance and feedback data from recent workouts
   * @returns Promise resolving to program progression result
   */
  async progressProgram(
    currentProgram: TrainingProgram,
    progressData: ProgressData
  ): Promise<ProgramProgressionResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId('progress');

    logger.info('Starting program progression', {
      operation: 'progressProgram',
      component: 'programGenerator',
      requestId,
      userId: currentProgram.userId,
      currentProgramId: currentProgram.id,
      currentWeek: currentProgram.weekNumber,
    });

    try {
      // Validate input data
      const validatedProgram = this.validateTrainingProgram(currentProgram);
      const validatedProgressData = this.validateProgressData(progressData);

      // Extract onboarding data for context (may need to fetch from database)
      const onboardingData = await this.extractOnboardingContext(validatedProgram);

      // Build Neural request for program progression
      const neuralRequest: NeuralRequest = {
        onboardingData,
        currentWeek: validatedProgram.weekNumber + 1, // Progress to next week
        previousProgress: validatedProgressData,
      };

      // Generate progressed program using Neural API
      let neuralResponse;
      try {
        neuralResponse = await this.neuralAPI.generateProgram(neuralRequest);
      } catch (error) {
        logger.error('Neural API program progression failed', {
          operation: 'progressProgram',
          component: 'programGenerator',
          requestId,
          userId: currentProgram.userId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error("Neural API failed to generate a program.");
      }
      
      // Enhance progressed program with continuity from current program
      const progressedProgram = this.enhanceProgressedProgram(
        neuralResponse.program,
        validatedProgram,
        validatedProgressData
      );
      
      // Neural programs are generated on-demand, no database storage needed
      const storedProgram = progressedProgram;

      const duration = Date.now() - startTime;
      this.metrics.programsProgressed++;
      this.metrics.totalGenerationTime += duration;

      logger.info('Program progression completed successfully', {
        operation: 'progressProgram',
        component: 'programGenerator',
        requestId,
        userId: currentProgram.userId,
        duration,
        previousProgramId: validatedProgram.id,
        newProgramId: storedProgram.id,
        weekProgression: `${validatedProgram.weekNumber} → ${storedProgram.weekNumber}`,
      });

      return {
        success: true,
        program: storedProgram,
        previousProgram: validatedProgram,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.errorCount++;
      this.metrics.totalGenerationTime += duration;

      logger.error('Program progression failed', {
        operation: 'progressProgram',
        component: 'programGenerator',
        requestId,
        userId: currentProgram.userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      return this.handleProgressionError(error, {
        operation: 'progressProgram',
        currentProgram,
        requestId,
        duration,
      });
    }
  }

  /**
   * Validate onboarding data using Neural schemas
   * 
   * @private
   */
  private validateOnboardingData(data: OnboardingData): OnboardingData {
    try {
      return ENHANCED_PROGRAM_VALIDATION.neural.onboardingData.parse(data);
    } catch (error) {
      logger.error('Onboarding data validation failed', {
        operation: 'validateOnboardingData',
        component: 'programGenerator',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ProgramGeneratorError(
        ProgramGeneratorErrorType.VALIDATION_ERROR,
        `Invalid onboarding data: ${error instanceof Error ? error.message : String(error)}`,
        { onboardingData: data }
      );
    }
  }

  /**
   * Validate training program using Neural schemas
   * 
   * @private
   */
  private validateTrainingProgram(program: TrainingProgram): TrainingProgram {
    try {
      return ENHANCED_PROGRAM_VALIDATION.neural.program.parse(program);
    } catch (error) {
      logger.error('Training program validation failed', {
        operation: 'validateTrainingProgram',
        component: 'programGenerator',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ProgramGeneratorError(
        ProgramGeneratorErrorType.VALIDATION_ERROR,
        `Invalid training program: ${error instanceof Error ? error.message : String(error)}`,
        { programId: program.id }
      );
    }
  }

  /**
   * Validate progress data using Neural schemas
   * 
   * @private
   */
  private validateProgressData(data: ProgressData): ProgressData {
    try {
      return ENHANCED_PROGRAM_VALIDATION.neural.progressData.parse(data);
    } catch (error) {
      logger.error('Progress data validation failed', {
        operation: 'validateProgressData',
        component: 'programGenerator',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ProgramGeneratorError(
        ProgramGeneratorErrorType.VALIDATION_ERROR,
        `Invalid progress data: ${error instanceof Error ? error.message : String(error)}`,
        { progressData: data }
      );
    }
  }

  /**
   * Validate user exists and has required profile data
   * 
   * @private
   */
  private async validateUser(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        throw new ProgramGeneratorError(
          ProgramGeneratorErrorType.USER_NOT_FOUND,
          `User not found: ${userId}`,
          { userId, error: error?.message }
        );
      }

      logger.debug('User validation successful', {
        operation: 'validateUser',
        component: 'programGenerator',
        userId,
        userName: profile.name,
      });
    } catch (error) {
      if (error instanceof ProgramGeneratorError) {
        throw error;
      }

      logger.error('User validation failed', {
        operation: 'validateUser',
        component: 'programGenerator',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ProgramGeneratorError(
        ProgramGeneratorErrorType.DATABASE_ERROR,
        `Failed to validate user: ${error instanceof Error ? error.message : String(error)}`,
        { userId }
      );
    }
  }

  /**
   * Enhance program with user-specific data and metadata
   * 
   * @private
   */
  private enhanceProgramForUser(program: TrainingProgram, userId: string): TrainingProgram {
    return {
      ...program,
      userId,
      id: this.generateProgramId(userId),
      createdAt: new Date(),
    };
  }

  /**
   * Enhance progressed program with continuity from previous program
   * 
   * @private
   */
  private enhanceProgressedProgram(
    newProgram: TrainingProgram,
    previousProgram: TrainingProgram,
    progressData: ProgressData
  ): TrainingProgram {
    return {
      ...newProgram,
      userId: previousProgram.userId,
      id: this.generateProgramId(previousProgram.userId),
      createdAt: new Date(),
      // Maintain program name continuity if it's a series
      programName: this.generateProgressedProgramName(newProgram.programName, previousProgram, progressData),
    };
  }

  /**
   * Generate an appropriate program name for progression
   * 
   * @private
   */
  private generateProgressedProgramName(
    suggestedName: string,
    previousProgram: TrainingProgram,
    progressData: ProgressData
  ): string {
    // If the user has been consistent and progressing well, maintain series naming
    if (progressData.workoutFeedback?.completionRate && progressData.workoutFeedback.completionRate >= 0.8) {
      // Check if previous program was part of a series
      const weekNumberMatch = previousProgram.programName.match(/Week (\d+)/i);
      if (weekNumberMatch) {
        const baseName = previousProgram.programName.replace(/Week \d+/i, '').trim();
        return `${baseName} Week ${previousProgram.weekNumber + 1}`;
      }
      
      // Check if we can add week progression to existing name
      if (!previousProgram.programName.toLowerCase().includes('week')) {
        return `${previousProgram.programName} - Week ${previousProgram.weekNumber + 1}`;
      }
    }

    // Use AI-suggested name for major changes or poor adherence
    return suggestedName;
  }

  /**
   * Extract onboarding context from program structure (Neural programs don't store snapshots)
   * 
   * @private
   */
  private async extractOnboardingContext(program: TrainingProgram): Promise<OnboardingData> {
    logger.info('Deriving onboarding context from program structure (Neural system)', {
      operation: 'extractOnboardingContext',
      component: 'programGenerator',
      programId: program.id,
    });

    // Neural programs don't store onboarding snapshots, derive from program structure
    return this.deriveOnboardingDataFromProgram(program);
  }

  /**
   * Derive basic onboarding data from program structure (fallback)
   * 
   * @private
   */
  private deriveOnboardingDataFromProgram(program: TrainingProgram): OnboardingData {
    // Analyze program to make educated guesses about user preferences
    const avgDuration = program.workouts.reduce((sum, w) => sum + w.duration, 0) / program.workouts.length;
    const workoutCount = program.workouts.length;
    
    // Guess session duration based on average workout duration
    let sessionDuration: 30 | 45 | 60 | 90 = 60;
    if (avgDuration <= 35) sessionDuration = 30;
    else if (avgDuration <= 50) sessionDuration = 45;
    else if (avgDuration <= 75) sessionDuration = 60;
    else sessionDuration = 90;

    // Guess equipment access based on exercise patterns
    const exerciseNames = program.workouts
      .flatMap(w => w.mainExercises)
      .map(e => e.name.toLowerCase());
    
    let equipmentAccess: 'full_gym' | 'dumbbells_only' | 'bodyweight_only' = 'full_gym';
    if (exerciseNames.every(name => 
      name.includes('bodyweight') || 
      name.includes('push-up') || 
      name.includes('squat') && !name.includes('barbell')
    )) {
      equipmentAccess = 'bodyweight_only';
    } else if (exerciseNames.some(name => name.includes('dumbbell')) && 
               !exerciseNames.some(name => name.includes('barbell'))) {
      equipmentAccess = 'dumbbells_only';
    }

    logger.info('Derived onboarding data from program structure', {
      operation: 'deriveOnboardingDataFromProgram',
      component: 'programGenerator',
      programId: program.id,
      derivedData: {
        sessionDuration,
        equipmentAccess,
        workoutCount,
        avgDuration,
      },
    });

    return {
      primaryFocus: 'general_fitness', // Safe default
      experienceLevel: 'intermediate', // Safe default
      sessionDuration,
      equipmentAccess,
      additionalInfo: {
        availableDays: workoutCount,
      },
    };
  }



  /**
   * Handle errors and convert to standard result format
   * 
   * @private
   */
  private handleError(error: unknown, context: Record<string, any>): ProgramGenerationResult {
    if (error instanceof NeuralAPIError) {
      return {
        success: false,
        error: `AI generation failed: ${error.message}`,
        details: {
          type: 'neural_api_error',
          originalType: error.type,
          context: error.context,
          ...context,
        },
      };
    }

    if (error instanceof ProgramGeneratorError) {
      return {
        success: false,
        error: error.message,
        details: {
          type: error.type,
          context: error.context,
          ...context,
        },
      };
    }

    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      details: {
        type: 'unknown_error',
        ...context,
      },
    };
  }

  /**
   * Handle progression-specific errors
   * 
   * @private
   */
  private handleProgressionError(error: unknown, context: Record<string, any>): ProgramProgressionResult {
    const baseResult = this.handleError(error, context);
    return {
      success: false,
      error: baseResult.error,
      details: baseResult.details,
      previousProgram: context.currentProgram,
    };
  }

  /**
   * Generate unique request ID
   * 
   * @private
   */
  private generateRequestId(operation: string): string {
    return `pg_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique program ID
   * 
   * @private
   */
  private generateProgramId(userId: string): string {
    return `prog_${userId.substr(0, 8)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const totalPrograms = this.metrics.programsGenerated + this.metrics.programsProgressed;
    const averageGenerationTime = totalPrograms > 0 
      ? this.metrics.totalGenerationTime / totalPrograms 
      : 0;

    return {
      programsGenerated: this.metrics.programsGenerated,
      programsProgressed: this.metrics.programsProgressed,
      totalPrograms,
      errorCount: this.metrics.errorCount,
      successRate: totalPrograms > 0 
        ? (totalPrograms - this.metrics.errorCount) / totalPrograms 
        : 0,
      averageGenerationTime: Math.round(averageGenerationTime),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      programsGenerated: 0,
      programsProgressed: 0,
      totalGenerationTime: 0,
      errorCount: 0,
    };
  }
}

// Export singleton instance for convenience
export const programGenerator = new ProgramGenerator();

// Export factory function for testing/custom configs
export const createProgramGenerator = (neuralAPI?: NeuralAPI) => new ProgramGenerator(neuralAPI);
