'use client'

import React from 'react'
import { IndividualQuestionPage } from '@/components/onboarding/IndividualQuestionPage'
import { useRouter } from 'next/navigation'
import { finalizeOnboardingAndGenerateProgram, type FullOnboardingAnswers } from '@/app/_actions/onboardingActions'
import { createClient } from '@/utils/supabase/client'

/**
 * Individual Question-Based Onboarding Page
 * Each question is presented on its own dedicated page for better engagement
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progressMessage, setProgressMessage] = React.useState('')
  const [programId, setProgramId] = React.useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Personalized progress messages based on user data
  const getProgressMessages = (userData: any) => {
    const messages = [
      `Now we are examining your training preferences for ${userData.primaryGoal}...`,
      `We are analyzing your ${userData.experienceLevel} experience level and ${userData.trainingFrequencyDays}-day training schedule...`,
      `Our AI is calculating your personalized volume landmarks based on your strength data...`,
      `We are designing your ${userData.durationWeeksTotal || 6}-week program with scientific periodization...`,
      `We are optimizing your exercise selection for your available equipment: ${userData.equipment?.join(', ') || 'standard gym equipment'}...`,
      `We are finalizing your program with personalized coaching cues and progression strategies...`,
      `Your program is being validated and enhanced with the latest exercise science research...`,
    ]
    return messages
  }

  const startProgressAnimation = (userData: any) => {
    const messages = getProgressMessages(userData)
    let currentIndex = 0

    const updateMessage = () => {
      if (currentIndex < messages.length) {
        setProgressMessage(messages[currentIndex])
        currentIndex++
      }
    }

    // Show first message immediately
    updateMessage()

    // Update message every 3 seconds
    const interval = setInterval(() => {
      updateMessage()
    }, 3000)

    return interval
  }

  const pollProgramStatus = (programId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data: program, error } = await supabase
          .from('training_programs')
          .select('generation_status, generation_error')
          .eq('id', programId)
          .single()

        if (error) {
          console.error('Error polling program status:', error)
          return
        }

        if (program.generation_status === 'completed') {
          // Clear polling and redirect to program page
          if (pollingInterval) {
            clearInterval(pollingInterval)
          }
          setIsProcessing(false)
          router.push('/program?onboarding=completed&program=generated')
        } else if (program.generation_status === 'failed') {
          // Clear polling and redirect with error
          if (pollingInterval) {
            clearInterval(pollingInterval)
          }
          setIsProcessing(false)
          router.push(`/program?onboarding=completed&error=${encodeURIComponent(program.generation_error || 'Program generation failed')}`)
        }
        // If still processing, continue polling
      } catch (error) {
        console.error('Error in polling:', error)
      }
    }, 5000) // Poll every 5 seconds

    setPollingInterval(interval)
  }

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

      // Start progress animation
      const progressInterval = startProgressAnimation(onboardingData)

      // Call the server action to save data and generate program
      const result = await finalizeOnboardingAndGenerateProgram(onboardingData)

      if ('error' in result) {
        clearInterval(progressInterval)
        throw new Error(result.error)
      }

      console.log('Onboarding completed, program generation started!')

      // Check if there was a warning (program generation failed but onboarding succeeded)
      if ('warning' in result && result.warning) {
        clearInterval(progressInterval)
        console.warn('Program generation warning:', result.warning)
        router.push('/program?onboarding=completed&program_warning=true')
        return
      }

      // For the new background generation, we need to find the program ID
      // and start polling for status updates
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get the most recent program for this user
          const { data: programs, error: programsError } = await supabase
            .from('training_programs')
            .select('id, generation_status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (!programsError && programs) {
            setProgramId(programs.id)
            pollProgramStatus(programs.id)
          } else {
            // Fallback: redirect to program page which will handle the status
            router.push('/program?onboarding=completed')
          }
        }
      } catch (pollError) {
        console.error('Error setting up polling:', pollError)
        // Fallback: redirect to program page
        router.push('/program?onboarding=completed')
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error // Re-throw so the IndividualQuestionPage can handle it
    }
  }

  const handleError = (error: string) => {
    console.error('Onboarding error:', error)
    setIsProcessing(false)
    // Clear any polling intervals
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
  }

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  return (
    <div className="min-h-screen bg-gray-50">
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Creating Your Personalized Training Program
            </h3>
            <div className="space-y-4">
              <p className="text-gray-700 text-lg leading-relaxed">
                {progressMessage || "Initializing your program generation..."}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <span>Processing in background</span>
              </div>
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
