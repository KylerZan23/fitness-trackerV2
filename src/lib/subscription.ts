import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export interface SubscriptionStatus {
  hasAccess: boolean
  isPremium: boolean
  isTrialActive: boolean
  trialEndsAt: string | null
  daysRemaining: number | null
}

/**
 * Check if a user has active access (premium subscription or active trial)
 * @param userId - The user ID to check
 * @returns Promise<SubscriptionStatus> - Detailed subscription status
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_premium, trial_ends_at')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Default to no access if profile not found or error occurred
      return {
        hasAccess: false,
        isPremium: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: null,
      }
    }

    const now = new Date()
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialActive = trialEndsAt ? trialEndsAt > now : false
    const daysRemaining = trialEndsAt 
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    return {
      hasAccess: profile.is_premium || isTrialActive,
      isPremium: profile.is_premium || false,
      isTrialActive,
      trialEndsAt: profile.trial_ends_at,
      daysRemaining,
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      hasAccess: false,
      isPremium: false,
      isTrialActive: false,
      trialEndsAt: null,
      daysRemaining: null,
    }
  }
}

/**
 * Simple check if user has access to premium features
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user has access (premium or active trial)
 */
export async function hasActiveAccess(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.hasAccess
}

/**
 * Start a 7-day trial for a new user
 * @param userId - The user ID to start trial for
 * @returns Promise<boolean> - True if trial was started successfully
 */
export async function startTrial(userId: string): Promise<boolean> {
  try {
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        trial_ends_at: trialEndDate,
        is_premium: false,
      })
      .eq('id', userId)
      .is('trial_ends_at', null) // Only update if trial hasn't been set yet

    return !error
  } catch (error) {
    console.error('Error starting trial:', error)
    return false
  }
}

/**
 * Upgrade user to premium subscription
 * @param userId - The user ID to upgrade
 * @returns Promise<boolean> - True if upgrade was successful
 */
export async function upgradeToPremium(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        // Note: trial_ends_at is kept for historical purposes
      })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error upgrading to premium:', error)
    return false
  }
}

/**
 * Cancel premium subscription (downgrade to free/expired trial)
 * @param userId - The user ID to downgrade
 * @returns Promise<boolean> - True if downgrade was successful
 */
export async function cancelPremium(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: false,
        // Note: trial_ends_at remains unchanged for historical tracking
      })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error canceling premium:', error)
    return false
  }
}

/**
 * Get user-friendly subscription status message
 * @param status - The subscription status object
 * @returns string - Human-readable status message
 */
export function getSubscriptionMessage(status: SubscriptionStatus): string {
  if (status.isPremium) {
    return 'Premium Subscription Active'
  }
  
  if (status.isTrialActive && status.daysRemaining !== null) {
    if (status.daysRemaining === 0) {
      return 'Trial expires today'
    } else if (status.daysRemaining === 1) {
      return '1 day left in trial'
    } else {
      return `${status.daysRemaining} days left in trial`
    }
  }
  
  return 'Trial expired - Upgrade to continue'
} 