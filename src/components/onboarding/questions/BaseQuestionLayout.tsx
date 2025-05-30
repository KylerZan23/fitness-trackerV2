'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { type ProgressInfo } from '../types/onboarding-flow'

interface BaseQuestionLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  progress: ProgressInfo
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  isOptional?: boolean
  isLoading?: boolean
  error?: string
  questionKey?: string // For animation keys
}

/**
 * Circular progress indicator component with smooth animations
 */
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
        {/* Background circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle with smooth animation */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-indigo-600 transition-all duration-700 ease-out"
          strokeLinecap="round"
          style={{
            transitionProperty: 'stroke-dashoffset, stroke',
            transitionDuration: '0.7s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-gray-700 transition-all duration-300">
          {percentage}%
        </span>
      </div>
    </div>
  )
}

/**
 * Base layout component for individual onboarding questions
 * Provides full-page question experience with engaging visual design and smooth animations
 */
export function BaseQuestionLayout({
  title,
  description,
  children,
  progress,
  onNext,
  onPrevious,
  onSkip,
  canGoNext,
  canGoPrevious,
  isOptional = false,
  isLoading = false,
  error,
  questionKey
}: BaseQuestionLayoutProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)

  // Trigger entrance animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [questionKey])

  // Handle smooth transitions
  const handleNext = async () => {
    if (!canGoNext || isLoading) return
    
    setIsExiting(true)
    await new Promise(resolve => setTimeout(resolve, 200))
    onNext()
    setIsExiting(false)
    setIsVisible(false)
  }

  const handlePrevious = async () => {
    if (!canGoPrevious || isLoading) return
    
    setIsExiting(true)
    await new Promise(resolve => setTimeout(resolve, 200))
    onPrevious()
    setIsExiting(false)
    setIsVisible(false)
  }

  const handleSkip = async () => {
    if (!onSkip || isLoading) return
    
    setIsExiting(true)
    await new Promise(resolve => setTimeout(resolve, 200))
    onSkip()
    setIsExiting(false)
    setIsVisible(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-8 overflow-hidden">
      <div className="w-full max-w-3xl">
        {/* Progress Section with entrance animation */}
        <div 
          className={`mb-8 text-center transition-all duration-500 ease-out ${
            isVisible && !isExiting 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-4'
          }`}
        >
          <CircularProgress percentage={progress.percentage} />
          <p className="text-center text-sm text-gray-600 mt-3 transition-all duration-300">
            Question {progress.current} of {progress.total}
          </p>
          {isOptional && (
            <p className="text-xs text-gray-500 mt-1 transition-all duration-300">
              This question is optional
            </p>
          )}
        </div>

        {/* Question Card with slide animation */}
        <Card 
          className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-500 ease-out ${
            isVisible && !isExiting 
              ? 'opacity-100 translate-x-0 scale-100' 
              : isExiting
                ? 'opacity-0 -translate-x-8 scale-95'
                : 'opacity-0 translate-x-8 scale-95'
          }`}
          style={{
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.5s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle 
              className={`text-3xl font-bold text-gray-900 mb-3 leading-tight transition-all duration-700 delay-100 ${
                isVisible && !isExiting 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription 
                className={`text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
                  isVisible && !isExiting 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pb-8 px-8">
            {/* Error Display with animation */}
            {error && (
              <div 
                className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-lg transition-all duration-300 ${
                  error ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="flex items-center">
                  <Icon name="alert-circle" className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Question Content with staggered animation */}
            <div 
              className={`max-w-2xl mx-auto transition-all duration-700 delay-300 ${
                isVisible && !isExiting 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-6'
              }`}
            >
              {children}
            </div>
          </CardContent>

          <CardFooter 
            className={`flex justify-between items-center pt-8 pb-8 px-8 border-t bg-gray-50/50 transition-all duration-700 delay-400 ${
              isVisible && !isExiting 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious || isLoading}
              className="px-6 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              <Icon name="chevron-left" className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Skip Button (for optional questions) */}
              {isOptional && onSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  Skip for now
                </Button>
              )}

              {/* Next/Continue Button */}
              <Button
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Icon name="loader" className="animate-spin h-4 w-4 mr-2" />
                    Loading...
                  </>
                ) : progress.current === progress.total ? (
                  <>
                    Review & Continue
                    <Icon name="check" className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <Icon name="chevron-right" className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Progress Bar with smooth animation */}
        <div 
          className={`mt-6 max-w-md mx-auto transition-all duration-700 delay-500 ${
            isVisible && !isExiting 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${progress.percentage}%`,
                transitionProperty: 'width',
                transitionDuration: '0.7s',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 