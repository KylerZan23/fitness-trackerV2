import { z } from 'zod'
import { type OnboardingData } from '@/lib/types/onboarding'

/**
 * Core types for the individual question-based onboarding flow
 */

// Re-create the onboarding form data type based on the schema structure
export type OnboardingFormData = OnboardingData & {
  primaryTrainingFocus: string
  experienceLevel: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  weight_unit?: string
  onboarding_completed?: boolean
  onboarding_responses?: any
}

export interface QuestionProps {
  value: any
  onChange: (value: any) => void
  error?: string
  profile?: UserProfile
  allAnswers?: Partial<OnboardingFormData>
}

export interface Question {
  id: keyof OnboardingFormData
  title: string
  description?: string
  component: React.ComponentType<QuestionProps>
  validation: z.ZodSchema
  isOptional?: boolean
  shouldShow?: (answers: Partial<OnboardingFormData>) => boolean
  category: 'profile' | 'training' | 'strength' | 'preferences'
  order: number
}

export interface ProgressInfo {
  current: number
  total: number
  percentage: number
}

export interface OnboardingFlowState {
  currentQuestionIndex: number
  answers: Partial<OnboardingFormData>
  questionsToShow: Question[]
  progress: ProgressInfo
  isLoading: boolean
  error?: string
}

export type QuestionCategory = 'profile' | 'training' | 'strength' | 'preferences'

export interface QuestionConditions {
  [questionId: string]: (answers: Partial<OnboardingFormData>) => boolean
} 