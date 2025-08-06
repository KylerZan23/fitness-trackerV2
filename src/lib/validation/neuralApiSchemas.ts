// src/lib/validation/neuralApiSchemas.ts
import { z } from 'zod';

/**
 * Validation schemas for Neural API endpoints
 * 
 * These schemas ensure type safety and validate requests/responses
 * for the Neural coach API infrastructure.
 */

// Base exercise schema
const ExerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  targetMuscles: z.array(z.string()),
  sets: z.number().min(1).max(20),
  reps: z.string().min(1),
  load: z.string().min(1),
  rest: z.string().min(1).optional(),
  rpe: z.string().min(1),
  notes: z.string().optional(),
  videoUrl: z.string().url().optional()
});

// Workout schema
const WorkoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  duration: z.number().min(5).max(300),
  focus: z.string().min(1),
  warmup: z.array(ExerciseSchema),
  mainExercises: z.array(ExerciseSchema).min(1),
  finisher: z.array(ExerciseSchema).optional(),
  totalEstimatedTime: z.number().min(5).max(300)
});

// Training program schema
const TrainingProgramSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  programName: z.string().min(5),
  weekNumber: z.number().min(1).max(52),
  workouts: z.array(WorkoutSchema).min(1).max(7),
  progressionNotes: z.string().min(1),
  createdAt: z.date(),
  neuralInsights: z.string().min(1)
});

// Onboarding data schema
const OnboardingDataSchema = z.object({
  primaryFocus: z.enum(['hypertrophy', 'strength', 'general_fitness']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  equipmentAccess: z.enum(['full_gym', 'dumbbells_only', 'bodyweight_only']),
  personalRecords: z.object({
    squat: z.number().positive().optional(),
    bench: z.number().positive().optional(),
    deadlift: z.number().positive().optional()
  }).optional(),
  additionalInfo: z.object({
    injuryHistory: z.string().max(1000).optional(),
    preferences: z.array(z.string()).max(10).optional(),
    availableDays: z.number().min(1).max(7).optional()
  }).optional()
});

// Progress data schemas
const StrengthProgressSchema = z.record(
  z.string(),
  z.object({
    previousBest: z.number(),
    current: z.number(),
    unit: z.string(),
    measuredAt: z.date()
  })
);

const WorkoutFeedbackSchema = z.object({
  averageFatigue: z.number().min(1).max(10),
  averageMotivation: z.number().min(1).max(10),
  completionRate: z.number().min(0).max(1),
  workoutsCompleted: z.number().min(0)
});

const BodyCompositionSchema = z.object({
  weightChange: z.number().optional(),
  bodyFatChange: z.number().optional(),
  measuredAt: z.date()
});

const RecoveryMetricsSchema = z.object({
  averageSleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10)
});

const ProgressDataSchema = z.object({
  strengthProgress: StrengthProgressSchema.optional(),
  workoutFeedback: WorkoutFeedbackSchema.optional(),
  bodyComposition: BodyCompositionSchema.optional(),
  recoveryMetrics: RecoveryMetricsSchema.optional()
});

// =============================================================================
// NEURAL GENERATE ENDPOINT SCHEMAS
// =============================================================================

export const NeuralGenerateRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  onboardingData: OnboardingDataSchema,
  regenerate: z.boolean().optional().default(false),
  weekNumber: z.number().min(1).max(52).optional().default(1)
});

export const NeuralGenerateResponseSchema = z.object({
  success: z.boolean(),
  program: TrainingProgramSchema.optional(),
  reasoning: z.string().optional(),
  progressionPlan: z.string().optional(),
  nextWeekPreview: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

// =============================================================================
// NEURAL PROGRESS ENDPOINT SCHEMAS
// =============================================================================

export const NeuralProgressRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  programId: z.string().uuid('Invalid program ID format'),
  currentWeek: z.number().min(1).max(52),
  progressData: ProgressDataSchema,
  targetWeek: z.number().min(1).max(52).optional(),
  progressionType: z.enum(['automatic', 'manual', 'deload']).optional().default('automatic')
});

export const NeuralProgressResponseSchema = z.object({
  success: z.boolean(),
  program: TrainingProgramSchema.optional(),
  progressionAnalysis: z.string().optional(),
  adaptationsMade: z.array(z.string()).optional(),
  nextWeekPreview: z.string().optional(),
  weekNumber: z.number().optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

// =============================================================================
// PROGRAM CRUD ENDPOINT SCHEMAS
// =============================================================================

export const ProgramUpdateRequestSchema = z.object({
  programName: z.string().min(5).max(100).optional(),
  workouts: z.array(WorkoutSchema).optional(),
  progressionNotes: z.string().max(2000).optional(),
  neuralInsights: z.string().max(2000).optional(),
  sharing_settings: z.object({
    allow_public_view: z.boolean(),
    allow_copy: z.boolean(),
    created_by: z.string().uuid()
  }).optional()
});

export const ProgramResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    userId: z.string(),
    programName: z.string(),
    weekNumber: z.number(),
    workouts: z.array(WorkoutSchema),
    progressionNotes: z.string(),
    createdAt: z.date(),
    neuralInsights: z.string(),
    is_shared: z.boolean().optional(),
    shared_with: z.array(z.string()).optional(),
    sharing_settings: z.object({
      allow_public_view: z.boolean(),
      allow_copy: z.boolean(),
      created_by: z.string()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

export const ProgramsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    program_name: z.string(),
    week_number: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    user_id: z.string()
  })).optional(),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean()
  }).optional(),
  error: z.string().optional()
});

// =============================================================================
// PROGRAM SHARING SCHEMAS
// =============================================================================

export const ShareProgramRequestSchema = z.object({
  sharedWithUserId: z.string().uuid('Invalid user ID format'),
  permissionLevel: z.enum(['view', 'copy']).default('view'),
  message: z.string().max(500).optional()
});

export const ShareProgramResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional()
});

// =============================================================================
// ERROR RESPONSE SCHEMAS
// =============================================================================

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.record(z.any()).optional(),
  code: z.string().optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional()
});

// =============================================================================
// RATE LIMITING SCHEMAS
// =============================================================================

export const RateLimitHeadersSchema = z.object({
  'X-RateLimit-Limit': z.string(),
  'X-RateLimit-Remaining': z.string(),
  'X-RateLimit-Reset': z.string(),
  'Retry-After': z.string().optional()
});

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const ProgramQueryParamsSchema = z.object({
  includeShared: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
  orderBy: z.enum(['created_at', 'updated_at', 'program_name']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional()
});

// =============================================================================
// HELPER VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates and transforms request data
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid data format'] };
  }
}

/**
 * Validates query parameters with proper type coercion
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid query parameters'] };
  }
}

/**
 * Creates a standardized error response
 */
export function createValidationErrorResponse(
  errors: string[],
  requestId?: string
): Response {
  const errorResponse = {
    success: false,
    error: 'Validation failed',
    details: { validation_errors: errors },
    timestamp: new Date().toISOString(),
    requestId
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Type exports for use in API endpoints
export type NeuralGenerateRequest = z.infer<typeof NeuralGenerateRequestSchema>;
export type NeuralGenerateResponse = z.infer<typeof NeuralGenerateResponseSchema>;
export type NeuralProgressRequest = z.infer<typeof NeuralProgressRequestSchema>;
export type NeuralProgressResponse = z.infer<typeof NeuralProgressResponseSchema>;
export type ProgramUpdateRequest = z.infer<typeof ProgramUpdateRequestSchema>;
export type ProgramResponse = z.infer<typeof ProgramResponseSchema>;
export type ProgramsListResponse = z.infer<typeof ProgramsListResponseSchema>;
export type ShareProgramRequest = z.infer<typeof ShareProgramRequestSchema>;
export type ShareProgramResponse = z.infer<typeof ShareProgramResponseSchema>;
export type ProgramQueryParams = z.infer<typeof ProgramQueryParamsSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
