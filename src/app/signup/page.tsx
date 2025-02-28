'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { SignupFormData, signupSchema } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An error occurred during signup'
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            age: data.age,
            fitness_goals: data.fitnessGoals,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setIsSuccess(true)
    } catch (err: unknown) {
      console.error('Signup error:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const SuccessView = () => (
    <div className="min-h-screen bg-black text-white flex">
      <div className="w-full md:w-[480px] p-8 flex flex-col justify-center items-center">
        <Link href="/" className="text-2xl font-bold mb-12">FitnessTracker</Link>
        
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-serif mb-4">Check Your Email</h1>
          <p className="text-gray-400 mb-8">
            We've sent you an email with a confirmation link.
            Please check your inbox and click the link to complete your registration.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-white hover:text-gray-300 transition-colors"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>

      <div className="hidden md:block relative flex-1">
        <div className="absolute inset-0">
          <Image
            src="/signup-success-bg.jpg"
            alt="Success"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black to-black/50" />
        </div>
      </div>
    </div>
  )

  if (isSuccess) {
    return <SuccessView />
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="w-full md:w-[480px] p-8 flex flex-col justify-between">
        <div>
          <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
        </div>
        
        <div>
          <h1 className="text-4xl font-serif mb-4">Create an Account</h1>
          <p className="text-gray-400 mb-8">Sign up to start your fitness journey</p>

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
                  {...register('password')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Choose a strong password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium mb-2">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="Enter your age"
                  disabled={isLoading}
                />
                {errors.age && (
                  <p className="mt-2 text-sm text-red-500">{errors.age.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="fitnessGoals" className="block text-sm font-medium mb-2">
                  Fitness Goals
                </label>
                <textarea
                  id="fitnessGoals"
                  {...register('fitnessGoals')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  rows={3}
                  placeholder="Tell us about your fitness goals"
                  disabled={isLoading}
                />
                {errors.fitnessGoals && (
                  <p className="mt-2 text-sm text-red-500">{errors.fitnessGoals.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-gray-300 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div />
      </div>

      {/* Right Panel - Image */}
      <div className="hidden md:block relative flex-1">
        <div className="absolute inset-0">
          <Image
            src="/signup-bg.jpg"
            alt="Fitness motivation"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black to-black/50" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center p-12">
          <blockquote className="max-w-lg">
            <p className="text-3xl font-serif leading-relaxed">
              "The difference between try and triumph is just a little umph!"
            </p>
            <footer className="mt-4 text-gray-400">- Fitness Motivation</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
} 