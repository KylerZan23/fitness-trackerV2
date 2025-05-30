'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'
import { type FitnessGoal } from '@/lib/types/onboarding'

const FITNESS_GOALS: { value: FitnessGoal; label: string; description: string; emoji: string; color: string }[] = [
  {
    value: 'Muscle Gain',
    label: 'Muscle Gain',
    description: 'Build lean muscle mass and increase size',
    emoji: '💪',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: 'Strength Gain',
    label: 'Strength Gain',
    description: 'Increase maximum strength and power',
    emoji: '🏋️‍♂️',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
  },
  {
    value: 'Endurance Improvement',
    label: 'Endurance Improvement',
    description: 'Improve cardiovascular fitness and stamina',
    emoji: '🏃‍♀️',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  },
  {
    value: 'Sport-Specific',
    label: 'Sport-Specific',
    description: 'Train for a specific sport or activity',
    emoji: '⚽',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
  },
  {
    value: 'General Fitness',
    label: 'General Fitness',
    description: 'Overall health and wellness improvement',
    emoji: '🌟',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
  }
]

export function PrimaryGoalQuestion({ value, onChange, error }: QuestionProps) {
  const selectedGoal = value as FitnessGoal | undefined

  return (
    <div className="space-y-4">
      {/* Goal Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FITNESS_GOALS.map((goal) => {
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
          💡 <strong>Tip:</strong> Choose the goal that matters most to you right now. You can always adjust your focus later!
        </p>
      </div>
    </div>
  )
} 