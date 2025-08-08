'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Brain, Loader2, AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { NeuralProgressIndicator, NEURAL_ONBOARDING_STEPS } from './NeuralProgressIndicator'
import { NeuralQuestionCard, NEURAL_QUESTION_CONFIGS } from './NeuralQuestionCard' 
import { cn } from '@/lib/utils'
import type { OnboardingData, OnboardingCompletionData } from '@/types/neural'

/**
 * API error response structure from backend
 */
interface APIErrorResponse {
  error: string;           // Generic error message
  message: string;         // Specific error details
  details: ValidationError[] | null;  // Structured validation errors
  timestamp: string;
  requestId?: string;
}

/**
 * Validation error structure for API responses
 */
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validation schema for Neural onboarding data
const NeuralOnboardingSchema = z.object({
  primaryFocus: z.enum(['hypertrophy', 'strength', 'general_fitness']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  equipmentAccess: z.enum(['full_gym', 'dumbbells_only', 'bodyweight_only']),
  personalRecords: z.object({
    squat: z.number().optional(),
    bench: z.number().optional(),
    deadlift: z.number().optional()
  }).optional(),
  additionalInfo: z.object({
    injuryHistory: z.string().optional(),
    preferences: z.array(z.string()).optional(),
    availableDays: z.number().min(1).max(7).optional()
  }).optional()
})

interface NeuralOnboardingState {
  currentStep: number
  formData: Partial<OnboardingData>
  errors: Record<string, string>
  isLoading: boolean
  isSubmitting: boolean
}

interface NeuralOnboardingFlowProps {
  /** User ID for the onboarding flow */
  userId?: string
  /** Callback when onboarding is completed */
  onComplete?: (data: OnboardingCompletionData) => void
  /** Callback when onboarding is cancelled */
  onCancel?: () => void
  /** Initial data to pre-populate the form */
  initialData?: Partial<OnboardingData>
  /** Custom className */
  className?: string
}

/**
 * NeuralOnboardingFlow - Main orchestrator for Neural onboarding experience
 * 
 * Features:
 * - Multi-step onboarding with progress tracking
 * - Form validation and state management
 * - Integration with Neural program generation
 * - Modern, engaging UI with animations
 * - Persistent state across browser sessions
 * - Accessible keyboard navigation
 */
export function NeuralOnboardingFlow({
  userId,
  onComplete,
  onCancel,
  initialData = {},
  className
}: NeuralOnboardingFlowProps) {
  const router = useRouter()
  
  const [state, setState] = useState<NeuralOnboardingState>({
    currentStep: 0,
    formData: { ...initialData },
    errors: {},
    isLoading: false,
    isSubmitting: false
  })

  // Step configuration
  const steps = [
    {
      id: 'primaryFocus',
      title: 'Primary Focus',
      component: () => renderQuestion('primaryFocus'),
      isRequired: true,
      validate: (data: Partial<OnboardingData>) => data.primaryFocus ? null : 'Please select your primary fitness goal'
    },
    {
      id: 'experienceLevel',
      title: 'Experience',
      component: () => renderQuestion('experienceLevel'),
      isRequired: true,
      validate: (data: Partial<OnboardingData>) => data.experienceLevel ? null : 'Please select your experience level'
    },
    {
      id: 'sessionDuration',
      title: 'Session Duration',
      component: () => renderQuestion('sessionDuration'),
      isRequired: true,
      validate: (data: Partial<OnboardingData>) => data.sessionDuration ? null : 'Please select your preferred session duration'
    },
    {
      id: 'equipmentAccess',
      title: 'Equipment',
      component: () => renderQuestion('equipmentAccess'),
      isRequired: true,
      validate: (data: Partial<OnboardingData>) => data.equipmentAccess ? null : 'Please select your equipment access'
    },
    {
      id: 'trainingDaysPerWeek',
      title: 'Days/Week',
      component: () => renderQuestion('trainingDaysPerWeek'),
      isRequired: true,
      validate: (data: Partial<OnboardingData>) => (data as any).trainingDaysPerWeek ? null : 'Please select how many days per week you want to train'
    },
    {
      id: 'personalRecords',
      title: 'Optional PRs',
      component: () => renderStrengthQuestion(),
      isRequired: false,
      validate: () => null // Optional step
    }
  ]

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('neural-onboarding-state')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          setState(prev => ({ ...prev, ...parsed, isLoading: false, isSubmitting: false }))
        } catch (error) {
          console.warn('Failed to parse saved onboarding state:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neural-onboarding-state', JSON.stringify({
        currentStep: state.currentStep,
        formData: state.formData
      }))
    }
  }, [state.currentStep, state.formData])

  const updateFormData = useCallback((field: keyof OnboardingData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: '' } // Clear error when user interacts
    }))
  }, [])

  const validateCurrentStep = useCallback(() => {
    const currentStepConfig = steps[state.currentStep]
    if (!currentStepConfig) return true

    const error = currentStepConfig.validate(state.formData)
    if (error) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [currentStepConfig.id]: error }
      }))
      return false
    }
    return true
  }, [state.currentStep, state.formData, steps])

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return

    if (state.currentStep < steps.length - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
    } else {
      handleSubmit()
    }
  }, [state.currentStep, validateCurrentStep, steps.length])

  const goToPreviousStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))
    }
  }, [state.currentStep])

  /**
   * Format validation errors into user-friendly message
   */
  const formatValidationErrors = (errors: ValidationError[]): string => {
    const fieldMappings: Record<string, string> = {
      'primaryFocus': 'fitness goal',
      'experienceLevel': 'experience level',
      'sessionDuration': 'session duration',
      'equipmentAccess': 'equipment access',
      'personalRecords.squat': 'squat record',
      'personalRecords.bench': 'bench press record',
      'personalRecords.deadlift': 'deadlift record'
    }

    const formattedErrors = errors.map(error => {
      const friendlyField = fieldMappings[error.field] || error.field
      const message = error.message.toLowerCase().replace(/^expected .+, received .+$/, 'is invalid')
      return `${friendlyField} ${message}`
    })

    if (formattedErrors.length === 1) {
      return `Please fix: ${formattedErrors[0]}`
    } else if (formattedErrors.length === 2) {
      return `Please fix: ${formattedErrors.join(' and ')}`
    } else {
      return `Please fix: ${formattedErrors.slice(0, -1).join(', ')}, and ${formattedErrors[formattedErrors.length - 1]}`
    }
  }

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true }))

    try {
      // Validate all data
      const validatedData = NeuralOnboardingSchema.parse(state.formData)

      // Generate Neural program
      const response = await fetch('/api/neural/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryFocus: validatedData.primaryFocus,
          experienceLevel: validatedData.experienceLevel,
          sessionDuration: validatedData.sessionDuration,
          equipmentAccess: validatedData.equipmentAccess,
          personalRecords: validatedData.personalRecords,
          // Pass training frequency if provided
          trainingDaysPerWeek: (state.formData as any).trainingDaysPerWeek
        })
      })

      if (!response.ok) {
        let errorMessage: string
        
        try {
          // Parse JSON error response from API
          const errorData: APIErrorResponse = await response.json()
          
          // Handle validation errors with specific field details
          if (response.status === 400 && errorData.details && errorData.details.length > 0) {
            errorMessage = formatValidationErrors(errorData.details)
          } 
          // Handle other API errors with specific messages
          else if (errorData.message) {
            switch (response.status) {
              case 404:
                errorMessage = 'Your account was not found. Please try logging in again.'
                break
              case 502:
                errorMessage = 'Our AI service is temporarily unavailable. Please try again in a few moments.'
                break
              case 500:
                errorMessage = errorData.message.includes('database') 
                  ? 'We are experiencing database issues. Please try again later.'
                  : errorData.message
                break
              default:
                errorMessage = errorData.message
            }
          } 
          // Fallback to generic error message
          else {
            errorMessage = errorData.error || 'An unexpected error occurred. Please try again.'
          }
        } catch (parseError) {
          // Handle JSON parsing failures gracefully
          console.warn('Failed to parse error response:', parseError)
          
          // Use status-based fallback messages when JSON parsing fails
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check your inputs and try again.'
              break
            case 401:
              errorMessage = 'Please log in again to continue.'
              break
            case 404:
              errorMessage = 'Service not found. Please try again later.'
              break
            case 429:
              errorMessage = 'Too many requests. Please wait a moment and try again.'
              break
            case 500:
            case 502:
            case 503:
              errorMessage = 'Server error. Please try again later.'
              break
            default:
              errorMessage = 'Network error. Please check your connection and try again.'
          }
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.success && result.error) {
        throw new Error(result.error)
      }

      // Clear saved state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('neural-onboarding-state')
      }

      // Callback or redirect with program data including persistent ID
      if (onComplete) {
        onComplete({
          ...validatedData,
          programId: result.programId,
          program: result.program, // Pass the full program object
          createdAt: result.createdAt
        })
      } else {
        // Redirect with the complete program data structure to avoid fetch dependency
        if (result.program && result.programId) {
          // Store the complete program data structure that matches the fetch endpoint format
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('freshProgram', JSON.stringify({
              id: result.programId,
              userId: result.userId,
              createdAt: result.createdAt,
              updatedAt: result.updatedAt,
              program: result.program,
              metadata: result.metadata || { source: 'neural-generation' }
            }))
          }
          router.push(`/programs/${result.programId}`)
        } else {
          router.push('/dashboard?newUser=true')
        }
      }
    } catch (error) {
      console.error('Neural onboarding submission failed:', error)
      
      let errorMessage: string
      
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Server response error. Please try again.'
        } else {
          // Use the specific error message we parsed from API or validation
          errorMessage = error.message
        }
      } else {
        // Fallback for unknown error types
        errorMessage = 'Something went wrong. Please try again.'
      }
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { 
          submit: errorMessage
        }
      }))
    }
  }

  const renderQuestion = (questionKey: keyof typeof NEURAL_QUESTION_CONFIGS) => {
    const config = NEURAL_QUESTION_CONFIGS[questionKey]
    const fieldValue = state.formData[questionKey as keyof OnboardingData]
    const error = state.errors[questionKey]

    return (
      <NeuralQuestionCard
        {...config}
        value={fieldValue}
        onChange={(value) => updateFormData(questionKey as keyof OnboardingData, value)}
        error={error}
        required={steps[state.currentStep]?.isRequired}
        isActive={true}
      />
    )
  }

  const renderStrengthQuestion = () => {
    const personalRecords = state.formData.personalRecords || {}
    
    return (
      <div className="space-y-6">
        <NeuralQuestionCard
          title="What are your current strength levels?"
          description="Share your personal records to help Neural calibrate your program (optional)"
          emoji="💪"
          type="text"
          value=""
          onChange={() => {}} // This is just informational
          className="border-dashed"
        />
        
        <div className="grid gap-4 md:grid-cols-3">
          <NeuralQuestionCard
            title="Squat"
            type="number"
            value={personalRecords.squat}
            onChange={(value) => updateFormData('personalRecords', { ...personalRecords, squat: value })}
            placeholder="225"
            unit="lbs"
            min={0}
            max={1000}
          />
          <NeuralQuestionCard
            title="Bench Press"
            type="number"
            value={personalRecords.bench}
            onChange={(value) => updateFormData('personalRecords', { ...personalRecords, bench: value })}
            placeholder="185"
            unit="lbs"
            min={0}
            max={1000}
          />
          <NeuralQuestionCard
            title="Deadlift"
            type="number"
            value={personalRecords.deadlift}
            onChange={(value) => updateFormData('personalRecords', { ...personalRecords, deadlift: value })}
            placeholder="275"
            unit="lbs"
            min={0}
            max={1000}
          />
        </div>
      </div>
    )
  }

  const currentStepConfig = steps[state.currentStep]
  const isLastStep = state.currentStep === steps.length - 1
  const canProceed = currentStepConfig ? !currentStepConfig.validate(state.formData) : false

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <NeuralProgressIndicator
          currentStep={state.currentStep}
          steps={NEURAL_ONBOARDING_STEPS}
          showDescriptions={true}
        />

        {/* Question Content */}
        <div className="mt-8">
          {currentStepConfig && (
            <div className="mb-8">
              {currentStepConfig.component()}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <Button
            variant="outline"
            onClick={state.currentStep === 0 ? onCancel : goToPreviousStep}
            disabled={state.isSubmitting}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{state.currentStep === 0 ? 'Cancel' : 'Previous'}</span>
          </Button>

          <div className="flex items-center space-x-4">
            {/* Skip button for optional steps */}
            {!currentStepConfig?.isRequired && !isLastStep && (
              <Button
                variant="ghost"
                onClick={goToNextStep}
                disabled={state.isSubmitting}
                className="text-gray-600"
              >
                Skip for now
              </Button>
            )}

            <Button
              onClick={goToNextStep}
              disabled={state.isSubmitting || (currentStepConfig?.isRequired && !canProceed)}
              className="flex items-center space-x-2 min-w-[120px]"
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>{isLastStep ? 'Create Program' : 'Continue'}</span>
                  {!isLastStep && <ArrowRight className="w-4 h-4" />}
                  {isLastStep && <Brain className="w-4 h-4" />}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {state.errors.submit && (
          <div className="mt-6 flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{state.errors.submit}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pb-8 text-center text-sm text-gray-500">
          <p>Powered by Neural AI • Your data is secure and private</p>
        </div>
      </div>
    </div>
  )
}

// Hook for using Neural onboarding in other components
export function useNeuralOnboarding() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  
  const checkOnboardingStatus = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/onboarding-status`)
      const { completed } = await response.json()
      setIsOnboardingComplete(completed)
      return completed
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      return false
    }
  }, [])

  return {
    isOnboardingComplete,
    checkOnboardingStatus
  }
}
