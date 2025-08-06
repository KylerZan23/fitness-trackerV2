'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Brain, Loader2, AlertTriangle } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { NeuralProgressIndicator, NEURAL_ONBOARDING_STEPS } from './NeuralProgressIndicator'
import { NeuralQuestionCard, NEURAL_QUESTION_CONFIGS } from './NeuralQuestionCard' 
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/types/neural'

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
  onComplete?: (data: OnboardingData) => void
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
      title: 'Your Goals',
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
      title: 'Schedule',
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
      id: 'personalRecords',
      title: 'Strength',
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

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true }))

    try {
      // Validate all data
      const validatedData = NeuralOnboardingSchema.parse(state.formData)

      // Generate Neural program
      const response = await fetch('/api/neural/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          onboardingData: validatedData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate Neural program')
      }

      const result = await response.json()

      // Clear saved state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('neural-onboarding-state')
      }

      // Callback or redirect
      if (onComplete) {
        onComplete(validatedData)
      } else {
        router.push('/dashboard?newUser=true')
      }
    } catch (error) {
      console.error('Neural onboarding submission failed:', error)
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { 
          submit: error instanceof Error ? error.message : 'Something went wrong. Please try again.' 
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
