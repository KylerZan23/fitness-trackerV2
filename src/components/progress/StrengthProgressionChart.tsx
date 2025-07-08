'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  WorkoutData,
  calculateStrengthProgression,
  calculateStrengthTrend,
  StrengthDataPoint,
  E1RMFormula,
} from '@/lib/utils/strengthCalculations'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Available lifts for selection
const AVAILABLE_LIFTS = [
  { key: 'squat', label: 'Squat', color: 'rgba(59, 130, 246, 1)', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { key: 'bench', label: 'Bench Press', color: 'rgba(16, 185, 129, 1)', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { key: 'deadlift', label: 'Deadlift', color: 'rgba(239, 68, 68, 1)', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { key: 'overhead_press', label: 'Overhead Press', color: 'rgba(245, 158, 11, 1)', bgColor: 'rgba(245, 158, 11, 0.1)' },
] as const

export interface StrengthProgressionChartProps {
  workoutHistory: WorkoutData[]
  weightUnit: 'kg' | 'lbs'
  className?: string
  defaultLift?: string
  formula?: E1RMFormula
}

export function StrengthProgressionChart({
  workoutHistory,
  weightUnit,
  className,
  defaultLift = 'squat',
  formula = 'epley'
}: StrengthProgressionChartProps) {
  const [selectedLift, setSelectedLift] = useState(defaultLift)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Filter workouts by selected lift type
  const filteredWorkouts = useMemo(() => {
    const exerciseMapping: Record<string, string> = {
      // Squat variations
      'back squat': 'squat',
      'front squat': 'squat',
      'squat': 'squat',
      'barbell squat': 'squat',
      
      // Bench variations
      'bench press': 'bench',
      'barbell bench press': 'bench',
      'bench': 'bench',
      'flat bench press': 'bench',
      
      // Deadlift variations
      'deadlift': 'deadlift',
      'conventional deadlift': 'deadlift',
      'sumo deadlift': 'deadlift',
      'barbell deadlift': 'deadlift',
      
      // Overhead press variations
      'overhead press': 'overhead_press',
      'military press': 'overhead_press',
      'standing press': 'overhead_press',
      'shoulder press': 'overhead_press',
      'ohp': 'overhead_press'
    }

    return workoutHistory.filter(workout => {
      const exerciseName = workout.exercise_name.toLowerCase()
      const liftType = exerciseMapping[exerciseName as keyof typeof exerciseMapping]
      return liftType === selectedLift
    })
  }, [workoutHistory, selectedLift])

  // Calculate progression data
  const progressionData = useMemo(() => 
    calculateStrengthProgression(filteredWorkouts, formula),
    [filteredWorkouts, formula]
  )

  // Calculate trend analysis
  const trendAnalysis = useMemo(() => 
    calculateStrengthTrend(progressionData),
    [progressionData]
  )

  // Get selected lift info
  const selectedLiftInfo = AVAILABLE_LIFTS.find(lift => lift.key === selectedLift) || AVAILABLE_LIFTS[0]

  // Chart data
  const chartData: ChartData<'line'> = useMemo(() => {
    if (progressionData.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    // Sort data by date
    const sortedData = [...progressionData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Limit to last 50 data points for performance
    const displayData = sortedData.slice(-50)

    return {
      labels: displayData.map(point => format(parseISO(point.date), 'MMM d')),
      datasets: [
        {
          label: `${selectedLiftInfo.label} e1RM`,
          data: displayData.map(point => point.e1rm),
          borderColor: selectedLiftInfo.color,
          backgroundColor: selectedLiftInfo.bgColor,
          pointBackgroundColor: selectedLiftInfo.color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true,
        }
      ]
    }
  }, [progressionData, selectedLiftInfo])

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: 'rgba(17, 24, 39, 0.9)',
        bodyColor: 'rgba(55, 65, 81, 0.8)',
        borderColor: 'rgba(209, 213, 219, 0.8)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (context[0]?.dataIndex !== undefined) {
              const dataPoint = progressionData[context[0].dataIndex]
              return format(parseISO(dataPoint.date), 'MMM d, yyyy')
            }
            return ''
          },
          label: (context) => {
            const value = context.parsed.y
            const dataPoint = progressionData[context.dataIndex]
            return [
              `e1RM: ${Math.round(value)} ${weightUnit}`,
              `Sets: ${dataPoint.workout.sets} × ${dataPoint.workout.reps} @ ${dataPoint.workout.weight}${weightUnit}`,
              `Formula: ${dataPoint.formula}`
            ]
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: 'rgba(107, 114, 128, 0.8)',
          font: {
            size: 12,
          },
          callback: (value) => `${value} ${weightUnit}`,
        },
      },
    },
  }), [progressionData, weightUnit])

  // Trend indicator
  const TrendIcon = trendAnalysis.trend === 'improving' ? TrendingUp : 
                   trendAnalysis.trend === 'declining' ? TrendingDown : Minus

  const trendColor = trendAnalysis.trend === 'improving' ? 'text-green-600' :
                     trendAnalysis.trend === 'declining' ? 'text-red-600' : 'text-gray-600'

  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl p-6 shadow-sm", className)}>
      {/* Header with dropdown and trend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Strength Progression</h3>
          <p className="text-sm text-gray-600">Track your estimated 1RM over time</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Trend indicator */}
          {progressionData.length > 1 && (
            <div className={cn("flex items-center space-x-2", trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.abs(trendAnalysis.changePercent)}% 
                {trendAnalysis.trend === 'improving' ? ' increase' : 
                 trendAnalysis.trend === 'declining' ? ' decrease' : ' stable'}
              </span>
            </div>
          )}

          {/* Lift selection dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 min-w-[140px] justify-between"
            >
              <span>{selectedLiftInfo.label}</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isDropdownOpen && "rotate-180"
              )} />
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {AVAILABLE_LIFTS.map((lift) => (
                  <button
                    key={lift.key}
                    onClick={() => {
                      setSelectedLift(lift.key)
                      setIsDropdownOpen(false)
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg",
                      lift.key === selectedLift && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lift.color }}
                      />
                      <span className="font-medium">{lift.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[400px] relative">
        {progressionData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No {selectedLiftInfo.label} Data Available
            </h4>
            <p className="text-gray-600 max-w-md">
              Log some {selectedLiftInfo.label.toLowerCase()} workouts to see your strength progression over time.
            </p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Summary stats */}
      {progressionData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {progressionData.length}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(Math.max(...progressionData.map(p => p.e1rm)))} {weightUnit}
              </div>
              <div className="text-sm text-gray-600">Peak e1RM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(progressionData[progressionData.length - 1]?.e1rm || 0)} {weightUnit}
              </div>
              <div className="text-sm text-gray-600">Current e1RM</div>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
} 