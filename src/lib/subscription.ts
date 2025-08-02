import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export type SubscriptionTier = 'trial' | 'standard' | 'pro'

export interface SubscriptionStatus {
  hasAccess: boolean
  isPremium: boolean
  isPro: boolean
  isStandard: boolean
  isTrialActive: boolean
  subscriptionTier: SubscriptionTier
  trialEndsAt: string | null
  daysRemaining: number | null
  isReadOnlyMode: boolean
  trialExpired: boolean
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
      .select('is_premium, trial_ends_at, subscription_tier')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      // Default to no access if profile not found or error occurred
      return {
        hasAccess: false,
        isPremium: false,
        isPro: false,
        isStandard: false,
        isTrialActive: false,
        subscriptionTier: 'trial',
        trialEndsAt: null,
        daysRemaining: null,
        isReadOnlyMode: true,
        trialExpired: true,
      }
    }

    const now = new Date()
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialActive = trialEndsAt ? trialEndsAt > now : false
    const trialExpired = trialEndsAt ? trialEndsAt <= now : false
    const daysRemaining = trialEndsAt 
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null

    const subscriptionTier: SubscriptionTier = profile.subscription_tier || 'trial'
    const isPro = subscriptionTier === 'pro'
    const isStandard = subscriptionTier === 'standard'
    const isPremium = isPro || isStandard || profile.is_premium
    const hasAccess = isPremium || isTrialActive
    const isReadOnlyMode = !hasAccess && trialExpired

    return {
      hasAccess,
      isPremium,
      isPro,
      isStandard,
      isTrialActive,
      subscriptionTier,
      trialEndsAt: profile.trial_ends_at,
      daysRemaining,
      isReadOnlyMode,
      trialExpired,
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      hasAccess: false,
      isPremium: false,
      isPro: false,
      isStandard: false,
      isTrialActive: false,
      subscriptionTier: 'trial',
      trialEndsAt: null,
      daysRemaining: null,
      isReadOnlyMode: true,
      trialExpired: true,
    }
  }
}

/**
 * Simple check if user has access to premium features
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user has access (premium or active trial)
 */
export async function hasActiveAccess(userId: string): Promise<boolean> {
  try {
    // Use database function for consistent timezone handling
    const { data, error } = await supabase
      .rpc('has_active_access', { user_id: userId })
    
    if (error) {
      console.error('Error checking active access:', error)
      // Fallback to subscription status check
      const status = await getSubscriptionStatus(userId)
      return status.hasAccess
    }
    
    return data || false
  } catch (error) {
    console.error('Error in hasActiveAccess:', error)
    // Fallback to subscription status check
    const status = await getSubscriptionStatus(userId)
    return status.hasAccess
  }
}

/**
 * Start a 7-day trial for a new user using database function
 * @param userId - The user ID to start trial for
 * @returns Promise<boolean> - True if trial was started successfully
 */
export async function startTrial(userId: string): Promise<boolean> {
  try {
    // Use database function for consistent timezone handling
    const { error } = await supabase
      .rpc('start_user_trial', { user_id: userId })

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
/**
 * Check if the current user is in read-only mode (trial expired, no premium subscription)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user should be in read-only mode
 */
export async function isReadOnlyMode(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isReadOnlyMode
}

/**
 * Get subscription status from middleware headers (client-side)
 * This is used to avoid additional database calls on the client
 */
export function getSubscriptionStatusFromHeaders(): {
  isReadOnlyMode: boolean
  trialExpired: boolean
  daysRemaining: number | null
} {
  if (typeof window === 'undefined') {
    return { isReadOnlyMode: false, trialExpired: false, daysRemaining: null }
  }

  // These headers would be set by middleware and passed through response
  const isReadOnlyMode = document.querySelector('meta[name="x-read-only-mode"]')?.getAttribute('content') === 'true'
  const trialExpired = document.querySelector('meta[name="x-trial-expired"]')?.getAttribute('content') === 'true'
  const daysRemainingStr = document.querySelector('meta[name="x-trial-days-remaining"]')?.getAttribute('content')
  const daysRemaining = daysRemainingStr ? parseInt(daysRemainingStr, 10) : null

  return { isReadOnlyMode, trialExpired, daysRemaining }
}

/**
 * Check if user has Pro tier access specifically
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user has Pro tier subscription
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isPro
}

/**
 * Check if user has Standard tier access (includes Pro)
 * @param userId - The user ID to check  
 * @returns Promise<boolean> - True if user has Standard or Pro tier subscription
 */
export async function hasStandardAccess(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isStandard || status.isPro
}

/**
 * Get user's subscription tier
 * @param userId - The user ID to check
 * @returns Promise<SubscriptionTier> - User's current subscription tier
 */
export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const status = await getSubscriptionStatus(userId)
  return status.subscriptionTier
}

/**
 * Upgrade user to Pro tier
 * @param userId - The user ID to upgrade
 * @returns Promise<boolean> - True if upgrade was successful
 */
export async function upgradeToProTier(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        is_premium: true,
      })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error upgrading to Pro tier:', error)
    return false
  }
}

/**
 * Upgrade user to Standard tier  
 * @param userId - The user ID to upgrade
 * @returns Promise<boolean> - True if upgrade was successful
 */
export async function upgradeToStandardTier(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'standard',
        is_premium: true,
      })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error upgrading to Standard tier:', error)
    return false
  }
}

export function getSubscriptionMessage(status: SubscriptionStatus): string {
  if (status.isPro) {
    return 'Pro Subscription Active'
  }
  
  if (status.isStandard) {
    return 'Standard Subscription Active'
  }
  
  if (status.isPremium && !status.isPro && !status.isStandard) {
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