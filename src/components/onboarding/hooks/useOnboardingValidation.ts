import { useState, useCallback, useEffect } from 'react'
import { type OnboardingFormData } from '../types/onboarding-flow'
import { ONBOARDING_QUESTIONS } from '../QuestionRegistry'

interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
  suggestion?: string
}

interface ValidationState {
  [questionId: string]: ValidationResult
}

/**
 * Custom hook for real-time validation of onboarding questions
 * Provides immediate feedback as users interact with form fields
 */
export function useOnboardingValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({})
  const [isValidating, setIsValidating] = useState(false)

  /**
   * Validate a single question's answer in real-time
   */
  const validateQuestion = useCallback(async (
    questionId: keyof OnboardingFormData, 
    value: any,
    allAnswers?: Partial<OnboardingFormData>
  ): Promise<ValidationResult> => {
    const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId)
    if (!question) {
      return { isValid: false, error: 'Question not found' }
    }

    try {
      // Basic Zod validation
      question.validation.parse(value)
      
      // Custom validation logic based on question type
      const customValidation = await performCustomValidation(questionId, value, allAnswers)
      
      return {
        isValid: true,
        ...customValidation
      }
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Invalid value'
      return {
        isValid: false,
        error: formatValidationError(questionId, errorMessage)
      }
    }
  }, [])

  /**
   * Validate all answers and return overall validation state
   */
  const validateAllAnswers = useCallback(async (
    answers: Partial<OnboardingFormData>
  ): Promise<{ isValid: boolean; errors: string[] }> => {
    setIsValidating(true)
    const errors: string[] = []
    const newValidationState: ValidationState = {}

    for (const question of ONBOARDING_QUESTIONS) {
      if (!question.isOptional && !answers[question.id]) {
        errors.push(`${question.title} is required`)
        newValidationState[question.id] = {
          isValid: false,
          error: 'This field is required'
        }
      } else if (answers[question.id]) {
        const result = await validateQuestion(question.id, answers[question.id], answers)
        newValidationState[question.id] = result
        if (!result.isValid && result.error) {
          errors.push(`${question.title}: ${result.error}`)
        }
      }
    }

    setValidationState(newValidationState)
    setIsValidating(false)

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [validateQuestion])

  /**
   * Update validation state for a specific question
   */
  const updateValidation = useCallback(async (
    questionId: keyof OnboardingFormData,
    value: any,
    allAnswers?: Partial<OnboardingFormData>
  ) => {
    const result = await validateQuestion(questionId, value, allAnswers)
    setValidationState(prev => ({
      ...prev,
      [questionId]: result
    }))
    return result
  }, [validateQuestion])

  /**
   * Clear validation for a specific question
   */
  const clearValidation = useCallback((questionId: keyof OnboardingFormData) => {
    setValidationState(prev => {
      const newState = { ...prev }
      delete newState[questionId]
      return newState
    })
  }, [])

  /**
   * Get validation result for a specific question
   */
  const getValidation = useCallback((questionId: keyof OnboardingFormData): ValidationResult => {
    return validationState[questionId] || { isValid: true }
  }, [validationState])

  return {
    validationState,
    isValidating,
    validateQuestion,
    validateAllAnswers,
    updateValidation,
    clearValidation,
    getValidation
  }
}

/**
 * Perform custom validation logic based on question type and context
 */
async function performCustomValidation(
  questionId: keyof OnboardingFormData,
  value: any,
  allAnswers?: Partial<OnboardingFormData>
): Promise<Partial<ValidationResult>> {
  switch (questionId) {
    case 'primaryGoal':
      return validatePrimaryGoal(value, allAnswers)
    
    case 'trainingFrequencyDays':
      return validateTrainingFrequency(value, allAnswers)
    
    case 'equipment':
      return validateEquipment(value, allAnswers)
    
    case 'squat1RMEstimate':
    case 'benchPress1RMEstimate':
    case 'deadlift1RMEstimate':
    case 'overheadPress1RMEstimate':
      return validateStrengthEstimate(questionId, value, allAnswers)
    
    case 'strengthAssessmentType':
      return validateStrengthAssessmentType(value, allAnswers)
    
    default:
      return {}
  }
}

/**
 * Validate primary goal selection
 */
function validatePrimaryGoal(value: any, allAnswers?: Partial<OnboardingFormData>): Partial<ValidationResult> {
  if (value === 'Sport-Specific S&C: Explosive Power') {
    return {
      suggestion: "Great choice! We'll ask about your specific sport next to tailor your program."
    }
  }
  
  if (value === 'General Fitness: Foundational Strength') {
    return {
      suggestion: "Perfect for building overall health and wellness. We'll create a balanced program for you."
    }
  }
  
  return {}
}

/**
 * Validate training frequency
 */
function validateTrainingFrequency(value: any, allAnswers?: Partial<OnboardingFormData>): Partial<ValidationResult> {
  const frequency = Number(value)
  
  if (frequency < 2) {
    return {
      warning: "Training less than 2 days per week may limit your progress. Consider increasing frequency when possible."
    }
  }
  
  if (frequency > 6) {
    return {
      warning: "Training 7 days per week is very demanding. Make sure to include adequate recovery time."
    }
  }
  
  if (frequency >= 4 && allAnswers?.primaryGoal === 'Endurance Improvement: Gym Cardio') {
    return {
      suggestion: "Excellent frequency for endurance goals! We'll include both cardio and strength training."
    }
  }
  
  return {}
}

/**
 * Validate equipment selection
 */
function validateEquipment(value: any, allAnswers?: Partial<OnboardingFormData>): Partial<ValidationResult> {
  const equipment = Array.isArray(value) ? value : []
  
  if (equipment.length === 0) {
    return {
      warning: "No equipment selected. We'll focus on bodyweight exercises."
    }
  }
  
  if (equipment.includes('Bodyweight Only') && equipment.length > 1) {
    return {
      suggestion: "Great mix! We'll combine bodyweight exercises with your available equipment."
    }
  }
  
  if (equipment.includes('Full Gym (Barbells, Racks, Machines)')) {
    return {
      suggestion: "Excellent! Full gym access gives us maximum flexibility for your program."
    }
  }
  
  return {}
}

/**
 * Validate strength estimates
 */
function validateStrengthEstimate(
  questionId: keyof OnboardingFormData,
  value: any,
  allAnswers?: Partial<OnboardingFormData>
): Partial<ValidationResult> {
  const weight = Number(value)
  
  if (weight <= 0) {
    return {}
  }
  
  // Basic sanity checks for strength estimates
  const exerciseRanges = {
    squat1RMEstimate: { min: 45, max: 800, typical: [135, 315] },
    benchPress1RMEstimate: { min: 45, max: 600, typical: [95, 225] },
    deadlift1RMEstimate: { min: 45, max: 900, typical: [135, 405] },
    overheadPress1RMEstimate: { min: 45, max: 400, typical: [65, 155] }
  }
  
  const range = exerciseRanges[questionId as keyof typeof exerciseRanges]
  if (!range) return {}
  
  if (weight < range.min) {
    return {
      warning: `This seems quite low for a 1RM. Make sure you're entering your maximum single rep weight.`
    }
  }
  
  if (weight > range.max) {
    return {
      warning: `This is an exceptionally high 1RM. Please double-check your entry.`
    }
  }
  
  if (weight >= range.typical[0] && weight <= range.typical[1]) {
    return {
      suggestion: `Good strength level! This will help us set appropriate training weights.`
    }
  }
  
  return {}
}

/**
 * Validate strength assessment type
 */
function validateStrengthAssessmentType(value: any, allAnswers?: Partial<OnboardingFormData>): Partial<ValidationResult> {
  const hasStrengthData = [
    'squat1RMEstimate',
    'benchPress1RMEstimate', 
    'deadlift1RMEstimate',
    'overheadPress1RMEstimate'
  ].some(key => allAnswers?.[key as keyof OnboardingFormData])
  
  if (!hasStrengthData) {
    return {
      warning: "Please enter at least one strength estimate above to use this assessment."
    }
  }
  
  if (value === 'unsure') {
    return {
      suggestion: "No problem! We'll use conservative weight recommendations that you can adjust."
    }
  }
  
  if (value === 'actual_1rm') {
    return {
      suggestion: "Perfect! Actual 1RM data gives us the most accurate weight recommendations."
    }
  }
  
  return {}
}

/**
 * Format validation error messages to be more user-friendly
 */
function formatValidationError(questionId: keyof OnboardingFormData, errorMessage: string): string {
  // Map technical validation errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Required': 'This field is required',
    'Invalid enum value': 'Please select a valid option',
    'Expected number, received string': 'Please enter a valid number',
    'Number must be greater than 0': 'Please enter a positive number'
  }
  
  return errorMap[errorMessage] || errorMessage
} 