'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'
import { type WeightUnit } from '@/lib/types/onboarding'

const UNIT_OPTIONS: { 
  value: WeightUnit
  label: string
  description: string
  examples: string
  emoji: string
  color: string
}[] = [
  {
    value: 'kg',
    label: 'Kilograms (kg)',
    description: 'Metric system - used worldwide',
    examples: 'Squat: 100kg, Bench: 80kg, Deadlift: 120kg',
    emoji: '🌍',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
  },
  {
    value: 'lbs',
    label: 'Pounds (lbs)',
    description: 'Imperial system - common in US gyms',
    examples: 'Squat: 225lbs, Bench: 185lbs, Deadlift: 275lbs',
    emoji: '🇺🇸',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
  }
]

export function UnitPreferenceQuestion({ value, onChange, error }: QuestionProps) {
  const selectedUnit = value as WeightUnit | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="text-6xl mb-4">⚖️</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          What weight unit do you prefer?
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We'll use this throughout the app for displaying weights and collecting your strength data.
        </p>
      </div>

      {/* Unit Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {UNIT_OPTIONS.map((unit) => {
          const isSelected = selectedUnit === unit.value
          
          return (
            <button
              key={unit.value}
              onClick={() => onChange(unit.value)}
              className={`
                relative p-8 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : unit.color
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

              {/* Unit Content */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{unit.emoji}</div>
                  <div>
                    <h3 className={`text-xl font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {unit.label}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {unit.description}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-medium mb-1 ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>
                    Example weights:
                  </p>
                  <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {unit.examples}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Helper Information */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">💡 Why we ask this</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your choice affects how we display weights throughout the app</li>
            <li>• Strength assessments will use your preferred unit</li>
            <li>• Training programs will show weights in your chosen unit</li>
            <li>• You can change this later in your profile settings</li>
          </ul>
        </div>

        {selectedUnit && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Great! We'll use {selectedUnit === 'kg' ? 'kilograms' : 'pounds'} throughout the app
            </h4>
            <p className="text-sm text-green-800">
              {selectedUnit === 'kg' 
                ? 'All weights will be displayed in kilograms (kg) and strength assessments will ask for kg values.'
                : 'All weights will be displayed in pounds (lbs) and strength assessments will ask for lbs values.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 