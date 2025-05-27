'use client'

/**
 * Strava OAuth Callback Page
 * ------------------------------------------------
 * This page handles the OAuth callback from Strava,
 * exchanging the authorization code for tokens and
 * storing them securely.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { exchangeStravaCode } from '@/lib/strava'
import { saveTokensToDatabase, saveTokensToLocalStorage } from '@/lib/strava-token-store'
import Link from 'next/link'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function handleCallback() {
      try {
        setIsLoading(true)

        if (!searchParams) {
          setError('Unable to access URL parameters')
          return
        }

        // Get the authorization code from the URL
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')

        if (errorParam) {
          setError(`Strava authorization error: ${errorParam}`)
          return
        }

        if (!code) {
          setError('No authorization code provided by Strava')
          return
        }

        // Get current session to get user ID
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
          return
        }

        if (!session) {
          router.push('/login')
          return
        }

        // Exchange code for tokens
        const tokens = await exchangeStravaCode(code)

        // Save tokens to localStorage for immediate use
        saveTokensToLocalStorage(tokens)

        // Save tokens to database for persistence, passing the browser client instance
        await saveTokensToDatabase(supabase, session.user.id, tokens)

        setSuccess(true)

        // Redirect back to run logger page after a short delay
        setTimeout(() => {
          router.push('/run-logger')
        }, 2000)
      } catch (err) {
        console.error('Strava callback error:', err)
        // Safe error handling with type checking
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An error occurred while connecting to Strava'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
        <h1 className="text-2xl font-serif">Connecting to Strava...</h1>
        <p className="text-gray-400 mt-2">Please wait while we process your authorization</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-serif font-bold mb-4 text-center">Connection Failed</h1>
          <p className="text-red-500 mb-6 text-center">{error}</p>
          <div className="flex space-x-4">
            <Link
              href="/run-logger"
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1 text-center"
            >
              Back to Run Logger
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-green-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h1 className="text-2xl font-serif font-bold mb-4 text-center">Connected to Strava!</h1>
          <p className="text-center mb-6">
            Your Strava account has been successfully connected. Redirecting you back to the Run
            Logger...
          </p>
          <div className="flex space-x-4">
            <Link
              href="/run-logger"
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1 text-center"
            >
              Return to Run Logger
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Default state (should never reach here but added for completeness)
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
    </div>
  )
}

export default function StravaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h1 className="text-2xl font-serif">Loading...</h1>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
