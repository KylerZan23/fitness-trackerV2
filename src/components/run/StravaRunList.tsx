/**
 * Strava Run List Component
 * ------------------------------------------------
 * This component displays runs fetched from Strava as Strava-like cards
 */

import { useState, useEffect } from 'react'
import { getStravaActivitiesClient, getStravaActivityWithPolylineClient } from '@/lib/strava-client'
import { getTokensFromDatabase, saveTokensToDatabase } from '@/lib/strava-token-store'
import { RunCard } from './RunCard'
import { supabase } from '@/lib/supabase'

interface StravaRunListProps {
  userId: string
  isConnected: boolean
}

interface Run {
  id: number
  name: string
  distance: number // in meters
  moving_time: number // in seconds
  elapsed_time: number // in seconds
  total_elevation_gain: number // in meters
  start_date: string
  start_date_local: string
  type: string
  average_speed: number // meters/second
  max_speed: number // meters/second
  map?: {
    id: string
    summary_polyline: string
  }
  segment_efforts?: Array<{
    id: number
    name: string
    elapsed_time: number
    achievement_count?: number
    pr_rank?: number | null
  }>
}

export function StravaRunList({ userId, isConnected }: StravaRunListProps) {
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)

  // Get user info from local storage or hardcode for demo
  const userInfo = {
    name: 'Kyler Zanuck',
    location: 'Los Angeles, California',
  }

  useEffect(() => {
    async function fetchRuns() {
      if (!isConnected || !userId) return

      try {
        setIsLoading(true)
        setError(null)

        // Get tokens from database
        const tokens = await getTokensFromDatabase(supabase, userId)

        if (!tokens) {
          setError('No Strava tokens found. Please reconnect your account.')
          return
        }

        // Fetch activities (only runs)
        const activities = await getStravaActivitiesClient(
          tokens,
          1,
          30,
          undefined,
          undefined,
          async (newTokens) => {
            // Update tokens in database when they're refreshed
            await saveTokensToDatabase(supabase, userId, {
              access_token: newTokens.access_token,
              refresh_token: tokens.refresh_token, // Keep existing refresh token
              expires_at: newTokens.expires_at,
            })
          }
        )
        const runActivities = activities.filter((activity: any) => activity.type === 'Run')

        setRuns(runActivities)
      } catch (err) {
        console.error('Error fetching runs:', err)
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An error occurred while fetching runs from Strava'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRuns()
  }, [userId, isConnected])

  // Fetch detailed run data when selectedRunId changes
  useEffect(() => {
    async function fetchDetailedRun() {
      if (!selectedRunId || !isConnected || !userId) return

      try {
        setIsLoading(true)

        // Get tokens from database
        const tokens = await getTokensFromDatabase(supabase, userId)

        if (!tokens) {
          setError('No Strava tokens found. Please reconnect your account.')
          return
        }

        // Fetch detailed activity with polyline
        const detailedRun = await getStravaActivityWithPolylineClient(
          tokens,
          selectedRunId,
          async (newTokens) => {
            // Update tokens in database when they're refreshed
            await saveTokensToDatabase(supabase, userId, {
              access_token: newTokens.access_token,
              refresh_token: tokens.refresh_token, // Keep existing refresh token
              expires_at: newTokens.expires_at,
            })
          }
        )
        setSelectedRun(detailedRun)
      } catch (err) {
        console.error('Error fetching detailed run:', err)
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An error occurred while fetching detailed run data'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetailedRun()
  }, [selectedRunId, userId, isConnected])

  // Check URL for runId query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const runId = params.get('runId')

      if (runId) {
        setSelectedRunId(parseInt(runId, 10))
      }
    }
  }, [])

  if (!isConnected) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center py-6">
          Connect your Strava account to see your runs here.
        </p>
      </div>
    )
  }

  if (isLoading && !runs.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-700">Loading your runs...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center py-6">
          No runs found in your Strava account. Go for a run and sync with Strava, or log a run
          manually.
        </p>
      </div>
    )
  }

  // If a specific run is selected, show only that run with details
  if (selectedRun) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Run Details</h3>
          <button
            onClick={() => {
              setSelectedRunId(null)
              setSelectedRun(null)

              // Update URL to remove runId parameter
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.delete('runId')
                window.history.pushState({}, '', url)
              }
            }}
            className="text-sm text-primary hover:text-primary/80"
          >
            Back to all runs
          </button>
        </div>

        <RunCard
          id={selectedRun.id}
          name={selectedRun.name}
          distance={selectedRun.distance}
          moving_time={selectedRun.moving_time}
          elapsed_time={selectedRun.elapsed_time}
          total_elevation_gain={selectedRun.total_elevation_gain}
          start_date={selectedRun.start_date}
          start_date_local={selectedRun.start_date_local}
          polyline={selectedRun.map?.summary_polyline}
          segment_efforts={selectedRun.segment_efforts}
          user={userInfo}
        />
      </div>
    )
  }

  // Show list of runs
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Recent Runs</h3>

      {runs.map(run => (
        <RunCard
          key={run.id}
          id={run.id}
          name={run.name}
          distance={run.distance}
          moving_time={run.moving_time}
          elapsed_time={run.elapsed_time}
          total_elevation_gain={run.total_elevation_gain}
          start_date={run.start_date}
          start_date_local={run.start_date_local}
          polyline={run.map?.summary_polyline}
          user={userInfo}
          className="mb-6"
        />
      ))}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-700">Loading more data...</span>
        </div>
      )}
    </div>
  )
}
