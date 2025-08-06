/**
 * Legacy Program Types for Backward Compatibility
 * 
 * These types maintain compatibility with existing imports while the codebase
 * transitions to the new Neural type system in src/types/neural.ts
 */

/**
 * Day of the week enumeration
 */
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/**
 * Exercise tier for importance classification
 */
export type ExerciseTier = 'Anchor' | 'Primary' | 'Secondary' | 'Accessory';

/**
 * Exercise detail interface (legacy)
 */
export interface ExerciseDetail {
  /** Exercise name */
  name: string;
  
  /** Exercise importance tier */
  tier: ExerciseTier;
  
  /** Number of sets */
  sets: number;
  
  /** Rep range or specific reps */
  reps: string;
  
  /** Rate of Perceived Exertion */
  rpe: string;
  
  /** Rest period between sets */
  rest: string;
  
  /** Optional form notes */
  notes?: string;
  
  /** Whether this is an anchor lift */
  isAnchorLift: boolean;
}

/**
 * Workout day structure (legacy)
 */
export interface WorkoutDay {
  /** Day of the week */
  dayOfWeek: DayOfWeek;
  
  /** Whether this is a rest day */
  isRestDay: boolean;
  
  /** Array of exercises for this day */
  exercises: ExerciseDetail[];
  
  /** Estimated workout duration */
  estimatedDuration?: string;
  
  /** Workout focus (e.g., "Upper Body - Push", "Lower Body") */
  focus?: string;
}

/**
 * Training week structure (legacy)
 */
export interface TrainingWeek {
  /** Week number in the program */
  weekNumber: number;
  
  /** Week number within the current phase */
  phaseWeek: number;
  
  /** Progression strategy for this week */
  progressionStrategy: string;
  
  /** Training intensity focus */
  intensityFocus: string;
  
  /** Array of 7 days (workout and rest days) */
  days: WorkoutDay[];
  
  /** Weekly volume classification */
  weeklyVolumeLandmark?: string;
}

/**
 * Training phase structure (legacy)
 */
export interface TrainingPhase {
  /** Phase name */
  phaseName: string;
  
  /** Phase type */
  phaseType: 'Accumulation' | 'Intensification' | 'Realization' | 'Deload';
  
  /** Phase duration in weeks */
  durationWeeks: number;
  
  /** Primary goal of this phase */
  primaryGoal: string;
  
  /** Array of training weeks in this phase */
  weeks: TrainingWeek[];
}

/**
 * Complete training program structure (legacy)
 */
export interface TrainingProgram {
  /** Program name */
  programName: string;
  
  /** Program description */
  description: string;
  
  /** Total program duration in weeks */
  durationWeeksTotal: number;
  
  /** AI coach introduction */
  coachIntro: string;
  
  /** General training advice */
  generalAdvice: string;
  
  /** Periodization model used */
  periodizationModel: string;
  
  /** Array of training phases */
  phases: TrainingPhase[];
  
  /** Volume progression strategy */
  totalVolumeProgression?: string;
  
  /** Designated anchor lifts */
  anchorLifts?: string[];
  
  /** Program generation timestamp */
  generatedAt?: string;
  
  /** AI model used for generation */
  aiModelUsed?: string;
}

/**
 * User profile for program generation (legacy)
 */
export interface UserProfileForGeneration {
  /** User ID */
  id: string;
  
  /** User's name */
  name: string;
  
  /** Email address */
  email: string;
  
  /** Age */
  age: number;
  
  /** Weight */
  weight?: number;
  
  /** Weight unit */
  weight_unit: 'kg' | 'lbs';
  
  /** Experience level */
  experience_level: string;
  
  /** Primary training focus */
  primary_training_focus: string;
  
  /** Training frequency per week */
  training_frequency_days: number;
  
  /** Preferred session duration */
  session_duration: string;
  
  /** Available equipment */
  equipment: string[];
  
  /** Injury history or limitations */
  injuries_limitations?: string;
  
  /** Exercise preferences */
  exercise_preferences?: string;
  
  /** Personal records */
  squat_1rm_estimate?: number;
  bench_press_1rm_estimate?: number;
  deadlift_1rm_estimate?: number;
  overhead_press_1rm_estimate?: number;
  
  /** Strength assessment type */
  strength_assessment_type?: string;
}

/**
 * Daily readiness data for adaptive programming (legacy)
 */
export interface DailyReadinessData {
  /** Date of readiness assessment */
  date: string;
  
  /** Energy level (1-10) */
  energyLevel: number;
  
  /** Sleep quality (1-10) */
  sleepQuality: number;
  
  /** Hours of sleep */
  sleepHours: number;
  
  /** Stress level (1-10) */
  stressLevel: number;
  
  /** Motivation level (1-10) */
  motivationLevel: number;
  
  /** Any soreness or pain */
  soreness?: string;
  
  /** Previous day's training load */
  previousTrainingLoad?: number;
  
  /** Readiness score (calculated) */
  readinessScore: number;
}

/**
 * Program scaffold for generation pipeline (legacy)
 */
export interface ProgramScaffold {
  /** Program name */
  programName: string;
  
  /** Program description */
  description: string;
  
  /** Total duration in weeks */
  durationWeeksTotal: number;
  
  /** Coach introduction */
  coachIntro: string;
  
  /** General advice */
  generalAdvice: string;
  
  /** Periodization approach */
  periodizationModel: string;
  
  /** Phase configurations */
  phases: Array<{
    phaseName: string;
    phaseType: string;
    durationWeeks: number;
    primaryGoal: string;
  }>;
}

/**
 * Weekly volume landmarks for progression (legacy)
 */
export type WeeklyVolumeLandmark = 'MEV' | 'MAV' | 'MRV' | 'Deload';

/**
 * Progression strategies (legacy)
 */
export type ProgressionStrategy = 'Linear' | 'Double Progression' | 'Reverse Pyramid' | 'Wave Loading' | 'Autoregulated';

/**
 * Helper function to convert legacy types to Neural types
 */
export function convertToNeuralTypes(legacyProgram: TrainingProgram) {
  // This function can be implemented to help migrate from legacy to Neural types
  // For now, it's a placeholder to maintain compatibility
  console.warn('Legacy program type detected. Consider migrating to Neural types in src/types/neural.ts');
  return legacyProgram;
}

/**
 * Type guards for legacy types
 */
export function isWorkoutDay(obj: any): obj is WorkoutDay {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.dayOfWeek === 'string' &&
    typeof obj.isRestDay === 'boolean' &&
    Array.isArray(obj.exercises)
  );
}

export function isTrainingProgram(obj: any): obj is TrainingProgram {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.programName === 'string' &&
    Array.isArray(obj.phases)
  );
}

/**
 * Default values for legacy compatibility
 */
export const DEFAULT_WORKOUT_DAY: WorkoutDay = {
  dayOfWeek: 'Monday',
  isRestDay: true,
  exercises: [],
  estimatedDuration: '60 minutes'
};

export const DEFAULT_EXERCISE_DETAIL: ExerciseDetail = {
  name: 'Rest',
  tier: 'Accessory',
  sets: 0,
  reps: '0',
  rpe: '0',
  rest: '0',
  isAnchorLift: false
};
