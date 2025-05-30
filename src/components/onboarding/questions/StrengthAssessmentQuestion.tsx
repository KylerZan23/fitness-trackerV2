'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type QuestionProps } from '../types/onboarding-flow'

interface StrengthData {
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
  strengthAssessmentType?: 'actual_1rm' | 'estimated_1rm' | 'unsure'
}

const STRENGTH_EXERCISES = [
  {
    key: 'squat1RMEstimate' as keyof StrengthData,
    label: 'Squat',
    emoji: '🏋️‍♂️',
    description: 'Back squat or front squat',
    placeholder: 'e.g., 225'
  },
  {
    key: 'benchPress1RMEstimate' as keyof StrengthData,
    label: 'Bench Press',
    emoji: '💪',
    description: 'Barbell bench press',
    placeholder: 'e.g., 185'
  },
  {
    key: 'deadlift1RMEstimate' as keyof StrengthData,
    label: 'Deadlift',
    emoji: '🔥',
    description: 'Conventional or sumo deadlift',
    placeholder: 'e.g., 275'
  },
  {
    key: 'overheadPress1RMEstimate' as keyof StrengthData,
    label: 'Overhead Press',
    emoji: '🚀',
    description: 'Standing military press',
    placeholder: 'e.g., 135'
  }
]

export function StrengthAssessmentQuestion({ value, onChange, error }: QuestionProps) {
  const strengthData = (value as StrengthData) || {}

  const handleInputChange = (field: keyof StrengthData, inputValue: string | number) => {
    const newData = { ...strengthData }
    
    if (typeof inputValue === 'string' && field !== 'strengthAssessmentType') {
      // Handle numeric inputs
      const numValue = inputValue === '' ? undefined : parseInt(inputValue, 10)
      if (inputValue !== '' && (isNaN(numValue!) || numValue! <= 0)) {
        return // Don't update if invalid number
      }
      newData[field] = numValue as any
    } else {
      newData[field] = inputValue as any
    }
    
    onChange(newData)
  }

  const hasAnyStrengthData = STRENGTH_EXERCISES.some(exercise => {
    const value = strengthData[exercise.key]
    return typeof value === 'number' && value > 0
  })

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          💪 Help us personalize your training weights
        </h3>
        <p className="text-gray-600">
          Enter your estimated 1-rep max (1RM) for these exercises. Don't worry if you're not sure - you can skip this!
        </p>
      </div>

      {/* Strength Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STRENGTH_EXERCISES.map((exercise) => (
          <div key={exercise.key} className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{exercise.emoji}</span>
              <div>
                <Label htmlFor={exercise.key} className="text-lg font-semibold text-gray-900">
                  {exercise.label}
                </Label>
                <p className="text-sm text-gray-600">{exercise.description}</p>
              </div>
            </div>
            
            <div className="relative">
              <Input
                id={exercise.key}
                type="number"
                placeholder={exercise.placeholder}
                value={strengthData[exercise.key] || ''}
                onChange={(e) => handleInputChange(exercise.key, e.target.value)}
                className="text-lg py-3 pr-16 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                step="5"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                lbs
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assessment Type Selection (only show if user has entered any data) */}
      {hasAnyStrengthData && (
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-gray-900">
            How confident are you in these numbers?
          </Label>
          <Select
            value={strengthData.strengthAssessmentType || ''}
            onValueChange={(value) => handleInputChange('strengthAssessmentType', value)}
          >
            <SelectTrigger className="text-lg py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="Select your confidence level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actual_1rm">
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <div>
                    <div className="font-medium">Actual 1RM</div>
                    <div className="text-sm text-gray-600">I've tested these recently</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="estimated_1rm">
                <div className="flex items-center space-x-2">
                  <span>📊</span>
                  <div>
                    <div className="font-medium">Estimated 1RM</div>
                    <div className="text-sm text-gray-600">Based on my recent training</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="unsure">
                <div className="flex items-center space-x-2">
                  <span>🤔</span>
                  <div>
                    <div className="font-medium">Not sure</div>
                    <div className="text-sm text-gray-600">Best guess, might be off</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Helpful Information */}
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 What's a 1RM?</h4>
          <p className="text-sm text-blue-800 mb-2">
            Your 1-rep max (1RM) is the maximum weight you can lift for one complete repetition with proper form.
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Don't have a 1RM?</strong> Estimate based on your heaviest sets</li>
            <li>• <strong>Use online calculators</strong> if you know your 5RM or 10RM</li>
            <li>• <strong>When in doubt</strong> - underestimate rather than overestimate</li>
          </ul>
        </div>

        {hasAnyStrengthData && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Great! This will help us recommend appropriate weights
            </h4>
            <p className="text-sm text-green-800">
              We'll use these numbers to suggest training weights based on proven strength training principles.
              You can always adjust the weights during your workouts.
            </p>
          </div>
        )}

        {!hasAnyStrengthData && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              🤷‍♀️ No problem if you don't know these numbers!
            </h4>
            <p className="text-sm text-gray-700">
              You can skip this question and we'll provide general guidance. 
              You can always add this information later in your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
