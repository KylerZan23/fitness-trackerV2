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
    console.error('Error in finalizeOnboardingAndGenerateProgram:', error)
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

    // Generate training program after successful onboarding completion
    try {
      console.log('Generating training program for user:', user.id)
      
      // Pass the complete user data directly to the program generation function
      const programResult = await generateTrainingProgram(user, formData)

      if (programResult.success) {
        console.log('Training program generated successfully')
        return { success: true }
      } else {
        console.error('Failed to generate training program:', programResult.error)
        // Don't fail the onboarding if program generation fails - user can regenerate later
        return {
          success: true,
          warning:
            'Onboarding completed but program generation failed. Please try generating your program again.',
        }
      }
    } catch (programError) {
      console.error('Error during program generation:', programError)
      // Don't fail the onboarding if program generation fails
      return {
        success: true,
        warning:
          'Onboarding completed but program generation failed. Please try generating your program again.',
      }
    }
  } catch (error) {
    console.error('Unexpected error in saveOnboardingData:', error)
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
    console.error('Unexpected error in checkOnboardingStatus:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
