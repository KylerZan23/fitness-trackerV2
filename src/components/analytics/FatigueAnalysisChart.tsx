'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
} from 'chart.js'
import { Radar, Doughnut } from 'react-chartjs-2'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

  const supabase = await createClient()

interface FatigueData {
  muscle_group: string
  training_days_in_week: number
  weekly_volume: number
  last_trained_days_ago: number
  recovery_score: number
  fatigue_level: 'low' | 'moderate' | 'high'
}

interface FatigueAnalysisChartProps {
  userId: string
  className?: string
  weightUnit?: 'kg' | 'lbs'
}

const MUSCLE_GROUP_COLORS = {
  'Chest': '#ef4444',
  'Back': '#3b82f6',
  'Shoulders': '#f59e0b',
  'Arms': '#8b5cf6',
  'Legs': '#10b981',
  'Core': '#f97316',
  'Full Body': '#6b7280',
}

export function FatigueAnalysisChart({ 
  userId, 
  className = '',
  weightUnit = 'kg'
}: FatigueAnalysisChartProps) {
  const [fatigueData, setFatigueData] = useState<FatigueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'radar' | 'distribution'>('radar')

  useEffect(() => {
    async function fetchFatigueData() {
      setIsLoading(true)
      setError(null)

      try {
        // Get recent training data (last 4 weeks)
        const fourWeeksAgo = new Date()
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

        const { data: recentData, error: recentError } = await supabase
          .from('user_advanced_analytics')
          .select('muscle_group, training_days_in_week, weekly_volume, week_start')
          .eq('user_id', userId)
          .gte('week_start', fourWeeksAgo.toISOString())
          .order('week_start', { ascending: false })

        if (recentError) throw recentError

        // Get last workout dates per muscle group
        const { data: lastWorkouts, error: lastWorkoutsError } = await supabase
          .from('workouts')
          .select('muscle_group, created_at')
          .eq('user_id', userId)
          .gte('created_at', fourWeeksAgo.toISOString())
          .order('created_at', { ascending: false })

        if (lastWorkoutsError) throw lastWorkoutsError

        // Process fatigue analysis
        const processedData = calculateFatigueAnalysis(recentData || [], lastWorkouts || [])
        setFatigueData(processedData)
      } catch (err) {
        console.error('Error fetching fatigue data:', err)
        setError('Failed to load fatigue analysis data')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchFatigueData()
    }
  }, [userId])

  const calculateFatigueAnalysis = (recentData: any[], lastWorkouts: any[]): FatigueData[] => {
    const muscleGroups = Array.from(new Set(recentData.map(d => d.muscle_group)))
    
    return muscleGroups.map(muscleGroup => {
      // Calculate average training frequency (days per week)
      const muscleGroupData = recentData.filter(d => d.muscle_group === muscleGroup)
      const avgTrainingDays = muscleGroupData.reduce((sum, d) => sum + d.training_days_in_week, 0) / Math.max(muscleGroupData.length, 1)
      
      // Calculate average weekly volume
      const avgWeeklyVolume = muscleGroupData.reduce((sum, d) => sum + d.weekly_volume, 0) / Math.max(muscleGroupData.length, 1)
      
      // Find last workout for this muscle group
      const lastWorkout = lastWorkouts.find(w => w.muscle_group === muscleGroup)
      const lastTrainedDaysAgo = lastWorkout 
        ? Math.floor((Date.now() - new Date(lastWorkout.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 14 // Default to 14 days if no recent workouts

      // Calculate recovery score (0-100)
      // Higher frequency and volume = lower recovery score
      // More days since last workout = higher recovery score
      const frequencyFactor = Math.max(0, 1 - (avgTrainingDays / 7)) * 40 // Max 40 points
      const volumeFactor = Math.max(0, 1 - (avgWeeklyVolume / 10000)) * 30 // Max 30 points (assuming 10k is high volume)
      const restFactor = Math.min(30, lastTrainedDaysAgo * 5) // Max 30 points, 5 points per day

      const recoveryScore = Math.min(100, frequencyFactor + volumeFactor + restFactor)

      // Determine fatigue level
      let fatigueLevel: 'low' | 'moderate' | 'high'
      if (recoveryScore >= 70) fatigueLevel = 'low'
      else if (recoveryScore >= 40) fatigueLevel = 'moderate'
      else fatigueLevel = 'high'

      return {
        muscle_group: muscleGroup,
        training_days_in_week: avgTrainingDays,
        weekly_volume: avgWeeklyVolume,
        last_trained_days_ago: lastTrainedDaysAgo,
        recovery_score: recoveryScore,
        fatigue_level: fatigueLevel,
      }
    })
  }

  const chartData = useMemo(() => {
    if (!fatigueData.length) return null

    if (viewMode === 'radar') {
      return {
        labels: fatigueData.map(d => d.muscle_group),
        datasets: [
          {
            label: 'Recovery Score',
            data: fatigueData.map(d => d.recovery_score),
            borderColor: '#8b5cf6',
            backgroundColor: '#8b5cf620',
            borderWidth: 2,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#8b5cf6',
          },
        ],
      }
    } else {
      // Distribution chart
      const fatigueCounts = fatigueData.reduce((acc, d) => {
        acc[d.fatigue_level] = (acc[d.fatigue_level] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        labels: ['Low Fatigue', 'Moderate Fatigue', 'High Fatigue'],
        datasets: [
          {
            data: [
              fatigueCounts.low || 0,
              fatigueCounts.moderate || 0,
              fatigueCounts.high || 0,
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
          },
        ],
      }
    }
  }, [fatigueData, viewMode])

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: '#e5e7eb',
        },
        angleLines: {
          color: '#e5e7eb',
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Fatigue Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Activity className="h-5 w-5" />
            <span>Fatigue Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!chartData || fatigueData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Fatigue Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No fatigue data available</p>
              <p className="text-sm text-gray-500 mt-2">Need at least 2 weeks of training data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>Fatigue Analysis</span>
            </CardTitle>
            <CardDescription>
              Monitor recovery levels and muscle group fatigue patterns
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={viewMode === 'radar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('radar')}
                className="h-8 px-3"
              >
                Recovery
              </Button>
              <Button
                variant={viewMode === 'distribution' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('distribution')}
                className="h-8 px-3"
              >
                Distribution
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Fatigue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {fatigueData.map((data) => {
            const Icon = data.fatigue_level === 'low' ? CheckCircle 
                      : data.fatigue_level === 'moderate' ? Clock 
                      : AlertTriangle
            const colorClass = data.fatigue_level === 'low' ? 'text-green-600 bg-green-50'
                             : data.fatigue_level === 'moderate' ? 'text-yellow-600 bg-yellow-50'
                             : 'text-red-600 bg-red-50'

            return (
              <div key={data.muscle_group} className={`rounded-lg p-3 ${colorClass}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{data.muscle_group}</p>
                    <p className="text-sm opacity-75">
                      Recovery: {data.recovery_score.toFixed(0)}%
                    </p>
                  </div>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="h-64">
          {viewMode === 'radar' ? (
            <Radar data={chartData} options={radarOptions} />
          ) : (
            <Doughnut data={chartData} options={doughnutOptions} />
          )}
        </div>

        {/* Recovery Recommendations */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Recovery Recommendations</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {fatigueData.filter(d => d.fatigue_level === 'high').length > 0 && (
              <p>• Consider reducing volume for high-fatigue muscle groups</p>
            )}
            {fatigueData.filter(d => d.last_trained_days_ago > 7).length > 0 && (
              <p>• Some muscle groups haven't been trained in over a week</p>
            )}
            {fatigueData.filter(d => d.fatigue_level === 'low').length > 2 && (
              <p>• Good recovery levels - consider progressive overload</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}