// src/lib/types/program.ts

import { z } from 'zod';

// Base Enums and Types
export const DayOfWeekEnum = z.enum([
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday', 
  'Sunday'
]);
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

export const ExerciseTierEnum = z.enum([
  'Anchor',
  'Primary', 
  'Secondary',
  'Accessory'
]);
export type ExerciseTier = z.infer<typeof ExerciseTierEnum>;

export const ProgressionStrategyEnum = z.enum([
  'Linear',
  'Double Progression',
  'Reverse Pyramid',
  'Wave Loading',
  'Autoregulated'
]);
export type ProgressionStrategy = z.infer<typeof ProgressionStrategyEnum>;

// Zod Schema for a single exercise
export const ExerciseDetailSchema = z.object({
  name: z.string().min(1, { message: "Exercise name is required." }),
  tier: ExerciseTierEnum,
  sets: z.number().int().positive(),
  reps: z.string().min(1).describe("Rep range, e.g., '8-10' or '5'"),
  rpe: z.string().describe("Rate of Perceived Exertion, e.g., '7-8' or '@8'"),
  rest: z.string().min(1).describe("Rest period, e.g., '90-120s' or '2-3min'"),
  notes: z.string().optional().describe("Specific form cues or rationale."),
  isAnchorLift: z.boolean().default(false).describe("True if this is the designated anchor lift"),
});
export type ExerciseDetail = z.infer<typeof ExerciseDetailSchema>;

// Zod Schema for a single workout day
export const WorkoutDaySchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  focus: z.string().min(1).describe("e.g., 'Upper Body - Push', 'Lower Body', or 'Rest'"),
  isRestDay: z.boolean(),
  exercises: z.array(ExerciseDetailSchema),
  estimatedDuration: z.string().optional().describe("Expected workout duration, e.g., '60-75min'"),
});
export type WorkoutDay = z.infer<typeof WorkoutDaySchema>;

// Zod Schema for a single training week
export const TrainingWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  phaseWeek: z.number().int().positive().describe("Week number within the current phase"),
  progressionStrategy: ProgressionStrategyEnum,
  intensityFocus: z.string().min(1).describe("e.g., 'Volume Accumulation', 'Intensity', 'Deload'"),
  days: z.array(WorkoutDaySchema).length(7, { message: "A week must have exactly 7 days." }),
  weeklyVolumeLandmark: z.string().optional().describe("MEV/MAV/MRV classification for this week"),
});
export type TrainingWeek = z.infer<typeof TrainingWeekSchema>;

// Zod Schema for a training phase
export const TrainingPhaseSchema = z.object({
  phaseName: z.string().min(1).describe("e.g., 'Volume Accumulation', 'Intensification', 'Realization'"),
  phaseType: z.enum(['Accumulation', 'Intensification', 'Realization', 'Deload']),
  durationWeeks: z.number().int().positive(),
  primaryGoal: z.string().min(1).describe("Primary adaptation goal for this phase"),
  weeks: z.array(TrainingWeekSchema),
});
export type TrainingPhase = z.infer<typeof TrainingPhaseSchema>;

// Zod Schema for the entire training program
export const TrainingProgramSchema = z.object({
  programName: z.string().min(1),
  description: z.string().min(1),
  durationWeeksTotal: z.number().int().positive(),
  coachIntro: z.string().min(1).describe("Personalized intro from the AI coach."),
  generalAdvice: z.string().min(1).describe("Scientific rationale for the program design."),
  periodizationModel: z.string().min(1).describe("e.g., 'Linear', 'Undulating', 'Block'"),
  phases: z.array(TrainingPhaseSchema).min(1),
  // Metadata for scientific validation
  totalVolumeProgression: z.string().optional().describe("Overall volume progression strategy"),
  anchorLifts: z.array(z.string()).optional().describe("List of designated anchor lifts"),
});
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;

// Helper schemas for the generation pipeline
export const ProgramScaffoldSchema = z.object({
  programName: z.string().min(1),
  description: z.string().min(1),
  durationWeeksTotal: z.number().int().positive(),
  periodizationModel: z.string().min(1),
  phases: z.array(z.object({
    phaseName: z.string().min(1),
    phaseType: z.enum(['Accumulation', 'Intensification', 'Realization', 'Deload']),
    durationWeeks: z.number().int().positive(),
    primaryGoal: z.string().min(1),
    weeks: z.array(z.object({
      weekNumber: z.number().int().positive(),
      phaseWeek: z.number().int().positive(),
      intensityFocus: z.string().min(1),
      progressionStrategy: ProgressionStrategyEnum,
    }))
  }))
});
export type ProgramScaffold = z.infer<typeof ProgramScaffoldSchema>;

export const NarrativeContentSchema = z.object({
  coachIntro: z.string().min(1),
  generalAdvice: z.string().min(1),
});
export type NarrativeContent = z.infer<typeof NarrativeContentSchema>;

// Database storage interface for training programs
export const StoredTrainingProgramSchema = TrainingProgramSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  isActive: z.boolean(),
  status: z.enum(['draft', 'active', 'completed', 'paused', 'archived']),
  currentWeek: z.number().int().positive().optional(),
  currentPhase: z.number().int().positive().optional(),
});
export type StoredTrainingProgram = z.infer<typeof StoredTrainingProgramSchema>;

// Workout completion tracking schemas
export const ExerciseCompletionSchema = z.object({
  exerciseName: z.string().min(1),
  setsCompleted: z.number().int().positive(),
  repsCompleted: z.array(z.union([z.number(), z.string()])),
  weightUsed: z.array(z.string()).optional(),
  notes: z.string().optional(),
  completedAsPrescribed: z.boolean(),
});
export type ExerciseCompletion = z.infer<typeof ExerciseCompletionSchema>;

export const WorkoutCompletionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  programId: z.string(),
  weekNumber: z.number().int().positive(),
  dayOfWeek: DayOfWeekEnum,
  completedAt: z.date().or(z.string()),
  exercisesCompleted: z.array(ExerciseCompletionSchema),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(10).optional(),
  actualDurationMinutes: z.number().int().positive().optional(),
});
export type WorkoutCompletion = z.infer<typeof WorkoutCompletionSchema>;

// Daily Readiness tracking schemas
export const DailyReadinessDataSchema = z.object({
  sleep: z.enum(['Poor', 'Average', 'Great']),
  energy: z.enum(['Sore/Tired', 'Feeling Good', 'Ready to Go']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timestamp: z.date().or(z.string()),
});
export type DailyReadinessData = z.infer<typeof DailyReadinessDataSchema>;

// Enhanced User Profiling Schemas for Science-Based Training
export const VolumeParametersSchema = z.object({
  trainingAge: z.number().int().positive().describe("Training age in years"),
  recoveryCapacity: z.number().int().min(1).max(10).describe("Recovery capacity rating (1-10)"),
  volumeTolerance: z.number().min(0.5).max(2.0).describe("Volume tolerance coefficient"),
  stressLevel: z.number().int().min(1).max(10).describe("Current life stress level (1-10)"),
});
export type VolumeParameters = z.infer<typeof VolumeParametersSchema>;

export const VolumeLandmarksSchema = z.object({
  MEV: z.number().int().positive().describe("Minimum Effective Volume"),
  MAV: z.number().int().positive().describe("Maximum Adaptive Volume"),
  MRV: z.number().int().positive().describe("Maximum Recoverable Volume"),
});
export type VolumeLandmarks = z.infer<typeof VolumeLandmarksSchema>;

export const RecoveryProfileSchema = z.object({
  fatigueThreshold: z.number().int().min(1).max(10),
  recoveryRate: z.number().min(0.5).max(2.0),
  sleepQuality: z.number().int().min(1).max(10),
  recoveryModalities: z.array(z.string()).optional(),
});
export type RecoveryProfile = z.infer<typeof RecoveryProfileSchema>;

export const WeakPointAnalysisSchema = z.object({
  strengthRatios: z.record(z.string(), z.number()),
  weakPoints: z.array(z.string()),
  correctionExercises: z.record(z.string(), z.array(z.string())),
  weakPointPriority: z.record(z.string(), z.number().int().min(1).max(10)).optional(),
});
export type WeakPointAnalysis = z.infer<typeof WeakPointAnalysisSchema>;

export const RPEProfileSchema = z.object({
  sessionRPETargets: z.record(z.string(), z.tuple([z.number(), z.number()])),
  autoregulationRules: z.object({
    readyToGo: z.number(),
    feelingGood: z.number(),
    soreTired: z.number(),
  }),
  rpeAccuracy: z.number().int().min(1).max(10).optional(),
  exerciseRPEPreferences: z.record(z.string(), z.tuple([z.number(), z.number()])).optional(),
});
export type RPEProfile = z.infer<typeof RPEProfileSchema>;

export const PeriodizationModelSchema = z.object({
  type: z.enum(['linear', 'undulating', 'block', 'conjugate', 'autoregulated']),
  phases: z.array(z.object({
    name: z.string().min(1),
    duration: z.number().int().positive(),
    focus: z.enum(['hypertrophy', 'strength', 'power', 'endurance', 'deload']),
    intensityRange: z.tuple([z.number(), z.number()]),
    volumeMultiplier: z.number().positive(),
  })),
  adaptationTargets: z.object({
    strength: z.record(z.string(), z.number()).optional(),
    hypertrophy: z.record(z.string(), z.number()).optional(),
    power: z.record(z.string(), z.number()).optional(),
    endurance: z.record(z.string(), z.number()).optional(),
  }),
  deloadProtocol: z.object({
    frequency: z.number().int().positive(),
    type: z.enum(['volume', 'intensity', 'complete']),
    reductionPercentage: z.number().int().min(1).max(100),
  }),
});
export type PeriodizationModel = z.infer<typeof PeriodizationModelSchema>;

export const EnhancedUserDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  height_cm: z.number().positive().optional(),
  weight_kg: z.number().positive().optional(),
  fitness_goals: z.string().optional(),
  primary_training_focus: z.string().optional(),
  experience_level: z.string().optional(),
  weight_unit: z.enum(['kg', 'lbs']),
  squat1RMEstimate: z.number().positive().optional(),
  benchPress1RMEstimate: z.number().positive().optional(),
  deadlift1RMEstimate: z.number().positive().optional(),
  overheadPress1RMEstimate: z.number().positive().optional(),
  equipment: z.array(z.string()).optional(),
  trainingFrequencyDays: z.number().int().positive().optional(),
  sessionDuration: z.string().optional(),
  exercisePreferences: z.string().optional(),
  injuriesLimitations: z.string().optional(),
  volumeParameters: VolumeParametersSchema,
  volumeLandmarks: z.record(z.string(), VolumeLandmarksSchema),
  recoveryProfile: RecoveryProfileSchema,
  weakPointAnalysis: WeakPointAnalysisSchema,
  rpeProfile: RPEProfileSchema,
  periodizationModel: PeriodizationModelSchema,
  trainingHistory: z.object({
    totalTrainingTime: z.number().positive(),
    injuryHistory: z.array(z.string()),
    peakPerformances: z.record(z.string(), z.number()),
    trainingResponseProfile: z.record(z.string(), z.enum(['poor', 'average', 'excellent'])),
  }).optional(),
  lifestyleFactors: z.object({
    occupationType: z.enum(['sedentary', 'active', 'physical']),
    averageSleepHours: z.number().min(0).max(24),
    stressManagement: z.array(z.string()),
    nutritionAdherence: z.number().int().min(1).max(10),
  }).optional(),
});
export type EnhancedUserData = z.infer<typeof EnhancedUserDataSchema>;

// Legacy type exports for backward compatibility
export type UserData = EnhancedUserData;
export type WorkoutFocus = string;
export type TrainingSession = {
  week?: number;
  dayOfWeek?: number | string;
  focus?: string;
  exercises?: {
    name: string;
    sets: string | number;
    reps?: string | number;
    duration?: string;
    rest: string;
    rpe?: string | number;
  }[];
};

// Props interfaces for components
export interface DailyReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (readiness: DailyReadinessData) => void;
  isSubmitting?: boolean;
}

export interface DailyReadinessService {
  hasCompletedToday: () => boolean;
  markCompletedToday: (readiness: DailyReadinessData) => void;
  getTodaysReadiness: () => DailyReadinessData | null;
  clearAll: () => void;
}

// Test function to validate schema structure
export function validatePhoenixSchema() {
  const sampleExercise: ExerciseDetail = {
    name: "Barbell Squat",
    tier: "Anchor",
    sets: 3,
    reps: "5",
    rpe: "8",
    rest: "3-5min",
    notes: "Focus on depth and form",
    isAnchorLift: true,
  };

  const sampleWorkoutDay: WorkoutDay = {
    dayOfWeek: "Monday",
    focus: "Lower Body - Squat",
    isRestDay: false,
    exercises: [sampleExercise],
    estimatedDuration: "60-75min",
  };

  const sampleWeek: TrainingWeek = {
    weekNumber: 1,
    phaseWeek: 1,
    progressionStrategy: "Linear",
    intensityFocus: "Volume Accumulation",
    days: [
      sampleWorkoutDay,
      { ...sampleWorkoutDay, dayOfWeek: "Tuesday", focus: "Upper Body - Push", exercises: [] },
      { ...sampleWorkoutDay, dayOfWeek: "Wednesday", focus: "Rest", isRestDay: true, exercises: [] },
      { ...sampleWorkoutDay, dayOfWeek: "Thursday", focus: "Lower Body - Deadlift", exercises: [] },
      { ...sampleWorkoutDay, dayOfWeek: "Friday", focus: "Upper Body - Pull", exercises: [] },
      { ...sampleWorkoutDay, dayOfWeek: "Saturday", focus: "Rest", isRestDay: true, exercises: [] },
      { ...sampleWorkoutDay, dayOfWeek: "Sunday", focus: "Rest", isRestDay: true, exercises: [] },
    ],
    weeklyVolumeLandmark: "MAV",
  };

  const samplePhase: TrainingPhase = {
    phaseName: "Volume Accumulation",
    phaseType: "Accumulation",
    durationWeeks: 4,
    primaryGoal: "Build foundational strength and muscle mass",
    weeks: [sampleWeek],
  };

  const sampleProgram: TrainingProgram = {
    programName: "Phoenix Strength Program",
    description: "A comprehensive 4-week strength training program",
    durationWeeksTotal: 4,
    coachIntro: "Welcome to your personalized strength journey!",
    generalAdvice: "This program follows scientific periodization principles.",
    periodizationModel: "Linear",
    phases: [samplePhase],
    totalVolumeProgression: "Progressive overload with volume accumulation",
    anchorLifts: ["Barbell Squat", "Deadlift", "Bench Press"],
  };

  // Validate using Zod schemas
  try {
    const validatedExercise = ExerciseDetailSchema.parse(sampleExercise);
    const validatedDay = WorkoutDaySchema.parse(sampleWorkoutDay);
    const validatedWeek = TrainingWeekSchema.parse(sampleWeek);
    const validatedPhase = TrainingPhaseSchema.parse(samplePhase);
    const validatedProgram = TrainingProgramSchema.parse(sampleProgram);
    
    console.log("✅ Phoenix Schema validation successful");
    return {
      success: true,
      exercise: validatedExercise,
      day: validatedDay,
      week: validatedWeek,
      phase: validatedPhase,
      program: validatedProgram,
    };
  } catch (error) {
    console.error("❌ Phoenix Schema validation failed:", error);
    return { success: false, error };
  }
}
