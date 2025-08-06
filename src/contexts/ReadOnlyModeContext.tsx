'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getSubscriptionStatus, type SubscriptionStatus } from '@/lib/subscription'

interface ReadOnlyModeContextType {
  isReadOnlyMode: boolean
  subscriptionStatus: SubscriptionStatus | null
  isLoading: boolean
  refreshStatus: () => Promise<void>
  showUpgradePrompt: (featureName?: string) => void
}

const ReadOnlyModeContext = createContext<ReadOnlyModeContextType | undefined>(undefined)

interface ReadOnlyModeProviderProps {
  children: React.ReactNode
}

export function ReadOnlyModeProvider({ children }: ReadOnlyModeProviderProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshStatus = async () => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscriptionStatus(null)
        setIsLoading(false)
        return
      }

      const status = await getSubscriptionStatus(user.id)
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error refreshing subscription status:', error)
      // Default to read-only mode on error
      setSubscriptionStatus({
        hasAccess: false,
        isPremium: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: null,
        isReadOnlyMode: true,
        trialExpired: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const showUpgradePrompt = (featureName = 'this feature') => {
    // Show upgrade modal or redirect to pricing page
    const message = `Your free trial has expired. Upgrade to premium to access ${featureName}.`
    
    if (confirm(`${message}\n\nWould you like to upgrade now?`)) {
      // In a real implementation, this would redirect to a pricing page
      // For now, we'll just log the action
      console.log('User requested upgrade:', featureName)
      // router.push('/pricing')
    }
  }

  useEffect(() => {
    refreshStatus()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshStatus()
    })

    return () => subscription.unsubscribe()
  }, [])

  const value: ReadOnlyModeContextType = {
    isReadOnlyMode: subscriptionStatus?.isReadOnlyMode ?? false,
    subscriptionStatus,
    isLoading,
    refreshStatus,
    showUpgradePrompt,
  }

  return (
    <ReadOnlyModeContext.Provider value={value}>
      {children}
    </ReadOnlyModeContext.Provider>
  )
}

export function useReadOnlyMode(): ReadOnlyModeContextType {
  const context = useContext(ReadOnlyModeContext)
  if (context === undefined) {
    throw new Error('useReadOnlyMode must be used within a ReadOnlyModeProvider')
  }
  return context
}

/**
 * Hook to handle read-only mode restrictions
 * Returns a function that checks if an action is allowed and shows upgrade prompt if not
 */
export function useReadOnlyGuard() {
  const { isReadOnlyMode, showUpgradePrompt } = useReadOnlyMode()

  return (featureName?: string): boolean => {
    if (isReadOnlyMode) {
      showUpgradePrompt(featureName)
      return false
    }
    return true
  }
}