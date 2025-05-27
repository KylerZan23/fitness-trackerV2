'use client'

import { useEffect } from 'react'
import { Error } from '@/components/ui/error'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Something went wrong!</h2>
        <Error
          message={error.message || 'An unexpected error occurred. Please try again later.'}
          className="mb-6"
        />
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
