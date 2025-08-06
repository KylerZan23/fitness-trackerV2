/**
 * Neural API Service
 * ------------------------------------------------
 * AI-powered training program generation service using the Neural type system.
 * Provides structured, reliable program generation with comprehensive error handling,
 * retry logic, and validation.
 * 
 * Features:
 * - Provider-agnostic LLM integration via OpenAI service
 * - Structured outputs with guaranteed Neural schema compliance
 * - Comprehensive error handling with specific error types
 * - Retry logic with exponential backoff
 * - Request/response logging and metrics
 * - Type-safe configuration management
 */

import { z } from 'zod';
import { openaiService, type LLMServiceConfig } from '@/lib/services/openaiService';
import { logger } from '@/lib/logging';
import { ENHANCED_PROGRAM_VALIDATION } from '@/lib/validation/enhancedProgramSchema';
import type { 
  NeuralRequest, 
  NeuralResponse, 
  TrainingProgram, 
  OnboardingData,
  ProgressData 
} from '@/types/neural';

/**
 * Configuration interface for Neural API LLM interactions
 */
export interface LLMConfig {
  /** API key for the LLM provider */
  apiKey: string;
  /** Model name/identifier */
  model: string;
  /** Maximum tokens for response generation */
  maxTokens: number;
  /** Temperature for response creativity (0.0-1.0) */
  temperature?: number;
}

/**
 * Enhanced error types specific to Neural API operations
 */
export enum NeuralAPIErrorType {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  PROMPT_ERROR = 'PROMPT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Neural API specific error with enhanced context
 */
export class NeuralAPIError extends Error {
  constructor(
    public type: NeuralAPIErrorType,
    message: string,
    public context?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NeuralAPIError';
  }
}

/**
 * Default configuration for Neural API LLM interactions
 */
export const DEFAULT_NEURAL_CONFIG: LLMConfig = {
  apiKey: '', // Will be populated from environment
  model: 'gpt-4o',
  maxTokens: 4000,
  temperature: 0.1, // Low temperature for consistent, structured outputs
};

/**
 * Neural API Service Class
 * 
 * Handles AI-powered training program generation using the Neural type system.
 * Provides reliable, structured program generation with comprehensive error handling.
 */
export class NeuralAPI {
  private config: LLMConfig;
  private metrics: {
    requestCount: number;
    successCount: number;
    errorCount: number;
    totalResponseTime: number;
  };

  constructor(config?: Partial<LLMConfig>) {
    this.config = { ...DEFAULT_NEURAL_CONFIG, ...config };
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
    };

    logger.info('Neural API service initialized', {
      operation: 'init',
      component: 'neuralAPI',
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });
  }

  /**
   * Generate a complete training program from Neural request
   * 
   * @param request - Neural request containing onboarding data and context
   * @returns Promise resolving to validated Neural response
   * @throws NeuralAPIError for various failure scenarios
   */
  async generateProgram(request: NeuralRequest): Promise<NeuralResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    logger.info('Starting Neural program generation', {
      operation: 'generateProgram',
      component: 'neuralAPI',
      requestId,
      currentWeek: request.currentWeek,
      primaryFocus: request.onboardingData.primaryFocus,
      experienceLevel: request.onboardingData.experienceLevel,
    });

    this.metrics.requestCount++;

    try {
      // Validate input request
      const validatedRequest = this.validateNeuralRequest(request);
      
      // Build AI prompt for program generation
      const prompt = this.buildProgramGenerationPrompt(validatedRequest);
      
      // Generate structured response using OpenAI service
      const response = await this.generateWithRetry(
        prompt,
        ENHANCED_PROGRAM_VALIDATION.neural.response,
        3,
        requestId
      );

      // Additional validation and enhancement
      const validatedResponse = this.validateNeuralResponse(response);
      
      const duration = Date.now() - startTime;
      this.metrics.successCount++;
      this.metrics.totalResponseTime += duration;

      logger.info('Neural program generation completed successfully', {
        operation: 'generateProgram',
        component: 'neuralAPI',
        requestId,
        duration,
        programName: validatedResponse.program.programName,
        workoutCount: validatedResponse.program.workouts.length,
      });

      return validatedResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.errorCount++;
      this.metrics.totalResponseTime += duration;

      logger.error('Neural program generation failed', {
        operation: 'generateProgram',
        component: 'neuralAPI',
        requestId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Re-throw as NeuralAPIError with context
      if (error instanceof NeuralAPIError) {
        throw error;
      }

      throw new NeuralAPIError(
        NeuralAPIErrorType.GENERATION_ERROR,
        `Program generation failed: ${error instanceof Error ? error.message : String(error)}`,
        { requestId, duration, request: this.sanitizeRequestForLogging(request) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate structured output with retry logic
   * 
   * @private
   */
  private async generateWithRetry<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    maxRetries: number = 3,
    requestId: string
  ): Promise<T> {
    const llmConfig: Partial<LLMServiceConfig> = {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    try {
      return await openaiService.generateWithRetry(
        prompt,
        schema,
        maxRetries,
        llmConfig
      );
    } catch (error) {
      logger.error('LLM generation failed after retries', {
        operation: 'generateWithRetry',
        component: 'neuralAPI',
        requestId,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      // Map OpenAI service errors to Neural API errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new NeuralAPIError(
            NeuralAPIErrorType.RATE_LIMIT_ERROR,
            'Rate limit exceeded. Please try again later.',
            { requestId, maxRetries }
          );
        }
        
        if (error.message.includes('timeout')) {
          throw new NeuralAPIError(
            NeuralAPIErrorType.TIMEOUT_ERROR,
            'Request timed out. Please try again.',
            { requestId, maxRetries }
          );
        }

        if (error.message.includes('Schema validation failed')) {
          throw new NeuralAPIError(
            NeuralAPIErrorType.VALIDATION_ERROR,
            'Generated response failed validation. Please try again.',
            { requestId, maxRetries }
          );
        }
      }

      throw new NeuralAPIError(
        NeuralAPIErrorType.GENERATION_ERROR,
        'Failed to generate structured response after retries',
        { requestId, maxRetries },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate Neural request input
   * 
   * @private
   */
  private validateNeuralRequest(request: NeuralRequest): NeuralRequest {
    try {
      return ENHANCED_PROGRAM_VALIDATION.neural.request.parse(request);
    } catch (error) {
      logger.error('Neural request validation failed', {
        operation: 'validateNeuralRequest',
        component: 'neuralAPI',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new NeuralAPIError(
        NeuralAPIErrorType.VALIDATION_ERROR,
        `Invalid Neural request: ${error instanceof Error ? error.message : String(error)}`,
        { request: this.sanitizeRequestForLogging(request) }
      );
    }
  }

  /**
   * Validate and enhance Neural response
   * 
   * @private
   */
  private validateNeuralResponse(response: any): NeuralResponse {
    try {
      // First validate the basic structure
      const validatedResponse = ENHANCED_PROGRAM_VALIDATION.neural.response.parse(response);
      
      // Additional business logic validation
      this.validateProgramBusinessLogic(validatedResponse.program);
      
      // Enhance response with additional metadata
      return this.enhanceNeuralResponse(validatedResponse);
    } catch (error) {
      logger.error('Neural response validation failed', {
        operation: 'validateNeuralResponse',
        component: 'neuralAPI',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new NeuralAPIError(
        NeuralAPIErrorType.VALIDATION_ERROR,
        `Invalid Neural response: ${error instanceof Error ? error.message : String(error)}`,
        { responseStructure: this.sanitizeResponseForLogging(response) }
      );
    }
  }

  /**
   * Validate program business logic
   * 
   * @private
   */
  private validateProgramBusinessLogic(program: TrainingProgram): void {
    // Ensure program has workouts
    if (!program.workouts || program.workouts.length === 0) {
      throw new NeuralAPIError(
        NeuralAPIErrorType.VALIDATION_ERROR,
        'Program must contain at least one workout'
      );
    }

    // Ensure each workout has exercises
    for (const workout of program.workouts) {
      if (!workout.mainExercises || workout.mainExercises.length === 0) {
        throw new NeuralAPIError(
          NeuralAPIErrorType.VALIDATION_ERROR,
          `Workout "${workout.name}" must contain at least one main exercise`
        );
      }

      // Validate workout duration is reasonable
      if (workout.duration < 15 || workout.duration > 180) {
        throw new NeuralAPIError(
          NeuralAPIErrorType.VALIDATION_ERROR,
          `Workout "${workout.name}" duration (${workout.duration} min) is outside reasonable range (15-180 min)`
        );
      }
    }

    // Ensure program name is descriptive
    if (!program.programName || program.programName.length < 5) {
      throw new NeuralAPIError(
        NeuralAPIErrorType.VALIDATION_ERROR,
        'Program name must be at least 5 characters long'
      );
    }
  }

  /**
   * Enhance Neural response with additional metadata
   * 
   * @private
   */
  private enhanceNeuralResponse(response: NeuralResponse): NeuralResponse {
    // Add generation timestamp to program
    const enhancedProgram: TrainingProgram = {
      ...response.program,
      createdAt: new Date(),
    };

    return {
      ...response,
      program: enhancedProgram,
    };
  }

  /**
   * Build AI prompt for program generation
   * 
   * @private
   */
  private buildProgramGenerationPrompt(request: NeuralRequest): string {
    const { onboardingData, currentWeek, previousProgress } = request;
    
    let prompt = `Generate a personalized training program based on the following user data:

PRIMARY FOCUS: ${onboardingData.primaryFocus}
EXPERIENCE LEVEL: ${onboardingData.experienceLevel}
SESSION DURATION: ${onboardingData.sessionDuration} minutes
EQUIPMENT ACCESS: ${onboardingData.equipmentAccess}
CURRENT WEEK: ${currentWeek}`;

    // Add personal records if available
    if (onboardingData.personalRecords) {
      prompt += `\n\nPERSONAL RECORDS:`;
      if (onboardingData.personalRecords.squat) {
        prompt += `\n- Squat: ${onboardingData.personalRecords.squat}`;
      }
      if (onboardingData.personalRecords.bench) {
        prompt += `\n- Bench Press: ${onboardingData.personalRecords.bench}`;
      }
      if (onboardingData.personalRecords.deadlift) {
        prompt += `\n- Deadlift: ${onboardingData.personalRecords.deadlift}`;
      }
    }

    // Add additional context
    if (onboardingData.additionalInfo) {
      if (onboardingData.additionalInfo.injuryHistory) {
        prompt += `\n\nINJURY HISTORY: ${onboardingData.additionalInfo.injuryHistory}`;
      }
      if (onboardingData.additionalInfo.preferences) {
        prompt += `\n\nPREFERENCES: ${onboardingData.additionalInfo.preferences.join(', ')}`;
      }
      if (onboardingData.additionalInfo.availableDays) {
        prompt += `\n\nAVAILABLE DAYS PER WEEK: ${onboardingData.additionalInfo.availableDays}`;
      }
    }

    // Add progress data if this is a progression
    if (previousProgress) {
      prompt += `\n\nPREVIOUS PROGRESS DATA:`;
      
      if (previousProgress.workoutFeedback) {
        const feedback = previousProgress.workoutFeedback;
        prompt += `\n- Average Fatigue: ${feedback.averageFatigue}/10`;
        prompt += `\n- Average Motivation: ${feedback.averageMotivation}/10`;
        prompt += `\n- Completion Rate: ${Math.round(feedback.completionRate * 100)}%`;
        prompt += `\n- Workouts Completed: ${feedback.workoutsCompleted}`;
      }

      if (previousProgress.strengthProgress) {
        prompt += `\n\nSTRENGTH PROGRESS:`;
        Object.entries(previousProgress.strengthProgress).forEach(([exercise, progress]) => {
          prompt += `\n- ${exercise}: ${progress.previousBest} → ${progress.current} ${progress.unit}`;
        });
      }
    }

    prompt += `\n\nGenerate a complete training program that includes:
1. A descriptive program name that reflects the focus and approach
2. 3-5 workouts for the current week
3. Each workout should include warmup, main exercises, and optional finisher
4. Provide detailed exercise specifications (sets, reps, load, rest, RPE)
5. Include Neural's reasoning for the program design choices
6. Provide a detailed progression plan for upcoming weeks
7. Give a preview of what to expect next week

Focus on creating a program that:
- Matches the user's experience level and goals
- Fits within their available time and equipment
- Provides appropriate progression and variety
- Includes clear, actionable exercise descriptions
- Considers any injury history or preferences mentioned

Be specific with exercise names, rep ranges, and coaching cues. Use natural language for load descriptions (e.g., "moderate weight", "15-20lb dumbbells", "bodyweight").`;

    logger.debug('Generated program generation prompt', {
      operation: 'buildProgramGenerationPrompt',
      component: 'neuralAPI',
      promptLength: prompt.length,
      primaryFocus: onboardingData.primaryFocus,
      hasProgressData: !!previousProgress,
    });

    return prompt;
  }

  /**
   * Generate unique request ID for tracking
   * 
   * @private
   */
  private generateRequestId(): string {
    return `neural_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize request data for logging (remove sensitive information)
   * 
   * @private
   */
  private sanitizeRequestForLogging(request: NeuralRequest): Partial<NeuralRequest> {
    return {
      currentWeek: request.currentWeek,
      onboardingData: {
        primaryFocus: request.onboardingData.primaryFocus,
        experienceLevel: request.onboardingData.experienceLevel,
        sessionDuration: request.onboardingData.sessionDuration,
        equipmentAccess: request.onboardingData.equipmentAccess,
        // Exclude potentially sensitive information like injury history
      },
    };
  }

  /**
   * Sanitize response data for logging
   * 
   * @private
   */
  private sanitizeResponseForLogging(response: any): any {
    if (!response || typeof response !== 'object') {
      return { type: typeof response };
    }

    return {
      hasProgram: !!response.program,
      hasReasoning: !!response.reasoning,
      hasProgressionPlan: !!response.progressionPlan,
      hasNextWeekPreview: !!response.nextWeekPreview,
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info('Updated Neural API configuration', {
      operation: 'updateConfig',
      component: 'neuralAPI',
      newConfig: {
        model: newConfig.model,
        maxTokens: newConfig.maxTokens,
        temperature: newConfig.temperature,
        // Don't log API key
      },
    });
  }

  /**
   * Get current configuration (sanitized)
   */
  getConfig(): Omit<LLMConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const averageResponseTime = this.metrics.requestCount > 0 
      ? this.metrics.totalResponseTime / this.metrics.requestCount 
      : 0;

    return {
      requestCount: this.metrics.requestCount,
      successCount: this.metrics.successCount,
      errorCount: this.metrics.errorCount,
      successRate: this.metrics.requestCount > 0 
        ? this.metrics.successCount / this.metrics.requestCount 
        : 0,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
    };
  }
}

// Export singleton instance for convenience
export const neuralAPI = new NeuralAPI();

// Export factory function for testing/custom configs
export const createNeuralAPI = (config?: Partial<LLMConfig>) => new NeuralAPI(config);

/**
 * Utility function for backward compatibility
 */
export async function generateNeuralProgram(
  request: NeuralRequest,
  config?: Partial<LLMConfig>
): Promise<NeuralResponse> {
  const api = config ? createNeuralAPI(config) : neuralAPI;
  return api.generateProgram(request);
}
