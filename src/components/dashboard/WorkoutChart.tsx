'use client'

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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { WorkoutTrend } from '@/lib/db'

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

interface WorkoutChartProps {
  data: WorkoutTrend[]
  period: 'week' | 'month'
}

export function WorkoutChart({ data, period }: WorkoutChartProps) {
  const chartData: ChartData<'line'> = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Workouts',
        data: data.map(item => item.count),
        borderColor: 'rgba(147, 197, 253, 0.8)',
        backgroundColor: 'rgba(147, 197, 253, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Total Weight (kg/lbs)',
        data: data.map(item => item.totalWeight),
        borderColor: 'rgba(110, 231, 183, 0.8)',
        backgroundColor: 'rgba(110, 231, 183, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Total Duration (min)',
        data: data.map(item => item.totalDuration),
        borderColor: 'rgba(251, 146, 60, 0.8)',
        backgroundColor: 'rgba(251, 146, 60, 0.2)',
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'system-ui',
          }
        }
      },
      title: {
        display: true,
        text: `Workout Trends - Past ${period === 'week' ? 'Week' : 'Month'}`,
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          family: 'serif',
          size: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      }
    },
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
} 