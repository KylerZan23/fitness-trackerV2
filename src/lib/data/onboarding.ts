// src/lib/data/onboarding.ts
import { createClient } from '@/utils/supabase/server';

export async function updateUserProfileWithOnboarding(userId: string, updateData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with onboarding data:', updateError);
      return {
        success: false,
        error: 'Failed to save your onboarding data. Please try again.',
      };
    }
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateUserProfileWithOnboarding:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function getOnboardingStatus(userId: string): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error checking onboarding status:', profileError);
      return { success: false, error: 'Failed to check onboarding status. Please try again.' };
    }

    return { success: true, completed: profile?.onboarding_completed || false };
  } catch (error) {
    console.error('Unexpected error in getOnboardingStatus:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
