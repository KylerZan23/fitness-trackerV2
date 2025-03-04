'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { LoginFormData, loginSchema } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

interface AuthError {
  message: string;
  status?: number;
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSessionInfo, setShowSessionInfo] = useState(false)

  // Check if the page was accessed with a bypass parameter
  const bypassAuth = searchParams?.get('bypass') === 'true'

  // If accessed with bypass, show a notice about being logged in
  useEffect(() => {
    if (bypassAuth) {
      const checkSession = async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setShowSessionInfo(true)
        }
      }
      
      checkSession()
    }
  }, [bypassAuth])

  // Force logout function
  const handleForceLogout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await supabase.auth.signOut()
      setShowSessionInfo(false)
      // Refresh the page
      window.location.href = '/login'
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
        provider: signInData.session.user.app_metadata?.provider
      })

      // Give Supabase a moment to persist the session in cookies
      console.log('Waiting for session to be properly persisted...')
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to verify session, but don't block login if there's an issue
      try {
        const { data: verifySession } = await supabase.auth.getSession()
        
        if (!verifySession.session) {
          console.warn('Session verification check failed, continuing with initial sign-in data')
        } else {
          console.log('Session verified and persisted successfully')
        }
      } catch (sessionError) {
        // Log but don't throw an error - we'll continue with the initial sign-in data
        console.warn('Session verification error, continuing with initial sign-in data:', sessionError)
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
            id: string;
            email: string;
            name: string;
            created_at: string;
            updated_at: string;
            age?: number;
            fitness_goals?: string;
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
            profileData.fitness_goals = 'Get fit'  // Default value
          }
          
          // Perform upsert without additional select/single to simplify operation
          const { error: createError } = await supabase
            .from('profiles')
            .upsert(profileData)

          if (createError) {
            // Log detailed error information
            console.error('Profile creation error:', JSON.stringify(createError, null, 2))
            
            // Check if this is an RLS policy error
            if (createError.code === '42501') {
              console.warn('Row-Level Security policy violation - trying server-side profile creation')
              
              // Add a small delay to ensure session is fully established
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Log access token availability
              console.log(`Access token available: ${!!signInData.session.access_token}`)
              if (signInData.session.access_token) {
                console.log(`Token length: ${signInData.session.access_token.length}, First 10 chars: ${signInData.session.access_token.substring(0, 10)}...`)
              }
              
              // Verify session before proceeding
              console.log('Verifying session before server-side profile creation')
              const { data: verifiedSession, error: sessionVerifyError } = await supabase.auth.getSession()
              
              if (sessionVerifyError) {
                console.error('Session verification error:', sessionVerifyError)
              }
              
              console.log(`Verified session exists: ${!!verifiedSession.session}`)
              console.log(`Session user ID: ${verifiedSession.session?.user.id}`)
              console.log(`Session expiry: ${verifiedSession.session ? new Date((verifiedSession.session.expires_at ?? 0) * 1000).toISOString() : 'N/A'}`)
              
              // Increase delay to 1.5 seconds to ensure token propagation
              console.log('Adding additional delay before API call for token propagation...')
              await new Promise(resolve => setTimeout(resolve, 1500))
              
              // Attempt to create profile using our server-side API
              try {
                console.log('Sending profile creation request to server API...')
                console.log(`Using token from verified session: ${!!verifiedSession.session?.access_token}`)
                console.log(`Using user ID: ${userId}`)
                
                const response = await fetch('/api/create-profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: userId,
                    email: userEmail,
                    name: signInData.session.user.user_metadata?.name || userEmail.split('@')[0] || 'User',
                    fitness_goals: signInData.session.user.user_metadata?.fitness_goals || 'Get fit',
                    age: signInData.session.user.user_metadata?.age,
                    auth_token: verifiedSession.session?.access_token || signInData.session.access_token,
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
                    console.error('Auth session missing detected - this suggests token verification issues')
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
          } else {
            console.log('Profile created successfully')
          }
        } else {
          console.log('Existing profile found')
        }
      } catch (profileError) {
        // Log with more detail
        console.error('Profile check/create error:', 
          typeof profileError === 'object' ? JSON.stringify(profileError, null, 2) : profileError)
        console.log('Continuing without profile verification')
      }

      // Navigate to dashboard after login - we don't need a second verification
      console.log('Login successful, redirecting to dashboard...')
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Login process error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel - Form */}
      <div className="w-full md:w-[480px] p-8 flex flex-col justify-between">
        <div>
          <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
        </div>
        
        <div>
          <h1 className="text-4xl font-serif mb-4">Welcome Back</h1>
          <p className="text-gray-400 mb-8">Sign in to continue your fitness journey</p>

          {/* Display session warning if user is already logged in but using bypass */}
          {showSessionInfo && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
              <h3 className="text-yellow-400 font-medium">You're already logged in</h3>
              <p className="text-gray-300 text-sm mt-1 mb-3">
                You currently have an active session. Do you want to continue with your 
                current session or sign in with a different account?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                >
                  Continue to Dashboard
                </button>
                <button
                  onClick={handleForceLogout}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg hover:bg-yellow-500/30 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing Out...' : 'Sign Out & Use Different Account'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-white hover:text-gray-300 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden md:block flex-1 relative">
        <Image 
          src="/login-bg.jpg"
          alt="Fitness background" 
          fill
          className="object-cover" 
        />
      </div>
    </div>
  )
}