import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  isLoading?: boolean
}

export function StatsCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  trendValue,
  className,
  isLoading = false
}: StatsCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(
        "bg-white border border-gray-200 rounded-xl p-6 shadow-sm",
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    )
  }

  // Trend icon based on direction
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  
  // Trend color classes
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  }

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* Main value display */}
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-lg font-medium text-gray-500">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle and trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">
            {subtitle}
          </p>
        )}
        
        {trend && trendValue && (
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            trendColors[trend]
          )}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized stats card for strength metrics
export interface StrengthStatsCardProps {
  liftName: string
  e1rmValue: number | null
  unit: 'kg' | 'lbs'
  confidence?: 'high' | 'medium' | 'low'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  lastTested?: string
  icon?: React.ReactNode
  className?: string
  isLoading?: boolean
}

export function StrengthStatsCard({
  liftName,
  e1rmValue,
  unit,
  confidence,
  trend,
  trendValue,
  lastTested,
  icon,
  className,
  isLoading = false
}: StrengthStatsCardProps) {
  // Confidence indicators
  const confidenceColors = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  const confidenceText = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence'
  }

  const displayValue = e1rmValue ? Math.round(e1rmValue) : '—'
  const subtitle = e1rmValue && lastTested 
    ? `Last tested ${lastTested}`
    : e1rmValue 
    ? 'Estimated 1RM'
    : 'No data available'

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {/* Header with lift name and icon */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {liftName} 1RM
        </h3>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* e1RM value */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className={cn(
          "text-2xl font-bold",
          e1rmValue ? "text-gray-900" : "text-gray-400"
        )}>
          {displayValue}
        </span>
        {e1rmValue && (
          <span className="text-lg font-medium text-gray-500">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom section with confidence and trend */}
      <div className="space-y-2">
        {/* Subtitle */}
        <p className="text-xs text-gray-500">
          {subtitle}
        </p>

        {/* Confidence and trend indicators */}
        <div className="flex items-center justify-between">
          {confidence && e1rmValue && (
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium border",
              confidenceColors[confidence]
            )}>
              {confidenceText[confidence]}
            </div>
          )}
          
          {trend && trendValue && e1rmValue && (
            <div className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === 'up' ? 'text-green-600 bg-green-50' :
              trend === 'down' ? 'text-red-600 bg-red-50' :
              'text-gray-600 bg-gray-50'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
               trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      )}
    </div>
  )
}

// Grid container for strength stats cards
export interface StrengthVitalsGridProps {
  children: React.ReactNode
  className?: string
}

export function StrengthVitalsGrid({ children, className }: StrengthVitalsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
      className
    )}>
      {children}
    </div>
  )
} 