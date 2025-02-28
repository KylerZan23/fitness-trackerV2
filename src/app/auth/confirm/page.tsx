'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Error } from '@/components/ui/error'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token from the URL
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          setError('Invalid confirmation link')
          setIsVerifying(false)
          return
        }

        // Verify the user's email
        const { error: verificationError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (verificationError) {
          throw verificationError
        }

        // Get the user session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          throw new Error('No user session found')
        }

        // Create user profile in the database
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.name,
            age: session.user.user_metadata.age,
            fitness_goals: session.user.user_metadata.fitness_goals,
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          throw profileError
        }

        // Redirect to dashboard with success parameter
        router.push('/dashboard?welcome=true')
      } catch (err) {
        console.error('Confirmation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to confirm email')
        setIsVerifying(false)
      }
    }

    confirmEmail()
  }, [router, searchParams])

  if (isVerifying) {
    return (
      <AuthLayout
        title="Verifying Your Email"
        subtitle="Please wait while we confirm your email address"
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout
        title="Verification Error"
        subtitle="There was a problem confirming your email"
      >
        <div className="py-8">
          <Error message={error} />
          <button
            onClick={() => router.push('/signup')}
            className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Back to Sign Up
          </button>
        </div>
      </AuthLayout>
    )
  }

  return null
} 