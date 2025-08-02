'use server'

import { createClient } from '@/utils/supabase/server'
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_premium, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return {
        hasAccess: userHasAccess,
        isPremium: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: null
      }
    }

    const now = new Date()
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialActive = trialEndsAt ? trialEndsAt > now : false
    const daysRemaining = trialEndsAt && isTrialActive 
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      hasAccess: userHasAccess,
      isPremium: profile.is_premium || false,
      isTrialActive,
      trialEndsAt: profile.trial_ends_at,
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