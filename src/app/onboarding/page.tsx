'use client'

import React from 'react'
import { IndividualQuestionPage } from '@/components/onboarding/IndividualQuestionPage'
import { useRouter } from 'next/navigation'
import { generateTrainingProgram } from '@/app/_actions/aiProgramActions';
import { finalizeOnboardingAndGenerateProgram, type FullOnboardingAnswers } from '@/app/_actions/onboardingActions';
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

      // After a brief delay, initiate the program generation and start polling.
      // This ensures the onboarding data has been committed before we proceed.
      setTimeout(() => {
        generateProgramAndStartPolling(onboardingData);
      }, 2000);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Stop the progress animation and show an error.
      if (pollingInterval) clearInterval(pollingInterval);
      setIsProcessing(false);
      // You might want to display a more user-friendly error message here.
      throw error;
    }
  };

  const generateProgramAndStartPolling = async (onboardingData: FullOnboardingAnswers) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated.");
      }

      // This server action now correctly triggers the background generation.
      const result = await generateTrainingProgram(user.id, onboardingData);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Now, find the newly created program and start polling its status.
      const { data: programs, error: programsError } = await supabase
        .from('training_programs')
        .select('id, generation_status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (programsError || !programs) {
        throw new Error("Could not find the new program to poll.");
      }
      
      setProgramId(programs.id);
      pollProgramStatus(programs.id);

    } catch (error) {
      console.error("Error during program generation and polling setup:", error);
      if (pollingInterval) clearInterval(pollingInterval);
      setIsProcessing(false);
      router.push(`/program?onboarding=completed&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
    }
  };

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
