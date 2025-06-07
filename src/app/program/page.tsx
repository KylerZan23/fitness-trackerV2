'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  fetchActiveProgramAction,
  type CompletedDayIdentifier,
} from '@/app/_actions/aiProgramActions'
import { submitProgramFeedback } from '@/app/_actions/feedbackActions'
import { type TrainingProgram } from '@/lib/types/program'
import { type TrainingProgramWithId } from '@/lib/programDb'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Calendar, Target, Clock, TrendingUp, Play, Plus, BarChart3, Settings, HelpCircle, ChevronUp, BookOpen, Activity, Info, Star, MessageSquare } from 'lucide-react'
import { ProgramPhaseDisplay } from '@/components/program/ProgramPhaseDisplay'
import { useToast } from '@/components/ui/Toast'

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
}

// Progress calculation utility functions
const calculateProgramProgress = (
  programData: TrainingProgram,
  completedDays: CompletedDayIdentifier[]
) => {
  let totalWorkouts = 0
  let completedWorkouts = 0

  // Count total workout days (excluding rest days)
  programData.phases.forEach((phase, phaseIndex) => {
    phase.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day) => {
        if (!day.isRestDay) {
          totalWorkouts++
          
          // Check if this workout is completed
          const isCompleted = completedDays.some(
            cd =>
              cd.phaseIndex === phaseIndex &&
              cd.weekIndex === weekIndex &&
              cd.dayOfWeek === day.dayOfWeek
          )
          
          if (isCompleted) {
            completedWorkouts++
          }
        }
      })
    })
  })

  const completionPercentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

  return {
    totalWorkouts,
    completedWorkouts,
    completionPercentage
  }
}

// Program Feedback Component
const ProgramFeedbackSection = ({ programData }: { programData: TrainingProgramWithId }) => {
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const { addToast } = useToast()

  const handleProgramFeedbackSubmit = async () => {
    console.log('Submit handler called, rating:', feedbackRating)
    if (!feedbackRating) {
      console.log('No rating selected, returning early')
      return
    }

    console.log('Proceeding with submission...')
    setIsSubmittingFeedback(true)
    setFeedbackError(null)

    try {
      console.log('Calling submitProgramFeedback with:', {
        programId: programData.id,
        programIdType: typeof programData.id,
        programIdLength: programData.id?.length,
        rating: feedbackRating,
        ratingType: typeof feedbackRating,
        comment: feedbackComment.trim() || undefined
      })
      
      const result = await submitProgramFeedback(
        programData.id,
        feedbackRating,
        feedbackComment.trim() || undefined
      )
      
      console.log('Server action result:', result)

      if (result.success) {
        console.log('Feedback submitted successfully:', result)
        setFeedbackSubmitted(true)
        addToast({
          type: 'success',
          title: 'Feedback submitted!',
          description: 'Thank you for helping us improve your training experience.',
        })
      } else {
        console.error('Server action returned error:', result.error)
        console.error('Full result object:', result)
        setFeedbackError(result.error)
        addToast({
          type: 'error',
          title: 'Failed to submit feedback',
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setFeedbackError(errorMessage)
      addToast({
        type: 'error',
        title: 'Failed to submit feedback',
        description: errorMessage,
      })
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const renderStarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = (hoveredRating ?? feedbackRating ?? 0) >= star
          return (
            <button
              key={star}
              type="button"
              onClick={() => {
                console.log(`Setting rating to: ${star}`)
                setFeedbackRating(star)
              }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className={`p-1 transition-all duration-200 hover:scale-110 ${
                isActive ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
              }`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`}
              />
            </button>
          )
        })}
        {feedbackRating && (
          <span className="ml-2 text-sm text-gray-600">
            {feedbackRating} star{feedbackRating !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    )
  }

  if (feedbackSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Thank you for your feedback!</h3>
              <p className="text-green-700">Your input helps us improve your training experience.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-blue-900">Rate Your Program</CardTitle>
            <CardDescription className="text-blue-700">
              Help us improve by sharing your experience with this AI-generated program
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate this training program?
          </label>
          {renderStarRating()}
        </div>

        {/* Comment Textarea */}
        <div>
          <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 mb-2">
            Additional comments (optional)
          </label>
          <Textarea
            id="feedback-comment"
            placeholder="Share your thoughts about the program structure, exercise selection, difficulty level, or any other feedback..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isSubmittingFeedback}
          />
        </div>

        {/* Error Display */}
        {feedbackError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{feedbackError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleProgramFeedbackSubmit}
            disabled={!feedbackRating || isSubmittingFeedback}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingFeedback ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
          {/* Debug info - remove after testing */}
          <div className="ml-2 text-xs text-gray-500">
            Rating: {feedbackRating || 'None'} | Submitting: {isSubmittingFeedback ? 'Yes' : 'No'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile-Optimized Progress Display Component
const ProgressTrackingSection = ({ 
  programData, 
  completedDays 
}: { 
  programData: TrainingProgram
  completedDays: CompletedDayIdentifier[] 
}) => {
  const { totalWorkouts, completedWorkouts, completionPercentage } = calculateProgramProgress(
    programData,
    completedDays
  )

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Your Progress</h2>
        </div>
        <span className="text-sm sm:text-base opacity-90 font-medium self-start sm:self-auto">{completionPercentage}% Complete</span>
      </div>
      
      <div className="w-full bg-white/20 rounded-full h-2.5 sm:h-3 mb-3 sm:mb-4">
        <div 
          className="bg-white rounded-full h-2.5 sm:h-3 transition-all duration-500 ease-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
        <p className="opacity-90">
          <span className="font-semibold">{completedWorkouts}</span> of <span className="font-semibold">{totalWorkouts}</span> workouts completed
        </p>
        {completionPercentage > 0 && (
          <p className="opacity-90 self-start sm:self-auto">
            Keep it up! 💪
          </p>
        )}
      </div>
    </div>
  )
}

// Floating Action Button Component
const FloatingActionButtons = ({ programData }: { programData: TrainingProgram | null }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const handleStartWorkout = () => {
    router.push('/workout/new')
  }

  const handleLogWorkout = () => {
    router.push('/workout/new')
  }

  const handleViewProgress = () => {
    router.push('/dashboard')
  }

  const handleSettings = () => {
    router.push('/profile')
  }

  const handleHelp = () => {
    // Could open a help modal or navigate to help page
    window.open('https://docs.example.com', '_blank')
  }

  const secondaryActions = [
    {
      icon: BarChart3,
      label: 'View Progress',
      action: handleViewProgress,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      icon: Plus,
      label: 'Log Workout',
      action: handleLogWorkout,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      icon: Settings,
      label: 'Settings',
      action: handleSettings,
      color: 'from-gray-500 to-gray-600',
      hoverColor: 'hover:from-gray-600 hover:to-gray-700'
    },
    {
      icon: HelpCircle,
      label: 'Help',
      action: handleHelp,
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {/* Secondary Action Buttons */}
      <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ease-out ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {secondaryActions.map((action, index) => (
          <div
            key={action.label}
            className={`flex items-center space-x-3 transition-all duration-300 ease-out ${
              isExpanded ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            {/* Action Label */}
            <div className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
              {action.label}
            </div>
            
            {/* Action Button */}
            <button
              onClick={action.action}
              className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.color} ${action.hoverColor} text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center group`}
              aria-label={action.label}
            >
              <action.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        ))}
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center space-x-3">
        {/* Primary Action Label */}
        <div className={`bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}>
          Start Workout
        </div>

        {/* Main FAB */}
        <div className="relative">
          {/* Primary Action Button */}
          <button
            onClick={handleStartWorkout}
            disabled={!programData}
            className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center group ${
              !programData ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Start Today's Workout"
          >
            <Play className="h-7 w-7 group-hover:scale-110 transition-transform duration-200 ml-0.5" />
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={toggleExpanded}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
            aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
          >
            <ChevronUp className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Background Overlay for Mobile */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

// Tab Content Components
const OverviewTabContent = ({ 
  programData, 
  completedDays 
}: { 
  programData: TrainingProgram
  completedDays: CompletedDayIdentifier[] 
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Program Rationale */}
      {programData.generalAdvice && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Info className="w-5 h-5 mr-2" /> Program Rationale from Your AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {programData.generalAdvice}
            </p>
          </CardContent>
        </Card>
      )}



      {/* Progress Tracking */}
      <ProgressTrackingSection programData={programData} completedDays={completedDays} />
      
      {/* Enhanced Interactive Program Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Duration Card */}
        <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-lg border border-white/60 hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-white hover:border-blue-200/50 transition-all duration-500 ease-out cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-100" />
          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-blue-300/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-300" />
          
          <div className="relative z-10 flex items-center space-x-4 sm:space-x-5">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-500 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-blue-600/80 group-hover:text-blue-700 uppercase tracking-wider transition-colors duration-300">Duration</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-blue-900 truncate transition-colors duration-300">
                {programData.durationWeeksTotal} weeks
              </p>
              <p className="text-xs text-gray-500 group-hover:text-blue-600/70 mt-1 hidden sm:block transition-colors duration-300">Complete program length</p>
            </div>
          </div>
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-blue-300/0 group-hover:border-blue-300/30 transition-all duration-500" />
        </div>

        {/* Frequency Card */}
        {programData.trainingFrequency && (
          <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-lg border border-white/60 hover:shadow-2xl hover:shadow-green-500/10 hover:bg-white hover:border-green-200/50 transition-all duration-500 ease-out cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-400/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-100" />
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-green-300/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-300" />
            
            <div className="relative z-10 flex items-center space-x-4 sm:space-x-5">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-green-500/25 transition-all duration-500 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-green-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-green-600/80 group-hover:text-green-700 uppercase tracking-wider transition-colors duration-300">Frequency</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-green-900 truncate transition-colors duration-300">
                  {programData.trainingFrequency}x per week
                </p>
                <p className="text-xs text-gray-500 group-hover:text-green-600/70 mt-1 hidden sm:block transition-colors duration-300">Training sessions</p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-green-300/0 group-hover:border-green-300/30 transition-all duration-500" />
          </div>
        )}

        {/* Difficulty Level Card */}
        {programData.difficultyLevel && (
          <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-lg border border-white/60 hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-white hover:border-purple-200/50 transition-all duration-500 ease-out cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-100" />
            <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-purple-300/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-300" />
            
            <div className="relative z-10 flex items-center space-x-4 sm:space-x-5">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-500 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-purple-600/80 group-hover:text-purple-700 uppercase tracking-wider transition-colors duration-300">Level</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-purple-900 truncate transition-colors duration-300">{programData.difficultyLevel}</p>
                <p className="text-xs text-gray-500 group-hover:text-purple-600/70 mt-1 hidden sm:block transition-colors duration-300">Difficulty rating</p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-purple-300/0 group-hover:border-purple-300/30 transition-all duration-500" />
          </div>
        )}
      </div>
    </div>
  )
}

const ProgramTabContent = ({ 
  programData, 
  completedDays 
}: { 
  programData: TrainingProgram
  completedDays: CompletedDayIdentifier[] 
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Training Program Details
          </h2>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
          Your personalized training program is organized into phases. Click on each phase and
          week to explore detailed workouts and exercises.
        </p>
        <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto" />
      </div>

      {programData.phases.map((phase, phaseIndex) => (
        <ProgramPhaseDisplay
          key={`phase-${phaseIndex}`}
          phase={phase}
          phaseIndex={phaseIndex}
          completedDays={completedDays}
        />
      ))}
    </div>
  )
}

const ResourcesTabContent = ({ programData }: { programData: TrainingProgram }) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* General Advice */}
        {programData.generalAdvice && (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <span>General Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">{programData.generalAdvice}</p>
            </CardContent>
          </Card>
        )}

        {/* Required Equipment */}
        {programData.requiredEquipment && programData.requiredEquipment.length > 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <span>Required Equipment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {programData.requiredEquipment.map((equipment, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-purple-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Tab System Component
const TabNavigation = ({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string
  onTabChange: (tab: string) => void 
}) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
      description: 'Progress & Stats'
    },
    {
      id: 'program',
      label: 'Program',
      icon: BookOpen,
      description: 'Training Details'
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: Info,
      description: 'Advice & Equipment'
    }
  ]

  return (
    <div className="w-full">
      {/* Mobile Tab Navigation */}
      <div className="block sm:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label={`${tab.label} tab`}
              >
                <tab.icon className={`h-5 w-5 mb-1 transition-transform duration-200 ${
                  activeTab === tab.id ? 'scale-110' : ''
                }`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 group ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-[1.01]'
                }`}
                aria-label={`${tab.label} tab`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <tab.icon className={`h-5 w-5 transition-transform duration-200 ${
                    activeTab === tab.id ? 'scale-110 text-white' : 'text-gray-600 group-hover:text-gray-900'
                  }`} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold transition-colors duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {tab.label}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    activeTab === tab.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {tab.description}
                  </div>
                </div>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-300/30 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProgramPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [programData, setProgramData] = useState<TrainingProgramWithId | null>(null)
  const [completedDays, setCompletedDays] = useState<CompletedDayIdentifier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        return
      }

      if (!currentSession) {
        router.push('/login')
        return
      }

      setSession(currentSession)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, profile_picture_url')
        .eq('id', currentSession.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError)
      }

      if (profileData) {
        setProfile(profileData)
      } else {
        // Create minimal profile if it doesn't exist
        const newProfile = {
          id: currentSession.user.id,
          name:
            currentSession.user.user_metadata?.name ||
            currentSession.user.email?.split('@')[0] ||
            'User',
          email: currentSession.user.email || '',
        }
        setProfile(newProfile)
      }

      // Fetch training program using server action
      const result = await fetchActiveProgramAction()

      if (result.error) {
        setError(result.error)
      } else {
        setProgramData(result.program)
        setCompletedDays(result.completedDays || [])

        // Console log the full program data as requested
        if (result.program) {
          console.log('Successfully fetched training program:', result.program)
          console.log('Completed workout days:', result.completedDays)
        }
      }
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: 'Loading...',
          userEmail: '',
          onLogout: handleLogout,
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your training program...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: profile?.name || 'User',
          userEmail: profile?.email || '',
          profilePictureUrl: profile?.profile_picture_url,
          onLogout: handleLogout,
        }}
      >
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6"
          role="alert"
        >
          {error}
        </div>
        <div className="text-center">
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!programData) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: profile?.name || 'User',
          userEmail: profile?.email || '',
          profilePictureUrl: profile?.profile_picture_url,
          onLogout: handleLogout,
        }}
      >
        <div className="text-center space-y-6">
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-2xl">No Active Training Program</CardTitle>
              <CardDescription>
                You don't have an active training program yet. Complete your onboarding to generate
                a personalized program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  Complete Onboarding
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      sidebarProps={{
        userName: profile?.name || 'User',
        userEmail: profile?.email || '',
        profilePictureUrl: profile?.profile_picture_url,
        onLogout: handleLogout,
      }}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Enhanced Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 overflow-hidden border border-gray-100 shadow-sm">
          {/* Decorative background elements - hidden on mobile for cleaner look */}
          <div className="hidden sm:block absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-y-6 sm:-translate-y-8 translate-x-6 sm:translate-x-8" />
          <div className="hidden sm:block absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-tr from-purple-200/20 to-blue-200/20 rounded-full translate-y-3 sm:translate-y-4 -translate-x-3 sm:-translate-x-4" />
          <div className="hidden lg:block absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-r from-green-200/20 to-blue-200/20 rounded-full" />
          
          {/* Hero Content */}
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                  {programData.programName}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mt-2 leading-relaxed">
                  {programData.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content with Smooth Transitions */}
        <div className="relative min-h-[400px]">
          <div className={`transition-all duration-300 ease-in-out ${
            activeTab === 'overview' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
          }`}>
            {activeTab === 'overview' && (
              <OverviewTabContent programData={programData} completedDays={completedDays} />
            )}
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${
            activeTab === 'program' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
          }`}>
            {activeTab === 'program' && (
              <ProgramTabContent programData={programData} completedDays={completedDays} />
            )}
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${
            activeTab === 'resources' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
          }`}>
            {activeTab === 'resources' && (
              <ResourcesTabContent programData={programData} />
            )}
          </div>
        </div>

        {/* Program Feedback Section */}
        <div className="mt-8">
          <ProgramFeedbackSection programData={programData} />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons programData={programData} />
    </DashboardLayout>
  )
}
