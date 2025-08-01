'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
import { WorkoutData } from '@/lib/utils/strengthCalculations'
import { format, subDays, startOfDay, endOfDay, getDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

interface ExerciseComparison {
  exercise_name: string
  today: {
    weight: number
    reps: number
    sets: number
    volume: number
  }
  lastWeek: {
    weight: number
    reps: number
    sets: number
    volume: number
  }
  changes: {
    weight: number
    reps: number
    sets: number
    volume: number
    weightPercent: number
    volumePercent: number
  }
  trend: 'improving' | 'declining' | 'stable'
  muscle_group?: string
}

interface IndepthAnalysisCardProps {
  userId: string
  weightUnit: 'kg' | 'lbs'
  userTimezone?: string
  className?: string
}

export function IndepthAnalysisCard({ userId, weightUnit, userTimezone = 'UTC', className }: IndepthAnalysisCardProps) {
  const [comparisons, setComparisons] = useState<ExerciseComparison[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasWorkoutToday, setHasWorkoutToday] = useState(false)

  useEffect(() => {
    async function fetchWorkoutComparisons() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Get current time in user's timezone
        const nowInUserTz = toZonedTime(new Date(), userTimezone)
        const dayOfWeek = getDay(nowInUserTz) // 0 = Sunday, 1 = Monday, etc.
        
        // Get today's workouts using user's timezone
        const todayStartUserTz = startOfDay(nowInUserTz)
        const todayEndUserTz = endOfDay(nowInUserTz)
        
        // Convert to UTC for database query
        const todayStart = fromZonedTime(todayStartUserTz, userTimezone)
        const todayEnd = fromZonedTime(todayEndUserTz, userTimezone)
        
        const { data: todayWorkouts, error: todayError } = await supabase
          .from('workouts')
          .select('exercise_name, weight, reps, sets, muscle_group, created_at')
          .eq('user_id', userId)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: true })

        if (todayError) {
          throw new Error(`Failed to fetch today's workouts: ${todayError.message}`)
        }

        if (!todayWorkouts || todayWorkouts.length === 0) {
          setHasWorkoutToday(false)
          setComparisons([])
          setIsLoading(false)
          return
        }

        setHasWorkoutToday(true)

        // Get the same day of week from last week in user's timezone
        const lastWeekSameDayUserTz = subDays(nowInUserTz, 7)
        const lastWeekStartUserTz = startOfDay(lastWeekSameDayUserTz)
        const lastWeekEndUserTz = endOfDay(lastWeekSameDayUserTz)
        
        // Convert to UTC for database query
        const lastWeekStart = fromZonedTime(lastWeekStartUserTz, userTimezone)
        const lastWeekEnd = fromZonedTime(lastWeekEndUserTz, userTimezone)

        const { data: lastWeekWorkouts, error: lastWeekError } = await supabase
          .from('workouts')
          .select('exercise_name, weight, reps, sets, muscle_group, created_at')
          .eq('user_id', userId)
          .gte('created_at', lastWeekStart.toISOString())
          .lte('created_at', lastWeekEnd.toISOString())
          .order('created_at', { ascending: true })

        if (lastWeekError) {
          throw new Error(`Failed to fetch last week's workouts: ${lastWeekError.message}`)
        }

        // Group workouts by exercise name
        const todayExercises = groupWorkoutsByExercise(todayWorkouts)
        const lastWeekExercises = groupWorkoutsByExercise(lastWeekWorkouts || [])

        // Create comparisons for exercises that exist in both sessions
        const exerciseComparisons: ExerciseComparison[] = []
        
        Object.entries(todayExercises).forEach(([exerciseName, todayData]) => {
          const lastWeekData = lastWeekExercises[exerciseName]
          
          if (lastWeekData) {
            // Calculate changes
            const weightChange = todayData.weight - lastWeekData.weight
            const repsChange = todayData.reps - lastWeekData.reps
            const setsChange = todayData.sets - lastWeekData.sets
            const volumeChange = todayData.volume - lastWeekData.volume
            
            const weightPercent = lastWeekData.weight > 0 ? (weightChange / lastWeekData.weight) * 100 : 0
            const volumePercent = lastWeekData.volume > 0 ? (volumeChange / lastWeekData.volume) * 100 : 0
            
            // Determine trend based on volume change (primary) and weight change (secondary)
            let trend: 'improving' | 'declining' | 'stable' = 'stable'
            if (volumePercent > 2 || (volumePercent >= 0 && weightPercent > 2)) {
              trend = 'improving'
            } else if (volumePercent < -2 || (volumePercent <= 0 && weightPercent < -2)) {
              trend = 'declining'
            }

            exerciseComparisons.push({
              exercise_name: exerciseName,
              today: todayData,
              lastWeek: lastWeekData,
              changes: {
                weight: weightChange,
                reps: repsChange,
                sets: setsChange,
                volume: volumeChange,
                weightPercent: Math.round(weightPercent * 10) / 10,
                volumePercent: Math.round(volumePercent * 10) / 10
              },
              trend,
              muscle_group: todayData.muscle_group
            })
          }
        })

        // Sort by volume change (descending) to show biggest improvements first
        exerciseComparisons.sort((a, b) => b.changes.volumePercent - a.changes.volumePercent)

        setComparisons(exerciseComparisons)
      } catch (err) {
        console.error('Error fetching workout comparisons:', err)
        setError('Failed to load workout comparison data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkoutComparisons()
  }, [userId])

  // Helper function to group workouts by exercise name and aggregate stats
  function groupWorkoutsByExercise(workouts: any[]) {
    const grouped: Record<string, any> = {}
    
    workouts.forEach(workout => {
      const exerciseName = workout.exercise_name
      const volume = workout.weight * workout.reps * workout.sets
      
      if (!grouped[exerciseName]) {
        grouped[exerciseName] = {
          weight: workout.weight,
          reps: workout.reps,
          sets: workout.sets,
          volume: volume,
          muscle_group: workout.muscle_group,
          count: 1
        }
      } else {
        // For multiple sets of the same exercise, take the maximum weight and sum volume
        grouped[exerciseName].weight = Math.max(grouped[exerciseName].weight, workout.weight)
        grouped[exerciseName].reps = Math.max(grouped[exerciseName].reps, workout.reps)
        grouped[exerciseName].sets += workout.sets
        grouped[exerciseName].volume += volume
        grouped[exerciseName].count += 1
      }
    })
    
    return grouped
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Target className="w-5 h-5" />
            <span>Indepth Analysis</span>
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // No workout today state
  if (!hasWorkoutToday) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Indepth Analysis</CardTitle>
              <CardDescription className="text-gray-600">
                Compare today's workout to the same session from last week
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No workout recorded today</p>
            <p className="text-sm text-gray-500">
              Complete a workout to see your week-over-week progress analysis
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No comparisons available
  if (comparisons.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Indepth Analysis</CardTitle>
              <CardDescription className="text-gray-600">
                Compare today's workout to the same session from last week
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No matching workout from last week</p>
            <p className="text-sm text-gray-500">
              Keep training consistently to see week-over-week comparisons
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">Indepth Analysis</CardTitle>
            <CardDescription className="text-gray-600">
              Compare today's workout to the same session from last week ({format(subDays(toZonedTime(new Date(), userTimezone), 7), 'MMM dd')})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comparisons.map((comparison, index) => {
            const TrendIcon = comparison.trend === 'improving' ? TrendingUp : 
                            comparison.trend === 'declining' ? TrendingDown : Minus
            
            const trendColor = comparison.trend === 'improving' ? 'text-green-600' : 
                              comparison.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
            
            const badgeColor = comparison.trend === 'improving' ? 'bg-green-100 text-green-700' : 
                              comparison.trend === 'declining' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{comparison.exercise_name}</h4>
                    {comparison.muscle_group && (
                      <p className="text-sm text-gray-500 capitalize">{comparison.muscle_group}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={badgeColor}>
                      <TrendIcon className="w-3 h-3 mr-1" />
                      {comparison.trend}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Today</p>
                    <p className="font-medium">
                      {comparison.today.weight}{weightUnit} × {comparison.today.reps} × {comparison.today.sets}
                    </p>
                    <p className="text-gray-500">
                      Volume: {comparison.today.volume.toLocaleString()}{weightUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Last Week</p>
                    <p className="font-medium">
                      {comparison.lastWeek.weight}{weightUnit} × {comparison.lastWeek.reps} × {comparison.lastWeek.sets}
                    </p>
                    <p className="text-gray-500">
                      Volume: {comparison.lastWeek.volume.toLocaleString()}{weightUnit}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className={`flex items-center space-x-1 ${trendColor}`}>
                        <span>Weight:</span>
                        <span className="font-medium">
                          {comparison.changes.weight >= 0 ? '+' : ''}{comparison.changes.weight}{weightUnit}
                        </span>
                        <span>({comparison.changes.weightPercent >= 0 ? '+' : ''}{comparison.changes.weightPercent}%)</span>
                      </span>
                    </div>
                    <div className={`flex items-center space-x-1 ${trendColor}`}>
                      <span>Volume:</span>
                      <span className="font-medium">
                        {comparison.changes.volumePercent >= 0 ? '+' : ''}{comparison.changes.volumePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 