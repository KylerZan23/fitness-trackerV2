/**
 * Strava Connect Component
 * ------------------------------------------------
 * This component provides UI for connecting to and disconnecting from Strava
 */

import { useState, useEffect } from 'react'
import { getStravaAuthUrl } from '@/lib/strava/index'
import {
  isStravaConnected,
  removeTokensFromDatabase,
  removeTokensFromLocalStorage,
} from '@/lib/strava/token-store'
import { createClient } from '@/utils/supabase/client' // Import the browser client
const supabase = createClient()

interface StravaConnectProps {
  userId: string
  onConnectionChange: (connected: boolean) => void
}

export const StravaConnect = ({ userId, onConnectionChange }: StravaConnectProps) => {
  const [connected, setConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        setIsLoading(true)
        // Pass the browser client to isStravaConnected
        const connected = await isStravaConnected(supabase, userId)
        setConnected(connected)
        onConnectionChange(connected)
      } catch (err) {
        console.error('Error checking Strava connection:', err)
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An error occurred while checking Strava connection'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      checkConnection()
    }
  }, [userId, onConnectionChange])

  const handleConnect = () => {
    try {
      // Use the getStravaAuthUrl function which now properly uses environment variables
      const authUrl = getStravaAuthUrl()

      console.log('Auth URL:', authUrl)

      // Redirect to Strava
      window.location.href = authUrl
    } catch (err) {
      console.error('Error generating Strava auth URL:', err)
      setError(
        'An error occurred while connecting to Strava. Please check that Strava credentials are properly configured.'
      )
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      // Pass the browser client to removeTokensFromDatabase
      await removeTokensFromDatabase(supabase, userId)
      removeTokensFromLocalStorage()
      setConnected(false)
      onConnectionChange(false)
    } catch (err) {
      console.error('Error disconnecting from Strava:', err)
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'An error occurred while disconnecting from Strava'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-white/70 text-xs mt-2 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    )
  }

  if (connected) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-orange-500 mr-3" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 5 13.828h4.172" />
              </svg>
              <h3 className="text-xl font-serif font-medium">Connected to Strava</h3>
            </div>
            <p className="text-gray-400 mt-2">
              Your Strava account is connected and ready to log runs.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
      <div className="text-center py-6">
        <svg
          viewBox="0 0 24 24"
          className="h-12 w-12 text-orange-500 mx-auto mb-4"
          fill="currentColor"
        >
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0 5 13.828h4.172" />
        </svg>
        <h3 className="text-2xl font-serif font-medium mb-2">Connect with Strava</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Connect your Strava account to automatically sync your runs and track your progress.
        </p>
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors font-medium"
        >
          Connect to Strava
        </button>

        {debugInfo && (
          <div className="mt-6 p-4 bg-black/50 border border-white/10 rounded-lg text-xs text-left overflow-auto">
            <p className="font-mono whitespace-pre-wrap text-gray-400">{debugInfo}</p>
          </div>
        )}
      </div>
    </div>
  )
}
