'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
// import Image from 'next/image' // Removed as image panels are being removed
import { SignupFormData, signupSchema } from '@/lib/schemas'
import { supabase } from '@/lib/supabase'
import { Label } from '@/components/ui/label' // Added for form labels
import { Button } from '@/components/ui/button' // Added for consistent button styling
import { Input } from '@/components/ui/input' // Added for consistent input styling
import { Textarea } from '@/components/ui/textarea' // Added for consistent textarea styling

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
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/confirm`,
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="block mx-auto text-center text-3xl font-bold text-indigo-600 hover:text-indigo-700 mb-8">
          FitnessTracker
        </Link>
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent you an email with a confirmation link.
            Please check your inbox and click the link to complete your registration.
          </p>
          <Button
            onClick={() => typeof window !== 'undefined' ? window.location.reload() : null}
            variant="outline"
            className="w-full"
          >
            Didn't receive the email? Try again
          </Button>
        </div>
      </div>
    </div>
  )

  if (isSuccess) {
    return <SuccessView />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="block mx-auto text-center text-3xl font-bold text-indigo-600 hover:text-indigo-700 mb-2">
          FitnessTracker
        </Link>
        <h2 className="mt-1 text-center text-2xl font-semibold text-gray-800">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
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
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  placeholder="Your age"
                  disabled={isLoading}
                  className={errors.age ? 'border-red-500' : ''}
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fitnessGoals" className="block text-sm font-medium text-gray-700 mb-1">
                  Fitness Goals
                </Label>
                <Textarea
                  id="fitnessGoals"
                  {...register('fitnessGoals')}
                  rows={3}
                  placeholder="Tell us about your fitness goals (e.g., lose weight, build muscle)"
                  disabled={isLoading}
                  className={errors.fitnessGoals ? 'border-red-500' : ''}
                />
                {errors.fitnessGoals && (
                  <p className="mt-1 text-sm text-red-600">{errors.fitnessGoals.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 