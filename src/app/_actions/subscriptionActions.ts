'use server'

import { createClient } from '@/utils/supabase/server'
import { getSubscriptionData } from '@/lib/data/subscription';
import { hasActiveSubscription } from '@/lib/permissions'

export async function checkSubscriptionStatus(): Promise<{
  hasAccess: boolean
  isPremium: boolean
  isTrialActive: boolean
  trialEndsAt: string | null
  daysRemaining: number | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        hasAccess: false,
        isPremium: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: null
      }
    }

    const userHasAccess = await hasActiveSubscription(user.id)
    
    // Get detailed subscription info
    const result = await getSubscriptionData(user.id);

    if (!result.success || !result.data) {
      return {
        hasAccess: userHasAccess,
        isPremium: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: null
      }
    }

    const now = new Date()
    const trialEndsAt = result.data.trial_ends_at ? new Date(result.data.trial_ends_at) : null
    const isTrialActive = trialEndsAt ? trialEndsAt > now : false
    const daysRemaining = trialEndsAt && isTrialActive 
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      hasAccess: userHasAccess,
      isPremium: result.data.is_premium || false,
      isTrialActive,
      trialEndsAt: result.data.trial_ends_at,
      daysRemaining
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      hasAccess: false,
      isPremium: false,
      isTrialActive: false,
      trialEndsAt: null,
      daysRemaining: null
    }
  }
} 