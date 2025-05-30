'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'

const SESSION_DURATIONS: { 
  value: string
  label: string
  description: string
  recommendation: string
  emoji: string
  color: string
}[] = [
  {
    value: '30-45 minutes',
    label: '30-45 min',
    description: 'Quick and efficient workouts',
    recommendation: 'Perfect for busy schedules',
    emoji: '⚡',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
  },
  {
    value: '45-60 minutes',
    label: '45-60 min',
    description: 'Balanced workout duration',
    recommendation: 'Most popular choice',
    emoji: '⏰',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  },
  {
    value: '60-75 minutes',
    label: '60-75 min',
    description: 'Comprehensive training sessions',
    recommendation: 'Great for detailed programs',
    emoji: '💪',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: '75+ minutes',
    label: '75+ min',
    description: 'Extended training sessions',
    recommendation: 'For serious athletes',
    emoji: '🔥',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
  }
]

export function SessionDurationQuestion({ value, onChange, error }: QuestionProps) {
  const selectedDuration = value as string | undefined

  return (
    <div className="space-y-6">
      {/* Duration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SESSION_DURATIONS.map((duration) => {
          const isSelected = selectedDuration === duration.value
          
          return (
            <button
              key={duration.value}
              onClick={() => onChange(duration.value)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : duration.color
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

              {/* Duration Content */}
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{duration.emoji}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {duration.label}
                  </h3>
                  <p className={`text-sm mb-1 ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {duration.description}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {duration.recommendation}
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

      {/* Helper Information */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Tip:</strong> Consider your schedule realistically. It's better to consistently do shorter workouts than to skip longer ones.
          </p>
        </div>

        {/* Duration Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span><strong>30-45 min:</strong> Focus on compound movements</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⏰</span>
              <span><strong>45-60 min:</strong> Balanced strength + cardio</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>💪</span>
              <span><strong>60-75 min:</strong> Detailed muscle targeting</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🔥</span>
              <span><strong>75+ min:</strong> Comprehensive training</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
