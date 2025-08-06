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
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

  const supabase = await createClient()

interface VolumeData {
  week_start: string
  muscle_group: string
  weekly_volume: number
  total_sets: number
  training_days_in_week: number
}

interface VolumeProgressionChartProps {
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
} as const

export function VolumeProgressionChart({ 
  userId, 
  className = '',
  weightUnit = 'kg'
}: VolumeProgressionChartProps) {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'12weeks' | '6months' | '1year'>('12weeks')
  const [viewMode, setViewMode] = useState<'volume' | 'sets'>('volume')

  useEffect(() => {
    async function fetchVolumeData() {
      setIsLoading(true)
      setError(null)

      try {
        const periods = {
          '12weeks': 12 * 7,
          '6months': 6 * 30,
          '1year': 365,
        }

        const daysBack = periods[selectedPeriod]
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysBack)

        const { data, error } = await supabase
          .from('user_advanced_analytics')
          .select('week_start, muscle_group, weekly_volume, total_sets, training_days_in_week')
          .eq('user_id', userId)
          .gte('week_start', startDate.toISOString())
          .order('week_start', { ascending: true })

        if (error) {
          throw error
        }

        setVolumeData(data || [])
      } catch (err) {
        console.error('Error fetching volume data:', err)
        setError('Failed to load volume progression data')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchVolumeData()
    }
  }, [userId, selectedPeriod])

  const chartData = useMemo(() => {
    if (!volumeData.length) return null

    // Get unique weeks and muscle groups
    const weeks = Array.from(new Set(volumeData.map(d => d.week_start))).sort()
    const muscleGroups = Array.from(new Set(volumeData.map(d => d.muscle_group)))

    // Prepare datasets for each muscle group
    const datasets = muscleGroups.map(muscleGroup => {
      const color = MUSCLE_GROUP_COLORS[muscleGroup as keyof typeof MUSCLE_GROUP_COLORS] || '#6b7280'
      
      const data = weeks.map(week => {
        const weekData = volumeData.find(d => d.week_start === week && d.muscle_group === muscleGroup)
        return viewMode === 'volume' 
          ? (weekData?.weekly_volume || 0)
          : (weekData?.total_sets || 0)
      })

      return {
        label: muscleGroup,
        data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      }
    })

    return {
      labels: weeks.map(week => {
        const date = new Date(week)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets,
    }
  }, [volumeData, viewMode])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const weekStart = new Date(volumeData.find(d => d.week_start)?.week_start || '')
            return `Week of ${weekStart.toLocaleDateString()}`
          },
          label: (context: any) => {
            const value = context.parsed.y
            const unit = viewMode === 'volume' ? weightUnit : 'sets'
            return `${context.dataset.label}: ${value.toLocaleString()} ${unit}`
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
          text: 'Week',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: viewMode === 'volume' ? `Volume (${weightUnit})` : 'Sets',
        },
        ticks: {
          callback: (value: any) => {
            return viewMode === 'volume' 
              ? `${value.toLocaleString()}${weightUnit}`
              : `${value} sets`
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Volume Progression</span>
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
            <TrendingUp className="h-5 w-5" />
            <span>Volume Progression</span>
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

  if (!chartData || chartData.datasets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Volume Progression</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No volume data available for the selected period</p>
              <p className="text-sm text-gray-500 mt-2">Start logging workouts to see your progression</p>
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
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Volume Progression</span>
            </CardTitle>
            <CardDescription>
              Track your training volume and sets over time by muscle group
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={viewMode === 'volume' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('volume')}
                className="h-8 px-3"
              >
                Volume
              </Button>
              <Button
                variant={viewMode === 'sets' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('sets')}
                className="h-8 px-3"
              >
                Sets
              </Button>
            </div>

            {/* Period Selector */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={selectedPeriod === '12weeks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod('12weeks')}
                className="h-8 px-3"
              >
                12W
              </Button>
              <Button
                variant={selectedPeriod === '6months' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod('6months')}
                className="h-8 px-3"
              >
                6M
              </Button>
              <Button
                variant={selectedPeriod === '1year' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod('1year')}
                className="h-8 px-3"
              >
                1Y
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}