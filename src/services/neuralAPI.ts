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
import { RawAIResponseSchema, validateRawAIResponse, validateNeuralRequest, type RawAIResponse, type NeuralRequest as NeuralRequestType } from '@/lib/validation/neuralProgramSchema';
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
        RawAIResponseSchema,
        3,
        requestId
      );

      // Additional validation and enhancement
      const validatedResponse = this.validateNeuralResponse(
        response,
        validatedRequest.onboardingData.sessionDuration,
        validatedRequest.onboardingData
      );
      
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
      const validation = validateNeuralRequest(request);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      return validation.data;
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
   * Transform raw AI response to expected NeuralResponse format
   * 
   * @private
   */
  private transformRawResponseToNeuralResponse(
    rawResponse: RawAIResponse,
    sessionDuration?: number,
    onboardingData?: OnboardingData
  ): NeuralResponse {
    // Generate unique IDs and transform workouts
    const desiredDuration = typeof sessionDuration === 'number' ? sessionDuration : 60
    const transformedWorkouts = rawResponse.workouts.map((workout, index) => ({
      id: crypto.randomUUID(),
      name: `${workout.day} - ${workout.focus}`,
      duration: desiredDuration,
      focus: workout.focus,
      warmup: workout.warmup?.map(exercise => ({
        id: crypto.randomUUID(),
        name: exercise.exercise,
        targetMuscles: [], // Would need to be mapped from exercise names
        sets: exercise.sets || 2,
        reps: exercise.reps?.toString() || "10",
        load: exercise.load || "bodyweight",
        rest: exercise.rest || "30 seconds",
        rpe: exercise.RPE?.toString() || "4",
        notes: exercise.description,
      })) || [],
      mainExercises: workout.main_exercises.map(exercise => {
        const id = crypto.randomUUID();
        const name = exercise.exercise;
        const sets = exercise.sets;
        const repsStr = exercise.reps?.toString() || 'AMRAP';
        const rpeStrRaw = exercise.RPE?.toString() || '7';
        const rpeStr = (() => {
          const focus = onboardingData?.primaryFocus?.toLowerCase();
          const exp = (onboardingData as any)?.experienceLevel as ('beginner'|'intermediate'|'advanced'|undefined);
          if (focus === 'hypertrophy') {
            const targetMin = exp === 'beginner' ? 7 : 8;
            const targetMax = exp === 'beginner' ? 8 : 9;
            const nums = (rpeStrRaw.match(/\d+(?:\.\d+)?/g) || []).map(parseFloat);
            if (nums.length === 0) return `${targetMin}-${targetMax}`;
            const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
            if (avg < targetMin - 0.1 || avg > targetMax + 0.1) return `${targetMin}-${targetMax}`;
            if (nums.length === 1) return `${Math.max(targetMin, Math.min(targetMax, Math.round(avg)))}`;
            const lo = Math.max(targetMin, Math.min(targetMax, Math.min(nums[0], nums[1])));
            const hi = Math.max(targetMin, Math.min(targetMax, Math.max(nums[0], nums[1])));
            return lo === hi ? `${lo}` : `${lo}-${hi}`;
          }
          return rpeStrRaw;
        })();
        const baseLoad = exercise.load;
        const restStr = (() => {
          const focus = onboardingData?.primaryFocus?.toLowerCase();
          if (focus === 'hypertrophy') return '2-3 minutes';
          return exercise.rest || '90 seconds';
        })();

        const suggested = this.computeSuggestedLoad(name, repsStr, rpeStr, onboardingData);
        const suggestedText = (() => {
          if (!suggested) return null;
          return `~${suggested.weightRounded} ${suggested.unit} (${Math.round(suggested.percent * 100)}% 1RM)`;
        })();
        const loadWithSuggestion = suggestedText
          ? `${baseLoad ?? ''}${baseLoad ? ' | ' : ''}${suggestedText}`
          : baseLoad;

        return {
          id,
          name,
          targetMuscles: [],
          sets,
          reps: repsStr,
          load: loadWithSuggestion,
          rest: restStr,
          rpe: rpeStr,
        };
      }),
      totalEstimatedTime: desiredDuration,
    }));

    // Create the training program
    const program: TrainingProgram = {
      id: crypto.randomUUID(),
      userId: "", // Will be set by the calling code
      programName: rawResponse.program_name,
      weekNumber: 1, // Default, could be passed from request
      workouts: transformedWorkouts,
      progressionNotes: "AI-generated program with progressive overload principles",
      createdAt: new Date(),
      neuralInsights: `Generated ${transformedWorkouts.length}-workout program focusing on ${transformedWorkouts[0]?.focus || 'balanced training'}`,
    };

    return {
      program,
      reasoning: "Program designed based on user preferences and experience level",
      progressionPlan: "Week-by-week progression with increasing intensity and volume",
      nextWeekPreview: "Next week will build upon this foundation with slight increases in load",
    };
  }

  /**
   * Validate and enhance Neural response
   * 
   * @private
   */
  private validateNeuralResponse(
    response: any,
    sessionDuration?: number,
    onboardingData?: OnboardingData
  ): NeuralResponse {
    try {
      // First validate the basic structure
      const validation = validateRawAIResponse(response);
      if (!validation.success) {
        throw new Error(`Response validation failed: ${validation.error}`);
      }
      const rawResponse = validation.data;
      
      // Transform raw AI response to expected NeuralResponse format
      const validatedResponse = this.transformRawResponseToNeuralResponse(rawResponse, sessionDuration, onboardingData);
      
      // Additional business logic validation
      this.validateProgramBusinessLogic(validatedResponse.program);

      // Attach predictive accessory ranges when possible
      if (onboardingData) {
        validatedResponse.program.workouts = validatedResponse.program.workouts.map(w => ({
          ...w,
          mainExercises: w.mainExercises.map(ex => {
            const predicted = this.predictAccessoryRange(ex.name, ex.reps, onboardingData);
            if (!predicted) return ex;
            const unit = (onboardingData.unitPreference === 'lbs') ? 'lbs' : 'kg';
            const repsLabel = predicted.repsLabel ? ` for ${predicted.repsLabel}` : '';
            const isDumbbell = ex.name.toLowerCase().includes('dumbbell') || ex.name.toLowerCase().includes('db ');
            const eachSuffix = isDumbbell ? ' each' : '';
            const rangeCore = `~${predicted.min}–${predicted.max} ${unit}${eachSuffix}`;
            const rangeText = `${rangeCore}${repsLabel}`;

            // Promote the range to the visible load line
            const hasMeaningfulLoad = typeof ex.load === 'string' && ex.load.trim().length > 0;
            const looksNumeric = hasMeaningfulLoad && /\d/.test(ex.load as string);
            const genericWeight = hasMeaningfulLoad && /(light|moderate|heavy|bodyweight)/i.test(ex.load as string);
            const mergedLoad = (!hasMeaningfulLoad || genericWeight || !looksNumeric)
              ? rangeText
              : `${ex.load} | ${rangeText}`;

            return {
              ...ex,
              load: mergedLoad,
              notes: ex.notes ? `${ex.notes}\nSuggested range: ${rangeText}` : `Suggested range: ${rangeText}`,
            };
          })
        }));
      }
      
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

    // Add anthropometrics for better predictions
    if (typeof (onboardingData as any).bodyWeight === 'number') {
      prompt += `\n\nBODY WEIGHT: ${(onboardingData as any).bodyWeight} ${(onboardingData as any).bodyWeightUnit || onboardingData.unitPreference || 'kg'}`;
    }
    if (onboardingData.gender) {
      prompt += `\nGENDER: ${onboardingData.gender}`;
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

    // Scale expected number of main exercises based on requested session duration
    const expectedExercises = (() => {
      switch (onboardingData.sessionDuration) {
        case 90: return '6-8';
        case 60: return '4-6';
        case 45: return '3-5';
        case 30: return '2-4';
        default: return '4-6';
      }
    })();

    // Inject deterministic split and weekly set targets for hypertrophy across 2–6 days
    if (onboardingData.primaryFocus === 'hypertrophy' && onboardingData.trainingDaysPerWeek) {
      const days = onboardingData.trainingDaysPerWeek;
      const splitMap: Record<number, string[]> = {
        2: [
          'Full Body',
          'Full Body',
        ],
        3: [
          'Upper',
          'Lower',
          'Full Body (Upper-Biased)',
        ],
        4: [
          'Upper',
          'Lower',
          'Upper',
          'Lower',
        ],
        5: [
          'Push (Chest, Shoulders, Triceps)',
          'Pull (Back, Biceps)',
          'Legs (Quads, Hamstrings, Glutes, Calves)',
          'Upper (Chest/Back/Shoulders focus)',
          'Lower (Quads/Hamstrings/Glutes focus)',
        ],
        6: [
          'Push (Chest, Shoulders, Triceps)',
          'Pull (Back, Biceps)',
          'Legs (Quads, Hamstrings, Glutes, Calves)',
          'Push (Chest, Shoulders, Triceps)',
          'Pull (Back, Biceps)',
          'Legs (Quads, Hamstrings, Glutes, Calves)',
        ],
      };
      const template = splitMap[days];
      if (template) {
        const header = 'MANDATORY WEEKLY SPLIT (DO NOT DEVIATE):';
        const lines = template.map((f, i) => {
          const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
          return `${dayNames[i]}: ${f}`;
        }).join('\n');
        prompt += `\n\n${header}\n${lines}`;
        prompt += `\n\nWEEKLY WORKING-SET TARGETS (PER MUSCLE):\n- Follow hypertrophy targets based on experience level (Beginner: 12–14, Intermediate: 12–18, Advanced: 14–20 sets per muscle per week).\n- Keep sessions within ${onboardingData.sessionDuration} minutes; prioritize anchor and primary lifts; adjust accessories to stay within time.`;
      }
    } else {
      // Non-6-day or non-advanced-hypertrophy cases: embed per-focus general targets for guidance
      const focusTargets = (() => {
        if (onboardingData.primaryFocus === 'strength') return 'Aim for 10–15 sets per muscle per week.';
        if (onboardingData.primaryFocus === 'general_fitness') return 'Aim for 6–9 sets per muscle per week.';
        // hypertrophy
        switch (onboardingData.experienceLevel) {
          case 'beginner': return 'Aim for 12–14 sets per muscle per week.';
          case 'intermediate': return 'Aim for 12–18 sets per muscle per week.';
          default: return 'Aim for 14–20 sets per muscle per week.';
        }
      })();
      prompt += `\n\nWEEKLY WORKING-SET TARGET GUIDANCE: ${focusTargets}`;
    }

    // Global banned exercises and preferred substitutions
    prompt += `\n\nEXERCISE POLICY:\n- BANNED: Arnold Press (do NOT include).\n- SUBSTITUTE: Use Seated Dumbbell Shoulder Press instead for shoulder pressing variations.\n\nGenerate a complete training program that includes:
1. A descriptive program name that reflects the focus and approach
 2. ${onboardingData.trainingDaysPerWeek ? `${onboardingData.trainingDaysPerWeek} workouts` : '3-5 workouts'} for the current week (match the user's preferred training frequency)
3. Each workout should include warmup and main exercises only (${expectedExercises} exercises for the main block based on the ${onboardingData.sessionDuration} minute session). Do NOT include any finishers.
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

Be specific with exercise names, rep ranges, and coaching cues. Use natural language for load descriptions (e.g., "moderate weight", "15-20lb dumbbells", "bodyweight").
When providing absolute loads, prefer the user's unit preference (${onboardingData.unitPreference || 'kg'}).

REQUIRED JSON FORMAT (NO FINISHERS):
{
  "program_name": "Descriptive program name",
  "workouts": [
    {
      "day": "Monday",
      "focus": "Upper Body Push",
      "warmup": [
        {
          "exercise": "Dynamic Stretching",
          "duration": "10 minutes",
          "description": "Full body mobility preparation"
        }
      ],
      "main_exercises": [
        {
          "exercise": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "load": "moderate weight",
          "rest": "90 seconds",
          "RPE": 7,
          "coaching_cues": "Control the descent, drive through chest"
        }
      ]
    }
  ]
}

Use exactly this structure. The key field is "workouts" (not "week_1_workouts" or any other variation).`;

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
   * Compute suggested absolute load from PRs for big-3 variants
   * Uses RPE when available, otherwise rep-based percentage mapping
   * Rounds to nearest 2.5 kg or 5 lbs based on user preference
   */
  private computeSuggestedLoad(
    exerciseName: string,
    reps: string,
    rpe: string,
    onboardingData?: OnboardingData
  ): { weightRounded: number; percent: number; unit: 'kg' | 'lbs' } | null {
    if (!onboardingData?.personalRecords) return null;

    const liftType = this.inferLiftType(exerciseName);
    if (!liftType) return null;

    const pr = onboardingData.personalRecords[liftType];
    if (!pr || pr <= 0) return null;

    const unit: 'kg' | 'lbs' = onboardingData.unitPreference === 'lbs' ? 'lbs' : 'kg';

    const percentFromRPE = this.percentFromRPE(rpe);
    const percentFromReps = this.percentFromReps(reps);
    let percent = percentFromRPE ?? percentFromReps ?? 0.7; // default 70%

    // Hypertrophy slight intensity bump (+2–3%)
    if (onboardingData?.primaryFocus?.toLowerCase() === 'hypertrophy') {
      percent = Math.min(1.0, percent + 0.025);
    }

    // Compute in the same unit as the user's PR to avoid double conversion
    const suggested = pr * percent;
    const increment = unit === 'kg' ? 2.5 : 5;
    const weightRounded = Math.round(suggested / increment) * increment;
    if (!isFinite(weightRounded) || weightRounded <= 0) return null;
    return { weightRounded, percent, unit };
  }

  private inferLiftType(name: string): 'squat' | 'bench' | 'deadlift' | null {
    const n = name.toLowerCase();
    // Deadlift before squat to avoid matching "squat" substring in some names
    if (n.includes('deadlift') || n.includes('rdl') || n.includes('romanian')) return 'deadlift';
    if (n.includes('bench')) return 'bench';
    if (n.includes('squat') || n.includes('hack squat') || n.includes('front squat') || n.includes('back squat')) return 'squat';
    return null;
  }

  private percentFromRPE(rpeStr: string): number | null {
    const parse = (s: string): number | null => {
      const m = s.match(/\d+(?:\.\d+)?/);
      return m ? Math.min(10, Math.max(1, parseFloat(m[0]))) : null;
    };
    if (!rpeStr) return null;
    if (rpeStr.includes('-')) {
      const parts = rpeStr.split('-').map(p => parse(p)).filter((v): v is number => v != null);
      if (parts.length) {
        const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
        return this.mapRpeToPercent(avg);
      }
      return null;
    }
    const val = parse(rpeStr);
    return val != null ? this.mapRpeToPercent(val) : null;
  }

  private mapRpeToPercent(rpe: number): number {
    // Approximate mapping consistent with prompt guidance
    if (rpe >= 9.5) return 1.0;
    if (rpe >= 9.0) return 0.9;
    if (rpe >= 8.5) return 0.875;
    if (rpe >= 8.0) return 0.8;
    if (rpe >= 7.5) return 0.75;
    if (rpe >= 7.0) return 0.7;
    if (rpe >= 6.5) return 0.65;
    if (rpe >= 6.0) return 0.6;
    return 0.55;
  }

  private percentFromReps(repsStr: string): number | null {
    if (!repsStr) return null;
    // Extract the first numeric in range or single
    const firstNumMatch = repsStr.match(/\d+/);
    if (!firstNumMatch) return null;
    const reps = parseInt(firstNumMatch[0], 10);
    // Simple table midpoints commonly used
    const table: Record<number, number> = {
      1: 1.0,
      2: 0.95,
      3: 0.92,
      4: 0.9,
      5: 0.875,
      6: 0.85,
      7: 0.825,
      8: 0.8,
      9: 0.775,
      10: 0.75,
      11: 0.725,
      12: 0.7,
    };
    // Clamp between 1 and 12 reps
    const key = Math.max(1, Math.min(12, reps));
    return table[key] ?? null;
  }

  // === Predictive Accessory Range System ===
  private predictAccessoryRange(
    exerciseName: string,
    repsStr: string | undefined,
    onboardingData: OnboardingData
  ): { min: number; max: number; repsLabel?: string } | null {
    const mapping = this.getAccessoryMapping(exerciseName);
    if (!mapping) return null;

    const bigLift = mapping.linked as 'bench' | 'squat' | 'deadlift';
    const pr = onboardingData.personalRecords?.[bigLift];
    if (!pr || pr <= 0) return null;

    // Determine level purely from declared experience (eliminate BW dependency)
    const exp = (onboardingData as any).experienceLevel as ('beginner'|'intermediate'|'advanced'|undefined);
    const level: 'novice'|'intermediate'|'advanced'|'elite' =
      exp === 'beginner' ? 'novice' : exp === 'advanced' ? 'advanced' : 'intermediate';

    const [minPct, maxPct] = mapping.percent[level];
    // 1RM range predicted for accessory (compute in user's native unit)
    const useLbs = onboardingData.unitPreference === 'lbs';
    const acc1RMminNative = pr * minPct;
    const acc1RMmaxNative = pr * maxPct;

    const genderAdj = this.genderAdjustment(onboardingData.gender, bigLift);
    let adjAcc1RMmin = acc1RMminNative * genderAdj;
    let adjAcc1RMmax = acc1RMmaxNative * genderAdj;

    // Convert 1RM range → working weight range for target reps
    const { minReps, maxReps, label } = this.parseRepsRange(repsStr);
    let percentLowReps = this.percentForReps(minReps); // heavier end
    let percentHighReps = this.percentForReps(maxReps); // lighter end

    // Hypertrophy rep-percent bias (10→0.77, 12→0.72)
    if (onboardingData.primaryFocus?.toLowerCase() === 'hypertrophy') {
      if (minReps === 10) percentLowReps = 0.77;
      if (minReps === 12) percentLowReps = 0.72;
      if (maxReps === 10) percentHighReps = 0.77;
      if (maxReps === 12) percentHighReps = 0.72;
    }

    let workMin = adjAcc1RMmin * percentHighReps;
    let workMax = adjAcc1RMmax * percentLowReps;

    // Hypertrophy slight intensity bump for accessories (+2–3%)
    if (onboardingData.primaryFocus?.toLowerCase() === 'hypertrophy') {
      workMin *= 1.025;
      workMax *= 1.025;
    }

    // Per-arm correction for dumbbell pressing patterns
    const nameLower = exerciseName.toLowerCase();
    const isPerArmPress = /(dumbbell|db)/.test(nameLower) && /press|bench|shoulder/.test(nameLower) && !/fly|flye/.test(nameLower);
    if (isPerArmPress) {
      workMin = workMin / 2;
      workMax = workMax / 2;
    }

    if (useLbs) {
      let minLbs = Math.round(workMin / 5) * 5;
      let maxLbs = Math.round(workMax / 5) * 5;

      // Apply machine-floor for Cable Tricep Pushdown to avoid unrealistically low loads
      if (/(cable\s+)?triceps?\s+pushdown|push-down|pressdown/i.test(exerciseName)) {
        const floor = 40; // lbs
        minLbs = Math.max(floor, minLbs);
        maxLbs = Math.max(minLbs, Math.max(floor, maxLbs));
      }
      return { min: minLbs, max: maxLbs, repsLabel: label };
    }
    // Convert to kg if needed (PR was lbs, all previous math in lbs)
    const minRounded = Math.round((workMin / 2.20462) / 2.5) * 2.5;
    const maxRounded = Math.round((workMax / 2.20462) / 2.5) * 2.5;
    return { min: minRounded, max: maxRounded, repsLabel: label };
  }

  private getAccessoryMapping(exerciseName: string): {
    linked: 'bench' | 'squat' | 'deadlift';
    percent: Record<'novice' | 'intermediate' | 'advanced' | 'elite', [number, number]>;
  } | null {
    const n = exerciseName.toLowerCase();

    // Reference table: predicts accessory 1RM % of linked big lift PR
    const table: Array<{ match: RegExp; linked: 'bench' | 'squat' | 'deadlift'; ratios: [number, number, number, number, number, number, number, number] }>
      = [
        // Upper Body – Push
        { match: /(triceps?\s+pushdown|cable\s+pushdown|triceps?\s+extension)/, linked: 'bench', ratios: [0.25,0.35, 0.65,0.80, 0.90,1.10, 1.30,1.60] },
        { match: /(overhead\s+press|strict\s+press|military\s+press|ohp\b|seated\s+overhead\s+press|standing\s+overhead\s+press)/, linked: 'bench', ratios: [0.45,0.55, 0.45,0.55, 0.50,0.60, 0.55,0.65] },
        { match: /(seated\s+dumbbell\s+shoulder\s+press|standing\s+dumbbell\s+press|dumbbell\s+shoulder\s+press|db\s+shoulder\s+press|shoulder\s+press)/, linked: 'bench', ratios: [0.45,0.55, 0.60,0.75, 0.70,0.85, 0.75,0.90] },
        { match: /(dumbbell\s+bench\s+press|db\s+bench\s+press)/, linked: 'bench', ratios: [0.50,0.60, 0.60,0.70, 0.65,0.75, 0.70,0.80] },
        { match: /(incline\s+dumbbell\s+press|incline\s+db\s+press|incline\s+bench)/, linked: 'bench', ratios: [0.55,0.65, 0.65,0.75, 0.70,0.85, 0.75,0.90] },
        { match: /(close[- ]grip\s+bench|cgbp)/, linked: 'bench', ratios: [0.65,0.75, 0.80,0.90, 0.90,1.00, 1.00,1.10] },
        { match: /(incline\s+bench)/, linked: 'bench', ratios: [0.50,0.60, 0.65,0.75, 0.75,0.85, 0.85,0.95] },
        { match: /(weighted\s+dips?|dips?\s*(\(weighted\)|with\s+weight|belt(ed)?))/, linked: 'bench', ratios: [0.25,0.35, 0.50,0.65, 0.65,0.80, 0.80,1.00] },
        { match: /(lateral\s+raise|side\s+raise|db\s+lateral\s+raise|dumbbell\s+lateral\s+raise)/, linked: 'bench', ratios: [0.12,0.18, 0.20,0.34, 0.22,0.36, 0.24,0.38] },
        { match: /(weighted\s+push[- ]?ups?|push[- ]?ups?\s*\(weighted\)|push[- ]?ups?)/, linked: 'bench', ratios: [0.30,0.40, 0.50,0.65, 0.65,0.80, 0.80,1.00] },

        // Upper Body – Pull
        { match: /(barbell\s+row|bent[- ]over\s+row|t[- ]bar\s+row|pendlay)/, linked: 'deadlift', ratios: [0.45,0.55, 0.55,0.65, 0.60,0.70, 0.70,0.80] },
        { match: /(one[- ]?arm\s+dumbbell\s+row|single[- ]?arm\s+row|dumbbell\s+row)/, linked: 'deadlift', ratios: [0.20,0.28, 0.25,0.32, 0.30,0.38, 0.35,0.45] },
        { match: /(pull[- ]?ups?|chin[- ]?ups?)\s*(\(weighted\))?/, linked: 'deadlift', ratios: [0.25,0.35, 0.50,0.65, 0.65,0.80, 0.80,0.95] },
        { match: /(lat\s+pull[- ]?down|pulldown|cable\s+pulldown)/, linked: 'deadlift', ratios: [0.45,0.55, 0.50,0.60, 0.55,0.65, 0.60,0.70] },
        { match: /(face\s+pull)/, linked: 'deadlift', ratios: [0.10,0.15, 0.15,0.25, 0.25,0.35, 0.35,0.45] },
        { match: /(barbell\s+biceps?\s+curl|biceps?\s+curl(?!\s+machine))/ , linked: 'deadlift', ratios: [0.15,0.25, 0.25,0.35, 0.35,0.45, 0.45,0.55] },
        { match: /(hammer\s+curl|db\s+hammer\s+curl)/, linked: 'deadlift', ratios: [0.10,0.20, 0.20,0.30, 0.30,0.40, 0.40,0.50] },

        // Lower Body – Quad-Dominant
        { match: /(front\s+squat)/, linked: 'squat', ratios: [0.50,0.60, 0.70,0.80, 0.80,0.90, 0.90,1.00] },
        { match: /(leg\s+press)/, linked: 'squat', ratios: [1.40,1.70, 1.60,1.90, 1.80,2.10, 2.00,2.30] },
        { match: /(bulgarian\s+split\s+squat|split\s+squat)/, linked: 'squat', ratios: [0.20,0.30, 0.35,0.45, 0.45,0.55, 0.55,0.65] },
        { match: /(walking\s+lunge|lunge|db\s+lunge|dumbbell\s+lunge)/, linked: 'squat', ratios: [0.20,0.30, 0.27,0.43, 0.32,0.48, 0.36,0.52] },
        { match: /(leg\s+extension)/, linked: 'squat', ratios: [0.30,0.45, 0.55,0.70, 0.80,0.95, 1.00,1.15] },

        // Lower Body – Hip-Dominant
        { match: /(romanian\s+deadlift|rdl\b|stiff[- ]leg)/, linked: 'deadlift', ratios: [0.45,0.55, 0.55,0.65, 0.60,0.70, 0.65,0.75] },
        { match: /(hip\s+thrust)/, linked: 'deadlift', ratios: [0.50,0.70, 0.90,1.10, 1.10,1.30, 1.30,1.50] },
        { match: /(glute\s+bridge)/, linked: 'deadlift', ratios: [0.40,0.60, 0.80,1.00, 1.00,1.20, 1.20,1.40] },
        { match: /(good\s+morning)/, linked: 'deadlift', ratios: [0.25,0.35, 0.40,0.50, 0.50,0.60, 0.60,0.70] },
        { match: /(cable\s+pull[- ]?through|pull[- ]?through)/, linked: 'deadlift', ratios: [0.20,0.30, 0.35,0.45, 0.45,0.55, 0.55,0.65] },
        { match: /(hamstring\s+curl|leg\s+curl|lying\s+leg\s+curl|seated\s+leg\s+curl)/, linked: 'deadlift', ratios: [0.15,0.25, 0.25,0.35, 0.35,0.45, 0.45,0.55] },
        { match: /(standing\s+calf\s+raise|calf\s+raise|seated\s+calf\s+raise|smith\s+calf\s+raise)/, linked: 'squat', ratios: [0.90,1.10, 1.00,1.20, 1.10,1.30, 1.15,1.35] },
      ];

    for (const row of table) {
      if (row.match.test(n)) {
        return {
          linked: row.linked,
          percent: {
            novice: [row.ratios[0], row.ratios[1]],
            intermediate: [row.ratios[2], row.ratios[3]],
            advanced: [row.ratios[4], row.ratios[5]],
            elite: [row.ratios[6], row.ratios[7]],
          }
        };
      }
    }
    return null;
  }

  private parseRepsRange(repsStr?: string): { minReps: number; maxReps: number; label?: string } {
    if (!repsStr) return { minReps: 8, maxReps: 10, label: undefined };
    const nums = (repsStr.match(/\d+/g) || []).map(n => parseInt(n, 10)).filter(n => n > 0 && Number.isFinite(n));
    if (nums.length === 0) return { minReps: 8, maxReps: 10, label: undefined };
    if (nums.length === 1) return { minReps: nums[0], maxReps: nums[0], label: `${nums[0]} reps` };
    const min = Math.min(nums[0], nums[1]);
    const max = Math.max(nums[0], nums[1]);
    return { minReps: min, maxReps: max, label: `${min}-${max} reps` };
  }

  private percentForReps(reps: number): number {
    // Shortcut table (avg Epley & Brzycki)
    const map: Record<number, number> = {
      1: 1.00,
      3: 0.93,
      5: 0.87,
      8: 0.80,
      10: 0.75,
      12: 0.70,
      15: 0.65,
    };
    if (map[reps] != null) return map[reps];
    // Fallback to Epley percent
    const epleyPercent = 1 / (1 + reps / 30);
    return Math.max(0.5, Math.min(1.0, epleyPercent));
  }

  private strengthLevel(
    lift: 'bench' | 'squat' | 'deadlift',
    relative: number
  ): 'novice' | 'intermediate' | 'advanced' | 'elite' {
    const thresholds: Record<'bench' | 'squat' | 'deadlift', [number, number, number]> = {
      bench: [0.75, 1.0, 1.25],
      squat: [1.25, 1.5, 2.0],
      deadlift: [1.5, 2.0, 2.5],
    };
    const [nov, inter, adv] = thresholds[lift];
    if (relative < nov) return 'novice';
    if (relative < inter) return 'intermediate';
    if (relative < adv) return 'advanced';
    return 'elite';
  }

  private getBodyWeightKg(onboardingData: OnboardingData): number | null {
    const unitPref = onboardingData.unitPreference || 'kg';
    const bw = (onboardingData as any).bodyWeight ?? (onboardingData as any).weight?.value;
    const bwUnit = (onboardingData as any).bodyWeightUnit ?? (onboardingData as any).weight?.unit ?? unitPref;
    if (!bw || bw <= 0) return null;
    return bwUnit === 'lbs' ? bw / 2.20462 : bw;
  }

  private genderAdjustment(gender: OnboardingData['gender'], lift: 'bench' | 'squat' | 'deadlift'): number {
    if (lift === 'bench') {
      // Women’s accessory lifts tend to be ~5–10% higher relative to big lift
      if (gender === 'female') return 1.08;
    }
    return 1.0;
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
