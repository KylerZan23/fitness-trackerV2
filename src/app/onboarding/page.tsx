'use client'

import React from 'react'
import { IndividualQuestionPage } from '@/components/onboarding/IndividualQuestionPage'
import { useRouter } from 'next/navigation'
import { finalizeOnboarding, type FullOnboardingAnswers } from '@/app/_actions/onboardingActions'

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
        experienceLevel: data.experienceLevel,
      }

      console.log('Submitting onboarding data to server action:', onboardingData)

      // Finalize onboarding without program generation
      const result = await finalizeOnboarding(onboardingData)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      console.log('Onboarding completed successfully')
      
      // Redirect to Neural program creation for personalized AI training
      router.push('/neural/onboarding?source=general-onboarding')
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsProcessing(false)
      // You might want to display a more user-friendly error message here
      throw error
    }
  }



  const handleError = (error: string) => {
    console.error('Onboarding error:', error)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Completing Your Profile
            </h3>
            <div className="space-y-4">
              <p className="text-gray-700 text-lg leading-relaxed">
                Saving your fitness preferences and preparing your Neural program creation...
              </p>
            </div>
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
