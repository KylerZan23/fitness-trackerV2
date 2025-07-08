'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { MuscleGroup, findMuscleGroupForExercise } from '@/lib/types'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels)

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

// Define a color palette for the pie chart slices
const PIE_CHART_COLORS = [
  'rgba(255, 99, 132, 0.8)', // Pink
  'rgba(54, 162, 235, 0.8)', // Blue
  'rgba(255, 206, 86, 0.8)', // Yellow
  'rgba(75, 192, 192, 0.8)', // Green
  'rgba(153, 102, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)', // Orange
  'rgba(101, 143, 72, 0.8)', // Dark Green
  'rgba(201, 203, 207, 0.8)', // Grey
]

export function MuscleDistributionChart({
  userId,
  weightUnit = 'kg',
}: MuscleDistributionChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [muscleData, setMuscleData] = useState<Record<string, MuscleData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'sets' | 'volume'>('sets')

  // Calculate date range based on period - Memoized with useCallback
  const getDateRange = useCallback(() => {
    if (period === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      }
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }
    }
  }, [currentDate, period])

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
        const { start, end } = getDateRange() // Call the memoized function

        let currentUserId = userId

        if (!currentUserId) {
          const { data: sessionData } = await supabase.auth.getSession()
          currentUserId = sessionData.session?.user.id

          if (!currentUserId) {
            setError(
              'Authentication required. Please log in to view your muscle distribution chart.'
            )
            setLoading(false)
            return
          }
        }

        // console.log('Fetching workouts for user:', currentUserId, 'from', start.toISOString(), 'to', end.toISOString())

        const { data, error: fetchError } = await supabase
          .from('workouts')
          .select('exercise_name, sets, reps, weight')
          .eq('user_id', currentUserId)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        if (fetchError) {
          // console.error('Supabase query error:', fetchError)
          throw fetchError
        }

        // console.log('Fetched workout data:', data ? `${data.length} records` : 'No data')

        const aggregatedData: Record<string, MuscleData> = {}

        if (data && data.length > 0) {
          data.forEach(workout => {
            const muscleGroup = findMuscleGroupForExercise(workout.exercise_name)

            if (!aggregatedData[muscleGroup]) {
              aggregatedData[muscleGroup] = {
                muscleGroup,
                sets: 0,
                reps: 0,
                weight: 0,
              }
            }

            aggregatedData[muscleGroup].sets += workout.sets ?? 0
            aggregatedData[muscleGroup].reps += (workout.sets ?? 0) * (workout.reps ?? 0)
            aggregatedData[muscleGroup].weight += (workout.sets ?? 0) * (workout.reps ?? 0) * (workout.weight ?? 0)
          })
        } else {
          // console.log('No workout data found for the selected period')
        }

        setMuscleData(aggregatedData)
      } catch (err) {
        // console.error('Error fetching muscle data:', err)
        let errorMessage = 'Failed to load workout data. Please try again later.'
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`
          // console.error('Error details:', err)
        }
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchMuscleData()
  }, [userId, period, currentDate, getDateRange]) // getDateRange is now stable due to useCallback

  const sortedMuscleGroups = Object.values(muscleData)
    .filter(data => viewMode === 'sets' ? data.sets > 0 : data.weight > 0)
    .sort((a, b) => viewMode === 'sets' ? b.sets - a.sets : b.weight - a.weight)

  const totalValue = sortedMuscleGroups.reduce(
    (sum, group) => sum + (viewMode === 'sets' ? group.sets : group.weight), 
    0
  )

  const pieChartData = {
    labels: sortedMuscleGroups.map(data => data.muscleGroup),
    datasets: [
      {
        label: viewMode === 'sets' ? '# of Sets' : 'Total Volume',
        data: sortedMuscleGroups.map(data => viewMode === 'sets' ? data.sets : data.weight),
        backgroundColor: sortedMuscleGroups.map(
          (_, index) => PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
        ),
        borderColor: sortedMuscleGroups.map((_, index) =>
          PIE_CHART_COLORS[index % PIE_CHART_COLORS.length].replace('0.8', '1')
        ),
        borderWidth: 1,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Disable the external legend
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const currentMuscleGroupData = sortedMuscleGroups[context.dataIndex]
            if (!currentMuscleGroupData) return ''

            const muscleGroup = currentMuscleGroupData.muscleGroup
            const sets = currentMuscleGroupData.sets
            const reps = currentMuscleGroupData.reps
            const weight = currentMuscleGroupData.weight

            const currentValue = viewMode === 'sets' ? sets : weight
            const percentage =
              totalValue > 0 ? ((currentValue / totalValue) * 100).toFixed(1) : 0

            const labelText = viewMode === 'sets' 
              ? `${muscleGroup}: ${sets} sets (${percentage}%)`
              : `${muscleGroup}: ${Math.round(weight)} ${weightUnit} (${percentage}%)`
            const details = []
            details.push(`Total Reps: ${reps}`)
            if (viewMode === 'sets') {
              details.push(`Total Volume: ${Math.round(weight)} ${weightUnit}`)
            } else {
              details.push(`Total Sets: ${sets}`)
            }
            return [labelText, ...details]
          },
        },
      },
      title: {
        display: false,
      },
      datalabels: {
        // Configuration for chartjs-plugin-datalabels
        formatter: (value: any, context: any) => {
          return context.chart.data.labels[context.dataIndex]
        },
        color: '#fff',
        font: {
          weight: 'bold' as const, // Added 'as const' for type safety
          size: 11, // Slightly smaller size
        },
        anchor: 'center' as const, // Anchor to the center of the arc segment
        align: 'center' as const, // Align text to the center of the anchor point
        // offset: 8, // Optional: adjust if needed
        // rotation: // Optional: can autorotate to fit
        // Consider adding a background to the labels for better contrast if needed
        // backgroundColor: function(context: any) {
        //   return context.dataset.backgroundColor;
        // },
        // borderRadius: 4,
        // padding: 6,
      },
    },
  }

  return (
    <div className="w-full">
      {/* Period selector and navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="flex space-x-2 mb-4 sm:mb-0">
          <button
            className={`px-3 py-1 rounded-lg text-sm ${period === 'week' ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => setPeriod('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm ${period === 'month' ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => setPeriod('month')}
          >
            Month
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex space-x-2 mb-4 sm:mb-0">
          <button
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'sets' ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => setViewMode('sets')}
          >
            Sets
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'volume' ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => setViewMode('volume')}
          >
            Volume
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousPeriod}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <span className="text-sm font-medium">{formatDateRange()}</span>

          <button
            onClick={goToNextPeriod}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            // Add disabled logic if needed (e.g., not going into the future)
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* No data state */}
      {!loading && !error && sortedMuscleGroups.length === 0 && (
        <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400 mb-2">No workout data available for this period</p>
          <p className="text-sm text-gray-500">
            Try selecting a different time period or log new workouts.
          </p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && sortedMuscleGroups.length > 0 && (
        <div>
          {' '}
          {/* Wrapper for text and chart */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            Distribution by {viewMode === 'sets' ? '# of Sets' : `Total Volume (${weightUnit})`}
          </p>
          <div className="relative mx-auto" style={{ height: '300px', maxWidth: '400px' }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      )}
    </div>
  )
}
