import { z } from 'zod'
import { 
  type Question, 
  type OnboardingFormData, 
  type QuestionConditions 
} from './types/onboarding-flow'

// Import question components (we'll create these in Phase 2)
// For now, we'll use placeholder components
const PlaceholderQuestion = ({ value, onChange }: any) => null

/**
 * Central registry of all onboarding questions
 * Defines the complete question flow with validation and conditional logic
 */
export const ONBOARDING_QUESTIONS: Question[] = [
  // Profile Questions (Required)
  {
    id: 'primaryGoal',
    title: "What's your main fitness goal? 🎯",
    description: "This helps us tailor your entire program to what matters most to you",
    component: PlaceholderQuestion,
    validation: z.enum([
      'Muscle Gain',
      'Strength Gain', 
      'Endurance Improvement',
      'Sport-Specific',
      'General Fitness'
    ]),
    category: 'profile',
    order: 1,
    isOptional: false
  },

  {
    id: 'secondaryGoal',
    title: "Any secondary goals? 🎯",
    description: "Sometimes we have multiple objectives - what else would you like to work on?",
    component: PlaceholderQuestion,
    validation: z.enum([
      'Muscle Gain',
      'Strength Gain',
      'Endurance Improvement', 
      'Sport-Specific',
      'General Fitness'
    ]).optional(),
    category: 'profile',
    order: 2,
    isOptional: true,
    shouldShow: (answers) => !!answers.primaryGoal
  },

  {
    id: 'experienceLevel',
    title: "What's your experience level? 📈",
    description: "We'll adjust the complexity and intensity based on your background",
    component: PlaceholderQuestion,
    validation: z.string().min(1, 'Please select your experience level'),
    category: 'profile',
    order: 3,
    isOptional: false
  },

  {
    id: 'weightUnit',
    title: "What weight unit do you prefer? ⚖️",
    description: "We'll use this throughout the app for displaying weights and collecting your strength data",
    component: PlaceholderQuestion,
    validation: z.enum(['kg', 'lbs']),
    category: 'profile',
    order: 4,
    isOptional: false
  },

  // Training Preferences (Required)
  {
    id: 'trainingFrequencyDays',
    title: "How many days per week can you train? 📅",
    description: "Be realistic - consistency is more important than frequency",
    component: PlaceholderQuestion,
    validation: z.number().min(2, 'Minimum 2 days per week').max(7, 'Maximum 7 days per week'),
    category: 'training',
    order: 5,
    isOptional: false
  },

  {
    id: 'sessionDuration',
    title: "How long per training session? ⏱️",
    description: "This helps us plan the right amount of exercises for each workout",
    component: PlaceholderQuestion,
    validation: z.enum(['30-45 minutes', '45-60 minutes', '60-75 minutes', '75+ minutes']),
    category: 'training',
    order: 6,
    isOptional: false
  },

  {
    id: 'equipment',
    title: "What equipment do you have access to? 🏋️‍♀️",
    description: "Select all that apply - we'll design workouts around what you have",
    component: PlaceholderQuestion,
    validation: z.array(z.enum([
      'Full Gym (Barbells, Racks, Machines)',
      'Dumbbells',
      'Kettlebells', 
      'Resistance Bands',
      'Bodyweight Only',
      'Cardio Machines (Treadmill, Bike, Rower, Elliptical)'
    ])).min(1, 'Please select at least one equipment option'),
    category: 'training',
    order: 7,
    isOptional: false
  },

  // Strength Questions (Optional)
  {
    id: 'squat1RMEstimate',
    title: "What's your squat 1RM or estimate? 🏋️‍♂️",
    description: "This helps us recommend appropriate weights. Skip if you're not sure.",
    component: PlaceholderQuestion,
    validation: z.number().positive().optional(),
    category: 'strength',
    order: 8,
    isOptional: true
  },

  {
    id: 'benchPress1RMEstimate', 
    title: "What's your bench press 1RM or estimate? 💪",
    description: "Enter your best bench press or a weight you can do for 3-5 reps",
    component: PlaceholderQuestion,
    validation: z.number().positive().optional(),
    category: 'strength',
    order: 9,
    isOptional: true
  },

  {
    id: 'deadlift1RMEstimate',
    title: "What's your deadlift 1RM or estimate? 🦵",
    description: "Your strongest deadlift or estimated max based on recent lifts",
    component: PlaceholderQuestion,
    validation: z.number().positive().optional(),
    category: 'strength',
    order: 10,
    isOptional: true
  },

  {
    id: 'overheadPress1RMEstimate',
    title: "What's your overhead press 1RM? 🙋‍♀️",
    description: "Standing overhead press (military press) max or estimate",
    component: PlaceholderQuestion,
    validation: z.number().positive().optional(),
    category: 'strength',
    order: 11,
    isOptional: true
  },

  {
    id: 'strengthAssessmentType',
    title: "How did you determine these values? 🤔",
    description: "This helps us understand how confident we should be in these numbers",
    component: PlaceholderQuestion,
    validation: z.enum(['actual_1rm', 'estimated_1rm', 'unsure']).optional(),
    category: 'strength',
    order: 12,
    isOptional: true,
    shouldShow: (answers) => !!(
      answers.squat1RMEstimate || 
      answers.benchPress1RMEstimate || 
      answers.deadlift1RMEstimate || 
      answers.overheadPress1RMEstimate
    )
  },

  // Preference Questions (Optional)
  {
    id: 'exercisePreferences',
    title: "Any exercise preferences or dislikes? ❤️",
    description: "Tell us what you love or hate - we'll try to accommodate your preferences",
    component: PlaceholderQuestion,
    validation: z.string().optional(),
    category: 'preferences',
    order: 13,
    isOptional: true
  },

  {
    id: 'injuriesLimitations',
    title: "Any injuries or limitations we should know about? ⚠️",
    description: "Help us keep you safe by sharing any current or past injuries",
    component: PlaceholderQuestion,
    validation: z.string().optional(),
    category: 'preferences',
    order: 14,
    isOptional: true
  }
]

/**
 * Global conditional logic for questions
 * These conditions determine when questions should be shown
 */
export const QUESTION_CONDITIONS: QuestionConditions = {
  secondaryGoal: (answers) => !!answers.primaryGoal,
  
  strengthAssessmentType: (answers) => !!(
    answers.squat1RMEstimate || 
    answers.benchPress1RMEstimate || 
    answers.deadlift1RMEstimate || 
    answers.overheadPress1RMEstimate
  )
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: string): Question[] {
  return ONBOARDING_QUESTIONS.filter(q => q.category === category)
}

/**
 * Get a specific question by ID
 */
export function getQuestionById(id: keyof OnboardingFormData): Question | undefined {
  return ONBOARDING_QUESTIONS.find(q => q.id === id)
}

/**
 * Get the total number of questions (including conditional ones)
 */
export function getTotalQuestionCount(): number {
  return ONBOARDING_QUESTIONS.length
}

/**
 * Get required questions only
 */
export function getRequiredQuestions(): Question[] {
  return ONBOARDING_QUESTIONS.filter(q => !q.isOptional)
}

/**
 * Get optional questions only
 */
export function getOptionalQuestions(): Question[] {
  return ONBOARDING_QUESTIONS.filter(q => q.isOptional)
} 