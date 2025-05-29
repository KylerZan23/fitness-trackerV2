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

// Primary fitness goals
export type FitnessGoal =
  | 'Muscle Gain'
  | 'Strength Gain'
  | 'Endurance Improvement'
  | 'Sport-Specific'
  | 'General Fitness'

// Session duration options
export type SessionDuration = '30-45 minutes' | '45-60 minutes' | '60-90 minutes' | '90+ minutes'

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

  /** Optional exercise preferences or dislikes */
  exercisePreferences?: string

  /** Optional injury or limitation notes */
  injuriesLimitations?: string
}

/**
 * Type for the complete user profile including onboarding data
 * This extends the existing UserProfile interface from the profile page
 */
export interface OnboardingResponse {
  onboarding_responses?: OnboardingData
  onboarding_completed?: boolean
}
