'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// import Image from 'next/image' // Removed as image panels are being removed
import { MinimalSignupFormData, minimalSignupSchema } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'An error occurred during signup'
}

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MinimalSignupFormData>({
    resolver: zodResolver(minimalSignupSchema),
  })

  const onSubmit = async (data: MinimalSignupFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Create account with minimal data
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If signup successful, create comprehensive profile immediately
      if (authData.user) {
        console.log('Account created successfully, creating comprehensive profile...')

        // Create comprehensive profile with all required fields
        const profileData = {
          id: authData.user.id,
          email: authData.user.email || data.email,
          name: data.name,
          age: 25, // Default age, user can update during onboarding
          fitness_goals: 'Get fit', // Default goal
          weight_unit: 'kg', // Default weight unit
          onboarding_completed: false,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          is_premium: false,
          primary_training_focus: null, // Will be set during onboarding
          experience_level: null, // Will be set during onboarding
          onboarding_responses: null, // Will be set during onboarding
          profile_picture_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log('Creating profile with data:', JSON.stringify(profileData, null, 2))

        const { error: profileError } = await supabase.from('profiles').upsert(profileData)

        if (profileError) {
          console.error('Error creating profile:', profileError)
          setError('Failed to create your profile. Please try again.')
          return
        }

        console.log('Profile created successfully, redirecting to onboarding...')
        router.push('/onboarding')
      }
    } catch (err: unknown) {
      console.error('Signup error:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="block mx-auto text-center text-3xl font-bold text-indigo-600 hover:text-indigo-700 mb-2"
        >
          FitnessTracker
        </Link>
        <h2 className="mt-1 text-center text-2xl font-semibold text-gray-800">
          Start Your 7-Day Free Trial
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-500">
          No credit card required • Cancel anytime • Full access to all features
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  placeholder="Your full name"
                  disabled={isLoading}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  placeholder="Create a password"
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Starting your trial...' : 'Start 7-Day Free Trial'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-xs text-gray-400">
              Your trial starts immediately. Upgrade to a paid plan anytime during or after your free trial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
