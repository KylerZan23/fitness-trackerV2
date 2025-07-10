/**
 * Onboarding questionnaire data types for the AI Training Program Generator
 */

// Equipment types that users can select from
export type EquipmentType =
  | 'Full Gym (Barbells, Racks, Machines)'
  | 'Dumbbells'
  | 'Kettlebells'
  | 'Resistance Bands'
  | 'Bodyweight Only'
  | 'Cardio Machines (Treadmill, Bike, Rower, Elliptical)'

// Primary fitness goals - specialized, gym-focused options
export type FitnessGoal =
  | 'Muscle Gain: General'
  | 'Muscle Gain: Hypertrophy Focus'
  | 'Strength Gain: Powerlifting Peak'
  | 'Strength Gain: General'
  | 'Endurance Improvement: Gym Cardio'
  | 'Sport-Specific S&C: Explosive Power'
  | 'General Fitness: Foundational Strength'
  | 'Weight Loss: Gym Based'
  | 'Bodyweight Mastery'
  | 'Recomposition: Lean Mass & Fat Loss'

// Session duration options
export type SessionDuration = '30-45 minutes' | '45-60 minutes' | '60-75 minutes' | '75+ minutes'

// Weight unit options
export type WeightUnit = 'kg' | 'lbs'

/**
 * Interface representing the user's responses to the onboarding questionnaire
 * Note: primary_training_focus and experience_level are excluded as they already exist in UserProfile
 */
export interface OnboardingData {
  /** Primary fitness goal selected by the user */
  primaryGoal: FitnessGoal

  /** Optional secondary fitness goal */
  secondaryGoal?: FitnessGoal

  /** Sport-specific details if "Sport-Specific" goal is selected */
  sportSpecificDetails?: string

  /** Number of training days per week (2-7) */
  trainingFrequencyDays: number

  /** Preferred session duration */
  sessionDuration: SessionDuration

  /** Array of available equipment */
  equipment: EquipmentType[]

  /** User's preferred weight unit for display and input */
  weightUnit: WeightUnit

  /** Optional exercise preferences or dislikes */
  exercisePreferences?: string

  /** Optional injury or limitation notes */
  injuriesLimitations?: string

  /** Optional estimated 1 Rep Max for Squat, in user's preferred weight unit */
  squat1RMEstimate?: number

  /** Optional estimated 1 Rep Max for Bench Press, in user's preferred weight unit */
  benchPress1RMEstimate?: number

  /** Optional estimated 1 Rep Max for Deadlift, in user's preferred weight unit */
  deadlift1RMEstimate?: number

  /** Optional estimated 1 Rep Max for Overhead Press, in user's preferred weight unit */
  overheadPress1RMEstimate?: number

  /** How the user assessed their strength (actual 1RM, estimated, or unsure) */
  strengthAssessmentType?: 'actual_1rm' | 'estimated_1rm' | 'unsure'
}

/**
 * Type for the complete user profile including onboarding data
 * This extends the existing UserProfile interface from the profile page
 */
export interface OnboardingResponse {
  onboarding_responses?: OnboardingData
  onboarding_completed?: boolean
}
