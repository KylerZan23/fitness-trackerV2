'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'
import { type FitnessGoal } from '@/lib/types/onboarding'

const FITNESS_GOALS: { value: FitnessGoal; label: string; description: string; emoji: string; color: string }[] = [
  {
    value: 'Muscle Gain: General',
    label: 'Muscle Gain: General',
    description: 'Build lean muscle mass and increase size',
    emoji: '💪',
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150 hover:border-blue-300'
  },
  {
    value: 'Muscle Gain: Hypertrophy Focus',
    label: 'Muscle Gain: Hypertrophy Focus',
    description: 'Advanced muscle building with volume focus',
    emoji: '🏗️',
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-150 hover:border-purple-300'
  },
  {
    value: 'Strength Gain: Powerlifting Peak',
    label: 'Strength Gain: Powerlifting Peak',
    description: 'Maximize strength in squat, bench, deadlift',
    emoji: '🏋️‍♂️',
    color: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-150 hover:border-red-300'
  },
  {
    value: 'Strength Gain: General',
    label: 'Strength Gain: General',
    description: 'Increase overall strength and power',
    emoji: '⚡',
    color: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-150 hover:border-orange-300'
  },
  {
    value: 'Endurance Improvement: Gym Cardio',
    label: 'Endurance Improvement: Gym Cardio',
    description: 'Improve cardio fitness using gym equipment',
    emoji: '🏃‍♀️',
    color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-150 hover:border-green-300'
  },
  {
    value: 'Sport-Specific S&C: Explosive Power',
    label: 'Sport-Specific S&C: Explosive Power',
    description: 'Athletic performance and power development',
    emoji: '⚽',
    color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:from-indigo-100 hover:to-indigo-150 hover:border-indigo-300'
  },
  {
    value: 'General Fitness: Foundational Strength',
    label: 'General Fitness: Foundational Strength',
    description: 'Build basic strength and movement patterns',
    emoji: '🌟',
    color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-150 hover:border-yellow-300'
  },
  {
    value: 'Weight Loss: Gym Based',
    label: 'Weight Loss: Gym Based',
    description: 'Fat loss through structured gym workouts',
    emoji: '🔥',
    color: 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:from-pink-100 hover:to-pink-150 hover:border-pink-300'
  },
  {
    value: 'Bodyweight Mastery',
    label: 'Bodyweight Mastery',
    description: 'Master bodyweight movements and skills',
    emoji: '🤸‍♀️',
    color: 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:from-teal-100 hover:to-teal-150 hover:border-teal-300'
  },
  {
    value: 'Recomposition: Lean Mass & Fat Loss',
    label: 'Recomposition: Lean Mass & Fat Loss',
    description: 'Simultaneous muscle gain and fat loss',
    emoji: '⚖️',
    color: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:from-slate-100 hover:to-slate-150 hover:border-slate-300'
  }
]

export function PrimaryGoalQuestion({ value, onChange, error }: QuestionProps) {
  const selectedGoal = value as FitnessGoal | undefined

  return (
    <div className="space-y-6">
      {/* Goal Options - Improved Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {FITNESS_GOALS.map((goal) => {
          const isSelected = selectedGoal === goal.value
          
          return (
            <button
              key={goal.value}
              onClick={() => onChange(goal.value)}
              className={`
                group relative h-full min-h-[140px] p-5 rounded-2xl border-2 text-left 
                transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-lg
                focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:scale-[1.02]
                ${isSelected 
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg ring-4 ring-indigo-500/20 scale-[1.02]' 
                  : goal.color
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Goal Content - Improved Layout */}
              <div className="flex flex-col h-full">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="text-3xl flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110">
                    {goal.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold mb-1 leading-tight transition-colors duration-300 ${
                      isSelected ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {goal.label}
                    </h3>
                  </div>
                </div>
                
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isSelected ? 'text-indigo-700' : 'text-gray-600'
                }`}>
                  {goal.description}
                </p>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          )
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Helper Text - Improved Design */}
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50 shadow-sm">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-2xl">💡</span>
          <span className="text-lg font-semibold text-indigo-900">Pro Tip</span>
        </div>
        <p className="text-sm text-indigo-700 text-center leading-relaxed">
          Choose the goal that matters most to you right now. You can always adjust your focus later as you progress!
        </p>
      </div>
    </div>
  )
} 