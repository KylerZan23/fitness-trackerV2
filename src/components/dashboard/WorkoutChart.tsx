'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { WorkoutTrend } from '@/lib/db'
import { format, parseISO, startOfWeek, addDays, addWeeks, formatISO } from 'date-fns'
import { ChevronLeft, ChevronRight, TrendingUp, Activity, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Define the type for selectable trend metrics locally
export type TrendMetric = 'totalDuration' | 'totalWeight' | 'totalSets'

interface WorkoutChartProps {
  data: WorkoutTrend[]
  weightUnit: 'kg' | 'lbs'
  isLoading?: boolean
}

// Loading skeleton component
function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="flex space-x-2">
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
      
      {/* Chart skeleton */}
      <div className="h-[400px] relative bg-gray-50 rounded-lg flex items-end justify-around p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t animate-pulse"
            style={{
              height: `${Math.random() * 60 + 20}%`,
              width: '12%',
              animationDelay: `${i * 100}ms`
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}

export function WorkoutChart({ data, weightUnit, isLoading = false }: WorkoutChartProps) {
  // State for week offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0)
  // State for the active metric to display
  const [activeMetric, setActiveMetric] = useState<TrendMetric>('totalDuration')
  // State for animation
  const [isTransitioning, setIsTransitioning] = useState(false)
  const chartRef = useRef<any>(null)

  // Handle metric change with animation
  const handleMetricChange = (newMetric: TrendMetric) => {
    if (newMetric === activeMetric) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveMetric(newMetric)
      setIsTransitioning(false)
    }, 150)
  }

  // --- Helper Functions ---

  // Get the start date (Monday) of the target week based on the offset
  const getTargetWeekStart = (offset: number): Date => {
    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
    return addWeeks(currentWeekStart, offset)
  }

  // Generate labels and date info for the target week
  const createWeekLabels = (offset: number) => {
    const mondayOfTargetWeek = getTargetWeekStart(offset)
    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(mondayOfTargetWeek, i)
      weekDays.push({
        date: format(day, 'yyyy-MM-dd'), // Keep YYYY-MM-DD for data matching
        label: format(day, 'EEE, MMM d'), // Format for display
        isPast: day < todayDateOnly,
      })
    }
    return weekDays
  }

  // Format the date range string for the title
  const formatWeekTitle = (offset: number): string => {
    const weekStart = getTargetWeekStart(offset)
    const weekEnd = addDays(weekStart, 6)
    if (offset === 0) {
      return 'Weekly Workout Trends (This Week)'
    }
    return `Weekly Workout Trends (Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`
  }

  // --- Data Processing ---

  // Generate labels for the currently selected week offset
  const weekLabels = createWeekLabels(weekOffset)

  // Map incoming data to the generated week labels
  const mappedData = weekLabels.map(dayInfo => {
    const matchingData = data.find(item => item.date === dayInfo.date)
    const dayDate = new Date(dayInfo.date + 'T00:00:00') // For comparison
    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    return {
      date: dayInfo.date,
      label: dayInfo.label,
      isPast: dayDate < todayDateOnly,
      count: matchingData?.count ?? 0,
      duration: matchingData?.totalDuration ?? 0,
      weight: matchingData?.totalWeight ?? 0,
      sets: matchingData?.totalSets ?? 0,
      exerciseNames: matchingData?.exerciseNames ?? [],
      notes: matchingData?.notes ?? [],
      workoutNames: matchingData?.workoutNames ?? [],
    }
  })

  // --- Chart Configuration ---

  const getCurrentMetricDisplayInfo = () => {
    switch (activeMetric) {
      case 'totalWeight':
        return {
          data: mappedData.map(item => item.weight),
          label: `Total Weight (${weightUnit})`,
          yAxisLabel: `Weight (${weightUnit})`,
          color: 'rgba(59, 130, 246, 0.8)', // Enhanced blue
          borderColor: 'rgba(59, 130, 246, 1)',
          gradient: 'from-blue-400 to-blue-600',
          icon: TrendingUp,
        }
      case 'totalSets':
        return {
          data: mappedData.map(item => item.sets),
          label: 'Total Sets',
          yAxisLabel: 'Sets',
          color: 'rgba(16, 185, 129, 0.8)', // Enhanced green
          borderColor: 'rgba(16, 185, 129, 1)',
          gradient: 'from-green-400 to-green-600',
          icon: Activity,
        }
      case 'totalDuration':
      default:
        return {
          data: mappedData.map(item => item.duration),
          label: 'Duration (min)',
          yAxisLabel: 'Duration (min)',
          color: 'rgba(249, 115, 22, 0.8)', // Enhanced orange
          borderColor: 'rgba(249, 115, 22, 1)',
          gradient: 'from-orange-400 to-orange-600',
          icon: Clock,
        }
    }
  }
  const currentMetricInfo = getCurrentMetricDisplayInfo()

  const chartData: ChartData<'bar'> = {
    labels: mappedData.map(item => item.label),
    datasets: [
      {
        label: currentMetricInfo.label,
        data: currentMetricInfo.data,
        backgroundColor: currentMetricInfo.color,
        borderColor: currentMetricInfo.borderColor,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: currentMetricInfo.borderColor,
        hoverBorderColor: currentMetricInfo.borderColor,
        hoverBorderWidth: 3,
      },
    ],
  }

  // Enhanced chart options with animations
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isTransitioning ? 300 : 800,
      easing: 'easeOutQuart',
    },
    transitions: {
      active: {
        animation: {
          duration: 200,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    layout: {
      padding: {
        bottom: 15,
        top: 10,
      },
    },
    plugins: {
      legend: {
        display: false, // We'll show this in our custom header
      },
      title: {
        display: false, // We'll show this in our custom header
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: 'rgba(17, 24, 39, 0.9)',
        bodyColor: 'rgba(55, 65, 81, 0.8)',
        borderColor: 'rgba(209, 213, 219, 0.8)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function (tooltipItems: any[]) {
            const dataIndex = tooltipItems[0].dataIndex
            if (!mappedData || dataIndex >= mappedData.length || dataIndex < 0) return ''
            const dataPoint = mappedData[dataIndex]
            const dateLabel = tooltipItems[0].label

            if (dataPoint.workoutNames && dataPoint.workoutNames.length > 0) {
              const workoutName = dataPoint.workoutNames[0] ?? 'Workout'
              return `${dateLabel} • ${workoutName}`
            }

            return dateLabel
          },
          label: function (context: any) {
            const value = context.parsed.y
            const dataIndex = context.dataIndex
            if (!mappedData || dataIndex >= mappedData.length || dataIndex < 0) return ''
            const dataPoint = mappedData[dataIndex]

            const lines = []
            
            // Main metric value with icon
            const metricIcon = activeMetric === 'totalDuration' ? '⏱️' : 
                             activeMetric === 'totalWeight' ? '🏋️' : '📊'
            lines.push(`${metricIcon} ${currentMetricInfo.label}: ${value}`)

            // Additional context
            if (dataPoint.count > 0) {
              lines.push(`🎯 Workouts: ${dataPoint.count}`)
            }

            // Exercise details
            if (dataPoint.exerciseNames && dataPoint.exerciseNames.length > 0) {
              lines.push('')
              lines.push('💪 Exercises:')
              dataPoint.exerciseNames.slice(0, 3).forEach(name => {
                lines.push(`  • ${name ?? 'N/A'}`)
              })
              if (dataPoint.exerciseNames.length > 3) {
                lines.push(`  • +${dataPoint.exerciseNames.length - 3} more...`)
              }
            }

            // Notes
            if (dataPoint.notes && dataPoint.notes.length > 0) {
              lines.push('')
              lines.push('📝 Notes:')
              const note = dataPoint.notes[0]
              const truncatedNote = note && note.length > 60 ? note.substring(0, 60) + '...' : (note ?? '')
              lines.push(`  ${truncatedNote}`)
            }

            return lines
          },
        },
      },
    },
    scales: {
              y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(209, 213, 219, 0.3)',
          },
        ticks: {
          color: 'rgba(55, 65, 81, 0.7)',
          font: {
            size: 12,
          },
          padding: 8,
        },
                  title: {
            display: true,
            text: currentMetricInfo.yAxisLabel,
            color: 'rgba(55, 65, 81, 0.8)',
            font: {
              family: 'system-ui',
              size: 13,
              weight: 'bold',
            },
            padding: 16,
          },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(55, 65, 81, 0.7)',
          font: {
            size: 11,
          },
          maxRotation: 0,
          padding: 8,
          callback: function (value: any, index: number) {
            if (!mappedData || index >= mappedData.length || index < 0) return ''
            const dataPoint = mappedData[index]
            const dateLabel = format(new Date(dataPoint.date), 'EEE')

            if (dataPoint.count > 0) {
              return [dateLabel, '💪']
            } else if (dataPoint.isPast) {
              return [dateLabel, '😴']
            } else {
              return [dateLabel, '—']
            }
          },
        },
        title: {
          display: false,
        },
      },
    },
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-card">
        <ChartSkeleton />
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        {/* Title and current metric info */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${currentMetricInfo.gradient}`}>
            <currentMetricInfo.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{formatWeekTitle(weekOffset)}</h3>
            <p className="text-sm text-gray-600">Viewing: {currentMetricInfo.label}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
            aria-label="Previous Week"
            className="hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-gray-500 px-2">Week {weekOffset === 0 ? 'Current' : `${Math.abs(weekOffset)} ago`}</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
            disabled={weekOffset === 0}
            aria-label="Next Week"
            className="hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Metric Selection Buttons */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['totalDuration', 'totalWeight', 'totalSets'] as TrendMetric[]).map(metric => {
            const isActive = activeMetric === metric
            let buttonText = ''
            let icon = null
            
            if (metric === 'totalDuration') {
              buttonText = 'Duration'
              icon = <Clock className="w-4 h-4" />
            } else if (metric === 'totalWeight') {
              buttonText = `Weight (${weightUnit})`
              icon = <TrendingUp className="w-4 h-4" />
            } else if (metric === 'totalSets') {
              buttonText = 'Sets'
              icon = <Activity className="w-4 h-4" />
            }

            return (
              <Button
                key={metric}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleMetricChange(metric)}
                className={`
                  flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                {icon}
                <span>{buttonText}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Chart Container */}
      <div className={`h-[400px] relative transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {mappedData.reduce((sum, day) => sum + day.count, 0)}
          </p>
          <p className="text-xs text-gray-500">Total Workouts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(mappedData.reduce((sum, day) => sum + day.duration, 0))}
          </p>
          <p className="text-xs text-gray-500">Total Minutes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(mappedData.reduce((sum, day) => sum + day.weight, 0))}
          </p>
          <p className="text-xs text-gray-500">Total {weightUnit}</p>
        </div>
      </div>
    </div>
  )
}
