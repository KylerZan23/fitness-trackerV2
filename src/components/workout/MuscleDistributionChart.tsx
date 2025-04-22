'use client'

import { useState, useEffect } from 'react'
import { format, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { MuscleGroup, findMuscleGroupForExercise } from '@/lib/types'

interface MuscleData {
  muscleGroup: string
  sets: number
  reps: number
  weight: number
}

interface MuscleDistributionChartProps {
  userId?: string
  weightUnit?: 'kg' | 'lbs'
}

export function MuscleDistributionChart({ userId, weightUnit = 'kg' }: MuscleDistributionChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [muscleData, setMuscleData] = useState<Record<string, MuscleData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate date range based on period
  const getDateRange = () => {
    if (period === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
      }
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      }
    }
  }

  // Format the date range for display
  const formatDateRange = () => {
    const { start, end } = getDateRange()
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }

  // Navigate to previous period
  const goToPreviousPeriod = () => {
    if (period === 'week') {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }
  }

  // Navigate to next period
  const goToNextPeriod = () => {
    if (period === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }
  }

  // Fetch muscle data from Supabase
  useEffect(() => {
    async function fetchMuscleData() {
      setLoading(true)
      setError(null)

      try {
        const { start, end } = getDateRange()
        
        // Get the current user ID if not provided
        let currentUserId = userId
        
        if (!currentUserId) {
          const { data: sessionData } = await supabase.auth.getSession()
          currentUserId = sessionData.session?.user.id
          
          if (!currentUserId) {
            setError('Authentication required. Please log in to view your muscle distribution chart.')
            setLoading(false)
            return
          }
        }

        console.log('Fetching workouts for user:', currentUserId, 'from', start.toISOString(), 'to', end.toISOString())

        // Fetch workouts within date range - don't request muscle_group as it might not exist
        const { data, error: fetchError } = await supabase
          .from('workouts')
          .select('exercise_name, sets, reps, weight')
          .eq('user_id', currentUserId)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
        
        if (fetchError) {
          console.error('Supabase query error:', fetchError)
          throw fetchError
        }
        
        console.log('Fetched workout data:', data ? `${data.length} records` : 'No data')
        
        // Aggregate data by muscle group
        const aggregatedData: Record<string, MuscleData> = {}
        
        if (data && data.length > 0) {
          data.forEach(workout => {
            // Determine muscle group from exercise name since the column might not exist
            const muscleGroup = findMuscleGroupForExercise(workout.exercise_name)
            
            if (!aggregatedData[muscleGroup]) {
              aggregatedData[muscleGroup] = {
                muscleGroup,
                sets: 0,
                reps: 0,
                weight: 0
              }
            }
            
            aggregatedData[muscleGroup].sets += workout.sets
            aggregatedData[muscleGroup].reps += workout.sets * workout.reps
            aggregatedData[muscleGroup].weight += workout.weight
          })
        } else {
          // No workout data found
          console.log('No workout data found for the selected period')
        }
        
        setMuscleData(aggregatedData)
      } catch (err) {
        console.error('Error fetching muscle data:', err)
        
        // Provide more detailed error information
        let errorMessage = 'Failed to load workout data. Please try again later.'
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`
          console.error('Error details:', err)
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchMuscleData()
  }, [userId, period, currentDate])

  // Calculate the maximum sets value for scaling
  const maxSets = Object.values(muscleData).reduce((max, data) => 
    data.sets > max ? data.sets : max, 0)

  // Get color based on percentage of max sets
  const getBarColor = (sets: number) => {
    if (maxSets === 0) return 'bg-gray-700'
    
    const percentage = (sets / maxSets) * 100
    
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-green-400'
    if (percentage >= 40) return 'bg-yellow-400'
    if (percentage >= 20) return 'bg-orange-400'
    return 'bg-red-400'
  }

  // Get width percentage based on sets
  const getBarWidth = (sets: number) => {
    if (maxSets === 0) return '0%'
    return `${(sets / maxSets) * 100}%`
  }

  // Sort muscle groups by sets (descending)
  const sortedMuscleGroups = Object.values(muscleData)
    .sort((a, b) => b.sets - a.sets)

  return (
    <div className="w-full">
      {/* Period selector and navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="flex space-x-2 mb-4 sm:mb-0">
          <button 
            className={`px-3 py-1 rounded-lg text-sm ${period === 'week' ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
            onClick={() => setPeriod('week')}
          >
            Week
          </button>
          <button 
            className={`px-3 py-1 rounded-lg text-sm ${period === 'month' ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
            onClick={() => setPeriod('month')}
          >
            Month
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={goToPreviousPeriod}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm font-medium">{formatDateRange()}</span>
          
          <button 
            onClick={goToNextPeriod}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* No data state */}
      {!loading && !error && Object.keys(muscleData).length === 0 && (
        <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400 mb-2">No workout data available for this period</p>
          <p className="text-sm text-gray-500">Try selecting a different time period or log a workout</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && Object.keys(muscleData).length > 0 && (
        <div className="space-y-4">
          {sortedMuscleGroups.map((data) => (
            <div key={data.muscleGroup} className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{data.muscleGroup}</span>
                <span className="text-sm text-gray-400">{data.sets} sets</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getBarColor(data.sets)}`} 
                  style={{ width: getBarWidth(data.sets) }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-400 flex justify-between">
                <span>{data.reps} total reps</span>
                <span>{Math.round(data.weight)} {weightUnit} total</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 