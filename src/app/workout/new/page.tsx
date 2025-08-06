'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
  const supabase = await createClient()
import { logWorkoutGroup, getUserProfile } from '@/lib/db/index'
import { getPendingWorkoutSession } from '@/app/_actions/workoutSessionActions'
import { Play, Pause, Square, Clock, CheckCircle, LayoutGrid, Focus, ChevronLeft, ChevronRight, Target } from 'lucide-react'

// Import UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Import workout feedback actions
import { submitWorkoutFeedback, type WorkoutFeedback } from '@/app/_actions/workoutFeedbackActions'

// Import program types and components
import {
  type WorkoutDay,
  type ExerciseDetail,
  type DailyReadinessData,
} from '@/lib/types/program'

// import { checkAndRegisterPB } from '@/app/_actions/aiProgramActions' // Removed: program generation actions deleted  
// import { getDailyAdaptedWorkout } from '@/app/_actions/aiProgramActions' // Removed: program generation actions deleted

// Interface for storing program context details for linking
interface ProgramContext {
  programId: string
  phaseIndex: number
  weekIndex: number
  dayOfWeek: number
}

// Interface for tracking actual exercise performance
interface ActualExerciseData {
  exerciseName: string
  sets: Array<{
  weight: number
  reps: number
  }>
}

// View modes for workout display
type WorkoutViewMode = 'full' | 'focused'

// Session tracker component wrapped in Suspense
function SessionTracker() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  
  // Add loading state for URL parameter parsing
  const [isLoadingWorkoutData, setIsLoadingWorkoutData] = useState(false) // Start as false, will be set to true when loading starts
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [sessionLoadStarted, setSessionLoadStarted] = useState(false) // Track if session loading has started
  
  // Session state
  const [plannedWorkout, setPlannedWorkout] = useState<WorkoutDay | null>(null)
  
  // Use ref for atomic guard check to prevent race conditions
  const sessionLoadingRef = useRef(false)
  const [programContext, setProgramContext] = useState<ProgramContext | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [notes, setNotes] = useState('')
  const [isWorkoutAdapted, setIsWorkoutAdapted] = useState(false)
  
  // Exercise tracking state
  const [actualExerciseData, setActualExerciseData] = useState<ActualExerciseData[]>([])
  
  // View mode and navigation state
  const [viewMode, setViewMode] = useState<WorkoutViewMode>('full')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  
  // Post-workout feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [workoutGroupId, setWorkoutGroupId] = useState<string | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const getTodayDateString = () => {
    const today = new Date()
    // Use local timezone instead of UTC for the date string
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // This single useEffect handles all initial data loading and parsing
  useEffect(() => {
    async function initializeSession() {
      // Atomic guard check to prevent race conditions
      if (plannedWorkout || sessionLoadingRef.current) {
        console.log('⚠️ Session already loaded or loading, skipping duplicate attempt', {
          hasWorkout: !!plannedWorkout,
          isLoading: sessionLoadingRef.current
        })
        return
      }

      // Immediately set the loading flag to prevent other calls
      sessionLoadingRef.current = true
      setSessionLoadStarted(true)

      console.log('🔄 Initializing workout session...')
      setIsLoadingWorkoutData(true)

      const sessionId = searchParams?.get('sessionId')
      console.log('📋 Session ID from URL:', sessionId)

      if (!sessionId) {
        console.error('❌ No session ID provided in URL')
        sessionLoadingRef.current = false // Reset loading flag
        setSessionLoadStarted(false)
        toast.error('Workout session not found. Redirecting...')
        router.push('/workouts')
        return
      }

      try {
        console.log('👤 Loading user profile...')
        const profileData = await getUserProfile()
        if (profileData) {
          setProfile(profileData)
          setWeightUnit(profileData.weight_unit ?? 'kg')
          console.log('✅ Profile loaded successfully:', {
            userId: profileData.id,
            weightUnit: profileData.weight_unit
          })
        } else {
          throw new Error('User profile could not be loaded.')
        }

        console.log('🔍 Fetching workout session data...')
        const sessionResult = await getPendingWorkoutSession(sessionId)
        
        console.log('📊 Session result:', {
          success: sessionResult.success,
          error: sessionResult.error,
          hasWorkout: !!sessionResult.workout,
          hasContext: !!sessionResult.context,
          hasReadiness: !!sessionResult.readiness
        })

        if (sessionResult.success) {
          const { workout, context, readiness } = sessionResult
          if (workout && context) {
            console.log('✅ Valid session data received:', {
              workoutFocus: workout.focus,
              exerciseCount: workout.exercises?.length || 0,
              programId: context.programId,
              hasReadiness: !!readiness
            })
            
            setProgramContext(context)
            if (readiness) {
              console.log('🎯 Adapting workout based on readiness data')
              await adaptWorkout(workout, readiness)
            } else {
              console.log('📝 Using original workout without adaptation')
              setPlannedWorkout(workout)
              initializeExerciseTracking(workout)
              setIsLoadingWorkoutData(false)
            }
          } else {
            console.error('❌ Incomplete session data:', {
              hasWorkout: !!workout,
              hasContext: !!context
            })
            throw new Error('Incomplete session data returned from server.')
          }
        } else {
          const errorMsg = sessionResult.error || 'Failed to load session data.'
          console.error('❌ Session loading failed:', {
            error: errorMsg,
            sessionId: sessionId
          })
          
          // Provide more specific error messages based on common issues
          let userFriendlyError = errorMsg
          if (errorMsg.includes('not found') || errorMsg.includes('expired')) {
            userFriendlyError = 'Your workout session has expired. Please start a new workout from the program page.'
          } else if (errorMsg.includes('Authentication')) {
            userFriendlyError = 'Authentication error. Please log in again and try starting your workout.'
          }
          
          throw new Error(userFriendlyError)
        }
      } catch (err: any) {
        console.error('❌ Fatal error in initializeSession:', {
          error: err,
          message: err.message,
          sessionId: sessionId
        })

        // Reset loading states on error so user can retry
        sessionLoadingRef.current = false
        setSessionLoadStarted(false)
        
        // Provide helpful error messages to the user
        const errorMessage = err.message || 'An unexpected error occurred while loading your workout session.'
        toast.error(errorMessage)
        
        // Add a small delay before redirecting to allow user to read the error
        setTimeout(() => {
          router.push('/workouts')
        }, 2000)
      } finally {
        if (!plannedWorkout) {
          setIsLoadingWorkoutData(false)
        }
        console.log('🏁 Session initialization completed')
      }
    }

    if (searchParams) {
      initializeSession()
    }
  }, [searchParams, router, plannedWorkout]) // Remove sessionLoadStarted from deps to prevent re-runs when it changes

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isSessionActive && !isPaused) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSessionActive, isPaused])

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get all exercises for the session
  const getAllExercises = (workout: WorkoutDay): ExerciseDetail[] => {
    const allExercises: ExerciseDetail[] = []
    // Only include exercises array since warmUp and coolDown don't exist in the type
    if (workout.exercises) allExercises.push(...workout.exercises)
    return allExercises
  }

  // Check if an exercise at a given index is a warmup or cooldown exercise
  const isWarmupOrCooldownExercise = (exerciseIndex: number): boolean => {
    // Since warmUp and coolDown don't exist in the type, always return false
    return false
  }

  // Check if current exercise is completed (all sets have weight and reps)
  const isCurrentExerciseCompleted = (exerciseIndex: number): boolean => {
    if (!plannedWorkout) return false
    
    const allExercises = getAllExercises(plannedWorkout)
    const exercise = allExercises[exerciseIndex]
    const actualData = actualExerciseData[exerciseIndex]
    
    if (!exercise || !actualData) return false
    
    // Check if all required sets are completed with weight and reps
    const completedSets = actualData.sets.filter(set => set.weight > 0 && set.reps > 0).length
    return completedSets >= exercise.sets
  }

  // Auto-advance to next exercise when current one is completed
  useEffect(() => {
    if (viewMode === 'focused' && plannedWorkout) {
      const allExercises = getAllExercises(plannedWorkout)
      
      // Check if current exercise is completed and we're not on the last exercise
      if (isCurrentExerciseCompleted(currentExerciseIndex) && currentExerciseIndex < allExercises.length - 1) {
        // Auto-advance after a short delay
        const timer = setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1)
          toast.success('Great job! Moving to next exercise.')
        }, 1500)
        
        return () => clearTimeout(timer)
      }
      
      // Check if we just completed the last exercise
      if (isCurrentExerciseCompleted(currentExerciseIndex) && currentExerciseIndex === allExercises.length - 1) {
        // Move to completion view after a short delay
        const timer = setTimeout(() => {
          setCurrentExerciseIndex(allExercises.length) // Set to length to show completion view
          toast.success('🎉 Workout complete! Time to finish up.')
        }, 1500)
        
        return () => clearTimeout(timer)
      }
    }
  }, [actualExerciseData, currentExerciseIndex, viewMode, plannedWorkout])

  // Session control functions
  const startSession = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date())
    }
    setIsSessionActive(true)
    setIsPaused(false)
  }

  const pauseSession = () => {
    setIsPaused(true)
  }

  const resumeSession = () => {
    setIsPaused(false)
  }

  const endSession = () => {
    setIsSessionActive(false)
    setIsPaused(false)
  }

  // View mode controls
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'full' ? 'focused' : 'full')
  }

  const goToPreviousExercise = () => {
    setCurrentExerciseIndex(prev => Math.max(0, prev - 1))
  }

  const goToNextExercise = () => {
    if (!plannedWorkout) return
    const allExercises = getAllExercises(plannedWorkout)
    setCurrentExerciseIndex(prev => Math.min(allExercises.length, prev + 1))
  }

  // Handle exercise set completion
  const handleSetComplete = (exerciseIndex: number, setIndex: number, weight: number, reps: number) => {
    setActualExerciseData(prev => {
      const updated = [...prev]
      if (!updated[exerciseIndex]) return prev
      
      // Ensure sets array is long enough
      while (updated[exerciseIndex].sets.length <= setIndex) {
        updated[exerciseIndex].sets.push({ weight: 0, reps: 0 })
      }
      
      updated[exerciseIndex].sets[setIndex] = { weight, reps }
      return updated
    })
  }

  // Handle exercise set removal
  const handleSetUncomplete = (exerciseIndex: number, setIndex: number) => {
    setActualExerciseData(prev => {
      const updated = [...prev]
      if (!updated[exerciseIndex] || !updated[exerciseIndex].sets[setIndex]) return prev
      
      updated[exerciseIndex].sets[setIndex] = { weight: 0, reps: 0 }
      return updated
    })
  }

  // Handle workout feedback submission
  const handleWorkoutFeedback = async (feedback: WorkoutFeedback) => {
    if (!workoutGroupId) {
      toast.error('No workout session found')
      return
    }

    setIsSubmittingFeedback(true)
    
    try {
      const result = await submitWorkoutFeedback({
        workoutGroupId,
        feedback
      })

      if (result.success) {
        toast.success('Thank you for your feedback!')
        setShowFeedbackModal(false)
        // Now navigate to program page
        router.push('/workouts')
      } else {
        toast.error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting workout feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Handle skipping feedback
  const handleSkipFeedback = () => {
    setShowFeedbackModal(false)
    router.push('/workouts')
  }

  // Handle PR checking
  const handlePBCheck = async (exerciseName: string, weight: number, reps: number) => {
    try {
      // TODO: Re-implement PR checking when new program system is ready
      const result = { isPB: false }
      return result
    } catch (error) {
      console.error('Error checking for PR:', error)
      return { isPB: false }
    }
  }

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }

  // Handle session completion
  const handleFinishWorkout = async () => {
    if (!plannedWorkout || !programContext) {
      toast.error('No workout data available')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Transform actualExerciseData to the expected format
      const exercisesToLog = actualExerciseData.map(exercise => ({
        exerciseName: exercise.exerciseName,
        sets: exercise.sets.length,
        reps: exercise.sets.length > 0 ? exercise.sets[0].reps : 0,
        weight: exercise.sets.length > 0 ? exercise.sets[0].weight : 0,
      }))

      const result = await logWorkoutGroup({
        name: plannedWorkout.focus || 'Workout',
        duration: Math.round(sessionTimer / 60),
        notes,
        exercises: exercisesToLog,
        workoutDate: getTodayDateString(),
        // Pass program context if available
        linked_program_id: programContext?.programId,
        linked_program_phase_index: programContext?.phaseIndex,
        linked_program_week_index: programContext?.weekIndex,
        linked_program_day_of_week: programContext?.dayOfWeek,
      })

      if (result.success) {
        toast.success('Workout logged successfully!')
        setWorkoutGroupId(result.data.id) // Save workout group ID for feedback
        setShowFeedbackModal(true) // Show feedback modal on success
      } else {
        // Display the specific error from the server
        setError(result.error)
        toast.error('Failed to log workout', {
          description: result.error,
        })
      }
    } catch (err: any) {
      const errorMessage =
        err.message || 'An unexpected error occurred while finishing the workout.'
      console.error('Error finishing workout:', err)
      setError(errorMessage)
      toast.error('Error', { description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Logout handler to pass to Sidebar
  const handleLogout = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prepare sidebar props
  const sidebarProps = profile
    ? {
        userName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
        userEmail: profile.email,
        profilePictureUrl: profile.profile_picture_url,
        onLogout: handleLogout,
      }
    : {
        userName: 'Loading...',
        userEmail: '',
        profilePictureUrl: null,
        onLogout: handleLogout,
      }

  // Function to adapt workout based on readiness data
  const adaptWorkout = async (originalWorkout: WorkoutDay, readinessData: DailyReadinessData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log('Daily workout adaptation temporarily disabled:', { originalWorkout, readinessData })
      
      // TODO: Re-implement daily adaptation when new program system is ready
      const result = { 
        success: true, 
        adaptedWorkout: originalWorkout // Use original workout for now
      }
      
      if (result.success && result.adaptedWorkout) {
        console.log('Successfully adapted workout:', result.adaptedWorkout)
        setPlannedWorkout(result.adaptedWorkout)
        initializeExerciseTracking(result.adaptedWorkout)
        setIsWorkoutAdapted(true)
        
        // Show success message about adaptation
        toast.success('Workout adapted based on your readiness!')
      } else {
        console.error('Failed to adapt workout:', 'Unknown error')
        // Fall back to original workout
        setPlannedWorkout(originalWorkout)
        initializeExerciseTracking(originalWorkout)
        toast.error('Failed to adapt workout, using original plan')
      }
    } catch (error) {
      console.error('Error adapting workout:', error)
      // Fall back to original workout
      setPlannedWorkout(originalWorkout)
      initializeExerciseTracking(originalWorkout)
      toast.error('Failed to adapt workout, using original plan')
    } finally {
      setIsSubmitting(false)
      setIsLoadingWorkoutData(false)
    }
  }

  // Function to initialize exercise tracking data
  const initializeExerciseTracking = (workoutData: WorkoutDay) => {
    const allExercises = getAllExercises(workoutData)
    
    setActualExerciseData(
      allExercises.map(exercise => ({
        exerciseName: exercise.name,
        sets: []
      }))
    )
  }

  // Loading state
  if (!profile && !error && isSubmitting) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading session data...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Early return if searchParams is not available (prevents hydration issues)
  if (!searchParams) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading workout parameters...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Session</h1>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/workouts')}>Back to Workouts</Button>
        </div>
      </DashboardLayout>
    )
  }

  // Loading workout data state or redirecting
  if (isLoadingWorkoutData || isRedirecting) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">
              {isRedirecting ? 'Redirecting to program page...' : 'Loading today\'s workout session...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // No workout data state (only shown after loading is complete)
  if (!plannedWorkout) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold mb-4">No Workout Data</h1>
          <p className="text-gray-600 mb-4">No planned workout data found. Please start from the program page.</p>
          <Button onClick={() => router.push('/workouts')}>Back to Workouts</Button>
        </div>
      </DashboardLayout>
    )
  }

  // Get all exercises for the session
  const allExercises = getAllExercises(plannedWorkout)

  // Main session tracker render
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto">
        {/* Session Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {plannedWorkout.focus ? `${plannedWorkout.focus} Session` : 'Training Session'}
                </h1>
                {isWorkoutAdapted && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <span>🎯</span>
                    <span>AI Adapted</span>
                  </div>
                )}
              </div>
              <p className="text-blue-100">
                {isWorkoutAdapted 
                  ? 'This workout has been personalized based on your daily readiness'
                  : 'Track your actual performance against the planned workout'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono">{formatTimer(sessionTimer)}</div>
              <div className="text-sm text-blue-100">Session Time</div>
            </div>
          </div>
        </div>

        {/* Session Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Session Control Buttons */}
            <div className="flex items-center space-x-4">
              {!isSessionActive ? (
                <Button
                  onClick={startSession}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </Button>
              ) : (
                <div className="flex space-x-4">
                  {!isPaused ? (
                    <Button
                      onClick={pauseSession}
                      variant="outline"
                      className="px-6 py-2"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={resumeSession}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={endSession}
                    variant="destructive"
                    className="px-6 py-2"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <Button
                onClick={toggleViewMode}
                variant={viewMode === 'focused' ? 'default' : 'outline'}
                className="px-4 py-2 text-sm"
              >
                {viewMode === 'focused' ? (
                  <>
                    <Focus className="w-4 h-4 mr-2" />
                    Focused
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Full View
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Focused View Navigation */}
        {viewMode === 'focused' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={goToPreviousExercise}
                  disabled={currentExerciseIndex === 0}
                  variant="outline"
                  className="px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center space-x-2">
                  {currentExerciseIndex < allExercises.length ? (
                    <>
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        Exercise {currentExerciseIndex + 1} of {allExercises.length}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">
                        Session Complete
                      </span>
                    </>
                  )}
                </div>
                <Button
                  onClick={goToNextExercise}
                  disabled={currentExerciseIndex >= allExercises.length - 1}
                  variant="outline"
                  className="px-3 py-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
                             {/* Progress Indicator */}
               <div className="flex items-center space-x-2">
                 <span className="text-sm text-gray-600">Progress:</span>
                 <div className="flex space-x-1">
                   {allExercises.map((_, index) => (
                     <div
                       key={index}
                       className={`w-3 h-3 rounded-full transition-colors ${
                         index === currentExerciseIndex
                           ? 'bg-blue-600'
                           : isCurrentExerciseCompleted(index)
                           ? 'bg-green-500'
                           : 'bg-gray-300'
                       }`}
                     />
                   ))}
                   {/* Completion indicator */}
                   <div
                     className={`w-3 h-3 rounded-full transition-colors ${
                       currentExerciseIndex >= allExercises.length
                         ? 'bg-green-600'
                         : 'bg-gray-300'
                     }`}
                   />
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Exercise Tracking */}
        <div className="space-y-6">
          {viewMode === 'full' ? (
            // Full view - show all exercises
            allExercises.map((exercise, index) => (
              <div key={`${exercise.name}-${index}`} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                  {isWarmupOrCooldownExercise(index) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Exercise
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Target:</strong> {exercise.sets} sets × {exercise.reps} reps
                  </p>
                  {exercise.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {exercise.notes}
                    </p>
                  )}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Track your sets:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Array.from({ length: exercise.sets }, (_, setIndex) => (
                        <div key={setIndex} className="flex items-center space-x-2 p-2 border rounded">
                          <span className="text-sm font-medium">Set {setIndex + 1}:</span>
                          <input
                            type="number"
                            placeholder="Weight"
                            className="w-16 px-2 py-1 text-xs border rounded"
                            onChange={(e) => {
                              const weight = parseFloat(e.target.value) || 0;
                              const currentReps = actualExerciseData[index]?.sets[setIndex]?.reps || 0;
                              handleSetComplete(index, setIndex, weight, currentReps);
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Reps"
                            className="w-16 px-2 py-1 text-xs border rounded"
                            onChange={(e) => {
                              const reps = parseInt(e.target.value) || 0;
                              const currentWeight = actualExerciseData[index]?.sets[setIndex]?.weight || 0;
                              handleSetComplete(index, setIndex, currentWeight, reps);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Focused view - show current exercise or completion card
            currentExerciseIndex < allExercises.length ? (
              <div key={`${allExercises[currentExerciseIndex].name}-${currentExerciseIndex}`} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{allExercises[currentExerciseIndex].name}</h3>
                  {isWarmupOrCooldownExercise(currentExerciseIndex) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Exercise
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Target:</strong> {allExercises[currentExerciseIndex].sets} sets × {allExercises[currentExerciseIndex].reps} reps
                  </p>
                  {allExercises[currentExerciseIndex].notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {allExercises[currentExerciseIndex].notes}
                    </p>
                  )}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Track your sets:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Array.from({ length: allExercises[currentExerciseIndex].sets }, (_, setIndex) => (
                        <div key={setIndex} className="flex items-center space-x-2 p-2 border rounded">
                          <span className="text-sm font-medium">Set {setIndex + 1}:</span>
                          <input
                            type="number"
                            placeholder="Weight"
                            className="w-16 px-2 py-1 text-xs border rounded"
                            onChange={(e) => {
                              const weight = parseFloat(e.target.value) || 0;
                              const currentReps = actualExerciseData[currentExerciseIndex]?.sets[setIndex]?.reps || 0;
                              handleSetComplete(currentExerciseIndex, setIndex, weight, currentReps);
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Reps"
                            className="w-16 px-2 py-1 text-xs border rounded"
                            onChange={(e) => {
                              const reps = parseInt(e.target.value) || 0;
                              const currentWeight = actualExerciseData[currentExerciseIndex]?.sets[setIndex]?.weight || 0;
                              handleSetComplete(currentExerciseIndex, setIndex, currentWeight, reps);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Show completion card when all exercises are done in focused view
              <div className="space-y-6">
                {/* Session Notes */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
                  <Textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="How did the session feel? Any observations or adjustments needed?"
                    className="min-h-[100px]"
                  />
                </div>

                {/* Finish Workout Button */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <h3 className="text-lg font-semibold mb-4">🎉 Great Work! Ready to Complete Your Session?</h3>
                  <p className="text-gray-600 mb-6">
                    You've completed all exercises! Add any notes above and finish your workout to save your progress.
                  </p>
                  
                  {/* Show start session prompt if session not active */}
                  {!isSessionActive ? (
                    <div className="mb-4">
                      <p className="text-orange-600 text-sm mb-3">
                        You need to start your session first to track your workout time.
                      </p>
                      <Button
                        onClick={startSession}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-base mb-3"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    </div>
                  ) : null}
                  
                  <Button
                    onClick={handleFinishWorkout}
                    disabled={isSubmitting || !isSessionActive}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Finish Workout
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Session Notes and Finish Workout - Only shown in Full View */}
        {viewMode === 'full' && (
          <>
            {/* Session Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="How did the session feel? Any observations or adjustments needed?"
                className="min-h-[100px]"
              />
            </div>

            {/* Finish Workout Button */}
            <div className="mt-8 pb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">Ready to Complete Your Session?</h3>
                <p className="text-gray-600 mb-6">
                  Make sure you've tracked all your sets before finishing. This will save your workout and update your program progress.
                </p>
                <Button
                  onClick={handleFinishWorkout}
                  disabled={isSubmitting || !isSessionActive}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Finish Workout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Post-Workout Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              Workout Logged! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              How did that session feel?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <Button
              onClick={() => handleWorkoutFeedback('easy')}
              disabled={isSubmittingFeedback}
              className="h-12 text-base font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
              variant="outline"
            >
              😅 Too Easy
            </Button>
            
            <Button
              onClick={() => handleWorkoutFeedback('good')}
              disabled={isSubmittingFeedback}
              className="h-12 text-base font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300"
              variant="outline"
            >
              👌 Just Right
            </Button>
            
            <Button
              onClick={() => handleWorkoutFeedback('hard')}
              disabled={isSubmittingFeedback}
              className="h-12 text-base font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300"
              variant="outline"
            >
              😰 Too Hard
            </Button>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSkipFeedback}
              disabled={isSubmittingFeedback}
              variant="ghost"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

// Main component with Suspense wrapper
export default function NewWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading workout session...</p>
      </div>
    }>
      <SessionTracker />
    </Suspense>
  )
} 