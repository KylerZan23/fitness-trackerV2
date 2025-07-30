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

  /** Optional exercise tier for enhanced programs */
  tier?: 'Tier_1' | 'Tier_2' | 'Tier_3'

  /** Optional muscle groups targeted by this exercise */
  muscleGroups?: string[]

  /** Optional weak point that this exercise targets */
  weakPointTarget?: string

  /** Optional stimulus-to-fatigue ratio */
  stimulusToFatigueRatio?: 'High' | 'Moderate' | 'Low'

  /** Optional scientific rationale for exercise selection */
  scientificRationale?: string
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

/**
 * Enhanced User Profiling Data Structures for Science-Based Training
 * These interfaces support advanced training periodization and individualization
 */

/**
 * Base user data interface consolidating existing profile information
 */
export interface UserData {
  /** Unique user identifier */
  id: string
  
  /** User's display name */
  name: string
  
  /** User's email address */
  email: string
  
  /** User's age in years */
  age?: number
  
  /** User's height in centimeters */
  height_cm?: number
  
  /** User's weight in kilograms */
  weight_kg?: number
  
  /** Primary fitness goals */
  fitness_goals?: string
  
  /** Primary training focus area */
  primary_training_focus?: string
  
  /** Training experience level (beginner/intermediate/advanced) */
  experience_level?: string
  
  /** Preferred weight unit for display */
  weight_unit: 'kg' | 'lbs'
  
  /** Current 1RM estimates for major lifts */
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
  
  /** Available training equipment */
  equipment?: string[]
  
  /** Training frequency per week */
  trainingFrequencyDays?: number
  
  /** Preferred session duration */
  sessionDuration?: string
  
  /** Exercise preferences and limitations */
  exercisePreferences?: string
  injuriesLimitations?: string
}

/**
 * Volume parameters for individualized training load management
 * Based on training age, recovery capacity, and stress levels
 */
export interface VolumeParameters {
  /** 
   * Training age in years - influences volume tolerance and adaptation rate
   * Beginners: 0-2 years, Intermediate: 2-5 years, Advanced: 5+ years
   */
  trainingAge: number
  
  /** 
   * Recovery capacity rating (1-10 scale)
   * Factors: sleep quality, nutrition, stress levels, age
   * 1-3: Poor recovery, 4-6: Average recovery, 7-10: Excellent recovery
   */
  recoveryCapacity: number
  
  /** 
   * Volume tolerance coefficient (0.5-2.0)
   * Individual response to training volume
   * <1.0: Low tolerance, 1.0: Average, >1.0: High tolerance
   */
  volumeTolerance: number
  
  /** 
   * Current life stress level (1-10 scale)
   * Influences recovery and volume recommendations
   * 1-3: Low stress, 4-6: Moderate stress, 7-10: High stress
   */
  stressLevel: number
}

/**
 * Volume landmarks for each muscle group based on scientific literature
 * MEV = Minimum Effective Volume, MAV = Maximum Adaptive Volume, MRV = Maximum Recoverable Volume
 */
export interface VolumeLandmarks {
  /** 
   * Minimum Effective Volume - minimum weekly sets needed for muscle growth
   * Based on muscle group size and recovery characteristics
   */
  MEV: number
  
  /** 
   * Maximum Adaptive Volume - optimal weekly sets for maximum gains
   * Sweet spot between stimulus and recovery demands
   */
  MAV: number
  
  /** 
   * Maximum Recoverable Volume - maximum weekly sets before negative returns
   * Beyond this point, recovery becomes impaired
   */
  MRV: number
}

/**
 * Individual recovery profile for training load management
 * Tracks fatigue accumulation and recovery patterns
 */
export interface RecoveryProfile {
  /** 
   * Fatigue threshold (1-10 scale)
   * Point at which performance significantly decreases
   * Individual variation in fatigue tolerance
   */
  fatigueThreshold: number
  
  /** 
   * Recovery rate coefficient (0.5-2.0)
   * How quickly the individual recovers from training stress
   * <1.0: Slow recovery, 1.0: Average, >1.0: Fast recovery
   */
  recoveryRate: number
  
  /** 
   * Sleep quality assessment (1-10 scale)
   * Critical factor in recovery and adaptation
   * Influences volume recommendations and deload timing
   */
  sleepQuality: number
  
  /** 
   * Preferred recovery modalities
   * Methods that work best for this individual
   */
  recoveryModalities?: string[]
}

/**
 * Weak point analysis for targeted training interventions
 * Identifies strength imbalances and corrective strategies
 */
export interface WeakPointAnalysis {
  /** 
   * Strength ratios between major lifts
   * Used to identify imbalances and weak points
   * Format: { 'squat:deadlift': 0.85, 'bench:squat': 0.65, etc. }
   */
  strengthRatios: Record<string, number>
  
  /** 
   * Identified weak points requiring targeted attention
   * Could be muscle groups, movement patterns, or specific lifts
   */
  weakPoints: string[]
  
  /** 
   * Recommended corrective exercises for each weak point
   * Specific exercises to address identified deficiencies
   */
  correctionExercises: Record<string, string[]>
  
  /** 
   * Priority level for each weak point (1-10 scale)
   * Determines focus allocation in program design
   */
  weakPointPriority?: Record<string, number>
}

/**
 * RPE (Rate of Perceived Exertion) profile for autoregulation
 * Manages training intensity based on daily readiness and fatigue
 */
export interface RPEProfile {
  /** 
   * Target session RPE ranges for different training phases
   * Format: { 'hypertrophy': [6, 8], 'strength': [7, 9], 'peaking': [8, 10] }
   */
  sessionRPETargets: Record<string, [number, number]>
  
  /** 
   * Autoregulation rules based on daily readiness
   * Adjusts prescribed loads based on subjective readiness
   */
  autoregulationRules: {
    /** RPE adjustment when feeling great (+1 to prescribed RPE) */
    readyToGo: number
    /** RPE adjustment when feeling average (no change) */
    feelingGood: number
    /** RPE adjustment when feeling poor (-1 to prescribed RPE) */
    soreTired: number
  }
  
  /** 
   * Individual RPE calibration
   * How accurately the user estimates RPE vs actual performance
   */
  rpeAccuracy?: number
  
  /** 
   * Exercise-specific RPE preferences
   * Some exercises may require different RPE targets
   */
  exerciseRPEPreferences?: Record<string, [number, number]>
}

/**
 * Periodization model for long-term training planning
 * Defines the overall structure and progression strategy
 */
export interface PeriodizationModel {
  /** 
   * Type of periodization model being used
   * Each model has different characteristics and applications
   */
  type: 'linear' | 'undulating' | 'block' | 'conjugate' | 'autoregulated'
  
  /** 
   * Training phases with their duration and focus
   * Sequential phases building toward specific adaptations
   */
  phases: {
    /** Phase name/identifier */
    name: string
    /** Duration in weeks */
    duration: number
    /** Primary adaptation focus */
    focus: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'deload'
    /** Intensity range for this phase */
    intensityRange: [number, number]
    /** Volume multiplier relative to baseline */
    volumeMultiplier: number
  }[]
  
  /** 
   * Specific adaptation targets for each training quality
   * Measurable goals for different aspects of fitness
   */
  adaptationTargets: {
    /** Strength improvement targets (% increase) */
    strength?: Record<string, number>
    /** Hypertrophy targets (muscle mass increase) */
    hypertrophy?: Record<string, number>
    /** Power development targets */
    power?: Record<string, number>
    /** Endurance improvement targets */
    endurance?: Record<string, number>
  }
  
  /** 
   * Deload frequency and structure
   * Planned recovery periods to prevent overreaching
   */
  deloadProtocol: {
    /** How often deloads occur (every X weeks) */
    frequency: number
    /** Type of deload (volume reduction, intensity reduction, etc.) */
    type: 'volume' | 'intensity' | 'complete'
    /** Magnitude of reduction (e.g., 40% volume reduction) */
    reductionPercentage: number
  }
}

/**
 * Enhanced user data interface extending base UserData with advanced profiling
 * Combines all science-based training parameters for individualized programming
 */
export interface EnhancedUserData extends UserData {
  /** 
   * Volume management parameters
   * Determines appropriate training loads and progression rates
   */
  volumeParameters: VolumeParameters
  
  /** 
   * Volume landmarks for major muscle groups
   * Muscle-specific training volume guidelines
   */
  volumeLandmarks: Record<string, VolumeLandmarks>
  
  /** 
   * Individual recovery characteristics
   * Guides rest periods, deload timing, and volume adjustments
   */
  recoveryProfile: RecoveryProfile
  
  /** 
   * Weak point analysis results
   * Identifies areas needing targeted attention
   */
  weakPointAnalysis: WeakPointAnalysis
  
  /** 
   * RPE-based autoregulation settings
   * Enables daily training adjustments based on readiness
   */
  rpeProfile: RPEProfile
  
  /** 
   * Long-term periodization strategy
   * Overall training plan structure and progression
   */
  periodizationModel: PeriodizationModel
  
  /** 
   * Training history metrics
   * Past performance data for informed decision making
   */
  trainingHistory?: {
    /** Total training months/years */
    totalTrainingTime: number
    /** Previous injuries or setbacks */
    injuryHistory: string[]
    /** Best lifts achieved historically */
    peakPerformances: Record<string, number>
    /** Response to different training styles */
    trainingResponseProfile: Record<string, 'poor' | 'average' | 'excellent'>
  }
  
  /** 
   * Lifestyle factors affecting training
   * External factors that influence recovery and performance
   */
  lifestyleFactors?: {
    /** Occupation type (sedentary, active, physical) */
    occupationType: 'sedentary' | 'active' | 'physical'
    /** Average sleep hours per night */
    averageSleepHours: number
    /** Stress management practices */
    stressManagement: string[]
    /** Nutritional adherence level */
    nutritionAdherence: number
  }
}
