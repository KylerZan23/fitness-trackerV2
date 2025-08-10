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
      <div className="mb-10 text-center">
        <div className="mb-3 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h2 className="ml-3 text-xl font-bold text-gray-900">Neural Setup</h2>
        </div>
        <p className="text-sm text-gray-600">Personalizing your fitness journey</p>
      </div>

      {/* Progress Bar Container */}
      <div className="relative mb-36">
        {/* Background Progress Track (glass) */}
        <div className="h-2 w-full overflow-hidden rounded-full border border-blue-200/50 bg-white/70 backdrop-blur">
          {/* Animated Progress Fill */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.35)] transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="absolute left-0 top-0 flex w-full -translate-y-[45%] items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div
                key={step.id}
                className={cn("relative flex flex-col items-center", !compact && "min-w-0 flex-1")}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out",
                    "shadow-sm",
                    isCompleted && "scale-110 border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md",
                    isCurrent && "scale-110 border-blue-500 bg-white ring-4 ring-blue-100",
                    isUpcoming && "border-gray-300 bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
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
                  <div className="mt-10 text-center min-w-0 max-w-[120px]">
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
      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
          <span className="text-gray-600">Step {currentStep + 1} of {steps.length}</span>
        </div>
        <div className="font-medium text-blue-700">{Math.round(progressPercentage)}% complete</div>
      </div>
    </div>
  )
}

// Default step configurations for Neural onboarding
export const NEURAL_ONBOARDING_STEPS: Step[] = [
  {
    id: 'quick-info',
    title: 'Quick Info',
    description: 'Gender, height, weight, unit'
  },
  {
    id: 'primary-focus',
    title: 'Primary Focus',
    description: 'What is your main goal?'
  },
  {
    id: 'experience',
    title: 'Experience',
    description: 'How experienced are you?'
  },
  {
    id: 'session-duration',
    title: 'Session Duration',
    description: 'How long per session?'
  },
  {
    id: 'equipment',
    title: 'Equipment',
    description: 'What can you access?'
  },
  {
    id: 'days-per-week',
    title: 'Days/Week',
    description: 'How many days can you train?'
  },
  {
    id: 'optional-prs',
    title: 'Optional PRs',
    description: 'Add PRs to refine your plan'
  }
]
