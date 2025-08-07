/**
 * Enhanced Program Schema Validation
 * 
 * Zod schemas for validating training programs and Neural type system data.
 * This file provides validation for both legacy program types and new Neural types.
 */

import { z } from 'zod';

// ===== NEURAL TYPE VALIDATION SCHEMAS =====

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
 * Neural exercise validation
 */
export const NeuralExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  targetMuscles: z.array(z.string()),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  load: z.string().min(1),
  rest: z.string().min(1),
  rpe: z.string().min(1),
  notes: z.string().optional(),
  videoUrl: z.string().url().optional(),
});

/**
 * Neural workout validation
 */
export const NeuralWorkoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  duration: z.number().positive(),
  focus: z.string().min(1),
  warmup: z.array(NeuralExerciseSchema),
  mainExercises: z.array(NeuralExerciseSchema),
  finisher: z.array(NeuralExerciseSchema).optional(),
  totalEstimatedTime: z.number().positive(),
});

/**
 * Simplified Neural training program validation
 * Matches the actual AI output structure for better compatibility
 */
export const SimplifiedNeuralProgramSchema = z.object({
  program_name: z.string(),
  workouts: z.array(z.object({
    day: z.string(),
    focus: z.string(),
    warmup: z.array(z.object({
      exercise: z.string(),
      sets: z.number().optional(),
      reps: z.union([z.string(), z.number()]).optional(),
      load: z.string().optional(),
      rest: z.string().optional(),
      description: z.string().optional()
    })).optional(),
    main_exercises: z.array(z.object({
      exercise: z.string(),
      sets: z.number(),
      reps: z.union([z.string(), z.number()]),
      load: z.string(),
      rest: z.string(),
      RPE: z.number().optional()
    })),
    finisher: z.union([
      z.array(z.object({
        exercise: z.string(),
        sets: z.number(),
        reps: z.union([z.string(), z.number()]),
        load: z.string(),
        rest: z.string()
      })),
      z.object({
        exercise: z.string(),
        sets: z.number(),
        reps: z.union([z.string(), z.number()]),
        load: z.string(),
        rest: z.string(),
        RPE: z.number().optional()
      })
    ]).optional(),
    optional_finisher: z.array(z.object({
      exercise: z.string(),
      sets: z.number(),
      reps: z.union([z.string(), z.number()]),
      load: z.string(),
      rest: z.string()
    })).optional()
  }))
});

/**
 * Original Neural training program validation (keeping for backward compatibility)
 * @deprecated Use SimplifiedNeuralProgramSchema for new implementations
 */
export const NeuralTrainingProgramSchema = SimplifiedNeuralProgramSchema;

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
 * Neural response validation
 */
export const NeuralResponseSchema = z.object({
  program: NeuralTrainingProgramSchema,
  reasoning: z.string().min(1),
  progressionPlan: z.string().min(1),
  nextWeekPreview: z.string().min(1),
});

// ===== LEGACY PROGRAM TYPE VALIDATION SCHEMAS =====

/**
 * Exercise detail validation (legacy)
 */
export const ExerciseDetailSchema = z.object({
  name: z.string().min(1),
  tier: z.enum(['Anchor', 'Primary', 'Secondary', 'Accessory']),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  rpe: z.string().min(1),
  rest: z.string().min(1),
  notes: z.string().optional(),
  isAnchorLift: z.boolean(),
});

/**
 * Workout day validation (legacy)
 */
export const WorkoutDaySchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  isRestDay: z.boolean(),
  exercises: z.array(ExerciseDetailSchema),
  estimatedDuration: z.string().optional(),
});

/**
 * Training week validation (legacy)
 */
export const TrainingWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  phaseWeek: z.number().int().positive(),
  progressionStrategy: z.string(),
  intensityFocus: z.string(),
  days: z.array(WorkoutDaySchema),
  weeklyVolumeLandmark: z.string().optional(),
});

/**
 * Training phase validation (legacy)
 */
export const TrainingPhaseSchema = z.object({
  phaseName: z.string().min(1),
  phaseType: z.enum(['Accumulation', 'Intensification', 'Realization', 'Deload']),
  durationWeeks: z.number().int().positive(),
  primaryGoal: z.string().min(1),
  weeks: z.array(TrainingWeekSchema),
});

/**
 * Training program validation (legacy)
 */
export const TrainingProgramSchema = z.object({
  programName: z.string().min(1),
  description: z.string(),
  durationWeeksTotal: z.number().int().positive(),
  coachIntro: z.string(),
  generalAdvice: z.string(),
  periodizationModel: z.string(),
  phases: z.array(TrainingPhaseSchema),
  totalVolumeProgression: z.string().optional(),
  anchorLifts: z.array(z.string()).optional(),
  generatedAt: z.string().optional(),
  aiModelUsed: z.string().optional(),
});

/**
 * Daily readiness data validation (legacy)
 */
export const DailyReadinessDataSchema = z.object({
  date: z.string(),
  energyLevel: z.number().min(1).max(10),
  sleepQuality: z.number().min(1).max(10),
  sleepHours: z.number().positive(),
  stressLevel: z.number().min(1).max(10),
  motivationLevel: z.number().min(1).max(10),
  soreness: z.string().optional(),
  previousTrainingLoad: z.number().optional(),
  readinessScore: z.number().min(1).max(10),
});

// ===== COMBINED VALIDATION FOR PROGRAM GENERATION =====

/**
 * Enhanced program validation that supports both legacy and Neural types
 */
export const ENHANCED_PROGRAM_VALIDATION = {
  // Neural type validations
  neural: {
    onboardingData: NeuralOnboardingDataSchema,
    exercise: NeuralExerciseSchema,
    workout: NeuralWorkoutSchema,
    program: NeuralTrainingProgramSchema,
    request: NeuralRequestSchema,
    response: NeuralResponseSchema,
    progressData: NeuralProgressDataSchema,
  },
  
  // Legacy type validations
  legacy: {
    exerciseDetail: ExerciseDetailSchema,
    workoutDay: WorkoutDaySchema,
    trainingWeek: TrainingWeekSchema,
    trainingPhase: TrainingPhaseSchema,
    trainingProgram: TrainingProgramSchema,
    dailyReadiness: DailyReadinessDataSchema,
  },
  
  // Validation utility functions
  utils: {
    validateNeuralProgram: (data: unknown) => NeuralTrainingProgramSchema.safeParse(data),
    validateLegacyProgram: (data: unknown) => TrainingProgramSchema.safeParse(data),
    validateNeuralRequest: (data: unknown) => NeuralRequestSchema.safeParse(data),
    
    // Auto-detect and validate program type
    validateProgram: (data: unknown) => {
      // Try Neural type first
      const neuralResult = NeuralTrainingProgramSchema.safeParse(data);
      if (neuralResult.success) {
        return { success: true, data: neuralResult.data, type: 'neural' as const };
      }
      
      // Fall back to legacy type
      const legacyResult = TrainingProgramSchema.safeParse(data);
      if (legacyResult.success) {
        return { success: true, data: legacyResult.data, type: 'legacy' as const };
      }
      
      // Both failed
      return {
        success: false,
        errors: {
          neural: neuralResult.error,
          legacy: legacyResult.error,
        },
      };
    },
  },
};

// ===== TYPE EXPORTS =====

// Export inferred TypeScript types
export type NeuralOnboardingData = z.infer<typeof NeuralOnboardingDataSchema>;
export type NeuralExercise = z.infer<typeof NeuralExerciseSchema>;
export type NeuralWorkout = z.infer<typeof NeuralWorkoutSchema>;
export type SimplifiedNeuralProgram = z.infer<typeof SimplifiedNeuralProgramSchema>;
export type NeuralTrainingProgram = SimplifiedNeuralProgram;
export type NeuralProgressData = z.infer<typeof NeuralProgressDataSchema>;
export type NeuralRequest = z.infer<typeof NeuralRequestSchema>;
export type NeuralResponse = z.infer<typeof NeuralResponseSchema>;

// Legacy type exports
export type LegacyExerciseDetail = z.infer<typeof ExerciseDetailSchema>;
export type LegacyWorkoutDay = z.infer<typeof WorkoutDaySchema>;
export type LegacyTrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type LegacyDailyReadinessData = z.infer<typeof DailyReadinessDataSchema>;

/**
 * Validation helper functions
 */
export function createValidationError(errors: z.ZodError) {
  return {
    success: false,
    errors: errors.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  };
}

export function isValidNeuralProgram(data: unknown): data is NeuralTrainingProgram {
  return NeuralTrainingProgramSchema.safeParse(data).success;
}

export function isValidLegacyProgram(data: unknown): data is LegacyTrainingProgram {
  return TrainingProgramSchema.safeParse(data).success;
}
