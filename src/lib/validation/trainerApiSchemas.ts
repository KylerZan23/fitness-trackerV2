/**
 * Validation schemas for trainer API endpoints
 * Uses Zod for runtime validation and TypeScript type inference
 */

import { z } from 'zod'

/**
 * Weight unit validation
 */
const WeightUnitSchema = z.enum(['kg', 'lbs'])

/**
 * Height unit validation
 */
const HeightUnitSchema = z.enum(['cm', 'ft_in'])

/**
 * Fitness level validation
 */
const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert'])

/**
 * Equipment types validation
 */
const EquipmentTypeSchema = z.enum([
  'Full Gym (Barbells, Racks, Machines)',
  'Dumbbells',
  'Kettlebells',
  'Resistance Bands',
  'Bodyweight Only',
  'Cardio Machines (Treadmill, Bike, Rower, Elliptical)'
])

/**
 * Session duration validation
 */
const SessionDurationSchema = z.enum(['30-45 minutes', '45-60 minutes', '60-75 minutes', '75+ minutes'])

/**
 * User biometrics schema
 */
export const UserBiometricsSchema = z.object({
  age: z.number()
    .int()
    .min(13, 'Age must be at least 13')
    .max(120, 'Age must be at most 120'),
  
  weight: z.number()
    .positive('Weight must be positive')
    .max(1000, 'Weight seems unrealistic')
    .optional(),
  
  height: z.number()
    .positive('Height must be positive')
    .max(300, 'Height seems unrealistic')
    .optional(),
  
  weight_unit: WeightUnitSchema,
  
  height_unit: HeightUnitSchema.optional(),
  
  body_fat_percentage: z.number()
    .min(3, 'Body fat percentage must be at least 3%')
    .max(50, 'Body fat percentage must be at most 50%')
    .optional(),
  
  fitness_level: FitnessLevelSchema.optional()
})

/**
 * Training goals schema
 */
export const TrainingGoalsSchema = z.object({
  primary_goal: z.string()
    .min(1, 'Primary goal is required')
    .max(200, 'Primary goal is too long'),
  
  secondary_goals: z.array(z.string().max(200))
    .max(5, 'Too many secondary goals')
    .optional(),
  
  training_frequency_days: z.number()
    .int()
    .min(2, 'Training frequency must be at least 2 days')
    .max(7, 'Training frequency must be at most 7 days'),
  
  session_duration: SessionDurationSchema,
  
  available_equipment: z.array(EquipmentTypeSchema)
    .min(1, 'At least one equipment type must be selected')
    .max(10, 'Too many equipment types selected'),
  
  training_style_preferences: z.array(z.string().max(100))
    .max(10, 'Too many training style preferences')
    .optional(),
  
  specific_focus_areas: z.array(z.string().max(100))
    .max(10, 'Too many specific focus areas')
    .optional()
})

/**
 * Lifting experience schema
 */
const LiftingExperienceSchema = z.object({
  squat_1rm: z.number()
    .positive('Squat 1RM must be positive')
    .max(1000, 'Squat 1RM seems unrealistic')
    .optional(),
  
  bench_1rm: z.number()
    .positive('Bench 1RM must be positive')
    .max(1000, 'Bench 1RM seems unrealistic')
    .optional(),
  
  deadlift_1rm: z.number()
    .positive('Deadlift 1RM must be positive')
    .max(1000, 'Deadlift 1RM seems unrealistic')
    .optional(),
  
  overhead_press_1rm: z.number()
    .positive('Overhead Press 1RM must be positive')
    .max(1000, 'Overhead Press 1RM seems unrealistic')
    .optional()
}).optional()

/**
 * Experience level schema
 */
export const ExperienceLevelSchema = z.object({
  level: FitnessLevelSchema,
  
  years_training: z.number()
    .int()
    .min(0, 'Years training cannot be negative')
    .max(80, 'Years training seems unrealistic')
    .optional(),
  
  previous_injuries: z.array(z.string().max(200))
    .max(20, 'Too many previous injuries listed')
    .optional(),
  
  lifting_experience: LiftingExperienceSchema
})

/**
 * Client info schema (optional metadata)
 */
export const ClientInfoSchema = z.object({
  client_name: z.string()
    .max(100, 'Client name is too long')
    .optional(),
  
  client_id: z.string()
    .max(100, 'Client ID is too long')
    .optional(),
  
  trainer_name: z.string()
    .max(100, 'Trainer name is too long')
    .optional(),
  
  trainer_id: z.string()
    .max(100, 'Trainer ID is too long')
    .optional()
}).optional()

/**
 * Generate program request schema
 */
export const GenerateProgramRequestSchema = z.object({
  user_biometrics: UserBiometricsSchema,
  training_goals: TrainingGoalsSchema,
  experience_level: ExperienceLevelSchema,
  client_info: ClientInfoSchema
})

/**
 * Program metadata schema for response
 */
export const ProgramMetadataSchema = z.object({
  generated_at: z.string().datetime(),
  ai_model_used: z.string(),
  generation_time_ms: z.number().int().positive(),
  weak_point_analysis: z.any().optional(),
  periodization_model: z.string().optional()
})

/**
 * Exercise detail schema
 */
export const ExerciseDetailSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().int().min(1).max(20),
  reps: z.union([z.string(), z.number()]),
  rest: z.string().min(1, 'Rest period is required'),
  tempo: z.string().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  weight: z.string().optional(),
  category: z.enum(['Compound', 'Isolation', 'Cardio', 'Mobility', 'Core', 'Warm-up', 'Cool-down', 'Power']).optional(),
  tier: z.enum(['Tier_1', 'Tier_2', 'Tier_3']).optional(),
  muscleGroups: z.array(z.string()).optional(),
  weakPointTarget: z.string().optional(),
  stimulusToFatigueRatio: z.enum(['High', 'Moderate', 'Low']).optional(),
  scientificRationale: z.string().optional()
})

/**
 * Workout day schema
 */
export const WorkoutDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  focus: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  exercises: z.array(ExerciseDetailSchema).min(1, 'At least one exercise is required'),
  estimatedDuration: z.string().optional(),
  targetIntensity: z.string().optional(),
  warmup: z.array(ExerciseDetailSchema).optional(),
  cooldown: z.array(ExerciseDetailSchema).optional(),
  notes: z.string().optional()
})

/**
 * Training week schema
 */
export const TrainingWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  intensity: z.string().optional(),
  focus: z.string().optional(),
  workouts: z.array(WorkoutDaySchema).min(1, 'At least one workout is required'),
  notes: z.string().optional(),
  deloadWeek: z.boolean().optional()
})

/**
 * Complete program schema for response
 */
export const GeneratedProgramSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Program name is required'),
  duration_weeks: z.number().int().min(1).max(52),
  training_days: z.array(TrainingWeekSchema).min(1, 'At least one training week is required'),
  metadata: ProgramMetadataSchema
})

/**
 * Generate program response schema
 */
export const GenerateProgramResponseSchema = z.object({
  success: z.boolean(),
  program: GeneratedProgramSchema.optional(),
  error: z.string().optional(),
  generation_time_ms: z.number().int().positive().optional()
})

/**
 * API response wrapper schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  meta: z.object({
    request_id: z.string().uuid(),
    timestamp: z.string().datetime(),
    rate_limit: z.object({
      allowed: z.boolean(),
      limit_type: z.enum(['hourly', 'daily']).optional(),
      requests_made: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      reset_time: z.string().datetime(),
      retry_after_seconds: z.number().int().positive().optional()
    }).optional()
  }).optional()
})

/**
 * API key creation request schema
 */
export const CreateApiKeyRequestSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  scopes: z.array(z.enum(['program:generate', 'program:read', 'user:read', 'analytics:read']))
    .min(1, 'At least one scope is required')
    .max(10, 'Too many scopes'),
  
  rate_limit_per_hour: z.number()
    .int()
    .min(1, 'Hourly rate limit must be at least 1')
    .max(10000, 'Hourly rate limit is too high')
    .optional(),
  
  rate_limit_per_day: z.number()
    .int()
    .min(1, 'Daily rate limit must be at least 1')
    .max(100000, 'Daily rate limit is too high')
    .optional(),
  
  expires_at: z.string()
    .datetime()
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'Expiration date must be in the future'
    ),
  
  client_info: z.record(z.any()).optional()
})

/**
 * Validation helper function with detailed error formatting
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.issues.map(issue => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
    return `${path}: ${issue.message}`
  })
  
  return { success: false, errors }
}

/**
 * Validation helper for API responses
 */
export function createValidationErrorResponse(errors: string[], requestId?: string) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: { validation_errors: errors }
    },
    meta: {
      request_id: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  }
}

// Export inferred types for TypeScript
export type UserBiometrics = z.infer<typeof UserBiometricsSchema>
export type TrainingGoals = z.infer<typeof TrainingGoalsSchema>
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>
export type GenerateProgramRequest = z.infer<typeof GenerateProgramRequestSchema>
export type GenerateProgramResponse = z.infer<typeof GenerateProgramResponseSchema>
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>