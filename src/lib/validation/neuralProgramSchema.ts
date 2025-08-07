/**
 * Simplified Neural Program Schema
 * 
 * This schema is designed to match the actual AI output structure,
 * replacing the overly complex enhancedProgramSchema.ts for Neural program validation.
 * 
 * Based on the AI's actual response structure observed in logs:
 * {
 *   "program_name": "Intermediate Hypertrophy Builder",
 *   "workouts": [...]
 * }
 */

import { z } from 'zod';

/**
 * Onboarding data validation for Neural system
 */
export const NeuralOnboardingDataSchema = z.object({
  primaryFocus: z.enum(['hypertrophy', 'strength', 'general_fitness']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  equipmentAccess: z.enum(['full_gym', 'dumbbells_only', 'bodyweight_only']),
  personalRecords: z.object({
    squat: z.number().positive().optional(),
    bench: z.number().positive().optional(),
    deadlift: z.number().positive().optional(),
  }).optional(),
  additionalInfo: z.object({
    injuryHistory: z.string().optional(),
    preferences: z.array(z.string()).optional(),
    availableDays: z.number().int().min(1).max(7).optional(),
  }).optional(),
});

/**
 * Progress data validation for Neural system
 */
export const NeuralProgressDataSchema = z.object({
  strengthProgress: z.record(z.object({
    previousBest: z.number(),
    current: z.number(),
    unit: z.string(),
    measuredAt: z.date(),
  })).optional(),
  workoutFeedback: z.object({
    averageFatigue: z.number().min(1).max(10),
    averageMotivation: z.number().min(1).max(10),
    completionRate: z.number().min(0).max(1),
    workoutsCompleted: z.number().int().nonnegative(),
  }).optional(),
  bodyComposition: z.object({
    weightChange: z.number().optional(),
    bodyFatChange: z.number().optional(),
    measuredAt: z.date(),
  }).optional(),
  recoveryMetrics: z.object({
    averageSleepHours: z.number().positive(),
    sleepQuality: z.number().min(1).max(10),
    stressLevel: z.number().min(1).max(10),
  }).optional(),
});

/**
 * Neural request validation
 */
export const NeuralRequestSchema = z.object({
  onboardingData: NeuralOnboardingDataSchema,
  currentWeek: z.number().int().positive(),
  previousProgress: NeuralProgressDataSchema.optional(),
});

/**
 * Exercise schema matching AI output structure
 */
export const NeuralExerciseSchema = z.object({
  exercise: z.string(),
  sets: z.number(),
  reps: z.union([z.string(), z.number()]),
  load: z.string(),
  rest: z.string(),
  RPE: z.number().optional(),
  description: z.string().optional(),
});

/**
 * Workout schema matching AI output structure
 */
export const NeuralWorkoutSchema = z.object({
  day: z.string(),
  focus: z.string(),
  warmup: z.array(NeuralExerciseSchema).optional(),
  main_exercises: z.array(NeuralExerciseSchema),
  finisher: z.array(NeuralExerciseSchema).optional(),
  optional_finisher: z.array(NeuralExerciseSchema).optional(),
});

/**
 * Simplified Neural program schema that matches AI output exactly
 */
export const SimplifiedNeuralProgramSchema = z.object({
  program_name: z.string(),
  workouts: z.array(NeuralWorkoutSchema),
});

/**
 * Raw AI response schema - what the AI actually returns
 * This matches the structure observed in the logs
 */
export const RawAIResponseSchema = z.object({
  program_name: z.string(),
  workouts: z.array(NeuralWorkoutSchema),
});

/**
 * Complete Neural API response schema with additional context
 * For backward compatibility with existing code
 */
export const NeuralAPIResponseSchema = z.object({
  program_name: z.string(),
  workouts: z.array(NeuralWorkoutSchema),
  reasoning: z.string().optional(),
  progressionPlan: z.string().optional(),
  nextWeekPreview: z.string().optional(),
});

// Type exports
export type NeuralOnboardingData = z.infer<typeof NeuralOnboardingDataSchema>;
export type NeuralProgressData = z.infer<typeof NeuralProgressDataSchema>;
export type NeuralRequest = z.infer<typeof NeuralRequestSchema>;
export type NeuralExercise = z.infer<typeof NeuralExerciseSchema>;
export type NeuralWorkout = z.infer<typeof NeuralWorkoutSchema>;
export type SimplifiedNeuralProgram = z.infer<typeof SimplifiedNeuralProgramSchema>;
export type RawAIResponse = z.infer<typeof RawAIResponseSchema>;
export type NeuralAPIResponse = z.infer<typeof NeuralAPIResponseSchema>;

/**
 * Validation helpers
 */
export function validateNeuralProgram(data: unknown): { success: true; data: SimplifiedNeuralProgram } | { success: false; error: string } {
  const result = SimplifiedNeuralProgramSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateRawAIResponse(data: unknown): { success: true; data: RawAIResponse } | { success: false; error: string } {
  const result = RawAIResponseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateNeuralAPIResponse(data: unknown): { success: true; data: NeuralAPIResponse } | { success: false; error: string } {
  const result = NeuralAPIResponseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateNeuralRequest(data: unknown): { success: true; data: NeuralRequest } | { success: false; error: string } {
  const result = NeuralRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateNeuralOnboardingData(data: unknown): { success: true; data: NeuralOnboardingData } | { success: false; error: string } {
  const result = NeuralOnboardingDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}

export function validateNeuralProgressData(data: unknown): { success: true; data: NeuralProgressData } | { success: false; error: string } {
  const result = NeuralProgressDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
  };
}
