'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'

const EXPERIENCE_LEVELS: { 
  value: string
  label: string
  description: string
  details: string
  emoji: string
  color: string
}[] = [
  {
    value: 'Beginner (0-3 months)',
    label: 'Beginner',
    description: 'New to fitness or returning after a long break',
    details: '0–3 months of consistent training',
    emoji: '🌱',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  },
  {
    value: 'Intermediate (3-12 months)',
    label: 'Intermediate',
    description: 'Have some experience with regular training',
    details: '3–12 months of consistent training',
    emoji: '🏃‍♂️',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: 'Advanced (12+ months)',
    label: 'Advanced',
    description: 'Experienced with consistent long-term training',
    details: '12+ months of dedicated training experience',
    emoji: '🏆',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
  }
]

export function ExperienceLevelQuestion({ value, onChange, error }: QuestionProps) {
  const selectedLevel = value as string | undefined

  return (
    <div className="space-y-6">
      {/* Experience Level Options */}
      <div className="space-y-4">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.value
          
          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={`
                relative w-full p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : level.color
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

              {/* Level Content */}
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{level.emoji}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {level.label}
                  </h3>
                  <p className={`text-sm mb-1 ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {level.description}
                  </p>
                  <p className={`text-xs font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {level.details}
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
          💡 <strong>Tip:</strong> Be honest about your experience level - this helps us create a program that's challenging but safe for you!
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 text-xs text-gray-600">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <span>🌱</span>
              <span className="font-semibold">Beginner:</span>
            </div>
            <p>We'll focus on learning proper form, building base fitness, and establishing consistent habits.</p>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <span>🏃‍♂️</span>
              <span className="font-semibold">Intermediate:</span>
            </div>
            <p>We'll add more variety, increase intensity, and work on specific goals with progressive overload.</p>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-1">
              <span>🏆</span>
              <span className="font-semibold">Advanced:</span>
            </div>
            <p>We'll create sophisticated programming with periodization, advanced techniques, and specialized methods.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
