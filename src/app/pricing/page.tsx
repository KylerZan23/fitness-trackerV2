'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getClientEnv } from '@/lib/env'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Star, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession } from '@/app/_actions/stripeActions'

const supabase = createClient()

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const expired = searchParams.get('expired') === 'true'
  const feature = searchParams.get('feature') || 'premium features'

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

  const startFreeTrial = async () => {
    try {
      // Check if user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // Redirect to signup if not logged in
        router.push('/signup')
        return
      }

      // User is logged in - redirect to program page (trial should auto-start)
      router.push('/program')
    } catch (err) {
      console.error('Error starting trial:', err)
      router.push('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="text-2xl font-bold text-gray-900">NeuralLift</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          {expired && (
            <Alert className="mb-6 max-w-2xl mx-auto">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your free trial has expired. Upgrade to premium to continue accessing {feature}.
              </AlertDescription>
            </Alert>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 7-day free trial. Cancel anytime. No commitment required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Trial */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">Free Trial</CardTitle>
              <CardDescription className="text-lg">Perfect for getting started</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">Free</div>
                <div className="text-gray-500">7 days</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Full AI-generated training programs</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>AI Coach weekly reviews</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Basic workout tracking</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Progress analytics</span>
                </li>
              </ul>
              <Button
                onClick={startFreeTrial}
                className="w-full"
                size="lg"
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Standard Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">Standard</CardTitle>
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
                  <span>AI Coach weekly reviews</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Basic progress analytics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Community access</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSubscribe(getClientEnv().NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY)}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Get Standard'}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-purple-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-500 text-white px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Advanced
              </Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold">Pro</CardTitle>
              <CardDescription className="text-lg">For serious athletes</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$19.99</div>
                <div className="text-gray-500">per month</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Everything in Standard</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">Advanced Analytics Dashboard</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">Volume Progression Tracking</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">Enhanced PR Analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">Fatigue & Recovery Insights</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium">Data Export Capabilities</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSubscribe('price_pro_monthly')} // TODO: Add actual Stripe Pro price ID
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Get Pro'}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>

          {/* Pro Annual Plan */}
          <Card className="relative border-2 border-blue-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Best Value
              </Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold">Pro Annual</CardTitle>
              <CardDescription className="text-lg">Best value for committed athletes</CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold text-gray-900">$159.99</div>
                <div className="text-gray-500">per year</div>
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save 33% vs Pro monthly
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">Advanced Program Periodization</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">AI-Powered Training Recommendations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">Custom Report Generation</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">Early Access to New Features</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority customer support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSubscribe('price_pro_annual')} // TODO: Add actual Stripe Pro Annual price ID
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Save 33% Annually'}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my free trial ends?
              </h3>
              <p className="text-gray-600">
                Your account will switch to read-only mode. You'll still be able to view your data, 
                but won't be able to generate new programs or access AI Coach features until you upgrade.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue to have access 
                until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What's included in the AI program generation?
              </h3>
              <p className="text-gray-600">
                Our AI analyzes your goals, experience level, available equipment, and training preferences 
                to create a completely personalized training program with proper periodization and progression.
              </p>
            </div>
          </div>
        </div>

        {/* Back to app link */}
        <div className="text-center mt-12">
          <Link href="/program" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to your training program
          </Link>
        </div>
      </div>
    </div>
  )
}