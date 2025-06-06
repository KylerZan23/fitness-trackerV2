'use client'

import React from 'react'
import { IndividualQuestionPage } from '@/components/onboarding/IndividualQuestionPage'
import { useRouter } from 'next/navigation'
import { finalizeOnboardingAndGenerateProgram, type FullOnboardingAnswers } from '@/app/_actions/onboardingActions'

/**
 * Individual Question-Based Onboarding Page
 * Each question is presented on its own dedicated page for better engagement
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleComplete = async (data: any) => {
    console.log('Onboarding completed with data:', data)
    
    setIsProcessing(true)
    
    try {
      // Transform the data to match the expected format
      const onboardingData: FullOnboardingAnswers = {
        // Core onboarding fields
        primaryGoal: data.primaryGoal,
        secondaryGoal: data.secondaryGoal,
        sportSpecificDetails: data.sportSpecificDetails,
        trainingFrequencyDays: data.trainingFrequencyDays,
        sessionDuration: data.sessionDuration,
        equipment: data.equipment || [],
        weightUnit: data.weightUnit,
        exercisePreferences: data.exercisePreferences,
        injuriesLimitations: data.injuriesLimitations,
        
        // Strength assessment fields
        squat1RMEstimate: data.squat1RMEstimate,
        benchPress1RMEstimate: data.benchPress1RMEstimate,
        deadlift1RMEstimate: data.deadlift1RMEstimate,
        overheadPress1RMEstimate: data.overheadPress1RMEstimate,
        strengthAssessmentType: data.strengthAssessmentType,
        
        // Profile fields that go in separate columns
        primaryTrainingFocus: data.primaryTrainingFocus,
        experienceLevel: data.experienceLevel,
      }

      console.log('Submitting onboarding data to server action:', onboardingData)

      // Call the server action to save data and generate program
      const result = await finalizeOnboardingAndGenerateProgram(onboardingData)

      if ('error' in result) {
        throw new Error(result.error)
      }

      console.log('Onboarding and program generation completed successfully!')

      // Check if there was a warning (program generation failed but onboarding succeeded)
      if ('warning' in result && result.warning) {
        console.warn('Program generation warning:', result.warning)
        // You could show a toast notification here
        // For now, we'll still redirect to program page with a query param
        router.push('/program?onboarding=completed&program_warning=true')
      } else {
        // Complete success - redirect to program page
        router.push('/program?onboarding=completed&program=generated')
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error // Re-throw so the IndividualQuestionPage can handle it
    } finally {
      setIsProcessing(false)
    }
  }

  const handleError = (error: string) => {
    console.error('Onboarding error:', error)
    setIsProcessing(false)
    // TODO: Show error toast or handle error appropriately
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating Your Training Program
            </h3>
            <p className="text-gray-600">
              Our AI is creating a personalized workout plan based on your responses. This may take a moment...
            </p>
          </div>
        </div>
      )}
      
      <IndividualQuestionPage 
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  )
}
