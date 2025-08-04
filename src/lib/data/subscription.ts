// src/lib/data/subscription.ts
import { createClient } from '@/utils/supabase/server';

type SubscriptionStatus = {
  is_premium: boolean;
  trial_ends_at: string | null;
};

export async function getSubscriptionData(userId: string): Promise<{ success: boolean; data?: SubscriptionStatus; error?: string }> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, trial_ends_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // It's not necessarily an error if a profile isn't found, 
      // so we don't log it as a hard error. The action can decide what to do.
      return { success: false, error: 'Profile not found or error fetching subscription data.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in getSubscriptionData:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
