'use server'

import { createClient } from '@/utils/supabase/server'
import { type OnboardingData } from '@/lib/types/onboarding'
import { generateTrainingProgram } from './aiProgramActions'
import { mapGoalToTrainingFocus } from '@/lib/utils/goalToFocusMapping'

/**
 * Combined type for onboarding data submission
 * Includes OnboardingData fields plus the profile fields that go in separate columns
 */
export interface OnboardingAndProfileData extends OnboardingData {
  experienceLevel: string
}

/**
 * Type for the full onboarding answers including profile data
 */
export type FullOnboardingAnswers = OnboardingAndProfileData

/**
 * Standard action response type
 */
export interface ActionResponse {
  success: boolean
  error?: string
  warning?: string
}

/**
 * Server action to finalize onboarding and generate training program
 * This is the main function for the new simplified signup flow
 */
export async function finalizeOnboardingAndGenerateProgram(
  formData: FullOnboardingAnswers
): Promise<ActionResponse> {
  try {
    console.log('finalizeOnboardingAndGenerateProgram called')
    // Directly pass formData to saveOnboardingData
    return await saveOnboardingData(formData)
  } catch (error) {
    console.error('ERROR in finalizeOnboardingAndGenerateProgram:', error)
    return { success: false, error: 'An unexpected error occurred while completing onboarding. Please try again.' }
  }
}

/**
 * Server action to save user onboarding data and mark onboarding as completed
 * @param formData The full set of onboarding answers, including profile data.
 * @deprecated Use finalizeOnboardingAndGenerateProgram for new flows
 */
export async function saveOnboardingData(
  formData: FullOnboardingAnswers
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Authentication error in saveOnboardingData:', authError)
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    if (!user) {
      console.error('No authenticated user found in saveOnboardingData')
      return { success: false, error: 'You must be logged in to complete onboarding.' }
    }

    console.log('Saving onboarding data for user:', user.id)

    // The profile is now created during the signup process.
    // This action will only update the existing profile with onboarding data.

    // Separate the data: profile fields vs onboarding responses
    const { experienceLevel, weightUnit, ...onboardingResponses } = formData
    
    // Convert strength estimates to kg for consistent storage
    // This ensures all stored weights are in kg, regardless of user's preference
    if (weightUnit === 'lbs') {
      if (onboardingResponses.squat1RMEstimate) {
        onboardingResponses.squat1RMEstimate = onboardingResponses.squat1RMEstimate / 2.20462
      }
      if (onboardingResponses.benchPress1RMEstimate) {
        onboardingResponses.benchPress1RMEstimate = onboardingResponses.benchPress1RMEstimate / 2.20462
      }
      if (onboardingResponses.deadlift1RMEstimate) {
        onboardingResponses.deadlift1RMEstimate = onboardingResponses.deadlift1RMEstimate / 2.20462
      }
      if (onboardingResponses.overheadPress1RMEstimate) {
        onboardingResponses.overheadPress1RMEstimate = onboardingResponses.overheadPress1RMEstimate / 2.20462
      }
    }
    
    // Derive training focus from primary goal
    const primaryTrainingFocus = mapGoalToTrainingFocus(formData.primaryGoal)

    // Prepare the update object
    const updateData = {
      primary_training_focus: primaryTrainingFocus,
      experience_level: experienceLevel,
      weight_unit: weightUnit,
      onboarding_responses: onboardingResponses,
      onboarding_completed: true,
    }

    // Update the user's profile with onboarding data
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile with onboarding data:', updateError)
      return {
        success: false,
        error: 'Failed to save your onboarding data. Please try again.',
      }
    }

    console.log('Onboarding data saved successfully for user:', user.id)

    // Program generation is now decoupled and handled by the client
    // which polls for program status after onboarding is complete.
    console.log(
      'Onboarding data saved successfully. Program generation will be initiated by the client poller.'
    )
    return { success: true }
  } catch (error) {
    console.error('ERROR in saveOnboardingData:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while saving your data. Please try again.',
    }
  }
}

/**
 * Server action to check if user has completed onboarding
 * Useful for conditional redirects and UI states
 */
export async function checkOnboardingStatus(): Promise<{ completed: boolean } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in checkOnboardingStatus:', authError)
      return { success: false, error: 'Authentication required. Please log in again.' }
    }

    console.log('Checking onboarding status for user:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error checking onboarding status:', profileError)
      return { success: false, error: 'Failed to check onboarding status. Please try again.' }
    }

    return { completed: profile?.onboarding_completed || false }
  } catch (error) {
    console.error('ERROR in checkOnboardingStatus:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
