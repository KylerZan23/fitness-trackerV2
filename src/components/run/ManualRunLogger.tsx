/**
 * Manual Run Logger Component
 * ------------------------------------------------
 * This component provides a form for manually logging runs to Strava
 */

import { useState, useEffect } from 'react'
import { createStravaActivity } from '@/lib/strava'
import { getTokensFromDatabase } from '@/lib/strava-token-store'

interface ManualRunLoggerProps {
  userId: string
  isConnected: boolean
  onRunLogged: () => void
}

export const ManualRunLogger = ({ userId, isConnected, onRunLogged }: ManualRunLoggerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('0')
  const [seconds, setSeconds] = useState('0')
  const [description, setDescription] = useState('')
  
  // Calculate seconds from hours, minutes, seconds inputs
  const calculateTotalSeconds = (): number => {
    return (
      parseInt(hours || '0', 10) * 3600 +
      parseInt(minutes || '0', 10) * 60 +
      parseInt(seconds || '0', 10)
    )
  }
  
  // Set today's date as default
  const setTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setDate(`${year}-${month}-${day}`)
  }
  
  // Set current time as default
  const setCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setTime(`${hours}:${minutes}`)
  }
  
  // Initialize form with defaults
  useEffect(() => {
    setTodayDate()
    setCurrentTime()
  }, [])
  
  // Convert miles to meters for the Strava API
  const milesToMeters = (miles: number): number => {
    return miles * 1609.344
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      setError('You need to connect your Strava account first')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      
      // Validate form
      if (!name.trim()) {
        setError('Run name is required')
        return
      }
      
      if (!date) {
        setError('Date is required')
        return
      }
      
      if (!time) {
        setError('Time is required')
        return
      }
      
      if (!distance || parseFloat(distance) <= 0) {
        setError('Valid distance is required')
        return
      }
      
      if (calculateTotalSeconds() <= 0) {
        setError('Duration is required')
        return
      }
      
      // Get tokens from database
      const tokens = await getTokensFromDatabase(userId)
      
      if (!tokens) {
        setError('No Strava tokens found. Please reconnect your account.')
        return
      }
      
      // Prepare the activity data
      const activityData = {
        name,
        type: 'Run',
        start_date_local: `${date}T${time}:00`,
        elapsed_time: calculateTotalSeconds(),
        description: description || undefined,
        distance: milesToMeters(parseFloat(distance)), // Convert miles to meters
        trainer: false,
        commute: false
      }
      
      // Create the activity
      await createStravaActivity(tokens, activityData)
      
      // Success
      setSuccess('Run logged successfully to Strava!')
      
      // Reset form
      setName('')
      setTodayDate()
      setCurrentTime()
      setDistance('')
      setHours('0')
      setMinutes('0')
      setSeconds('0')
      setDescription('')
      
      // Notify parent component
      onRunLogged()
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
      
    } catch (err) {
      console.error('Error logging run:', err)
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'An error occurred while logging the run to Strava'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <p className="text-gray-400 text-center py-6">
          Connect your Strava account to manually log runs.
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-serif mb-4">Log a Run Manually</h3>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-white/70 text-xs mt-2 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-green-400">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="run-name" className="block text-sm font-medium text-gray-300 mb-1">
            Run Name
          </label>
          <input
            id="run-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning Run"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="run-date" className="block text-sm font-medium text-gray-300 mb-1">
              Date
            </label>
            <input
              id="run-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
              required
            />
          </div>
          
          <div>
            <label htmlFor="run-time" className="block text-sm font-medium text-gray-300 mb-1">
              Time
            </label>
            <input
              id="run-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="run-distance" className="block text-sm font-medium text-gray-300 mb-1">
            Distance (miles)
          </label>
          <input
            id="run-distance"
            type="number"
            min="0.01"
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="3.1"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
                aria-label="Hours"
              />
              <span className="text-xs text-gray-400 mt-1 block text-center">Hours</span>
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="30"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
                aria-label="Minutes"
              />
              <span className="text-xs text-gray-400 mt-1 block text-center">Minutes</span>
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="0"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
                aria-label="Seconds"
              />
              <span className="text-xs text-gray-400 mt-1 block text-center">Seconds</span>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="run-description" className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            id="run-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How was your run?"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/25"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging Run...' : 'Log Run to Strava'}
          </button>
        </div>
      </form>
    </div>
  )
} 