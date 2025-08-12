'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
// import Image from 'next/image' // Removed as image panel is being removed
import { LoginFormData, loginSchema } from '@/lib/schemas'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label' // Added
import { Input } from '@/components/ui/input' // Added
import { Button } from '@/components/ui/button' // Added

interface AuthError {
  message: string
  status?: number
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSessionInfo, setShowSessionInfo] = useState(false)

  // Check if the page was accessed with a bypass parameter
  const bypassAuth = searchParams?.get('bypass') === 'true'
  // Check if the page was accessed with a force_login parameter
  const forceLogin = searchParams?.get('force_login') === 'true'
  // Check if there's a redirect URL
  const redirectTo = searchParams?.get('redirectTo') || '/workouts'

  // If accessed with bypass, show a notice about being logged in
  useEffect(() => {
    if (bypassAuth && !forceLogin) {
      const checkSession = async () => {
        // Use getSession() instead of getUser() for secure authentication verification
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setShowSessionInfo(true)
        }
      }

      checkSession()
    }
  }, [bypassAuth, forceLogin])

  // Force logout function
  const handleForceLogout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Sign out from Supabase
      const supabase = createClient()
      await supabase.auth.signOut()

      // Clear any local storage items related to auth
      localStorage.removeItem('supabase.auth.token')

      // Show success message
      toast.success('Successfully signed out')

      setShowSessionInfo(false)

      // Refresh the page with force_login parameter to ensure we can access the login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login?force_login=true'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    } finally {
      setIsLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Starting login process...')
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()

      // First, ensure we're starting with a clean state by signing out
      if (forceLogin) {
        console.log('Force login detected, signing out first to ensure clean state')
        await supabase.auth.signOut()
        // Small delay to ensure signout is processed
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Sign in with password
      console.log('Attempting to sign in with credentials...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw new Error(signInError.message)
      }

      if (!signInData?.session) {
        console.error('No session created after sign in')
        throw new Error('No session created')
      }

      console.log('Sign in successful, session created')

      // Store the user ID for profile operations - this is from the successful sign-in response
      const userId = signInData.session.user.id
      const userEmail = signInData.session.user.email || ''

      // Log the full session details for debugging
      console.log('=== Session Debug Information ===')
      console.log('Session:', {
        accessToken: `${signInData.session.access_token.substring(0, 10)}...`,
        tokenExpiry: new Date(signInData.session.expires_at! * 1000).toISOString(),
        user: {
          id: userId,
          email: userEmail,
          role: signInData.session.user.role,
          lastSignIn: signInData.session.user.last_sign_in_at,
        },
        provider: signInData.session.user.app_metadata?.provider,
      })

      // Give Supabase more time to persist the session in cookies
      console.log('Waiting for session to be properly persisted...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify session is properly established - with retry mechanism
      let sessionVerified = false
      let retryCount = 0
      const maxRetries = 3

      while (!sessionVerified && retryCount < maxRetries) {
        try {
          console.log(`Session verification attempt ${retryCount + 1}/${maxRetries}...`)

          // Use getSession() for secure authentication verification
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            console.warn(`Session verification error on attempt ${retryCount + 1}:`, sessionError)
            // Wait longer between retries
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
            retryCount++
            continue
          }

          if (!sessionData.session) {
            console.warn(`No session found on attempt ${retryCount + 1}, waiting longer...`)
            // Wait longer between retries
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
            retryCount++
            continue
          }

          // Session verified successfully
          console.log('Session verified and persisted successfully')
          sessionVerified = true
        } catch (error) {
          console.error(`Session verification exception on attempt ${retryCount + 1}:`, error)
          // Wait longer between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          retryCount++
        }
      }

      // If we couldn't verify the session after all retries, we'll continue anyway
      // since we have the initial session from signInWithPassword
      if (!sessionVerified) {
        console.warn(
          'Could not verify session persistence after multiple attempts. Continuing with initial session data.'
        )
        // We'll continue with the initial session from signInWithPassword
      }

      // Check/create profile using the user ID from the initial sign-in
      console.log('Checking user profile...')
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.log('Profile not found, creating new profile...')

          // Create profile data object with required fields and proper typing
          interface ProfileData {
            id: string
            email: string
            name: string
            created_at: string
            updated_at: string
            age?: number
            fitness_goals?: string
          }

          const profileData: ProfileData = {
            id: userId,
            email: userEmail,
            name: signInData.session.user.user_metadata?.name || userEmail.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Add optional fields only if they exist in user metadata
          if (signInData.session.user.user_metadata?.age) {
            profileData.age = signInData.session.user.user_metadata.age
          }

          if (signInData.session.user.user_metadata?.fitness_goals) {
            profileData.fitness_goals = signInData.session.user.user_metadata.fitness_goals
          } else {
            profileData.fitness_goals = 'Get fit' // Default value
          }

          // Prefer RPC that creates profile and sets 7-day trial
          const { error: rpcCreateError } = await supabase.rpc('create_profile_for_new_user', {
            user_id: userId,
            user_email: userEmail,
            user_name: profileData.name,
          })

          // If RPC fails (e.g., already exists), fall back to upsert
          const { error: createError } = rpcCreateError
            ? await supabase.from('profiles').upsert(profileData)
            : { error: null as any }

          if (rpcCreateError && createError) {
            // Log detailed error information
            console.error('Profile creation error:', JSON.stringify(createError, null, 2))

            // Check if this is an RLS policy error
            if (createError.code === '42501') {
              console.warn(
                'Row-Level Security policy violation - trying server-side profile creation'
              )

              // Add a small delay to ensure session is fully established
              await new Promise(resolve => setTimeout(resolve, 1000))

              // Log access token availability
              console.log(`Access token available: ${!!signInData.session.access_token}`)
              if (signInData.session.access_token) {
                console.log(
                  `Token length: ${signInData.session.access_token.length}, First 10 chars: ${signInData.session.access_token.substring(0, 10)}...`
                )
              }

              // Verify session before proceeding
              console.log('Verifying user before server-side profile creation')
              const { data: sessionData, error: sessionVerifyError } =
                await supabase.auth.getSession()

              if (sessionVerifyError) {
                console.error('Session verification error:', sessionVerifyError)
              }

              console.log(`Verified session exists: ${!!sessionData.session}`)
              console.log(`User ID: ${sessionData.session?.user.id}`)

              // Increase delay to 1.5 seconds to ensure token propagation
              console.log('Adding additional delay before API call for token propagation...')
              await new Promise(resolve => setTimeout(resolve, 1500))

              // Attempt to create profile using our server-side API
              try {
                console.log('Sending profile creation request to server API...')
                console.log(`Using token from verified session: ${!!sessionData.session?.user.id}`)
                console.log(`Using user ID: ${userId}`)

                const response = await fetch('/api/create-profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: userId,
                    email: userEmail,
                    name:
                      signInData.session.user.user_metadata?.name ||
                      userEmail.split('@')[0] ||
                      'User',
                    fitness_goals:
                      signInData.session.user.user_metadata?.fitness_goals || 'Get fit',
                    age: signInData.session.user.user_metadata?.age,
                    auth_token: signInData.session.access_token,
                  }),
                })

                const result = await response.json()

                if (response.ok) {
                  console.log('Profile created via server API:', result.message)
                } else {
                  console.error('Server profile creation failed:', result.error)
                  console.error('Response status:', response.status)
                  console.error('Response status text:', response.statusText)

                  // Check for specific error types
                  if (result.error && result.error.includes('Auth session missing')) {
                    console.error(
                      'Auth session missing detected - this suggests token verification issues'
                    )
                    console.log('Possible causes:')
                    console.log('1. Token not propagated to server yet')
                    console.log('2. Token expired between client verification and server use')
                    console.log('3. Token format issues between client and server')
                  }

                  setError(`Profile creation error: ${result.error}`)
                  console.log('Continuing with login despite profile creation failure')
                }
              } catch (apiError) {
                console.error('Error calling profile creation API:', apiError)
                setError('Failed to create profile. Please try again.')
                console.log('Continuing with login despite profile creation API error')
              }
            } else {
              console.log('Continuing without profile creation due to unexpected error')
            }
          } else if (!rpcCreateError) {
            console.log('Profile created with trial via RPC')
          } else {
            console.log('Profile created successfully (fallback upsert)')
            // Ensure trial is started if RPC wasn't used
            await supabase.rpc('start_user_trial', { user_id: userId })
          }
        } else {
          console.log('Existing profile found')
        }
      } catch (profileError) {
        // Log with more detail
        console.error(
          'Profile check/create error:',
          typeof profileError === 'object' ? JSON.stringify(profileError, null, 2) : profileError
        )
        console.log('Continuing without profile verification')
      }

      // Show success message
      toast.success('Login successful!')

      // TODO: Implement subscription-based redirect logic
      // Future enhancement: Check user subscription status and redirect accordingly
      // Suggested implementation:
      // 1. Add `subscription_status`, `trial_ends_at`, `subscription_tier` to profiles table
      // 2. Query these fields during login
      // 3. Redirect logic:
      //    - If trial_ends_at > now() OR subscription_status = 'active': redirect to /program
      //    - If trial expired AND no subscription: redirect to /pricing or /upgrade
      //    - New users: automatically start 7-day trial with trial_ends_at = now() + 7 days
      
      // We'll use the initial session from signInWithPassword for navigation
      // instead of requiring another verification that might fail
      console.log('Login successful, redirecting to dashboard...')
      router.push(redirectTo)
    } catch (err) {
      console.error('Login process error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
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
          NeuralLift
        </Link>
        <h2 className="mt-1 text-center text-2xl font-semibold text-gray-800">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {showSessionInfo && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
              <h3 className="text-yellow-700 font-medium">You're already logged in</h3>
              <p className="text-yellow-600 text-sm mt-1 mb-3">
                You currently have an active session. Do you want to continue with your current
                session or sign in with a different account?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/workouts')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Continue to Program
                </Button>
                <Button
                  onClick={handleForceLogout}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {isLoading ? 'Signing Out...' : 'Sign Out & Use Different Account'}
                </Button>
              </div>
            </div>
          )}

          {forceLogin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-md">
              <h3 className="text-blue-700 font-medium">Fresh Login</h3>
              <p className="text-blue-600 text-sm mt-1 mb-3">
                You're accessing the login page directly. Please sign in with your credentials.
              </p>
            </div>
          )}

          {!forceLogin && !showSessionInfo && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-300 rounded-md">
              <h3 className="text-purple-700 font-medium">Having trouble signing in?</h3>
              <p className="text-purple-600 text-sm mt-1 mb-3">
                If you're experiencing authentication issues, try a complete sign out first.
              </p>
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login?force_login=true'
                  }
                }}
                variant="outline" // Or a purple themed outline
                className="w-full"
              >
                Force Complete Sign Out
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
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
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="block mx-auto text-center text-3xl font-bold text-indigo-600 mb-2">
            NeuralLift
          </div>
          <h2 className="mt-1 text-center text-2xl font-semibold text-gray-800">
            Loading...
          </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
