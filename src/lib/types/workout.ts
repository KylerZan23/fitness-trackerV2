/**
 * Workout Types - Single Source of Truth
 * 
 * Comprehensive type definitions for all workout-related data structures.
 * This file consolidates types from legacy systems and Neural system into
 * a unified type system for consistency across the application.
 */

// =============================================================================
// CORE ENUMS AND CONSTANTS
// =============================================================================

/** Days of the week */
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/** Exercise difficulty/importance tiers */
export type ExerciseTier = 'Anchor' | 'Primary' | 'Secondary' | 'Accessory';

/** Workout completion status */
export type WorkoutStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/** Exercise categories for organization */
export type ExerciseCategory = 
  | 'compound_movement' 
  | 'isolation' 
  | 'cardio' 
  | 'flexibility' 
  | 'plyometric' 
  | 'core'
  | 'warm_up'
  | 'cool_down';

/** Muscle groups for targeting and analysis */
export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'core' 
  | 'quads' 
  | 'hamstrings' 
  | 'glutes' 
  | 'calves'
  | 'full_body';

/** Equipment types for exercise filtering */
export type EquipmentType = 
  | 'barbell' 
  | 'dumbbell' 
  | 'kettlebell' 
  | 'cable' 
  | 'machine'
  | 'bodyweight' 
  | 'resistance_band' 
  | 'suspension' 
  | 'other';

/** Training focus types */
export type TrainingFocus = 
  | 'strength' 
  | 'hypertrophy' 
  | 'endurance' 
  | 'power' 
  | 'general_fitness'
  | 'rehabilitation';

// =============================================================================
// EXERCISE STRUCTURES
// =============================================================================

/** 
 * Core exercise definition - the foundational exercise data
 */
export interface Exercise {
  /** Unique exercise identifier */
  id: string;
  
  /** Exercise name */
  name: string;
  
  /** Exercise category for organization */
  category: ExerciseCategory;
  
  /** Primary muscle groups targeted */
  primaryMuscles: MuscleGroup[];
  
  /** Secondary muscle groups engaged */
  secondaryMuscles?: MuscleGroup[];
  
  /** Equipment required */
  equipment: EquipmentType[];
  
  /** Exercise difficulty tier */
  tier: ExerciseTier;
  
  /** Whether this is an anchor/compound lift */
  isAnchorLift: boolean;
  
  /** Exercise description */
  description?: string;
  
  /** Form cues and instructions */
  formCues?: string;
  
  /** Exercise rationale/reasoning */
  rationale?: string;
  
  /** Progression notes */
  progressionNotes?: string;
  
  /** Exercise variations */
  variations?: string[];
  
  /** Safety considerations */
  safetyNotes?: string;
}

/**
 * Exercise with prescribed parameters for a workout
 */
export interface PrescribedExercise extends Exercise {
  /** Number of sets to perform */
  sets: number;
  
  /** Repetition range or specific reps */
  reps: string;
  
  /** Target load/weight */
  load?: string;
  
  /** Rate of Perceived Exertion target */
  rpe?: string;
  
  /** Rest period between sets */
  restBetweenSets?: string;
  
  /** Tempo prescription (eccentric-pause-concentric-pause) */
  tempo?: string;
  
  /** Special instructions for this exercise instance */
  instructions?: string;
  
  /** Alternative exercises if primary not available */
  alternatives?: string[];
}

/**
 * Completed exercise with actual performance data
 */
export interface CompletedExercise extends PrescribedExercise {
  /** Sets actually completed */
  completedSets: CompletedSet[];
  
  /** Total time spent on this exercise */
  totalTime?: number;
  
  /** User notes from performance */
  performanceNotes?: string;
  
  /** Completion timestamp */
  completedAt: Date;
  
  /** Whether exercise was modified during execution */
  wasModified: boolean;
  
  /** Modifications made */
  modifications?: string;
}

/**
 * Individual set data structure
 */
export interface CompletedSet {
  /** Set number */
  setNumber: number;
  
  /** Actual reps performed */
  reps: number;
  
  /** Weight/load used */
  weight?: number;
  
  /** Weight unit */
  weightUnit?: 'kg' | 'lbs';
  
  /** Distance (for cardio/running) */
  distance?: number;
  
  /** Distance unit */
  distanceUnit?: 'km' | 'miles' | 'meters';
  
  /** Duration of the set */
  duration?: number;
  
  /** Duration unit */
  durationUnit?: 'seconds' | 'minutes';
  
  /** Rate of Perceived Exertion */
  rpe?: number;
  
  /** Rest time after this set */
  restTime?: number;
  
  /** Set completion timestamp */
  completedAt: Date;
  
  /** Whether this set was completed successfully */
  isCompleted: boolean;
  
  /** Notes for this specific set */
  notes?: string;
}

// =============================================================================
// WORKOUT STRUCTURES
// =============================================================================

/**
 * Base workout day structure
 */
export interface WorkoutDay {
  /** Unique workout identifier */
  id: string;
  
  /** Day of the week this workout is scheduled */
  dayOfWeek: DayOfWeek;
  
  /** Workout name/title */
  name: string;
  
  /** Whether this is a rest day */
  isRestDay: boolean;
  
  /** Prescribed exercises for this workout */
  exercises: PrescribedExercise[];
  
  /** Estimated duration in minutes */
  estimatedDurationMinutes: number;
  
  /** Workout focus/theme */
  focus?: string;
  
  /** Training focus type */
  trainingFocus: TrainingFocus;
  
  /** Workout instructions */
  instructions?: string;
  
  /** Warm-up exercises */
  warmUp?: PrescribedExercise[];
  
  /** Cool-down exercises */
  coolDown?: PrescribedExercise[];
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Neural system workout structure (simplified for Neural API)
 */
export interface Workout {
  /** Unique workout identifier */
  id: string;
  
  /** Workout name */
  name: string;
  
  /** Day of week */
  dayOfWeek: DayOfWeek;
  
  /** Whether this is a rest day */
  isRestDay: boolean;
  
  /** Training focus */
  focus: string;
  
  /** Estimated duration */
  estimatedDuration: number;
  
  /** Workout exercises */
  exercises: PrescribedExercise[];
  
  /** Workout instructions */
  instructions?: string;
}

/**
 * Completed workout with performance data
 */
export interface CompletedWorkout extends WorkoutDay {
  /** Workout completion status */
  status: WorkoutStatus;
  
  /** Actual exercises completed */
  completedExercises: CompletedExercise[];
  
  /** Actual workout duration */
  actualDurationMinutes?: number;
  
  /** Workout start time */
  startedAt?: Date;
  
  /** Workout completion time */
  completedAt?: Date;
  
  /** Overall workout rating */
  rating?: number;
  
  /** User feedback on the workout */
  feedback?: string;
  
  /** Total volume (weight x reps) */
  totalVolume?: number;
  
  /** Average RPE across all sets */
  averageRpe?: number;
  
  /** Whether workout was modified */
  wasModified: boolean;
  
  /** Modifications made to the workout */
  modifications?: string[];
}

// =============================================================================
// WEEKLY AND PROGRAM STRUCTURES
// =============================================================================

/**
 * Training week containing multiple workout days
 */
export interface TrainingWeek {
  /** Week identifier */
  id: string;
  
  /** Week number in the program */
  weekNumber: number;
  
  /** Week number within current phase */
  phaseWeek: number;
  
  /** Week name/title */
  name?: string;
  
  /** Workout days for this week */
  workouts: WorkoutDay[];
  
  /** Week progression strategy */
  progressionStrategy: string;
  
  /** Intensity focus for this week */
  intensityFocus: string;
  
  /** Weekly volume landmark (MEV, MAV, MRV, Deload) */
  weeklyVolumeLandmark?: string;
  
  /** Week-specific instructions */
  instructions?: string;
  
  /** Deload week indicator */
  isDeloadWeek: boolean;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Completed training week with performance data
 */
export interface CompletedTrainingWeek extends TrainingWeek {
  /** Completed workouts */
  completedWorkouts: CompletedWorkout[];
  
  /** Week completion percentage */
  completionPercentage: number;
  
  /** Total volume for the week */
  totalWeeklyVolume?: number;
  
  /** Average weekly RPE */
  averageWeeklyRpe?: number;
  
  /** Week completion status */
  weekStatus: 'not_started' | 'in_progress' | 'completed' | 'partially_completed';
  
  /** Week completion date */
  weekCompletedAt?: Date;
  
  /** User feedback on the week */
  weekFeedback?: string;
}

// =============================================================================
// WORKOUT ANALYTICS AND METRICS
// =============================================================================

/**
 * Workout performance metrics
 */
export interface WorkoutMetrics {
  /** Total workouts completed */
  totalWorkouts: number;
  
  /** Total training time */
  totalTrainingTime: number;
  
  /** Average workout duration */
  averageWorkoutDuration: number;
  
  /** Total volume lifted */
  totalVolumeLifted: number;
  
  /** Average RPE */
  averageRpe: number;
  
  /** Workout completion rate */
  completionRate: number;
  
  /** Most trained muscle groups */
  topMuscleGroups: { muscle: MuscleGroup; frequency: number }[];
  
  /** Favorite exercises */
  topExercises: { exercise: string; frequency: number }[];
  
  /** Training consistency (days per week) */
  trainingFrequency: number;
}

/**
 * Exercise performance tracking
 */
export interface ExerciseProgress {
  /** Exercise identifier */
  exerciseId: string;
  
  /** Exercise name */
  exerciseName: string;
  
  /** Performance history */
  history: {
    date: Date;
    weight: number;
    reps: number;
    volume: number;
    rpe?: number;
  }[];
  
  /** Personal records */
  personalRecords: {
    maxWeight: { weight: number; reps: number; date: Date };
    maxVolume: { volume: number; date: Date };
    maxReps: { weight: number; reps: number; date: Date };
  };
  
  /** Progress trend */
  trend: 'improving' | 'stable' | 'declining';
  
  /** Last performed date */
  lastPerformed: Date;
  
  /** Performance notes */
  notes?: string;
}

// =============================================================================
// WORKOUT PLANNING AND TEMPLATES
// =============================================================================

/**
 * Workout template for reuse
 */
export interface WorkoutTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Template category */
  category: 'strength' | 'hypertrophy' | 'endurance' | 'general' | 'custom';
  
  /** Target training focus */
  trainingFocus: TrainingFocus;
  
  /** Template exercises */
  exercises: PrescribedExercise[];
  
  /** Estimated duration */
  estimatedDuration: number;
  
  /** Difficulty level */
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  
  /** Equipment required */
  equipmentRequired: EquipmentType[];
  
  /** Template tags for searching */
  tags: string[];
  
  /** Template creator */
  createdBy?: string;
  
  /** Public template indicator */
  isPublic: boolean;
  
  /** Usage count */
  usageCount: number;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  updatedAt: Date;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if an object is a WorkoutDay
 */
export function isWorkoutDay(obj: any): obj is WorkoutDay {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.dayOfWeek === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.isRestDay === 'boolean' &&
    Array.isArray(obj.exercises)
  );
}

/**
 * Type guard to check if an object is a Workout (Neural format)
 */
export function isWorkout(obj: any): obj is Workout {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.dayOfWeek === 'string' &&
    typeof obj.isRestDay === 'boolean' &&
    Array.isArray(obj.exercises)
  );
}

/**
 * Type guard to check if an object is an Exercise
 */
export function isExercise(obj: any): obj is Exercise {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.primaryMuscles) &&
    Array.isArray(obj.equipment)
  );
}

/**
 * Type guard to check if an object is a PrescribedExercise
 */
export function isPrescribedExercise(obj: any): obj is PrescribedExercise {
  return (
    isExercise(obj) &&
    typeof obj.sets === 'number' &&
    typeof obj.reps === 'string'
  );
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert Neural Workout to WorkoutDay format
 */
export function convertWorkoutToWorkoutDay(workout: Workout): WorkoutDay {
  return {
    id: workout.id,
    dayOfWeek: workout.dayOfWeek,
    name: workout.name,
    isRestDay: workout.isRestDay,
    exercises: workout.exercises,
    estimatedDurationMinutes: workout.estimatedDuration,
    focus: workout.focus,
    trainingFocus: 'general_fitness', // Default value
    instructions: workout.instructions,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Convert WorkoutDay to Neural Workout format
 */
export function convertWorkoutDayToWorkout(workoutDay: WorkoutDay): Workout {
  return {
    id: workoutDay.id,
    name: workoutDay.name,
    dayOfWeek: workoutDay.dayOfWeek,
    isRestDay: workoutDay.isRestDay,
    focus: workoutDay.focus || '',
    estimatedDuration: workoutDay.estimatedDurationMinutes,
    exercises: workoutDay.exercises,
    instructions: workoutDay.instructions
  };
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default exercise template
 */
export const DEFAULT_EXERCISE: Exercise = {
  id: '',
  name: '',
  category: 'compound_movement',
  primaryMuscles: [],
  equipment: ['bodyweight'],
  tier: 'Accessory',
  isAnchorLift: false
};

/**
 * Default prescribed exercise template
 */
export const DEFAULT_PRESCRIBED_EXERCISE: PrescribedExercise = {
  ...DEFAULT_EXERCISE,
  sets: 3,
  reps: '8-12',
  restBetweenSets: '60-90 seconds'
};

/**
 * Default rest day workout
 */
export const DEFAULT_REST_DAY: WorkoutDay = {
  id: 'rest',
  dayOfWeek: 'Sunday',
  name: 'Rest Day',
  isRestDay: true,
  exercises: [],
  estimatedDurationMinutes: 0,
  trainingFocus: 'general_fitness',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Default workout template
 */
export const DEFAULT_WORKOUT_TEMPLATE: WorkoutTemplate = {
  id: '',
  name: 'New Workout Template',
  category: 'general',
  trainingFocus: 'general_fitness',
  exercises: [],
  estimatedDuration: 60,
  difficultyLevel: 'beginner',
  equipmentRequired: ['bodyweight'],
  tags: [],
  isPublic: false,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  // Core types
  DayOfWeek,
  ExerciseTier,
  WorkoutStatus,
  ExerciseCategory,
  MuscleGroup,
  EquipmentType,
  TrainingFocus,
  
  // Exercise types
  Exercise,
  PrescribedExercise,
  CompletedExercise,
  CompletedSet,
  
  // Workout types
  WorkoutDay,
  Workout,
  CompletedWorkout,
  
  // Week types
  TrainingWeek,
  CompletedTrainingWeek,
  
  // Analytics types
  WorkoutMetrics,
  ExerciseProgress,
  
  // Template types
  WorkoutTemplate
};
