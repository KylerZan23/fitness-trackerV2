'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Zap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hasProAccess, getSubscriptionStatus, SubscriptionStatus } from '@/lib/subscription'
import { getUserProfile } from '@/lib/db/index'

interface ProFeatureGateProps {
  children: ReactNode
  fallback?: ReactNode
  featureName?: string
  featureDescription?: string
  className?: string
}

/**
 * Pro Feature Gate Component
 * 
 * Renders children only if user has Pro access.
 * Shows upgrade prompt for non-Pro users.
 */
export function ProFeatureGate({
  children,
  fallback,
  featureName = 'Advanced Analytics',
  featureDescription = 'Access detailed insights, advanced charts, and in-depth analysis of your training data.',
  className = ''
}: ProFeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        const profile = await getUserProfile()
        if (!profile) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        const [accessResult, statusResult] = await Promise.all([
          hasProAccess(profile.id),
          getSubscriptionStatus(profile.id)
        ])

        setHasAccess(accessResult)
        setSubscriptionStatus(statusResult)
      } catch (error) {
        console.error('Error checking Pro access:', error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [])

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <Card className="bg-gray-50">
          <CardHeader className="pb-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  // Show fallback if provided, otherwise show default upgrade prompt
  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <div className={className}>
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 flex items-center space-x-2">
                <span>{featureName}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Pro
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                {featureDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-white rounded-lg p-6 border border-purple-100">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unlock Pro Features
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {subscriptionStatus?.isStandard 
                    ? 'Upgrade to Pro to access advanced analytics and insights.'
                    : 'Unlock powerful analytics and take your training to the next level.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-6 text-left">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Volume progression tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Enhanced PR analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Muscle group fatigue analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Advanced data export</span>
                </div>
              </div>

              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  {subscriptionStatus?.isStandard ? 'Upgrade to Pro' : 'Choose Your Plan'}
                </Button>
              </Link>

              {subscriptionStatus?.isTrialActive && (
                <p className="text-xs text-gray-500 mt-3">
                  {subscriptionStatus.daysRemaining} days left in your trial
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simple hook to check Pro access
 */
export function useProAccess() {
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        const profile = await getUserProfile()
        if (profile) {
          const access = await hasProAccess(profile.id)
          setHasAccess(access)
        }
      } catch (error) {
        console.error('Error checking Pro access:', error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [])

  return { hasAccess, isLoading }
}