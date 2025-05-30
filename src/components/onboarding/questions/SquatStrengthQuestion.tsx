'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type QuestionProps } from '../types/onboarding-flow'

export function SquatStrengthQuestion({ value, onChange, error }: QuestionProps) {
  const currentValue = value as number | undefined

  const handleInputChange = (inputValue: string) => {
    if (inputValue === '') {
      onChange(undefined)
      return
    }
    
    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue)
    }
  }

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="text-6xl mb-4">🏋️‍♂️</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Squat Strength
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          What's your estimated 1-rep max for the squat? This helps us recommend appropriate training weights.
        </p>
      </div>

      {/* Weight Input */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="squat-weight" className="text-lg font-semibold text-gray-900">
            Squat 1RM (pounds)
          </Label>
          <div className="relative">
            <Input
              id="squat-weight"
              type="number"
              placeholder="e.g., 225"
              value={currentValue || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              className="text-xl py-4 pr-16 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              step="5"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-lg">
              lbs
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Helpful Information */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 About Squat 1RM</h4>
          <p className="text-sm text-blue-800 mb-2">
            Your squat 1RM is the maximum weight you can squat for one complete repetition with proper form.
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include back squat, front squat, or your preferred squat variation</li>
            <li>• If you don't know your exact 1RM, estimate based on your heaviest sets</li>
            <li>• Use online 1RM calculators if you know your 3RM or 5RM</li>
            <li>• When in doubt, it's better to underestimate than overestimate</li>
          </ul>
        </div>

        {currentValue && currentValue > 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Great! We'll use {currentValue} lbs for your squat recommendations
            </h4>
            <p className="text-sm text-green-800">
              Based on this, we'll suggest training weights around:
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• <strong>Heavy sets (1-5 reps):</strong> {Math.round(currentValue * 0.85)}-{Math.round(currentValue * 0.95)} lbs</li>
              <li>• <strong>Moderate sets (6-12 reps):</strong> {Math.round(currentValue * 0.65)}-{Math.round(currentValue * 0.80)} lbs</li>
              <li>• <strong>Light sets (12+ reps):</strong> {Math.round(currentValue * 0.50)}-{Math.round(currentValue * 0.65)} lbs</li>
            </ul>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">
            💡 Don't know your squat 1RM? No problem! You can skip this question and we'll provide general guidance instead.
          </p>
        </div>
      </div>
    </div>
  )
}
