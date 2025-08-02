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
  BarElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Calendar, Target } from 'lucide-react'
import { calculateE1RM } from '@/lib/utils/strengthCalculations'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const supabase = createClient()

interface PRData {
  exercise_name: string
  weight: number
  reps: number
  sets: number
  created_at: string
  estimated_1rm: number
}

interface EnhancedPRTrackerProps {
  userId: string
  className?: string
  weightUnit?: 'kg' | 'lbs'
}

const MAJOR_LIFTS = [
  'squat',
  'bench press', 
  'deadlift',
  'overhead press'
] as const

export function EnhancedPRTracker({ 
  userId, 
  className = '',
  weightUnit = 'kg'
}: EnhancedPRTrackerProps) {
  const [prData, setPRData] = useState<PRData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLift, setSelectedLift] = useState<string>('squat')
  const [viewMode, setViewMode] = useState<'1rm' | 'actual'>('1rm')

  useEffect(() => {
    async function fetchPRData() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch workout data for PR analysis (last 12 months)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        const { data, error } = await supabase
          .from('workouts')
          .select('exercise_name, weight, reps, sets, created_at')
          .eq('user_id', userId)
          .gte('created_at', oneYearAgo.toISOString())
          .gt('weight', 0)
          .gt('reps', 0)
          .lte('reps', 12) // Focus on strength training reps
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        // Process data to find PRs and calculate E1RMs
        const processedData: PRData[] = (data || []).map(workout => ({
          ...workout,
          estimated_1rm: calculateE1RM(workout.weight, workout.reps, 'epley')
        }))

        setPRData(processedData)
      } catch (err) {
        console.error('Error fetching PR data:', err)
        setError('Failed to load PR tracking data')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPRData()
    }
  }, [userId])

  const { chartData, prSummary } = useMemo(() => {
    if (!prData.length) return { chartData: null, prSummary: {} }

    // Normalize exercise names and filter for selected lift
    const exerciseMapping: Record<string, string> = {
      'back squat': 'squat',
      'front squat': 'squat',
      'squat': 'squat',
      'barbell squat': 'squat',
      'bench press': 'bench press',
      'barbell bench press': 'bench press',
      'flat bench press': 'bench press',
      'deadlift': 'deadlift',
      'conventional deadlift': 'deadlift',
      'sumo deadlift': 'deadlift',
      'barbell deadlift': 'deadlift',
      'overhead press': 'overhead press',
      'military press': 'overhead press',
      'standing press': 'overhead press',
      'shoulder press': 'overhead press',
    }

    const filteredData = prData.filter(workout => {
      const normalizedName = exerciseMapping[workout.exercise_name.toLowerCase()]
      return normalizedName === selectedLift
    })

    if (!filteredData.length) {
      return { chartData: null, prSummary: {} }
    }

    // Group by month and find max values
    const monthlyPRs = new Map<string, { actual: number, e1rm: number, date: string }>()
    
    filteredData.forEach(workout => {
      const date = new Date(workout.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const current = monthlyPRs.get(monthKey)
      const actualPR = workout.weight
      const e1rmPR = workout.estimated_1rm

      if (!current || e1rmPR > current.e1rm) {
        monthlyPRs.set(monthKey, {
          actual: actualPR,
          e1rm: e1rmPR,
          date: workout.created_at
        })
      }
    })

    // Convert to chart data
    const sortedMonths = Array.from(monthlyPRs.keys()).sort()
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-')
      return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      })
    })

    const actualPRs = sortedMonths.map(month => monthlyPRs.get(month)?.actual || 0)
    const e1rmPRs = sortedMonths.map(month => monthlyPRs.get(month)?.e1rm || 0)

    const chartData = {
      labels,
      datasets: [
        {
          label: viewMode === '1rm' ? 'Estimated 1RM' : 'Actual Weight',
          data: viewMode === '1rm' ? e1rmPRs : actualPRs,
          borderColor: '#8b5cf6',
          backgroundColor: '#8b5cf620',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3,
        }
      ]
    }

    // Calculate PR summary
    const latestPR = sortedMonths.length ? monthlyPRs.get(sortedMonths[sortedMonths.length - 1]) : null
    const previousPR = sortedMonths.length > 1 ? monthlyPRs.get(sortedMonths[sortedMonths.length - 2]) : null
    
    const prSummary = {
      current: latestPR,
      previous: previousPR,
      improvement: latestPR && previousPR 
        ? ((latestPR.e1rm - previousPR.e1rm) / previousPR.e1rm * 100)
        : 0,
      totalWorkouts: filteredData.length,
    }

    return { chartData, prSummary }
  }, [prData, selectedLift, viewMode])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y
            return `${context.dataset.label}: ${value.toFixed(1)} ${weightUnit}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: `Weight (${weightUnit})`,
        },
        ticks: {
          callback: (value: any) => `${value}${weightUnit}`,
        },
      },
    },
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Enhanced PR Tracker</span>
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
            <Trophy className="h-5 w-5" />
            <span>Enhanced PR Tracker</span>
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

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              <span>Enhanced PR Tracker</span>
            </CardTitle>
            <CardDescription>
              Track your personal records and estimated 1RM progression
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={viewMode === '1rm' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('1rm')}
                className="h-8 px-3"
              >
                E1RM
              </Button>
              <Button
                variant={viewMode === 'actual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('actual')}
                className="h-8 px-3"
              >
                Actual
              </Button>
            </div>

            {/* Lift Selector */}
            <select
              value={selectedLift}
              onChange={(e) => setSelectedLift(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {MAJOR_LIFTS.map(lift => (
                <option key={lift} value={lift}>
                  {lift.charAt(0).toUpperCase() + lift.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* PR Summary Stats */}
        {prSummary.current && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600 font-medium">Current {viewMode === '1rm' ? 'E1RM' : 'PR'}</p>
              <p className="text-lg font-bold text-purple-900">
                {viewMode === '1rm' 
                  ? `${prSummary.current.e1rm.toFixed(1)}${weightUnit}`
                  : `${prSummary.current.actual}${weightUnit}`
                }
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 font-medium">Improvement</p>
              <p className={`text-lg font-bold ${prSummary.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {prSummary.improvement >= 0 ? '+' : ''}{prSummary.improvement.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600 font-medium">Total Workouts</p>
              <p className="text-lg font-bold text-green-900">{prSummary.totalWorkouts}</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-sm text-orange-600 font-medium">Last PR</p>
              <p className="text-lg font-bold text-orange-900">
                {prSummary.current.date 
                  ? new Date(prSummary.current.date).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No PR data available for {selectedLift}</p>
                <p className="text-sm text-gray-500 mt-2">Start training this exercise to track your progress</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}