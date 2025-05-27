'use client'

import { useState, useEffect } from 'react'
import { Flame, Calendar, Trophy, Zap } from 'lucide-react'

interface StreakIndicatorProps {
  currentStreak: number
  longestStreak: number
  streakType: 'workout' | 'goal' | 'login'
  className?: string
  showMilestones?: boolean
}

export function StreakIndicator({ 
  currentStreak, 
  longestStreak, 
  streakType,
  className = '',
  showMilestones = true
}: StreakIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Trigger animation when streak increases
  useEffect(() => {
    if (currentStreak > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [currentStreak])

  // Show celebration for milestones
  useEffect(() => {
    const milestones = [7, 14, 30, 50, 100]
    if (milestones.includes(currentStreak)) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStreak])

  const getStreakLevel = () => {
    if (currentStreak >= 100) return { level: 'legendary', color: 'from-purple-500 to-pink-500' }
    if (currentStreak >= 50) return { level: 'master', color: 'from-indigo-500 to-purple-500' }
    if (currentStreak >= 30) return { level: 'expert', color: 'from-blue-500 to-indigo-500' }
    if (currentStreak >= 14) return { level: 'advanced', color: 'from-green-500 to-blue-500' }
    if (currentStreak >= 7) return { level: 'intermediate', color: 'from-yellow-500 to-green-500' }
    if (currentStreak >= 3) return { level: 'beginner', color: 'from-orange-500 to-yellow-500' }
    return { level: 'starter', color: 'from-gray-400 to-gray-500' }
  }

  const getStreakIcon = () => {
    switch (streakType) {
      case 'workout':
        return Flame
      case 'goal':
        return Trophy
      case 'login':
        return Calendar
      default:
        return Flame
    }
  }

  const getStreakMessage = () => {
    const { level } = getStreakLevel()
    const messages = {
      starter: 'Getting started!',
      beginner: 'Building momentum!',
      intermediate: 'On fire! 🔥',
      advanced: 'Crushing it!',
      expert: 'Unstoppable!',
      master: 'Legendary status!',
      legendary: 'Fitness deity! 👑'
    }
    return messages[level as keyof typeof messages]
  }

  const streakLevel = getStreakLevel()
  const StreakIcon = getStreakIcon()

  if (currentStreak === 0) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <StreakIcon className="w-5 h-5" />
        <span className="text-sm">Start your streak!</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 -m-4 pointer-events-none">
          <div className="relative w-full h-full">
            {/* Confetti particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
            
            {/* Milestone badge */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                🎉 {currentStreak} Day Milestone!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main streak display */}
      <div className={`
        flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r ${streakLevel.color}
        text-white shadow-lg transition-all duration-300
        ${isAnimating ? 'scale-110 shadow-xl' : 'hover:scale-105'}
      `}>
        {/* Streak icon with animation */}
        <div className={`
          relative flex-shrink-0
          ${isAnimating ? 'animate-bounce' : ''}
        `}>
          <StreakIcon className={`
            w-6 h-6 transition-all duration-300
            ${currentStreak >= 7 ? 'animate-pulse' : ''}
          `} />
          
          {/* Fire particles for high streaks */}
          {currentStreak >= 14 && (
            <div className="absolute -top-1 -right-1">
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Streak content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">
              {currentStreak}
            </span>
            <span className="text-sm opacity-90">
              day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="text-xs opacity-80 mt-1">
            {getStreakMessage()}
          </div>
        </div>

        {/* Personal best indicator */}
        {currentStreak === longestStreak && currentStreak > 1 && (
          <div className="flex-shrink-0">
            <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Trophy className="w-3 h-3" />
              <span>PB</span>
            </div>
          </div>
        )}
      </div>

      {/* Milestones progress */}
      {showMilestones && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Next milestone</span>
            <span>
              {currentStreak >= 100 ? '🏆 Max level!' : 
               currentStreak >= 50 ? '100 days' :
               currentStreak >= 30 ? '50 days' :
               currentStreak >= 14 ? '30 days' :
               currentStreak >= 7 ? '14 days' :
               '7 days'
              }
            </span>
          </div>
          
          {currentStreak < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${streakLevel.color} transition-all duration-500`}
                style={{ 
                  width: `${
                    currentStreak >= 50 ? ((currentStreak - 50) / 50) * 100 :
                    currentStreak >= 30 ? ((currentStreak - 30) / 20) * 100 :
                    currentStreak >= 14 ? ((currentStreak - 14) / 16) * 100 :
                    currentStreak >= 7 ? ((currentStreak - 7) / 7) * 100 :
                    (currentStreak / 7) * 100
                  }%` 
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 