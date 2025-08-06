/**
 * Modern Onboarding Type System
 * 
 * This file provides comprehensive type definitions for the onboarding flow,
 * integrating with the Neural type system and using modern TypeScript patterns
 * including branded types, conditional types, and advanced validation.
 */

import { z } from 'zod'
import type { OnboardingData as NeuralOnboardingData } from './neural'

// ===== BRANDED TYPES FOR TYPE SAFETY =====

/**
 * Branded types for stronger type safety
 */
declare const __brand: unique symbol
type Brand<K, T> = K & { [__brand]: T }

export type UserId = Brand<string, 'UserId'>
export type QuestionId = Brand<string, 'QuestionId'>
export type CategoryId = Brand<string, 'CategoryId'>

// ===== CORE ENUMS AND LITERALS =====

/**
 * Fitness goals with detailed categorization
 */
export const FitnessGoals = {
  // Muscle building goals
  MUSCLE_GENERAL: 'Muscle Gain: General',
  MUSCLE_HYPERTROPHY: 'Muscle Gain: Hypertrophy Focus',
  
  // Strength goals
  STRENGTH_POWERLIFTING: 'Strength Gain: Powerlifting Peak',
  STRENGTH_GENERAL: 'Strength Gain: General',
  
  // Endurance and cardio
  ENDURANCE_GYM: 'Endurance Improvement: Gym Cardio',
  
  // Sport-specific
  SPORT_EXPLOSIVE: 'Sport-Specific S&C: Explosive Power',
  
  // General fitness
  FITNESS_FOUNDATION: 'General Fitness: Foundational Strength',
  
  // Body composition
  WEIGHT_LOSS: 'Weight Loss: Gym Based',
  RECOMPOSITION: 'Recomposition: Lean Mass & Fat Loss',
  
  // Specialized
  BODYWEIGHT: 'Bodyweight Mastery',
} as const

export type FitnessGoal = typeof FitnessGoals[keyof typeof FitnessGoals]

/**
 * Equipment access levels
 */
export const EquipmentTypes = {
  FULL_GYM: 'Full Gym (Barbells, Racks, Machines)',
  DUMBBELLS: 'Dumbbells',
  KETTLEBELLS: 'Kettlebells',
  RESISTANCE_BANDS: 'Resistance Bands',
  BODYWEIGHT: 'Bodyweight Only',
  CARDIO_MACHINES: 'Cardio Machines (Treadmill, Bike, Rower, Elliptical)',
} as const

export type EquipmentType = typeof EquipmentTypes[keyof typeof EquipmentTypes]

/**
 * Experience levels with detailed descriptions
 */
export const ExperienceLevels = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate', 
  ADVANCED: 'advanced',
} as const

export type ExperienceLevel = typeof ExperienceLevels[keyof typeof ExperienceLevels]

/**
 * Session durations in user-friendly format
 */
export const SessionDurations = {
  SHORT: '30-45 minutes',
  MEDIUM: '45-60 minutes', 
  LONG: '60-75 minutes',
  EXTENDED: '75+ minutes',
} as const

export type SessionDuration = typeof SessionDurations[keyof typeof SessionDurations]

/**
 * Weight units
 */
export const WeightUnits = {
  METRIC: 'kg',
  IMPERIAL: 'lbs',
} as const

export type WeightUnit = typeof WeightUnits[keyof typeof WeightUnits]

/**
 * Question categories for organization
 */
export const QuestionCategories = {
  PROFILE: 'profile',
  TRAINING: 'training', 
  STRENGTH: 'strength',
  PREFERENCES: 'preferences',
} as const

export type QuestionCategory = typeof QuestionCategories[keyof typeof QuestionCategories]

// ===== VALIDATION SCHEMAS =====

/**
 * Comprehensive Zod schemas for runtime validation
 */
export const OnboardingSchemas = {
  // Basic field validations
  fitnessGoal: z.enum(Object.values(FitnessGoals) as [FitnessGoal, ...FitnessGoal[]]),
  experienceLevel: z.enum(Object.values(ExperienceLevels) as [ExperienceLevel, ...ExperienceLevel[]]),
  sessionDuration: z.enum(Object.values(SessionDurations) as [SessionDuration, ...SessionDuration[]]),
  weightUnit: z.enum(Object.values(WeightUnits) as [WeightUnit, ...WeightUnit[]]),
  equipmentList: z.array(z.enum(Object.values(EquipmentTypes) as [EquipmentType, ...EquipmentType[]])),
  
  // Numeric validations
  trainingDays: z.number().int().min(2, 'Minimum 2 days per week').max(7, 'Maximum 7 days per week'),
  oneRepMax: z.number().positive('Must be a positive number').max(1000, 'Value seems unrealistic'),
  
  // String validations
  textField: z.string().max(500, 'Text too long'),
  optionalText: z.string().max(500, 'Text too long').optional(),
  
  // Strength assessment
  strengthAssessment: z.enum(['actual_1rm', 'estimated_1rm', 'unsure']),
} as const

// ===== CORE DATA INTERFACES =====

/**
 * Personal records for strength assessment
 */
export interface PersonalRecords {
  /** Squat 1RM in user's preferred unit */
  squat?: number
  /** Bench press 1RM in user's preferred unit */
  bench?: number
  /** Deadlift 1RM in user's preferred unit */
  deadlift?: number
  /** Overhead press 1RM in user's preferred unit */
  overheadPress?: number
}

/**
 * Additional user context and preferences
 */
export interface AdditionalInfo {
  /** Previous injury history or limitations */
  injuryHistory?: string
  /** Exercise preferences or dislikes */
  exercisePreferences?: string
  /** Sport-specific details if applicable */
  sportSpecificDetails?: string
  /** Any additional notes or requirements */
  additionalNotes?: string
}

/**
 * Complete onboarding data structure
 */
export interface OnboardingData {
  // Core profile information
  primaryGoal: FitnessGoal
  experienceLevel: ExperienceLevel
  weightUnit: WeightUnit
  
  // Training preferences
  trainingFrequencyDays: number
  sessionDuration: SessionDuration
  equipment: EquipmentType[]
  
  // Strength assessment (optional)
  personalRecords?: PersonalRecords
  strengthAssessmentType?: 'actual_1rm' | 'estimated_1rm' | 'unsure'
  
  // Additional context (optional)
  additionalInfo?: AdditionalInfo
}

// ===== QUESTION FLOW TYPES =====

/**
 * Individual question component props
 */
export interface QuestionProps<T = any> {
  /** Current value for this question */
  value: T
  /** Update handler */
  onChange: (value: T) => void
  /** Validation error message */
  error?: string
  /** User profile context */
  profile?: UserProfile
  /** All current answers for conditional logic */
  allAnswers?: Partial<OnboardingFormData>
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Question definition with full configuration
 */
export interface Question<T = any> {
  /** Unique question identifier */
  id: QuestionId
  /** Display title */
  title: string
  /** Optional description or help text */
  description?: string
  /** React component for rendering */
  component: React.ComponentType<QuestionProps<T>>
  /** Zod validation schema */
  validation: z.ZodSchema<T>
  /** Whether this question is optional */
  isOptional?: boolean
  /** Conditional display logic */
  shouldShow?: (answers: Partial<OnboardingFormData>) => boolean
  /** Question category */
  category: QuestionCategory
  /** Display order */
  order: number
  /** Additional metadata */
  metadata?: {
    /** Icon name or component */
    icon?: string
    /** Color theme */
    theme?: string
    /** Help URL or documentation */
    helpUrl?: string
    /** Accessibility information */
    a11y?: {
      ariaLabel?: string
      description?: string
    }
  }
}

/**
 * Progress tracking information
 */
export interface ProgressInfo {
  /** Current question index */
  current: number
  /** Total questions to show */
  total: number
  /** Completion percentage */
  percentage: number
  /** Questions completed */
  completed: number
  /** Questions remaining */
  remaining: number
  /** Estimated time remaining (minutes) */
  estimatedTimeRemaining?: number
}

/**
 * Validation result for questions
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Field-specific errors */
  fieldErrors?: Record<string, string>
  /** Warnings (non-blocking) */
  warnings?: string[]
}

// ===== FLOW STATE MANAGEMENT =====

/**
 * Complete onboarding form data (union of all possible fields)
 */
export type OnboardingFormData = OnboardingData & {
  // Legacy support fields
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
  injuriesLimitations?: string
  exercisePreferences?: string
  sportSpecificDetails?: string
}

/**
 * Onboarding flow state
 */
export interface OnboardingFlowState {
  /** Current question index */
  currentQuestionIndex: number
  /** All user answers */
  answers: Partial<OnboardingFormData>
  /** Questions to display (filtered by conditions) */
  questionsToShow: Question[]
  /** Progress information */
  progress: ProgressInfo
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error?: string
  /** Whether flow is complete */
  isComplete: boolean
  /** Validation state */
  validation: {
    /** Current question validation */
    current?: ValidationResult
    /** Overall form validation */
    overall?: ValidationResult
  }
}

/**
 * User profile for context
 */
export interface UserProfile {
  id: UserId
  name: string
  email: string
  weight_unit?: WeightUnit
  onboarding_completed?: boolean
  onboarding_responses?: OnboardingFormData
  created_at?: string
  updated_at?: string
}

// ===== CONDITIONAL TYPES AND UTILITIES =====

/**
 * Conditional question visibility logic
 */
export interface QuestionConditions {
  [questionId: string]: (answers: Partial<OnboardingFormData>) => boolean
}

/**
 * Question dependency mapping
 */
export interface QuestionDependencies {
  [questionId: string]: {
    /** Questions that must be answered first */
    requires?: QuestionId[]
    /** Questions that this enables */
    enables?: QuestionId[]
    /** Questions that conflict with this */
    conflicts?: QuestionId[]
  }
}

// ===== CONVERSION AND INTEGRATION TYPES =====

/**
 * Convert legacy onboarding data to Neural format
 */
export type OnboardingToNeural = (data: OnboardingFormData) => NeuralOnboardingData

/**
 * Onboarding completion result
 */
export interface OnboardingCompletionResult {
  /** Whether completion was successful */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Generated user profile */
  profile?: UserProfile
  /** Neural-formatted data */
  neuralData?: NeuralOnboardingData
  /** Next steps for the user */
  nextSteps?: {
    /** Redirect URL */
    redirectTo?: string
    /** Actions to take */
    actions?: string[]
    /** Additional context */
    metadata?: Record<string, any>
  }
}

// ===== TYPE UTILITIES =====

/**
 * Extract question value type from question definition
 */
export type QuestionValueType<T extends Question> = T extends Question<infer U> ? U : never

/**
 * Extract all required question IDs
 */
export type RequiredQuestionIds<T extends readonly Question[]> = {
  [K in keyof T]: T[K] extends Question & { isOptional?: false | undefined } 
    ? T[K]['id'] 
    : never
}[number]

/**
 * Extract all optional question IDs
 */
export type OptionalQuestionIds<T extends readonly Question[]> = {
  [K in keyof T]: T[K] extends Question & { isOptional: true } 
    ? T[K]['id'] 
    : never
}[number]

/**
 * Type-safe question registry
 */
export interface QuestionRegistry<T extends readonly Question[] = readonly Question[]> {
  /** All questions */
  questions: T
  /** Question lookup by ID */
  getById: (id: QuestionId) => Question | undefined
  /** Questions by category */
  getByCategory: (category: QuestionCategory) => Question[]
  /** Validate question flow */
  validate: (answers: Partial<OnboardingFormData>) => ValidationResult
}

// ===== BRANDED TYPE CONSTRUCTORS =====

/**
 * Create branded types safely
 */
export const createUserId = (id: string): UserId => id as UserId
export const createQuestionId = (id: string): QuestionId => id as QuestionId
export const createCategoryId = (id: string): CategoryId => id as CategoryId

// ===== TYPE GUARDS =====

/**
 * Runtime type guards for onboarding types
 */
export const OnboardingTypeGuards = {
  isValidFitnessGoal: (value: any): value is FitnessGoal => 
    typeof value === 'string' && Object.values(FitnessGoals).includes(value as FitnessGoal),
    
  isValidExperienceLevel: (value: any): value is ExperienceLevel =>
    typeof value === 'string' && Object.values(ExperienceLevels).includes(value as ExperienceLevel),
    
  isCompleteOnboardingData: (data: any): data is OnboardingData => {
    const schema = z.object({
      primaryGoal: OnboardingSchemas.fitnessGoal,
      experienceLevel: OnboardingSchemas.experienceLevel,
      weightUnit: OnboardingSchemas.weightUnit,
      trainingFrequencyDays: OnboardingSchemas.trainingDays,
      sessionDuration: OnboardingSchemas.sessionDuration,
      equipment: OnboardingSchemas.equipmentList,
    })
    return schema.safeParse(data).success
  },
  
  isValidQuestionId: (value: any): value is QuestionId =>
    typeof value === 'string' && value.length > 0,
    
  isValidUserId: (value: any): value is UserId =>
    typeof value === 'string' && value.length > 0,
} as const

// ===== HELPER UTILITIES =====

/**
 * Utility functions for onboarding data manipulation
 */
export const OnboardingUtils = {
  /**
   * Convert onboarding data to Neural format
   */
  toNeuralFormat: (data: OnboardingFormData): NeuralOnboardingData => {
    // Map fitness goals to Neural format
    const goalMapping: Record<FitnessGoal, NeuralOnboardingData['primaryFocus']> = {
      [FitnessGoals.MUSCLE_GENERAL]: 'hypertrophy',
      [FitnessGoals.MUSCLE_HYPERTROPHY]: 'hypertrophy',
      [FitnessGoals.STRENGTH_POWERLIFTING]: 'strength',
      [FitnessGoals.STRENGTH_GENERAL]: 'strength',
      [FitnessGoals.ENDURANCE_GYM]: 'general_fitness',
      [FitnessGoals.SPORT_EXPLOSIVE]: 'strength',
      [FitnessGoals.FITNESS_FOUNDATION]: 'general_fitness',
      [FitnessGoals.WEIGHT_LOSS]: 'general_fitness',
      [FitnessGoals.RECOMPOSITION]: 'general_fitness',
      [FitnessGoals.BODYWEIGHT]: 'general_fitness',
    }

    // Map session durations to minutes
    const durationMapping: Record<SessionDuration, 30 | 45 | 60 | 90> = {
      [SessionDurations.SHORT]: 45,
      [SessionDurations.MEDIUM]: 60,
      [SessionDurations.LONG]: 60, // Map to 60 minutes for Neural compatibility
      [SessionDurations.EXTENDED]: 90,
    }

    // Map equipment access
    const hasFullGym = data.equipment?.includes(EquipmentTypes.FULL_GYM)
    const hasDumbbells = data.equipment?.includes(EquipmentTypes.DUMBBELLS)
    const equipmentAccess: NeuralOnboardingData['equipmentAccess'] = 
      hasFullGym ? 'full_gym' : hasDumbbells ? 'dumbbells_only' : 'bodyweight_only'

    return {
      primaryFocus: goalMapping[data.primaryGoal] || 'general_fitness',
      experienceLevel: data.experienceLevel as NeuralOnboardingData['experienceLevel'],
      sessionDuration: durationMapping[data.sessionDuration] || 60,
      equipmentAccess,
      personalRecords: data.personalRecords ? {
        squat: data.personalRecords.squat || data.squat1RMEstimate,
        bench: data.personalRecords.bench || data.benchPress1RMEstimate,
        deadlift: data.personalRecords.deadlift || data.deadlift1RMEstimate,
      } : undefined,
      additionalInfo: {
        injuryHistory: data.additionalInfo?.injuryHistory || data.injuriesLimitations,
        preferences: data.additionalInfo?.exercisePreferences ? [data.additionalInfo.exercisePreferences] : undefined,
        availableDays: data.trainingFrequencyDays,
      },
    }
  },

  /**
   * Calculate completion percentage
   */
  calculateProgress: (answers: Partial<OnboardingFormData>, totalQuestions: number): ProgressInfo => {
    const answeredCount = Object.keys(answers).filter(key => answers[key as keyof OnboardingFormData] !== undefined).length
    const percentage = Math.round((answeredCount / totalQuestions) * 100)
    
    return {
      current: answeredCount,
      total: totalQuestions,
      percentage,
      completed: answeredCount,
      remaining: totalQuestions - answeredCount,
      estimatedTimeRemaining: (totalQuestions - answeredCount) * 0.5, // 30 seconds per question
    }
  },

  /**
   * Validate onboarding data
   */
  validate: (data: Partial<OnboardingFormData>): ValidationResult => {
    const requiredFields: (keyof OnboardingFormData)[] = [
      'primaryGoal',
      'experienceLevel', 
      'weightUnit',
      'trainingFrequencyDays',
      'sessionDuration',
      'equipment',
    ]

    const missing = requiredFields.filter(field => !data[field])
    
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        fieldErrors: missing.reduce((acc, field) => ({
          ...acc,
          [field]: 'This field is required'
        }), {})
      }
    }

    return { isValid: true }
  },

  /**
   * Get question dependencies
   */
  getDependencies: (questionId: QuestionId): QuestionId[] => {
    // Define question dependencies
    const dependencies: Record<string, QuestionId[]> = {
      'sportSpecificDetails': [createQuestionId('primaryGoal')],
      'squat1RMEstimate': [createQuestionId('strengthAssessmentType')],
      'benchPress1RMEstimate': [createQuestionId('strengthAssessmentType')],
      'deadlift1RMEstimate': [createQuestionId('strengthAssessmentType')],
    }
    
    return dependencies[questionId] || []
  },
} as const

// ===== EXPORT ALIASES FOR COMPATIBILITY =====

/**
 * Legacy type aliases for backward compatibility
 */
export type { OnboardingData as LegacyOnboardingData }
export type { FitnessGoal as LegacyFitnessGoal }
export type { EquipmentType as LegacyEquipmentType }

/**
 * Re-export commonly used types (already exported above)
 */

/**
 * Default export with all utilities
 */
export default {
  Schemas: OnboardingSchemas,
  TypeGuards: OnboardingTypeGuards,
  Utils: OnboardingUtils,
  Constants: {
    FitnessGoals,
    EquipmentTypes,
    ExperienceLevels,
    SessionDurations,
    WeightUnits,
    QuestionCategories,
  },
}
