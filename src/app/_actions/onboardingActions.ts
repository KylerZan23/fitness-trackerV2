'use server'

import { createClient } from '@/utils/supabase/server'
import { type OnboardingData } from '@/lib/types/onboarding'
import { generateTrainingProgram } from './aiProgramActions'

/**
 * Combined type for onboarding data submission
 * Includes OnboardingData fields plus the profile fields that go in separate columns
 */
export interface OnboardingAndProfileData extends OnboardingData {
  primaryTrainingFocus: string
  experienceLevel: string
}

/**
 * Type alias for the full onboarding answers - same as OnboardingAndProfileData
 * but with a more descriptive name for the new flow
 */
export type FullOnboardingAnswers = OnboardingAndProfileData

/**
 * Server action response type
 */
type ActionResponse = 
  | { success: true; warning?: string }
  | { error: string }

/**
 * Server action to finalize onboarding and generate training program
 * This is the main function for the new simplified signup flow
 */
export async function finalizeOnboardingAndGenerateProgram(formData: FullOnboardingAnswers): Promise<ActionResponse> {
  return await saveOnboardingData(formData)
}

/**
 * Server action to save user onboarding data and mark onboarding as completed
 * @deprecated Use finalizeOnboardingAndGenerateProgram for new flows
 */
export async function saveOnboardingData(formData: OnboardingAndProfileData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error in saveOnboardingData:', authError)
      return { error: 'Authentication failed. Please log in again.' }
    }
    
    if (!user) {
      console.error('No authenticated user found in saveOnboardingData')
      return { error: 'You must be logged in to complete onboarding.' }
    }

    // Separate the data: profile fields vs onboarding responses
    const { primaryTrainingFocus, experienceLevel, ...onboardingResponses } = formData

    // Prepare the update object
    const updateData = {
      primary_training_focus: primaryTrainingFocus,
      experience_level: experienceLevel,
      onboarding_responses: onboardingResponses,
      onboarding_completed: true,
    }

    console.log('Saving onboarding data for user:', user.id, updateData)

    // Update the user's profile with onboarding data
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile with onboarding data:', updateError)
      return { 
        error: 'Failed to save your onboarding data. Please try again.' 
      }
    }

    console.log('Onboarding data saved successfully for user:', user.id)

    // Generate training program after successful onboarding completion
    try {
      console.log('Generating training program for user:', user.id)
      const programResult = await generateTrainingProgram(user.id)
      
      if (programResult.success) {
        console.log('Training program generated successfully')
        return { success: true }
      } else {
        console.error('Failed to generate training program:', programResult.error)
        // Don't fail the onboarding if program generation fails - user can regenerate later
        return { success: true, warning: 'Onboarding completed but program generation failed. Please try generating your program again.' }
      }
    } catch (programError) {
      console.error('Error during program generation:', programError)
      // Don't fail the onboarding if program generation fails
      return { success: true, warning: 'Onboarding completed but program generation failed. Please try generating your program again.' }
    }

  } catch (error) {
    console.error('Unexpected error in saveOnboardingData:', error)
    return { 
      error: 'An unexpected error occurred while saving your data. Please try again.' 
    }
  }
}

/**
 * Server action to check if user has completed onboarding
 * Useful for conditional redirects and UI states
 */
export async function checkOnboardingStatus(): Promise<{ completed: boolean } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error checking onboarding status:', profileError)
      return { error: 'Failed to check onboarding status' }
    }

    return { completed: profile?.onboarding_completed || false }

  } catch (error) {
    console.error('Unexpected error in checkOnboardingStatus:', error)
    return { error: 'An unexpected error occurred' }
  }
} 