import { type FitnessGoal } from '@/lib/types/onboarding'

/**
 * Mapping from primary fitness goals to training focus values
 * This allows us to automatically derive training focus from user's primary goal
 */
export const GOAL_TO_FOCUS_MAPPING: Record<FitnessGoal, string> = {
  'Muscle Gain: General': 'Bodybuilding',
  'Muscle Gain: Hypertrophy Focus': 'Bodybuilding',
  'Strength Gain: General': 'Powerlifting',
  'Strength Gain: Powerlifting Peak': 'Powerlifting',
  'Endurance Improvement: Gym Cardio': 'Endurance',
  'Sport-Specific S&C: Explosive Power': 'Athletic Performance',
  'General Fitness: Foundational Strength': 'General Fitness',
  'Weight Loss: Gym Based': 'Weight Loss',
  'Bodyweight Mastery': 'Bodyweight Training',
  'Recomposition: Lean Mass & Fat Loss': 'Body Recomposition'
}

/**
 * Maps a primary fitness goal to its corresponding training focus
 * @param primaryGoal - The user's primary fitness goal
 * @returns The corresponding training focus value
 */
export function mapGoalToTrainingFocus(primaryGoal: FitnessGoal): string {
  return GOAL_TO_FOCUS_MAPPING[primaryGoal]
}

/**
 * Gets all possible training focus values from the mapping
 * @returns Array of all training focus values
 */
export function getAllTrainingFocusValues(): string[] {
  return Object.values(GOAL_TO_FOCUS_MAPPING)
}

/**
 * Checks if a training focus value is valid (exists in our mapping)
 * @param focus - The training focus value to validate
 * @returns True if the focus value is valid
 */
export function isValidTrainingFocus(focus: string): boolean {
  return getAllTrainingFocusValues().includes(focus)
} 