'use client'

import { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Brain, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AICoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('AI Coach page error:', error)
  }, [error])

  const sidebarProps = {
    userName: 'User',
    userEmail: '',
    profilePictureUrl: null,
    onLogout: () => {},
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
              <p className="text-gray-600 mt-1">
                Something went wrong loading your AI Coach
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Error Loading AI Coach</h2>
          </div>
          
          <p className="text-red-700 mb-6">
            We encountered an error while loading your AI Coach dashboard. This might be a temporary issue.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={reset}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="ml-3"
            >
              Refresh Page
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 p-4 bg-gray-50 rounded-md">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}