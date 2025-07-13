'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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
import { TrackedExercise } from '@/components/program/TrackedExercise'
import { checkAndRegisterPB } from '@/app/_actions/aiProgramActions'
import { getDailyAdaptedWorkout } from '@/app/_actions/aiProgramActions'

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
  const [isLoadingWorkoutData, setIsLoadingWorkoutData] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  // Session state
  const [plannedWorkout, setPlannedWorkout] = useState<WorkoutDay | null>(null)
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
      setIsLoadingWorkoutData(true)

      const sessionId = searchParams?.get('sessionId')

      if (!sessionId) {
        toast.error('Workout session not found. Redirecting...')
        router.push('/program')
        return
      }

      try {
        const profileData = await getUserProfile()
        if (profileData) {
          setProfile(profileData)
          setWeightUnit(profileData.weight_unit ?? 'kg')
        } else {
          throw new Error('User profile could not be loaded.')
        }

        const sessionResult = await getPendingWorkoutSession(sessionId)

        if (sessionResult.success) {
          const { workout, context, readiness } = sessionResult
          if (workout && context) {
            setProgramContext(context)
            if (readiness) {
              await adaptWorkout(workout, readiness)
            } else {
              setPlannedWorkout(workout)
              initializeExerciseTracking(workout)
            }
          } else {
            throw new Error('Incomplete session data returned from server.')
          }
        } else {
          throw new Error(sessionResult.error || 'Failed to load session data.')
        }
      } catch (err: any) {
        console.error('Fatal error loading session:', err)
        toast.error(err.message || 'Your session may have expired.')
        router.push('/program')
      } finally {
        setIsLoadingWorkoutData(false)
      }
    }

    if (searchParams) {
      initializeSession()
    }
  }, [searchParams, router])

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
    if (workout.warmUp) allExercises.push(...workout.warmUp)
    if (workout.exercises) allExercises.push(...workout.exercises)
    if (workout.coolDown) allExercises.push(...workout.coolDown)
    return allExercises
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
        router.push('/program')
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
    router.push('/program')
  }

  // Handle PB checking
  const handlePBCheck = async (exerciseName: string, weight: number, reps: number) => {
    try {
      const result = await checkAndRegisterPB(exerciseName, weight, reps)
      return result
    } catch (error) {
      console.error('Error checking for PB:', error)
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
      
      console.log('Calling getDailyAdaptedWorkout with:', { originalWorkout, readinessData })
      
      const result = await getDailyAdaptedWorkout(originalWorkout, {
        sleep: readinessData.sleep,
        energy: readinessData.energy
      })
      
      if (result.success && result.adaptedWorkout) {
        console.log('Successfully adapted workout:', result.adaptedWorkout)
        setPlannedWorkout(result.adaptedWorkout)
        initializeExerciseTracking(result.adaptedWorkout)
        setIsWorkoutAdapted(true)
        
        // Show success message about adaptation
        toast.success('Workout adapted based on your readiness!')
      } else {
        console.error('Failed to adapt workout:', result.error)
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
          <Button onClick={() => router.push('/program')}>Back to Program</Button>
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
          <Button onClick={() => router.push('/program')}>Back to Program</Button>
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
              <TrackedExercise
                key={`${exercise.name}-${index}`}
                exercise={exercise}
                onSetComplete={(setIndex, weight, reps) => handleSetComplete(index, setIndex, weight, reps)}
                onSetUncomplete={(setIndex) => handleSetUncomplete(index, setIndex)}
                onPBCheck={handlePBCheck}
              />
            ))
          ) : (
            // Focused view - show current exercise or completion card
            currentExerciseIndex < allExercises.length ? (
              <TrackedExercise
                key={`${allExercises[currentExerciseIndex].name}-${currentExerciseIndex}`}
                exercise={allExercises[currentExerciseIndex]}
                onSetComplete={(setIndex, weight, reps) => handleSetComplete(currentExerciseIndex, setIndex, weight, reps)}
                onSetUncomplete={(setIndex) => handleSetUncomplete(currentExerciseIndex, setIndex)}
                onPBCheck={handlePBCheck}
              />
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