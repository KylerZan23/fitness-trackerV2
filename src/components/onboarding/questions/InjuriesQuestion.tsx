'use client'

import React from 'react'
import { type QuestionProps } from '../types/onboarding-flow'
import { Textarea } from '@/components/ui/textarea'

export function InjuriesQuestion({ value, onChange, error }: QuestionProps) {
  const currentValue = value as string | undefined

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue || undefined)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Safety First: Injuries & Limitations
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Help us keep you safe by sharing any current or past injuries, pain areas, or physical limitations.
        </p>
      </div>

      {/* Input Area */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="space-y-2">
          <label htmlFor="injuries-input" className="text-lg font-semibold text-gray-900 block">
            Current or Past Injuries/Limitations (Optional)
          </label>
          <Textarea
            id="injuries-input"
            placeholder="e.g., Lower back pain when deadlifting, previous knee surgery, shoulder impingement, wrist issues..."
            value={currentValue || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="min-h-[120px] text-base p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={5}
          />
          <p className="text-sm text-gray-500">
            Be as specific as possible - this helps us modify exercises to keep you safe and pain-free.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-2xl mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Helpful Examples */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">🦴</span>
              Joint Issues
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Knee pain or previous surgery</li>
              <li>• Shoulder impingement</li>
              <li>• Hip mobility restrictions</li>
              <li>• Ankle stiffness</li>
              <li>• Wrist or elbow pain</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">💪</span>
              Muscle/Back Issues
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Lower back pain</li>
              <li>• Herniated disc</li>
              <li>• Muscle strains</li>
              <li>• Neck tension</li>
              <li>• Sciatica</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
              <span className="mr-2">🏥</span>
              Medical Conditions
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Heart conditions</li>
              <li>• High blood pressure</li>
              <li>• Diabetes considerations</li>
              <li>• Balance issues</li>
              <li>• Doctor restrictions</li>
            </ul>
          </div>
        </div>

        {/* Safety Message */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
            <span className="mr-2">🛡️</span>
            How We'll Use This Information
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• <strong>Exercise Modifications:</strong> We'll suggest safer alternatives for problematic movements</li>
            <li>• <strong>Progressive Approach:</strong> Start conservatively and build up gradually</li>
            <li>• <strong>Form Emphasis:</strong> Extra focus on proper technique for sensitive areas</li>
            <li>• <strong>Recovery Considerations:</strong> Include appropriate warm-up and mobility work</li>
          </ul>
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            No current injuries or limitations? Great! You can skip this question and we'll create a standard program for you.
          </p>
        </div>
      </div>
    </div>
  )
}
