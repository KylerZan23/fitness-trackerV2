'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { LoginFormData, loginSchema } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthError {
  message: string;
  status?: number;
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

      // Log the full session details for debugging
      console.log('=== Session Debug Information ===')
      console.log('Session:', {
        accessToken: `${signInData.session.access_token.substring(0, 10)}...`,
        tokenExpiry: new Date(signInData.session.expires_at! * 1000).toISOString(),
        user: {
          id: signInData.session.user.id,
          email: signInData.session.user.email,
          role: signInData.session.user.role,
          lastSignIn: signInData.session.user.last_sign_in_at,
        },
        provider: signInData.session.user.app_metadata?.provider
      })

      // Check/create profile
      console.log('Checking user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.session.user.id)
        .single()

      if (profileError) {
        console.log('Profile not found, creating new profile...')
        const { error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.session.user.id,
            email: signInData.session.user.email,
            name: signInData.session.user.user_metadata?.name ?? null,
            age: signInData.session.user.user_metadata?.age ?? null,
            fitness_goals: signInData.session.user.user_metadata?.fitness_goals ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error('Profile creation error:', createError)
          console.log('Continuing without profile creation')
        } else {
          console.log('Profile created successfully')
        }
      } else {
        console.log('Existing profile found')
      }

      // Navigate to dashboard after login
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