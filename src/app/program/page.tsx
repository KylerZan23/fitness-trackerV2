'use client'

import { useState, useEffect, useCallback, Suspense, useMemo, useRef, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  fetchActiveProgramAction,
  type CompletedDayIdentifier,
} from '@/app/_actions/aiProgramActions'
import { startWorkoutSession } from '@/app/_actions/workoutSessionActions'
import { submitProgramFeedback } from '@/app/_actions/feedbackActions'
import { type TrainingProgram } from '@/lib/types/program'
import { type TrainingProgramWithId } from '@/lib/db/program'
import { type EnhancedTrainingProgram, type ScientificRationale } from '@/lib/validation/enhancedProgramSchema'
import { MUSCLE_GROUP_BASE_VOLUMES, calculateAllMuscleLandmarks } from '@/lib/volumeCalculations'
import { type VolumeParameters, type VolumeLandmarks } from '@/lib/types/program'
import { calculateWorkoutStreak } from '@/lib/db/index'
import { Session } from '@supabase/supabase-js'
import { useReadOnlyMode, useReadOnlyGuard } from '@/contexts/ReadOnlyModeContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, Calendar, Target, Clock, TrendingUp, Play, BarChart3, Settings, HelpCircle, ChevronUp, BookOpen, Activity, Info, Star, MessageSquare, ChevronRight, Eye, Brain, Lightbulb } from 'lucide-react'

import { WeeklyCheckInModal } from '@/components/program/WeeklyCheckInModal'
import { DailyReadinessModal } from '@/components/program/DailyReadinessModal'

// Enhanced program components
import { ScientificRationaleComponent } from '@/components/program/enhanced/ScientificRationale'


import { StreakIndicator } from '@/components/ui/StreakIndicator'
import { useToast } from '@/components/ui/Toast'
import { shouldShowDailyReadinessModal, dailyReadinessService } from '@/lib/dailyReadinessService'
import { type DailyReadinessData } from '@/lib/types/program'

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

  // NEW: Iterate over sessions instead of phases/weeks
  if (programData.sessions) {
    programData.sessions.forEach((session) => {
      // Assuming every session is a workout day for now
      totalWorkouts++

      // This logic needs to be adapted. We don't have a direct equivalent
      // to the old completedDays structure. For now, let's assume no days are completed
      // to avoid crashing. We will need to redefine how completion is tracked.
    })
  }


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
    if (!feedbackRating) {
      return
    }

    setIsSubmittingFeedback(true)
    setFeedbackError(null)

    try {
      const result = await submitProgramFeedback(
        programData.id,
        feedbackRating,
        feedbackComment.trim() || undefined
      )
      
      if (result.success) {
        setFeedbackSubmitted(true)
        addToast({
          type: 'success',
          title: 'Feedback submitted!',
          description: 'Thank you for helping us improve your training experience.',
        })
      } else {
        const errorMessage = result.error || 'An unknown error occurred.'
        setFeedbackError(errorMessage)
        addToast({
          type: 'error',
          title: 'Failed to submit feedback',
          description: errorMessage,
        })
      }
    } catch (error) {
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
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-lg text-orange-700 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" /> Program Feedback
        </CardTitle>
        <CardDescription className="text-orange-600">
          How is your training program working for you so far?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-orange-700 mb-2">
              Rate your program experience:
          </label>
          {renderStarRating()}
        </div>

        <div>
            <label htmlFor="feedback-comment" className="block text-sm font-medium text-orange-700 mb-2">
              Additional comments (optional):
          </label>
          <Textarea
            id="feedback-comment"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us about your experience with this program..."
              className="min-h-[100px] border-orange-200 focus:border-orange-300 focus:ring-orange-200"
          />
        </div>

        {feedbackError && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {feedbackError}
          </div>
        )}

          <Button
            onClick={handleProgramFeedbackSubmit}
            disabled={!feedbackRating || isSubmittingFeedback}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
        </div>
      </CardContent>
    </Card>
  )
}

function ProgramPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isReadOnlyMode, subscriptionStatus } = useReadOnlyMode()
  const checkReadOnlyGuard = useReadOnlyGuard()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [programData, setProgramData] = useState<TrainingProgramWithId | null>(null)
  const [completedDays, setCompletedDays] = useState<CompletedDayIdentifier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workoutStreak, setWorkoutStreak] = useState(0)
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false)
  const [checkInWeekNumber, setCheckInWeekNumber] = useState(1)
  const [showDailyReadinessModal, setShowDailyReadinessModal] = useState(false)
  const [isSubmittingReadiness, setIsSubmittingReadiness] = useState(false)
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { addToast } = useToast()
  
  // New states for background generation
  const [generationStatus, setGenerationStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)
  
  // Handle program generation warnings from URL params
  const [programWarning, setProgramWarning] = useState<string | null>(
    searchParams?.get('warning') || null
  )

  const findTodaysWorkout = (program: TrainingProgram) => {
    if (!program.sessions) return null

    const today = new Date()
    const jsDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const todayDayOfWeek = jsDay === 0 ? 7 : jsDay

    // Find a session that matches today's day of the week
    const todayWorkout = program.sessions.find(session => session.dayOfWeek === todayDayOfWeek)
    
    return todayWorkout || null
  }

  const checkIfWeekCompleted = (
    program: TrainingProgram,
    completedDays: CompletedDayIdentifier[],
    weekNumber: number,
  ): boolean => {
    // This function needs to be entirely rewritten to work with the new `sessions` structure.
    // For now, returning false to prevent crashes.
    return false
  }

  const shouldShowWeeklyCheckIn = (
    program: TrainingProgram,
    completedDays: CompletedDayIdentifier[]
  ): { show: boolean; weekNumber: number } => {
    // This also needs a complete rewrite.
    return { show: false, weekNumber: 0 }
  }

  // Handle client-side mounting to prevent SSR hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  // Function to check program generation status
  const checkGenerationStatus = useCallback(async () => {
    if (!session?.user) return

    // Check for timeout (10 minutes max polling)
    if (pollingStartTime && Date.now() - pollingStartTime > 10 * 60 * 1000) {
      console.warn('Program generation polling timed out after 10 minutes')
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      setGenerationStatus('failed')
      setGenerationError('Program generation timed out. Please try again.')
      addToast({
        type: 'error',
        title: 'Generation timeout',
        description: 'Program generation took too long. Please try generating again.',
      })
      return
    }

    try {
      const { data: programs, error } = await supabase
        .from('training_programs')
        .select('id, generation_status, generation_error, program_details')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error checking generation status:', error)
        return
      }

      if (programs) {
        setGenerationStatus(programs.generation_status)
        
        if (programs.generation_status === 'completed' && programs.program_details) {
          // Program is ready, create proper TrainingProgramWithId object
          const programWithId: TrainingProgramWithId = {
            id: programs.id,
            ...(programs.program_details as TrainingProgram)
          }
          
          setProgramData(programWithId)
          
          // Only show success notification if we were previously in a pending/processing state
          if (generationStatus === 'pending' || generationStatus === 'processing') {
            addToast({
              type: 'success',
              title: '🎉 Your training program is ready!',
              description: 'Your scientifically-optimized training program has been generated successfully.',
            })
          }
          
          setGenerationStatus('completed')
          
          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          // Fetch completed days and other data
          const [completedDaysResult, profileData, streakData] = await Promise.all([
            supabase
              .from('workout_groups')
              .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week')
              .eq('linked_program_id', programs.id)
              .not('linked_program_phase_index', 'is', null)
              .not('linked_program_week_index', 'is', null)
              .not('linked_program_day_of_week', 'is', null),
            supabase
              .from('profiles')
              .select('id, name, email, profile_picture_url, weight_unit')
              .eq('id', session.user.id)
              .maybeSingle(),
            calculateWorkoutStreak(session.user.id)
          ])

          const completedDays: CompletedDayIdentifier[] = (completedDaysResult.data || []).map(workout => ({
            phaseIndex: workout.linked_program_phase_index,
            weekIndex: workout.linked_program_week_index,
            dayOfWeek: workout.linked_program_day_of_week,
          }))

          setCompletedDays(completedDays)
          
          const workout = findTodaysWorkout(programs.program_details as TrainingProgram)
          setTodaysWorkout(workout)
          
          const weeklyCheckInStatus = shouldShowWeeklyCheckIn(
            programs.program_details as TrainingProgram,
            completedDays
          )
          
          if (weeklyCheckInStatus.show) {
            setShowWeeklyCheckIn(true)
            setCheckInWeekNumber(weeklyCheckInStatus.weekNumber)
          }

          if (profileData.data) {
            setProfile(profileData.data)
          }

          setWorkoutStreak(streakData || 0)
          setIsLoading(false)
          
        } else if (programs.generation_status === 'failed') {
          setGenerationError(programs.generation_error)
          setGenerationStatus('failed')
          
          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          setIsLoading(false)
        }
        // If still pending or processing, continue polling
      }
    } catch (err) {
      console.error('Error in generation status check:', err)
    }
  }, [session, pollingInterval])

  // Start polling for generation status
  const startPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    setPollingStartTime(Date.now()) // Track when polling started
    
    const interval = setInterval(() => {
      checkGenerationStatus()
    }, 5000) // Poll every 5 seconds
    
    setPollingInterval(interval)
  }, [checkGenerationStatus, pollingInterval])

  const fetchData = useCallback(async () => {
    if (!session?.user) return

    try {
      setIsLoading(true)
      setError(null)

      // First check if there's a program being generated
      const { data: programs, error: programsError } = await supabase
        .from('training_programs')
        .select('id, generation_status, generation_error, program_details')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!programsError && programs) {
        setGenerationStatus(programs.generation_status)
        
        if (programs.generation_status === 'pending' || programs.generation_status === 'processing') {
          // Start polling for status updates
          startPolling()
          return
        } else if (programs.generation_status === 'failed') {
          setGenerationError(programs.generation_error)
          setGenerationStatus('failed')
          setIsLoading(false)
          return
        } else if (programs.generation_status === 'completed' && programs.program_details) {
          // Program is ready, create proper TrainingProgramWithId object
          const programWithId: TrainingProgramWithId = {
            id: programs.id,
            ...(programs.program_details as TrainingProgram)
          }
          setProgramData(programWithId)
          setGenerationStatus('completed')
          
          // Fetch additional data for completed program
          const [profileData, streakData, completedWorkouts] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, name, email, profile_picture_url, weight_unit')
              .eq('id', session.user.id)
              .maybeSingle(),
            calculateWorkoutStreak(session.user.id),
            supabase
              .from('workout_groups')
              .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week')
              .eq('linked_program_id', programs.id)
              .not('linked_program_phase_index', 'is', null)
              .not('linked_program_week_index', 'is', null)
              .not('linked_program_day_of_week', 'is', null)
          ])

          if (profileData.data) {
            setProfile(profileData.data)
          }

          setWorkoutStreak(streakData || 0)

          const completedDays: CompletedDayIdentifier[] = (completedWorkouts.data || []).map(workout => ({
            phaseIndex: workout.linked_program_phase_index,
            weekIndex: workout.linked_program_week_index,
            dayOfWeek: workout.linked_program_day_of_week,
          }))

          setCompletedDays(completedDays)
          
          const workout = findTodaysWorkout(programs.program_details as TrainingProgram)
          setTodaysWorkout(workout)
          
          const weeklyCheckInStatus = shouldShowWeeklyCheckIn(
            programs.program_details as TrainingProgram,
            completedDays
          )
          
          if (weeklyCheckInStatus.show) {
            setShowWeeklyCheckIn(true)
            setCheckInWeekNumber(weeklyCheckInStatus.weekNumber)
          }
        }
      } else {
        // No program found, fetch basic profile data
        const [profileData, streakData] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, name, email, profile_picture_url, weight_unit')
            .eq('id', session.user.id)
            .maybeSingle(),
          calculateWorkoutStreak(session.user.id)
        ])

        if (profileData.data) {
          setProfile(profileData.data)
        }

        setWorkoutStreak(streakData || 0)
      }

    } catch (err) {
      setError('Failed to load program data')
    } finally {
      setIsLoading(false)
    }
  }, [session, startPolling])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session, fetchData])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  useEffect(() => {
    const checkDailyReadiness = () => {
      if (!isMounted || !session?.user || !programData) return
      
      const shouldShow = shouldShowDailyReadinessModal()
      
      if (shouldShow) {
        console.log('Daily readiness modal should be shown when user starts workout')
      }
    }
    
    checkDailyReadiness()
  }, [isMounted, session, programData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Retry program generation
  const handleRetryGeneration = async () => {
    if (!session?.user) return
    
    setIsRetrying(true)
    setGenerationError(null)
    
    try {
      const { generateTrainingProgram } = await import('@/app/_actions/aiProgramActions')
      const result = await generateTrainingProgram(session.user.id)
      
      if (result.success) {
        setGenerationStatus('pending')
        startPolling()
        addToast({
          type: 'success',
          title: 'Program generation started',
          description: 'Your program is being regenerated. This may take a few minutes.',
        })
      } else {
        // Check if we should redirect to pricing
        if (!result.success && 'redirectToPricing' in result && result.redirectToPricing) {
          router.push('/pricing?expired=true&feature=training program generation')
          return
        }
        setGenerationError(result.error || 'Failed to start program generation')
        addToast({
          type: 'error',
          title: 'Generation failed',
          description: result.error || 'Failed to start program generation',
        })
      }
    } catch (error) {
      setGenerationError('An unexpected error occurred')
      addToast({
        type: 'error',
        title: 'Generation failed',
        description: 'An unexpected error occurred while starting program generation',
      })
    } finally {
      setIsRetrying(false)
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const handleCloseWeeklyCheckIn = () => {
    setShowWeeklyCheckIn(false)
    localStorage.setItem(`weeklyCheckInShown-week-${checkInWeekNumber}`, 'true')
  }

  const handleAdaptationComplete = () => {
    setShowWeeklyCheckIn(false)
    localStorage.setItem(`weeklyCheckInShown-week-${checkInWeekNumber}`, 'true')
  }

  const handleShowDailyReadinessModal = () => {
    setShowDailyReadinessModal(true)
  }

  const handleStartWorkout = async (readinessData?: DailyReadinessData) => {
    if (!todaysWorkout || !programData) {
      addToast({
        type: 'error',
        title: 'Cannot start workout',
        description: "Today's workout data is not available.",
      })
      return
    }

    setIsLoading(true)
    try {
      const context = {
        programId: programData.id,
        phaseIndex: 0,
        weekIndex: 0,
        dayOfWeek: todaysWorkout.dayOfWeek,
      }

      const result = await startWorkoutSession(todaysWorkout, context, readinessData)

      if (result.success) {
        if (result.sessionId) {
          router.push(`/workout/new?sessionId=${result.sessionId}`)
        } else {
          addToast({
            type: 'error',
            title: 'Failed to start workout',
            description: 'Could not retrieve a session ID.',
          })
        }
      } else {
        addToast({
          type: 'error',
          title: 'Failed to start workout',
          description: result.error || 'Could not initialize the session.',
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'An unexpected error occurred',
        description: 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDailyReadinessSubmit = async (data: DailyReadinessData) => {
    setIsSubmittingReadiness(true)
    dailyReadinessService.markCompletedToday(data)
    await new Promise(resolve => setTimeout(resolve, 300))
    setShowDailyReadinessModal(false)
    setIsSubmittingReadiness(false)
    await handleStartWorkout(data)
  }

  const handleDailyReadinessClose = () => {
    if (!isSubmittingReadiness) {
      setShowDailyReadinessModal(false)
    }
  }

  // Enhanced program components renderer
  const renderEnhancedProgramComponents = (program: TrainingProgramWithId) => {
    // Check if this is an enhanced program with the required data
    const enhancedProgram = program as any as EnhancedTrainingProgram
    
    // Mock data for demonstration - in real app this would come from the program data
    const mockVolumeParameters: VolumeParameters = {
      trainingAge: 3,
      recoveryCapacity: 7,
      volumeTolerance: 1.2,
      stressLevel: 4
    }
    
    const individualLandmarks = calculateAllMuscleLandmarks(mockVolumeParameters)
    

    
    const mockScientificRationale: ScientificRationale = {
      principle: "Progressive Overload with Autoregulation",
      evidence: "Research demonstrates that RPE-based autoregulation leads to superior strength and hypertrophy outcomes compared to fixed loading schemes (Helms et al., 2018).",
      application: "This program uses daily readiness assessment to adjust training loads, ensuring optimal stimulus while managing fatigue accumulation.",
      citations: [
        "Helms, E. R., et al. (2018). RPE vs percentage 1RM loading in periodized programs matched for sets and repetitions. Sports Medicine.",
        "Zourdos, M. C., et al. (2016). Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve. Journal of Strength and Conditioning Research."
      ]
    }



    return (
      <div className="space-y-6">
        {/* Scientific Rationale */}
        <ScientificRationaleComponent
          rationale={mockScientificRationale}
          expandedByDefault={false}
          showCitations={true}
        />




      </div>
    )
  }

  // Show loading state for generation in progress
  // Only show loading if we're actually loading OR if we don't have program data yet
  if (isLoading || generationStatus === 'pending' || generationStatus === 'processing') {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: profile?.name || 'Loading...',
          userEmail: profile?.email || '',
          profilePictureUrl: profile?.profile_picture_url,
          onLogout: handleLogout,
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-6 max-w-md text-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {generationStatus === 'pending' ? 'Initializing Program Generation' : 
                 generationStatus === 'processing' ? 'Generating Your Training Program' : 
                 'Loading your training program...'}
              </h2>
              <p className="text-gray-600">
                {generationStatus === 'pending' ? 'Setting up your personalized program...' :
                 generationStatus === 'processing' ? 'Our AI is creating your scientifically-optimized training plan. This may take a few minutes.' :
                 'Please wait while we load your program...'}
              </p>
              {(generationStatus === 'pending' || generationStatus === 'processing') && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Processing in background</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show error state for generation failures or other errors
  if (error || generationStatus === 'failed') {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              {generationStatus === 'failed' ? 'Program Generation Failed' : 'Error Loading Program'}
            </h3>
            <p className="text-red-700 mb-4">
              {generationError || error || 'An unexpected error occurred while loading your program.'}
            </p>
            <div className="space-y-3">
              {generationStatus === 'failed' ? (
                <Button 
                  onClick={handleRetryGeneration}
                  disabled={isRetrying}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry Generation'
                  )}
                </Button>
              ) : (
                <Button onClick={fetchData} variant="outline" className="w-full">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Only show program if we have data and are not loading
  if (!programData || isLoading) {
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
          {programWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 text-sm">⚠️</span>
                </div>
                <div className="text-left">
                  <h3 className="text-amber-800 font-semibold mb-1">Program Generation Issue</h3>
                  <p className="text-amber-700 text-sm">{programWarning}</p>
                </div>
              </div>
            </div>
          )}

          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-2xl">No Active Training Program</CardTitle>
              <CardDescription>
                {programWarning 
                  ? "Your onboarding is complete, but we need to regenerate your training program."
                  : "You don't have an active training program yet. Complete your onboarding to generate a personalized program."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {programWarning ? (
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    // Check if user is in read-only mode
                    if (!checkReadOnlyGuard('generate training programs')) {
                      return
                    }

                    setIsLoading(true)
                    try {
                      const { generateTrainingProgram } = await import('@/app/_actions/aiProgramActions')
                      const result = await generateTrainingProgram(session?.user?.id || '')
                      if (result.success) {
                        setProgramWarning(null)
                        router.replace('/program')
                        await fetchData()
                      } else {
                        // Check if we should redirect to pricing
                        if (!result.success && 'redirectToPricing' in result && result.redirectToPricing) {
                          router.push('/pricing?expired=true&feature=training program generation')
                          return
                        }
                        setError(result.error || 'Failed to generate program')
                      }
                    } catch (err) {
                      setError('An unexpected error occurred while generating your program')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading || isReadOnlyMode}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Training Program
                </Button>
              ) : (
                <Link href="/onboarding">
                  <Button size="lg" className="w-full sm:w-auto">
                    Complete Onboarding
                  </Button>
                </Link>
              )}
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
        {/* Trial Status Banner */}
        {subscriptionStatus && !subscriptionStatus.isPremium && (
          <Card className={`mb-6 ${subscriptionStatus.isTrialActive ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center text-xl font-semibold ${subscriptionStatus.isTrialActive ? 'text-amber-900' : 'text-red-900'}`}>
                <Clock className={`w-6 h-6 mr-3 ${subscriptionStatus.isTrialActive ? 'text-amber-600' : 'text-red-600'}`} />
                {subscriptionStatus.isTrialActive ? 'Free Trial Active' : 'Trial Expired'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${subscriptionStatus.isTrialActive ? 'text-amber-700' : 'text-red-700'} mb-4`}>
                {subscriptionStatus.isTrialActive 
                  ? `You have ${subscriptionStatus.daysRemaining} day${subscriptionStatus.daysRemaining !== 1 ? 's' : ''} left in your free trial.`
                  : 'Your free trial has expired. Upgrade to premium to continue using all features.'
                }
              </p>
              {subscriptionStatus.isReadOnlyMode && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-medium">
                    🔒 Read-Only Mode: You can view your past workouts and dashboard, but cannot create new workouts or programs.
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  // In a real implementation, redirect to pricing page
                  console.log('Redirect to pricing page')
                }}
                className={`${subscriptionStatus.isTrialActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        )}
        
        {programData.coachIntro && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                <Brain className="w-6 h-6 mr-3 text-blue-600" />A Message from Neural
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{programData.coachIntro}</p>
            </CardContent>
          </Card>
        )}
        {todaysWorkout ? (
          todaysWorkout.isRestDay ? (
            <div className="relative bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl p-8 lg:p-10 overflow-hidden border border-green-200 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-10 translate-x-10" />
              <div className="relative z-10">
                <div className="flex items-center space-x-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-3xl">🧘</span>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-green-900 mb-2">Rest Day</h1>
                    <p className="text-green-700 text-xl">Today is scheduled for recovery</p>
                  </div>
                </div>
                <p className="text-green-800 text-xl mb-8 leading-relaxed">
                  Take time to recover and prepare for tomorrow's workout. Your body needs rest to grow stronger.
                </p>
                <div className="bg-white/80 rounded-xl p-6 border border-green-100">
                  <h3 className="font-semibold text-green-900 mb-4 text-lg">Recovery Activities</h3>
                  <ul className="text-green-800 space-y-2 text-lg">
                    <li>• Light stretching or yoga</li>
                    <li>• Hydration and proper nutrition</li>
                    <li>• Quality sleep (7-9 hours)</li>
                    <li>• Optional: light walk or gentle movement</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl p-8 lg:p-10 overflow-hidden border-2 border-blue-200 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-y-10 translate-x-10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <span className="text-3xl">💪</span>
                    </div>
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-2">Today's Session</h1>
                      <p className="text-blue-700 text-xl">{todaysWorkout.focus || 'Workout Day'}</p>
                    </div>
                  </div>
                </div>
                
                {todaysWorkout.estimatedDurationMinutes && (
                  <div className="bg-white/80 rounded-xl p-6 mb-8 border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <span className="text-blue-900 font-semibold text-lg">
                        Estimated Duration: {todaysWorkout.estimatedDurationMinutes} minutes
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (!isMounted) {
                        return
                      }

                      // Check if user is in read-only mode
                      if (!checkReadOnlyGuard('start workouts')) {
                        return
                      }

                      const hasCompletedReadiness = dailyReadinessService.hasCompletedToday()
                      
                      if (!hasCompletedReadiness) {
                        setShowDailyReadinessModal(true)
                        return
                      }
                      
                      const readinessData = dailyReadinessService.getTodaysReadiness()
                      
                      handleStartWorkout(readinessData ?? undefined)
                    }}
                    disabled={todaysWorkout?.isRestDay || isLoading || isReadOnlyMode}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-8 w-8" />
                    <span>Start Today's Workout</span>
                  </button>
                </div>
              </div>
            </div>
          )
        ) : programData ? (
          <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-8 lg:p-10 overflow-hidden border border-gray-200 shadow-xl">
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">No Specific Session Today</h1>
              <p className="text-gray-600 text-xl">
                You have an active program, but no specific workout is scheduled for today.
              </p>
            </div>
          </div>
        ) : null}

        {/* Quick Stats & Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6">
              <StreakIndicator
                currentStreak={workoutStreak}
                longestStreak={workoutStreak}
                streakType="workout"
                className="mx-auto"
                showMilestones={false}
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <Link href="/progress">
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                        Detailed Progress
                      </h3>
                      <p className="text-sm text-gray-600">View analytics & charts</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{programData.programLength}</h3>
                  <p className="text-sm text-gray-600">Program duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="program-details" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className="hover:no-underline px-6 py-4 hover:bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
              </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">View Full Program Details</h3>
                  <p className="text-sm text-gray-600">Browse all phases, weeks, and exercises</p>
              </div>
            </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6 pt-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{programData.programName}</h2>
                      <p className="text-gray-600">{programData.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/80 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                      <p className="text-xl font-bold text-blue-900">{programData.programLength}</p>
                    </div>
                    {programData.trainingFrequencyDays && (
                      <div className="bg-white/80 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-600">Frequency</p>
                        <p className="text-xl font-bold text-green-900">{programData.trainingFrequencyDays}x/week</p>
                      </div>
                    )}
                    {programData.difficultyLevel && (
                      <div className="bg-white/80 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-600">Level</p>
                        <p className="text-xl font-bold text-purple-900">{programData.difficultyLevel}</p>
                      </div>
                    )}
                  </div>
                </div>
          
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Workout Sessions
                  </h3>
                  {programData.sessions?.map((session, index) => (
                    <div key={`session-${index}`} className="border-t pt-4">
                      <h4 className="font-bold">Week {session.week}, Day {session.dayOfWeek}</h4>
                      <p>{session.focus}</p>
                      <ul className="list-disc pl-5 mt-2">
                        {session.exercises?.map((exercise, exIndex) => (
                          <li key={exIndex}>
                            {exercise.name}: {exercise.sets} sets of {exercise.reps || exercise.duration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {programData.generalAdvice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Program Guidelines
                    </h3>
                    <p className="text-blue-800 whitespace-pre-line leading-relaxed">{programData.generalAdvice}</p>
                  </div>
                )}

                {programData.requiredEquipment && programData.requiredEquipment.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Required Equipment</h3>
                    <div className="flex flex-wrap gap-2">
                      {programData.requiredEquipment.map((equipment, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Enhanced Program Components */}
        {renderEnhancedProgramComponents(programData)}

        <ProgramFeedbackSection programData={programData} />
      </div>

      <WeeklyCheckInModal
        isOpen={showWeeklyCheckIn}
        onClose={handleCloseWeeklyCheckIn}
        onAdaptationComplete={handleAdaptationComplete}
        weekNumber={checkInWeekNumber}
      />

       <DailyReadinessModal
         isOpen={showDailyReadinessModal}
         onClose={handleDailyReadinessClose}
         onSubmit={handleDailyReadinessSubmit}
         isSubmitting={isSubmittingReadiness}
       />
    </DashboardLayout>
  )
}

export default function ProgramPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProgramPageContent />
    </Suspense>
  )
}