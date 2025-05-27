'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  previousValue?: number
  description?: string
  iconName?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  gradientType?: 'energy' | 'strength' | 'endurance' | 'cardio' | 'default'
  animationDelay?: number
}

// Animation hook for counting up numbers
function useCountUp(end: number, duration: number = 1000, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!hasStarted) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, hasStarted])

  return count
}

export function StatsCard({ 
  title, 
  value, 
  previousValue,
  description, 
  iconName, 
  trend,
  gradientType = 'default',
  animationDelay = 0
}: StatsCardProps) {
  // Parse numeric value for animation
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : value
  const animatedValue = useCountUp(numericValue, 1200, animationDelay)
  
  // Format the animated value back to string if original was string
  const displayValue = typeof value === 'string' 
    ? value.replace(/[\d.-]+/, animatedValue.toString())
    : animatedValue

  // Gradient classes based on type
  const gradientClasses = {
    energy: 'bg-gradient-energy',
    strength: 'bg-gradient-strength', 
    endurance: 'bg-gradient-endurance',
    cardio: 'bg-gradient-cardio',
    default: 'bg-gradient-to-br from-gray-50 to-gray-100'
  }

  // Text color classes for readability on gradients
  const textClasses = {
    energy: 'text-white',
    strength: 'text-white',
    endurance: 'text-white', 
    cardio: 'text-white',
    default: 'text-gray-900'
  }

  // Icon color classes
  const iconClasses = {
    energy: 'text-white/80',
    strength: 'text-white/80',
    endurance: 'text-white/80',
    cardio: 'text-white/80', 
    default: 'text-gray-500'
  }

  // Calculate trend if previousValue is provided
  const calculatedTrend = previousValue !== undefined && previousValue > 0 ? {
    value: Math.round(((numericValue - previousValue) / previousValue) * 100),
    isPositive: numericValue >= previousValue
  } : trend

  return (
    <div 
      className={`
        ${gradientClasses[gradientType]} 
        border border-white/20 rounded-xl p-6 shadow-card hover:shadow-card-elevated 
        transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1
        animate-slideUp relative overflow-hidden group
      `}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Background pattern overlay for texture */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {iconName && (
              <div className={`${iconClasses[gradientType]} transition-colors duration-200`}>
                <Icon name={iconName} size={20} />
              </div>
            )}
            <h3 className={`
              text-sm font-semibold ${textClasses[gradientType]} 
              uppercase tracking-wider opacity-90
            `}>
              {title}
            </h3>
          </div>
          
          {calculatedTrend && (
            <div className={`
              flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
              ${calculatedTrend.isPositive 
                ? 'bg-green-500/20 text-green-100' 
                : 'bg-red-500/20 text-red-100'
              }
              ${gradientType === 'default' 
                ? calculatedTrend.isPositive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
                : ''
              }
            `}>
              {calculatedTrend.isPositive ? (
                <TrendingUp size={12} />
              ) : calculatedTrend.value === 0 ? (
                <Minus size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{Math.abs(calculatedTrend.value)}%</span>
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="mb-2">
          <p className={`
            text-3xl font-bold ${textClasses[gradientType]} 
            leading-none animate-countUp
          `}>
            {displayValue}
          </p>
        </div>

        {/* Description */}
        {description && (
          <p className={`
            text-sm ${textClasses[gradientType]} opacity-80 
            leading-relaxed
          `}>
            {description}
          </p>
        )}

        {/* Subtle glow effect on hover */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 pointer-events-none
          ${gradientType === 'energy' ? 'shadow-glow-orange' : ''}
          ${gradientType === 'strength' ? 'shadow-glow-blue' : ''}
          ${gradientType === 'endurance' ? 'shadow-glow-green' : ''}
          ${gradientType === 'cardio' ? 'shadow-glow-purple' : ''}
        `}></div>
      </div>
    </div>
  )
}
