'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { type QuestionProps } from '../types/onboarding-flow'

const EXAMPLE_PREFERENCES = [
  "I love compound movements like squats and deadlifts",
  "I prefer bodyweight exercises over machines",
  "I enjoy high-intensity interval training",
  "I like functional movements that help with daily activities",
  "I prefer shorter, intense workouts over long sessions"
]

const EXAMPLE_DISLIKES = [
  "I hate burpees and mountain climbers",
  "I don't like exercises that put stress on my lower back",
  "I'm not comfortable with overhead movements due to shoulder issues",
  "I find long cardio sessions boring",
  "I don't enjoy exercises that require a lot of coordination"
]

export function ExercisePreferencesQuestion({ value, onChange, error }: QuestionProps) {
  const currentValue = value as string | undefined
  const [showExamples, setShowExamples] = React.useState(false)

  const handleTextChange = (text: string) => {
    onChange(text.trim() === '' ? undefined : text)
  }

  return (
    <div className="space-y-6">
      {/* Main Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exercise-preferences" className="text-lg font-semibold text-gray-900">
            Tell us about your exercise preferences
          </Label>
          <p className="text-sm text-gray-600">
            Share what you love, what you hate, any limitations, or specific exercises you want to include or avoid.
          </p>
        </div>
        
        <Textarea
          id="exercise-preferences"
          placeholder="e.g., I love compound movements but hate burpees. I have a shoulder injury so I avoid overhead pressing..."
          value={currentValue || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[120px] text-base resize-none"
          maxLength={500}
        />
        
        {/* Character Count */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Be as specific as you'd like - this helps us personalize your program</span>
          <span>{currentValue?.length || 0}/500</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Examples Toggle */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium underline"
        >
          {showExamples ? 'Hide examples' : 'Need inspiration? See examples'}
        </button>
      </div>

      {/* Examples Section */}
      {showExamples && (
        <div className="space-y-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferences Examples */}
            <div className="space-y-3">
              <h4 className="font-semibold text-green-900 flex items-center">
                <span className="text-green-600 mr-2">💚</span>
                Things you might love:
              </h4>
              <ul className="space-y-2">
                {EXAMPLE_PREFERENCES.map((example, index) => (
                  <li key={index} className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                    "{example}"
                  </li>
                ))}
              </ul>
            </div>

            {/* Dislikes Examples */}
            <div className="space-y-3">
              <h4 className="font-semibold text-red-900 flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                Things you might avoid:
              </h4>
              <ul className="space-y-2">
                {EXAMPLE_DISLIKES.map((example, index) => (
                  <li key={index} className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                    "{example}"
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Categories */}
          <div className="border-t border-gray-300 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Other things to consider mentioning:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-blue-900">🏥 Physical Limitations</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• Injuries or pain areas</li>
                  <li>• Movement restrictions</li>
                  <li>• Doctor recommendations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-purple-900">🎯 Specific Goals</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• Sport-specific movements</li>
                  <li>• Muscle groups to focus on</li>
                  <li>• Skills you want to develop</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-orange-900">⚡ Training Style</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• High vs. low intensity</li>
                  <li>• Equipment preferences</li>
                  <li>• Workout environment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Pro Tips for Better Recommendations
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about injuries or limitations - we'll work around them</li>
          <li>• Mention if you have favorite exercises you want to keep doing</li>
          <li>• Tell us about past experiences that worked well or didn't work</li>
          <li>• Include any equipment you particularly love or hate using</li>
        </ul>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't have specific preferences? No worries! You can skip this and we'll create a balanced program for you.
        </p>
      </div>
    </div>
  )
}
