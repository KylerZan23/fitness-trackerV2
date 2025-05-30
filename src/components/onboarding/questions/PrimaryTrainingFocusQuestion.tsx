'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'

const TRAINING_FOCUS_OPTIONS: { 
  value: string
  label: string
  description: string
  emoji: string
  color: string
}[] = [
  {
    value: 'General Fitness',
    label: 'General Fitness',
    description: 'Balanced approach for overall health and wellness',
    emoji: '🌟',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
  },
  {
    value: 'Bodybuilding',
    label: 'Bodybuilding',
    description: 'Focus on muscle growth and physique development',
    emoji: '💪',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: 'Powerlifting',
    label: 'Powerlifting',
    description: 'Maximize strength in squat, bench, and deadlift',
    emoji: '🏋️‍♂️',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
  },
  {
    value: 'Athletic Performance',
    label: 'Athletic Performance',
    description: 'Improve speed, power, and sport-specific abilities',
    emoji: '⚡',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
  },
  {
    value: 'Endurance',
    label: 'Endurance',
    description: 'Build cardiovascular fitness and stamina',
    emoji: '🏃‍♀️',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  },
  {
    value: 'Functional Fitness',
    label: 'Functional Fitness',
    description: 'Improve movement quality for daily activities',
    emoji: '🤸‍♂️',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
  }
]

export function PrimaryTrainingFocusQuestion({ value, onChange, error }: QuestionProps) {
  const selectedFocus = value as string | undefined

  return (
    <div className="space-y-4">
      {/* Training Focus Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRAINING_FOCUS_OPTIONS.map((focus) => {
          const isSelected = selectedFocus === focus.value
          
          return (
            <button
              key={focus.value}
              onClick={() => onChange(focus.value)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : focus.color
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

              {/* Focus Content */}
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{focus.emoji}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {focus.label}
                  </h3>
                  <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {focus.description}
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
          💡 <strong>Tip:</strong> Your training style determines the structure and focus of your workouts. Choose what aligns best with your goals!
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>💪</span>
              <span><strong>Bodybuilding:</strong> Higher volume, isolation exercises</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🏋️‍♂️</span>
              <span><strong>Powerlifting:</strong> Heavy compound movements</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span><strong>Athletic:</strong> Explosive, sport-specific training</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>🏃‍♀️</span>
              <span><strong>Endurance:</strong> Cardio-focused with strength support</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🤸‍♂️</span>
              <span><strong>Functional:</strong> Movement patterns for daily life</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🌟</span>
              <span><strong>General:</strong> Balanced mix of everything</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 