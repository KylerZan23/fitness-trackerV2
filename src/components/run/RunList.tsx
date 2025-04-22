/**
 * Run List Component
 * ------------------------------------------------
 * This component displays a list of runs fetched from Strava
 */

import { useState, useEffect } from 'react'
import { getStravaActivities } from '@/lib/strava'
import { getTokensFromDatabase } from '@/lib/strava-token-store'
import { formatDistanceMiles, formatElevation, calculatePace } from '@/lib/units'

interface RunListProps {
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
}

export const RunList = ({ userId, isConnected }: RunListProps) => {
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchRuns() {
      if (!isConnected || !userId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Get tokens from database
        const tokens = await getTokensFromDatabase(userId)
        
        if (!tokens) {
          setError('No Strava tokens found. Please reconnect your account.')
          return
        }
        
        // Fetch activities (only runs)
        const activities = await getStravaActivities(tokens)
        const runActivities = activities.filter(activity => activity.type === 'Run')
        
        setRuns(runActivities)
      } catch (err) {
        console.error('Error fetching runs:', err)
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? String(err.message) 
          : 'An error occurred while fetching runs from Strava'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRuns()
  }, [userId, isConnected])
  
  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <p className="text-gray-400 text-center py-6">
          Connect your Strava account to see your runs here.
        </p>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white/70">Loading your runs...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }
  
  if (runs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <p className="text-gray-400 text-center py-6">
          No runs found in your Strava account. Go for a run and sync with Strava, or log a run manually.
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-serif mb-4">Your Recent Runs</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-normal">Date</th>
              <th className="text-left py-3 px-2 text-sm text-gray-400 font-normal">Name</th>
              <th className="text-right py-3 px-2 text-sm text-gray-400 font-normal">Distance</th>
              <th className="text-right py-3 px-2 text-sm text-gray-400 font-normal">Time</th>
              <th className="text-right py-3 px-2 text-sm text-gray-400 font-normal">Pace</th>
              <th className="text-right py-3 px-2 text-sm text-gray-400 font-normal">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(run => (
              <tr 
                key={run.id} 
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-2 text-sm">{formatDate(run.start_date_local)}</td>
                <td className="py-3 px-2">{run.name}</td>
                <td className="py-3 px-2 text-right">{formatDistanceMiles(run.distance)}</td>
                <td className="py-3 px-2 text-right">{formatTime(run.moving_time)}</td>
                <td className="py-3 px-2 text-right">{calculatePace(run.distance, run.moving_time)}</td>
                <td className="py-3 px-2 text-right">{formatElevation(run.total_elevation_gain)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 