'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'

const TRAINING_FREQUENCY_OPTIONS = [
  {
    value: 2,
    label: '2 days',
    description: 'Perfect for beginners or busy schedules',
    emoji: '🌱',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300',
    recommendation: 'Great for starting out'
  },
  {
    value: 3,
    label: '3 days',
    description: 'Ideal balance for most people',
    emoji: '⚖️',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
    recommendation: 'Most popular choice'
  },
  {
    value: 4,
    label: '4 days',
    description: 'Great for building momentum',
    emoji: '🚀',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
    recommendation: 'Excellent for progress'
  },
  {
    value: 5,
    label: '5 days',
    description: 'Serious commitment to fitness',
    emoji: '🔥',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
    recommendation: 'High dedication'
  },
  {
    value: 6,
    label: '6 days',
    description: 'Advanced training schedule',
    emoji: '💯',
    color: 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300',
    recommendation: 'For experienced athletes'
  },
  {
    value: 7,
    label: '7 days',
    description: 'Maximum commitment',
    emoji: '🏆',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300',
    recommendation: 'Elite level dedication'
  }
]

export function TrainingFrequencyQuestion({ value, onChange, error }: QuestionProps) {
  const selectedFrequency = value as number | undefined

  return (
    <div className="space-y-6">
      {/* Frequency Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TRAINING_FREQUENCY_OPTIONS.map((option) => {
          const isSelected = selectedFrequency === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                relative p-5 rounded-xl border-2 text-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                  : option.color
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Option Content */}
              <div className="space-y-2">
                <div className="text-3xl">{option.emoji}</div>
                <div className={`text-2xl font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                <div className={`text-xs font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {option.recommendation}
                </div>
                <div className={`text-xs ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {option.description}
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

      {/* Helpful Information */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Training Frequency Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Consistency beats intensity</strong> - Better to train 3 days consistently than 6 days sporadically</li>
            <li>• <strong>Start conservative</strong> - You can always increase frequency later</li>
            <li>• <strong>Include rest days</strong> - Recovery is when your body actually gets stronger</li>
          </ul>
        </div>

        {selectedFrequency && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Great choice! {selectedFrequency} days per week
            </h4>
            <p className="text-sm text-green-800">
              {selectedFrequency <= 3 && "This is perfect for building a sustainable routine. Focus on full-body workouts to maximize your time."}
              {selectedFrequency === 4 && "Excellent balance! You can split between upper/lower body or push/pull workouts."}
              {selectedFrequency === 5 && "High commitment level! You'll see great results with this frequency."}
              {selectedFrequency >= 6 && "Elite dedication! Make sure to prioritize recovery and listen to your body."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 