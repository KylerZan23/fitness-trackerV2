'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getClientEnv } from '@/lib/env'
import { getUserWorkoutStats } from '@/app/_actions/profileActions'
import { createCheckoutSession } from '@/app/_actions/stripeActions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Star, TrendingUp, Dumbbell, Target, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

const supabase = createClient()

interface WorkoutStats {
  totalWorkouts: number
  totalWorkoutsThisMonth: number
  totalWeightLifted: number
  averageWorkoutsPerWeek: number
  mostActiveDay: string
  personalRecordCount: number
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<WorkoutStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  
  const expired = searchParams.get('expired') === 'true'
  const feature = searchParams.get('feature') || 'premium features'
  const from = searchParams.get('from') || 'app'

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const result = await getUserWorkoutStats()
        if (result.success && result.data) {
          setUserStats(result.data)
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchUserStats()
  }, [router])

  const handleSubscribe = async (priceId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } = getClientEnv()
      const stripe = await loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await createCheckoutSession(priceId)

      if (result.sessionId && stripe) {
        await stripe.redirectToCheckout({ sessionId: result.sessionId })
      } else {
        throw new Error(result.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getContextualMessage = () => {
    if (expired) {
      return {
        title: "Your 7-Day Trial Has Ended",
        subtitle: "Continue your fitness journey with full access to all features",
        icon: <Lock className="h-8 w-8 text-orange-500" />
      }
    } else {
      return {
        title: `Unlock ${feature}`,
        subtitle: "Upgrade to access advanced features and take your training to the next level",
        icon: <Target className="h-8 w-8 text-blue-500" />
      }
    }
  }

  const message = getContextualMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={from === 'pricing' ? '/pricing' : '/program'}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h1>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contextual Message */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            {message.icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {message.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {message.subtitle}
          </p>
        </div>

        {/* Progress Showcase */}
        {!statsLoading && userStats && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Look at the progress you've already made!
              </h3>
              <p className="text-gray-600">
                Don't lose momentum - continue your fitness journey with premium features
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <Dumbbell className="h-12 w-12 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {userStats.totalWorkouts}
                  </div>
                  <p className="text-gray-600">Workouts Completed</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <TrendingUp className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {userStats.totalWeightLifted.toLocaleString()} lbs
                  </div>
                  <p className="text-gray-600">Total Weight Lifted</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <Target className="h-12 w-12 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {userStats.averageWorkoutsPerWeek}
                  </div>
                  <p className="text-gray-600">Avg Workouts/Week</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-700">
                You've been most active on <span className="font-semibold text-blue-600">{userStats.mostActiveDay}s</span> and completed{' '}
                <span className="font-semibold text-green-600">{userStats.totalWorkoutsThisMonth}</span> workouts this month!
              </p>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">Monthly</CardTitle>
              <CardDescription className="text-lg">For consistent training</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$9.99</div>
                <div className="text-gray-500">per month</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited AI program generation</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Full AI Coach access</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Community access</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSubscribe(getClientEnv().NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY)}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Subscribe Monthly'}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="relative border-2 border-blue-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold">Annual</CardTitle>
              <CardDescription className="text-lg">Best value for serious athletes</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$39.99</div>
                <div className="text-gray-500">per year</div>
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save 67% vs monthly
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Everything in Monthly</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Advanced program periodization</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Detailed strength analytics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Export capabilities</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Early access to new features</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSubscribe(getClientEnv().NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL)}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Save 67% Annually'}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Why upgrade now?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-900">7-day trial included</div>
                <div>Start with confidence</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Cancel anytime</div>
                <div>No long-term commitment</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Secure payment</div>
                <div>Powered by Stripe</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mt-8 max-w-2xl mx-auto">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}