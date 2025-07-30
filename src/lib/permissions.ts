import { createClient } from '@/utils/supabase/server';

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_premium, trial_ends_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  const now = new Date();
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isTrialActive = trialEndsAt ? trialEndsAt > now : false;

  return profile.is_premium || isTrialActive;
} 