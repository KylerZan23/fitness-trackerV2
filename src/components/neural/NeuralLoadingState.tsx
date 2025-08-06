'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Zap, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NeuralLoadingStateProps {
  /** Optional title override */
  title?: string
  /** Optional subtitle override */  
  subtitle?: string
  /** Estimated time in seconds */
  estimatedTime?: number
  /** Custom analysis steps */
  analysisSteps?: string[]
  /** Additional CSS classes */
  className?: string
}

const DEFAULT_ANALYSIS_STEPS = [
  "Analyzing your strength profile...",
  "Optimizing exercise selection...", 
  "Calculating volume landmarks...",
  "Applying progressive overload...",
  "Generating Neural insights...",
  "Finalizing your program..."
]

export function NeuralLoadingState({
  title = "Coach Neural is Creating Your Program",
  subtitle = "Using advanced AI and exercise science to craft your perfect training plan",
  estimatedTime = 15,
  analysisSteps = DEFAULT_ANALYSIS_STEPS,
  className
}: NeuralLoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, (estimatedTime * 1000) / analysisSteps.length)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) {
          return prev + (100 / (estimatedTime * 10))
        }
        return 100
      })
    }, 100)

    const timeInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev > 0) {
          return prev - 1
        }
        return 0
      })
    }, 1000)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
      clearInterval(timeInterval)
    }
  }, [estimatedTime, analysisSteps.length])

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4",
      "bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50",
      className
    )}>
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-8">
          {/* Neural Branding Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-6">
              {/* Animated Brain Icon with Neural Network Effect */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                
                {/* Neural Network Animation Rings */}
                <div className="absolute inset-0 rounded-xl border-2 border-blue-400/30 animate-ping" />
                <div className="absolute inset-0 rounded-xl border-2 border-purple-400/30 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/30 animate-ping" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Floating Neural Connections */}
              <div className="absolute -top-2 -right-2">
                <Zap className="w-4 h-4 text-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Target className="w-4 h-4 text-purple-500 animate-bounce" style={{ animationDelay: '0.8s' }} />
              </div>
              <div className="absolute -top-2 -left-2">
                <TrendingUp className="w-4 h-4 text-indigo-500 animate-bounce" style={{ animationDelay: '1.2s' }} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Analysis Steps */}
          <div className="space-y-3 mb-6">
            {analysisSteps.map((step, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all duration-500",
                  index <= currentStep 
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200" 
                    : "bg-gray-50 border border-gray-200"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500",
                  index < currentStep 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                    : index === currentStep
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse"
                    : "bg-gray-300 text-gray-600"
                )}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className={cn(
                  "text-sm transition-all duration-500",
                  index <= currentStep ? "text-gray-900 font-medium" : "text-gray-500"
                )}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Time Remaining */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Neural analysis: ~{timeRemaining}s remaining
              </span>
            </div>
          </div>

          {/* Premium Coaching Message */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-xs text-center text-gray-600 leading-relaxed">
              <span className="font-semibold text-blue-600">Coach Neural</span> is analyzing 
              thousands of exercise science studies to create your personalized program. 
              Every rep, set, and progression is backed by peer-reviewed research.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NeuralLoadingState
