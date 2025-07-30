/**
 * TypeScript interfaces for AI-generated training programs
 * These structures define the schema for LLM JSON output and database storage
 */

/**
 * Days of the week enum for consistency
 */
export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

/**
 * Common workout focus areas
 */
export type WorkoutFocus =
  | 'Upper Body'
  | 'Lower Body'
  | 'Push'
  | 'Pull'
  | 'Legs'
  | 'Full Body'
  | 'Cardio'
  | 'Core'
  | 'Arms'
  | 'Back'
  | 'Chest'
  | 'Shoulders'
  | 'Glutes'
  | 'Recovery/Mobility'
  | 'Sport-Specific'
  | 'Rest Day'
  | 'Lower Body Endurance'
  | 'Squat'
  | 'Bench'
  | 'Deadlift'
  | 'Overhead Press'

/**
 * Individual exercise detail within a workout
 */
export interface ExerciseDetail {
  /** Name of the exercise */
  name: string

  /** Number of sets to perform */
  sets: number

  /** Number of repetitions (can be a range like "8-12" or specific number) */
  reps: string | number

  /** Rest period between sets (e.g., "60-90 seconds", "2-3 minutes") */
  rest: string

  /** Optional tempo prescription (e.g., "3-1-2-1" for eccentric-pause-concentric-pause) */
  tempo?: string

  /** Optional Rate of Perceived Exertion (1-10 scale) */
  rpe?: number

  /** Optional exercise-specific notes or form cues */
  notes?: string

  /** Optional weight/load specification */
  weight?: string

  /** Optional exercise category for organization */
  category?: 'Compound' | 'Isolation' | 'Cardio' | 'Mobility' | 'Core' | 'Warm-up' | 'Cool-down' | 'Power'
}

/**
 * A single day's workout within a training week
 */
export interface WorkoutDay {
  /** Day of the week (1-7, Monday = 1) */
  dayOfWeek: DayOfWeek

  /** Optional workout focus/theme */
  focus?: WorkoutFocus

  /** Main exercises for the workout */
  exercises: ExerciseDetail[]

  /** Optional warm-up exercises */
  warmUp?: ExerciseDetail[]

  /** Optional cool-down exercises */
  coolDown?: ExerciseDetail[]

  /** Optional day-specific notes or instructions */
  notes?: string

  /** Estimated workout duration in minutes */
  estimatedDurationMinutes?: number

  /** Whether this is a rest day */
  isRestDay?: boolean
}

/**
 * A single training week within a phase
 */
export interface TrainingWeek {
  /** Week number within the overall program */
  weekNumber: number

  /** Array of workout days for this week */
  days: WorkoutDay[]

  /** Optional week-specific notes or focus */
  notes?: string

  /** Week number within the current phase */
  weekInPhase?: number

  /** Optional weekly goals or targets */
  weeklyGoals?: string[]

  /** Progression strategy for this week - how to progress from previous week */
  progressionStrategy?: string

  /** NEW: A specific tip from Neural for the week. */
  coachTip?: string
}

/**
 * A training phase (collection of weeks with similar focus)
 */
export interface TrainingPhase {
  /** Name/title of the phase */
  phaseName: string

  /** Duration of this phase in weeks */
  durationWeeks: number

  /** Array of training weeks in this phase */
  weeks: TrainingWeek[]

  /** Optional phase-specific notes or objectives */
  notes?: string

  /** Phase objectives or goals */
  objectives?: string[]

  /** Phase number within the overall program */
  phaseNumber?: number

  /** Overall progression strategy for this phase */
  progressionStrategy?: string
}

/**
 * Complete AI-generated training program
 */
export interface TrainingProgram {
  /** Program name/title */
  programName: string

  /** Detailed program description */
  description: string

  /** Total duration of the program in weeks */
  durationWeeksTotal: number

  /** Array of training phases */
  phases: TrainingPhase[]

  /** Optional general advice and guidelines */
  generalAdvice?: string

  /** NEW: A personalized introduction from Neural. */
  coachIntro?: string

  /** When the program was generated */
  generatedAt: Date | string

  /** AI model used for generation */
  aiModelUsed?: string

  /** Program difficulty level */
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced'

  /** Target training frequency per week */
  trainingFrequency?: number

  /** Required equipment */
  requiredEquipment?: string[]

  /** Program tags for categorization */
  tags?: string[]

  /** Version number for program updates */
  version?: string
}

/**
 * Database storage interface for training programs
 * Extends TrainingProgram with database-specific fields
 */
export interface StoredTrainingProgram extends TrainingProgram {
  /** Database ID */
  id: string

  /** User ID who owns this program */
  userId: string

  /** Database created timestamp */
  createdAt: Date | string

  /** Database updated timestamp */
  updatedAt: Date | string

  /** Whether this program is currently active for the user */
  isActive: boolean

  /** Program status */
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived'

  /** User's progress through the program */
  currentWeek?: number

  /** User's progress through the current phase */
  currentPhase?: number
}

/**
 * Workout completion tracking interface
 */
export interface WorkoutCompletion {
  /** Database ID */
  id: string

  /** User ID */
  userId: string

  /** Program ID this workout belongs to */
  programId: string

  /** Week number */
  weekNumber: number

  /** Day of week */
  dayOfWeek: DayOfWeek

  /** Date the workout was completed */
  completedAt: Date | string

  /** Exercises completed with actual performance */
  exercisesCompleted: ExerciseCompletion[]

  /** User notes about the workout */
  notes?: string

  /** Overall workout rating (1-10) */
  rating?: number

  /** Duration of actual workout in minutes */
  actualDurationMinutes?: number
}

/**
 * Individual exercise completion tracking
 */
export interface ExerciseCompletion {
  /** Exercise name */
  exerciseName: string

  /** Actual sets completed */
  setsCompleted: number

  /** Actual reps per set */
  repsCompleted: (number | string)[]

  /** Actual weight used */
  weightUsed?: string[]

  /** User notes for this exercise */
  notes?: string

  /** Whether the exercise was completed as prescribed */
  completedAsPrescribed: boolean
}

/**
 * Daily Readiness tracking interfaces
 */
export interface DailyReadinessData {
  /** Sleep quality rating */
  sleep: 'Poor' | 'Average' | 'Great'
  
  /** Energy/soreness level */
  energy: 'Sore/Tired' | 'Feeling Good' | 'Ready to Go'
  
  /** Date when readiness was recorded (YYYY-MM-DD format) */
  date: string
  
  /** Timestamp when readiness was recorded */
  timestamp: Date | string
}

/**
 * Props for Daily Readiness Modal component
 */
export interface DailyReadinessModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  
  /** Callback when modal is closed */
  onClose: () => void
  
  /** Callback when readiness data is submitted */
  onSubmit: (readiness: DailyReadinessData) => void
  
  /** Whether the form is being submitted */
  isSubmitting?: boolean
}

/**
 * Service for tracking daily readiness completion
 */
export interface DailyReadinessService {
  /** Check if user has completed readiness for today */
  hasCompletedToday: () => boolean
  
  /** Record that user has completed readiness for today */
  markCompletedToday: (readiness: DailyReadinessData) => void
  
  /** Get today's readiness data if available */
  getTodaysReadiness: () => DailyReadinessData | null
  
  /** Clear all stored readiness data */
  clearAll: () => void
}
