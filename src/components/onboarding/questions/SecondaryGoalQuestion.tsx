'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'

const SECONDARY_GOAL_OPTIONS: { 
  value: string
  label: string
  description: string
  emoji: string
  color: string
}[] = [
  {
    value: 'Muscle Gain',
    label: 'Muscle Gain',
    description: 'Build lean muscle mass and improve physique',
    emoji: '💪',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: 'Strength Gain',
    label: 'Strength Gain', 
    description: 'Increase maximum strength and power output',
    emoji: '🏋️‍♂️',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
  },
  {
    value: 'Endurance Improvement',
    label: 'Endurance Improvement',
    description: 'Boost cardiovascular fitness and stamina',
    emoji: '🏃‍♀️',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  },
  {
    value: 'Sport-Specific',
    label: 'Sport-Specific',
    description: 'Improve performance in a particular sport',
    emoji: '⚽',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
  },
  {
    value: 'General Fitness',
    label: 'General Fitness',
    description: 'Overall health, wellness, and daily function',
    emoji: '🌟',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
  }
]

export function SecondaryGoalQuestion({ value, onChange, error }: QuestionProps) {
  const selectedGoal = value as string | undefined

  return (
    <div className="space-y-6">
      {/* Goal Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECONDARY_GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoal === goal.value
          
          return (
            <button
              key={goal.value}
              onClick={() => onChange(goal.value)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : goal.color
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Goal Content */}
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{goal.emoji}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {goal.label}
                  </h3>
                  <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {goal.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          💡 <strong>Tip:</strong> Having multiple goals is totally normal! This helps us create a more well-rounded program for you.
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>💪</span>
              <span><strong>Muscle Gain:</strong> Hypertrophy-focused training</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🏋️‍♂️</span>
              <span><strong>Strength:</strong> Heavy compound movements</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🏃‍♀️</span>
              <span><strong>Endurance:</strong> Cardio and conditioning</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>⚽</span>
              <span><strong>Sport-Specific:</strong> Performance training</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🌟</span>
              <span><strong>General Fitness:</strong> Balanced approach</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🎯</span>
              <span><strong>Remember:</strong> This is your secondary goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't have a secondary goal? No problem! You can skip this question and focus on your primary goal.
        </p>
      </div>
    </div>
  )
}
