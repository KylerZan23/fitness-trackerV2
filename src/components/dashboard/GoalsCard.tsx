'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCurrentWeekGoalsWithProgress } from '@/lib/goalsDb'
import type { GoalWithProgress } from '@/lib/types'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/button'
import { AddGoalModal } from './AddGoalModal'
import { Target, Trophy, Zap, Calendar, TrendingUp } from 'lucide-react'

// Enhanced loading skeleton
function GoalsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full w-full"></div>
        </div>
      ))}
    </div>
  )
}

// Animated progress bar component
function AnimatedProgressBar({ 
  progress, 
  color, 
  isCompleted, 
  animationDelay = 0 
}: { 
  progress: number
  color: string
  isCompleted: boolean
  animationDelay?: number
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, animationDelay)

    return () => clearTimeout(timer)
  }, [progress, animationDelay])

  return (
    <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      {/* Background glow for completed goals */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 animate-pulse"></div>
      )}
      
      {/* Progress bar */}
      <div
        ref={progressRef}
        className={`
          h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden
          ${color}
          ${isCompleted ? 'shadow-lg' : ''}
        `}
        style={{ width: `${animatedProgress}%` }}
      >
        {/* Shimmer effect for active progress */}
        {!isCompleted && animatedProgress > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        )}
        
        {/* Celebration sparkles for completed goals */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <Trophy className="w-3 h-3 text-white animate-bounce" />
          </div>
        )}
      </div>
      
      {/* Progress percentage indicator */}
      {animatedProgress > 15 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-sm">
            {Math.round(animatedProgress)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Update component props - no longer needs default mock data
interface GoalsCardProps {}

export function GoalsCard({}: GoalsCardProps) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set())

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedGoals = await fetchCurrentWeekGoalsWithProgress()
      setGoals(fetchedGoals)
      
      // Track completed goals for celebration effects
      const newCompletedGoals = new Set<string>()
      fetchedGoals.forEach(goal => {
        if (goal.current_value >= goal.target_value) {
          newCompletedGoals.add(goal.id)
        }
      })
      setCompletedGoals(newCompletedGoals)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setError(err instanceof Error ? err.message : 'Could not load goals.')
      setGoals([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  // Helper to calculate progress percentage
  const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return 0
    return Math.min(Math.max((current / target) * 100, 0), 100)
  }

  // Helper to format the display value (e.g., "15/20 mi", "4/5 days")
  const formatValueDisplay = (goal: GoalWithProgress): string => {
    const current = Math.round(goal.current_value * 10) / 10
    const target = Math.round(goal.target_value * 10) / 10
    return `${current}/${target} ${goal.target_unit ?? ''}`.trim()
  }

  // Enhanced progress color system with gradients
  const getProgressColorInfo = (metricType: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: Trophy,
        bgColor: 'from-green-50 to-emerald-50'
      }
    }

    if (metricType.includes('distance')) {
      return {
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        icon: TrendingUp,
        bgColor: 'from-blue-50 to-cyan-50'
      }
    }
    if (metricType.includes('days') || metricType.includes('frequency')) {
      return {
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icon: Calendar,
        bgColor: 'from-purple-50 to-pink-50'
      }
    }
    if (metricType.includes('pace') || metricType.includes('speed')) {
      return {
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        icon: Zap,
        bgColor: 'from-orange-50 to-red-50'
      }
    }
    
    return {
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      icon: Target,
      bgColor: 'from-indigo-50 to-purple-50'
    }
  }

  // Calculate overall progress stats
  const totalGoals = goals.length
  const completedGoalsCount = goals.filter(g => g.current_value >= g.target_value).length
  const overallProgress = totalGoals > 0 ? (completedGoalsCount / totalGoals) * 100 : 0

  return (
    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200 h-full flex flex-col hover:shadow-card-hover transition-shadow duration-300">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Weekly Goals</h2>
            {totalGoals > 0 && (
              <p className="text-sm text-gray-600">
                {completedGoalsCount}/{totalGoals} completed • {Math.round(overallProgress)}%
              </p>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAddModalOpen(true)}
          className="hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
        >
          <Icon name="plus" className="mr-1 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* Overall Progress Indicator */}
      {totalGoals > 0 && !isLoading && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">{Math.round(overallProgress)}%</span>
          </div>
          <AnimatedProgressBar
            progress={overallProgress}
            color="bg-gradient-to-r from-indigo-500 to-purple-500"
            isCompleted={overallProgress === 100}
            animationDelay={200}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-grow">
          <GoalsLoadingSkeleton />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <div className="p-3 rounded-full bg-red-100 mb-4">
            <Icon name="alert-triangle" className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Error Loading Goals</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadGoals}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && goals.length === 0 && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <div className="p-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 mb-4">
            <Target className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Set</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-xs">
            Set weekly goals to track your progress and stay motivated on your fitness journey.
          </p>
          <Button 
            variant="default" 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Icon name="plus" className="mr-2 h-4 w-4" /> 
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Goals List */}
      {!isLoading && !error && goals.length > 0 && (
        <div className="space-y-6 flex-grow">
          {goals.map((goal, index) => {
            const progressPercent = calculateProgress(goal.current_value, goal.target_value)
            const displayValue = formatValueDisplay(goal)
            const isCompleted = goal.current_value >= goal.target_value
            const colorInfo = getProgressColorInfo(goal.metric_type, isCompleted)
            
            // Use goal.label if available, otherwise generate one from metric_type
            const goalLabel =
              goal.label ??
              goal.metric_type
                .replace('_', ' ')
                .replace('weekly ', '')
                .split(' ')
                .map(w => w[0].toUpperCase() + w.slice(1))
                .join(' ')

            return (
              <div 
                key={goal.id}
                className={`
                  p-4 rounded-lg border transition-all duration-300 hover:shadow-md
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : `bg-gradient-to-r ${colorInfo.bgColor} border-gray-200 hover:border-gray-300`
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorInfo.color}`}>
                      <colorInfo.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{goalLabel}</h4>
                      <p className="text-sm text-gray-600">{goal.metric_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{displayValue}</p>
                    {isCompleted && (
                      <p className="text-xs text-green-600 font-medium flex items-center">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completed!
                      </p>
                    )}
                  </div>
                </div>
                
                <AnimatedProgressBar
                  progress={progressPercent}
                  color={colorInfo.color}
                  isCompleted={isCompleted}
                  animationDelay={index * 200}
                />
              </div>
            )
          })}
        </div>
      )}

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onGoalAdded={loadGoals}
      />
    </div>
  )
}
