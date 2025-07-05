'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Error as ErrorComponent } from '@/components/ui/error'
import { supabase } from '@/lib/supabase'
import type { VerifyOtpParams } from '@supabase/supabase-js'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Check if searchParams is available
        if (!searchParams) {
          setError('Missing URL parameters')
          setIsVerifying(false)
          return
        }

        // Get the token from the URL
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          setError('Invalid confirmation link')
          setIsVerifying(false)
          return
        }

        // Verify the user's email with proper typing
        const verifyParams: VerifyOtpParams = {
          token_hash: token,
          type: 'signup' as const,
        }

        const { error: verificationError } = await supabase.auth.verifyOtp(verifyParams)

        if (verificationError) {
          throw verificationError
        }

        // Get the user session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          throw new Error('No user session found after email verification')
        }

        // Note: Email confirmation is handled by Supabase auth automatically.
        // The profiles table doesn't have an email_confirmed column.
        console.log('Email confirmed successfully via Supabase auth')

        // Check if user has completed onboarding to determine redirect
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        if (profileFetchError) {
          console.error('Error fetching profile:', profileFetchError)
          throw new Error('Failed to retrieve profile information after confirmation')
        }

        if (!profile) {
          throw new Error('Profile not found for the confirmed user')
        }

        // Redirect based on onboarding status
        if (profile?.onboarding_completed) {
          console.log('User has completed onboarding, redirecting to program')
          router.push('/program')
        } else {
          console.log('User has not completed onboarding, redirecting to onboarding')
          router.push('/onboarding')
        }
      } catch (err: unknown) {
        console.error('Confirmation error:', err)
        // Safely extract error message
        let errorMessage = 'Failed to confirm email'

        if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          const errorObj = err as { message: unknown }
          errorMessage =
            typeof errorObj.message === 'string' ? errorObj.message : 'Failed to confirm email'
        }

        setError(errorMessage)
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
      <AuthLayout title="Verification Error" subtitle="There was a problem confirming your email">
        <div className="py-8">
          <ErrorComponent message={error} />
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

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Loading" subtitle="Please wait...">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AuthLayout>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
