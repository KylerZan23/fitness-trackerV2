'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getUserProfile } from '@/lib/db/index'
import { getSubscriptionStatus } from '@/lib/subscription'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Brain, Lock, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIWeeklyReviewContent } from '@/components/ai-coach/AIWeeklyReviewContent'
import { AICoachContent } from '@/components/ai-coach/AICoachContent'
import { WeakPointAnalysisContent } from '@/components/ai-coach/WeakPointAnalysisContent'

const supabase = createClient()

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
}

interface SubscriptionStatus {
  hasAccess: boolean
  isPremium: boolean
  isTrialActive: boolean
  trialEndsAt: string | null
  daysRemaining: number | null
}

export default function AICoachPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user session
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/login')
          return
        }

        // Get user profile
        const userProfile = await getUserProfile(supabase)
        if (userProfile) {
          setProfile({
            id: userProfile.id,
            name: userProfile.name || 'User',
            email: userProfile.email || '',
            profile_picture_url: userProfile.profile_picture_url
          })
        }

        // Check subscription status
        const subStatus = await getSubscriptionStatus(user.id)
        setSubscriptionStatus(subStatus)

      } catch (err) {
        console.error('Error loading AI Coach data:', err)
        setError('Unable to load AI Coach. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarProps = {
    userName: profile?.name || 'User',
    userEmail: profile?.email,
    profilePictureUrl: profile?.profile_picture_url || null,
    onLogout: handleLogout,
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
                <p className="text-gray-600 mt-1">
                  Loading your personalized coaching experience...
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading AI Coach</h1>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // No access - show upgrade prompt
  if (subscriptionStatus && !subscriptionStatus.hasAccess) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
                <p className="text-gray-600 mt-1">
                  Get personalized coaching insights and recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-orange-900">AI Coach Premium Feature</CardTitle>
              <CardDescription className="text-orange-700 text-lg">
                Unlock personalized coaching insights, weekly performance analysis, and intelligent recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Feature Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Weekly Performance Review</h4>
                    <p className="text-sm text-orange-700">AI-powered analysis of your training patterns and progress</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Personalized Recommendations</h4>
                    <p className="text-sm text-orange-700">Daily workout suggestions based on your data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Weak Point Analysis</h4>
                    <p className="text-sm text-orange-700">Identify and target strength imbalances</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Interactive Q&A</h4>
                    <p className="text-sm text-orange-700">Ask follow-up questions about your training</p>
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              {subscriptionStatus?.isTrialActive === false && subscriptionStatus?.trialEndsAt && (
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <p className="text-orange-800 font-medium">Your free trial has ended</p>
                  <p className="text-orange-700 text-sm">Upgrade to continue using AI Coach features</p>
                </div>
              )}

              {/* CTA Button */}
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
                onClick={() => router.push('/pricing')}
              >
                Upgrade to Premium
              </Button>
              
              <p className="text-xs text-orange-600">
                Get unlimited access to all AI Coach features
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Main AI Coach Dashboard (Premium Access)
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
                <p className="text-gray-600 mt-1">
                  Your personalized fitness coaching experience
                </p>
              </div>
            </div>
            
            {/* Subscription Status Badge */}
            <div>
              {subscriptionStatus?.isPremium ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Premium Active
                </Badge>
              ) : subscriptionStatus?.isTrialActive ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Trial - {subscriptionStatus.daysRemaining} days left
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* AI Coach Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Review Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span>Weekly Performance Review</span>
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your past week's training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIWeeklyReviewContent />
            </CardContent>
          </Card>

          {/* Daily Recommendations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Today's Recommendations</span>
              </CardTitle>
              <CardDescription>
                Personalized workout and training suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AICoachContent />
            </CardContent>
          </Card>

          {/* Weak Point Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-orange-600" />
                <span>Weak Point Analysis</span>
              </CardTitle>
              <CardDescription>
                Identify and target strength imbalances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakPointAnalysisContent />
            </CardContent>
          </Card>

          {/* Goal Setting & Tracking - Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Goal Coaching</span>
              </CardTitle>
              <CardDescription>
                AI-guided goal setting and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600 text-sm">
                  Intelligent goal setting with AI-powered progress coaching
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial Warning for Trial Users */}
        {subscriptionStatus?.isTrialActive && subscriptionStatus?.daysRemaining && subscriptionStatus.daysRemaining <= 3 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-orange-900">
                  Your trial expires in {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-orange-700">
                  Upgrade now to continue using AI Coach features
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                onClick={() => router.push('/pricing')}
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}