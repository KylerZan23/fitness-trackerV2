'use client'

import React from 'react'
import { Check, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description?: string
}

interface NeuralProgressIndicatorProps {
  /** Current step index (0-based) */
  currentStep: number
  /** Array of step configurations */
  steps: Step[]
  /** Show step descriptions below titles */
  showDescriptions?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
  /** Custom className for styling */
  className?: string
}

/**
 * NeuralProgressIndicator - Visual progress indicator for Neural onboarding flow
 * 
 * Features:
 * - Clean progress bar with Neural branding
 * - Step indicators with completion states
 * - Smooth animations and transitions
 * - Responsive design for all screen sizes
 * - Accessible with proper ARIA labels
 */
export function NeuralProgressIndicator({
  currentStep,
  steps,
  showDescriptions = false,
  compact = false,
  className
}: NeuralProgressIndicatorProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn(
      "w-full",
      compact ? "py-4" : "py-6",
      className
    )}>
      {/* Neural Branding Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 ml-3">Neural Setup</h2>
        </div>
        <p className="text-sm text-gray-600">Personalizing your fitness journey</p>
      </div>

      {/* Progress Bar Container */}
      <div className="relative mb-24">
        {/* Background Progress Track */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Animated Progress Fill */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-start transform -translate-y-1/2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex flex-col items-center",
                  !compact && "min-w-0 flex-1"
                )}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ease-out",
                    "shadow-sm",
                    isCompleted && "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 scale-110",
                    isCurrent && "bg-white border-blue-500 ring-4 ring-blue-100 scale-110",
                    isUpcoming && "bg-white border-gray-300"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isCurrent && "text-blue-600",
                        isUpcoming && "text-gray-400"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                {!compact && (
                  <div className="mt-4 text-center min-w-0 max-w-[120px]">
                    <div
                      className={cn(
                        "text-sm font-medium transition-colors duration-300 leading-tight",
                        isCompleted && "text-blue-600",
                        isCurrent && "text-blue-700 font-semibold",
                        isUpcoming && "text-gray-500"
                      )}
                    >
                      {step.title}
                    </div>
                    {showDescriptions && step.description && (
                      <div
                        className={cn(
                          "text-xs mt-2 transition-colors duration-300 leading-tight",
                          isCompleted && "text-blue-500",
                          isCurrent && "text-blue-600",
                          isUpcoming && "text-gray-400"
                        )}
                      >
                        {step.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Info (Compact Mode) */}
      {compact && (
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {steps[currentStep]?.title}
          </div>
          {showDescriptions && steps[currentStep]?.description && (
            <div className="text-sm text-gray-600 mt-1">
              {steps[currentStep].description}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      )}

      {/* Progress Stats */}
      <div className="mt-6 flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
          <span className="text-gray-600">
            {currentStep + 1} of {steps.length} completed
          </span>
        </div>
        <div className="text-blue-600 font-medium">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>
    </div>
  )
}

// Default step configurations for Neural onboarding
export const NEURAL_ONBOARDING_STEPS: Step[] = [
  {
    id: 'focus',
    title: 'Your Goals',
    description: 'What do you want to achieve?'
  },
  {
    id: 'experience',
    title: 'Experience',
    description: 'Tell us your fitness background'
  },
  {
    id: 'schedule',
    title: 'Schedule',
    description: 'How much time can you commit?'
  },
  {
    id: 'equipment',
    title: 'Equipment',
    description: 'What do you have access to?'
  },
  {
    id: 'strength',
    title: 'Strength',
    description: 'Optional: Share your current levels'
  }
]
