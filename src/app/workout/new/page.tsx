'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkoutGroup, getUserProfile } from '@/lib/db'
import { Play, Pause, Square, Clock, CheckCircle } from 'lucide-react'

// Import UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

// Session tracker component wrapped in Suspense
function SessionTracker() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  
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

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Parse URL parameters to get planned workout data
  useEffect(() => {
    if (!searchParams) {
      console.log('No searchParams available, redirecting to program')
      router.push('/program')
      return
    }
    
    const workoutParam = searchParams.get('workout')
    const contextParam = searchParams.get('context')
    const readinessParam = searchParams.get('readiness')

    // Check if required parameters are present
    if (!workoutParam || !contextParam) {
      console.log('Missing required parameters (workout or context), redirecting to program')
      router.push('/program')
      return
    }

    try {
      const workoutData = JSON.parse(decodeURIComponent(workoutParam))
      const contextData = JSON.parse(decodeURIComponent(contextParam))
      const readinessData = readinessParam ? JSON.parse(decodeURIComponent(readinessParam)) : null
      
      // Validate that the parsed data has the expected structure
      if (!workoutData || typeof workoutData !== 'object') {
        throw new Error('Invalid workout data structure')
      }
      
      if (!contextData || typeof contextData !== 'object') {
        throw new Error('Invalid context data structure')
      }
      
      setProgramContext(contextData)
      
      // If readiness data is provided, adapt the workout
      if (readinessData) {
        console.log('Adapting workout based on readiness:', readinessData)
        adaptWorkout(workoutData, readinessData)
      } else {
        // No readiness data, use the original planned workout
        setPlannedWorkout(workoutData)
        initializeExerciseTracking(workoutData)
      }
    } catch (error) {
      console.error('Error parsing workout data:', error)
      toast.error('Failed to load workout data')
      router.push('/program')
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

  // Fetch user profile
  useEffect(() => {
    async function fetchProfileAndAuth() {
      try {
        setIsSubmitting(true)
        setError(null)
        
        const userProfile = await getUserProfile()
        if (userProfile) {
          setProfile(userProfile)
          setWeightUnit(userProfile.weight_unit ?? 'kg')
        } else {
          console.warn('No user profile found or no active session. Redirecting to login.')
          router.push('/login')
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('Failed to load user data. Please try logging in again.')
        // Don't redirect immediately, let the user see the error
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } finally {
        setIsSubmitting(false)
      }
    }
    fetchProfileAndAuth()
  }, [router])

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
      // Compile actual exercise data into the format expected by logWorkoutGroup
      const workoutExercises = actualExerciseData.map(exercise => ({
        exerciseName: exercise.exerciseName,
        sets: exercise.sets.length,
        reps: exercise.sets.length > 0 ? exercise.sets[0].reps : 0, // Use first set's reps as representative
        weight: exercise.sets.length > 0 ? exercise.sets[0].weight : 0, // Use first set's weight as representative
      }))

      const workoutName = plannedWorkout.focus
        ? `${plannedWorkout.focus} Session`
        : 'Training Session'

      const workoutPayload = {
        name: workoutName,
        exercises: workoutExercises,
        duration: Math.floor(sessionTimer / 60), // Convert to minutes
        notes: notes,
        workoutDate: getTodayDateString(),
        // Include program linking fields for adherence tracking
        linked_program_id: programContext.programId,
        linked_program_phase_index: programContext.phaseIndex,
        linked_program_week_index: programContext.weekIndex,
        linked_program_day_of_week: programContext.dayOfWeek,
      }

      await logWorkoutGroup(workoutPayload)
      toast.success('Workout completed successfully!')
      
      // End the session
      endSession()
      
      // Navigate back to program page
      router.push('/program')
    } catch (err: any) {
      console.error('Error completing workout:', err)
      const message = err.message || 'Failed to save workout. Please try again.'
      setError(message)
      toast.error(message)
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
    }
  }

  // Function to initialize exercise tracking data
  const initializeExerciseTracking = (workoutData: WorkoutDay) => {
    const allExercises: ExerciseDetail[] = []
    if (workoutData.warmUp) allExercises.push(...workoutData.warmUp)
    if (workoutData.exercises) allExercises.push(...workoutData.exercises)
    if (workoutData.coolDown) allExercises.push(...workoutData.coolDown)
    
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

  // No workout data state
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
  const allExercises: ExerciseDetail[] = []
  if (plannedWorkout.warmUp) allExercises.push(...plannedWorkout.warmUp)
  if (plannedWorkout.exercises) allExercises.push(...plannedWorkout.exercises)
  if (plannedWorkout.coolDown) allExercises.push(...plannedWorkout.coolDown)

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
          <div className="flex items-center justify-center space-x-4">
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
              </div>

        {/* Exercise Tracking */}
        <div className="space-y-6">
          {allExercises.map((exercise, index) => (
            <TrackedExercise
              key={`${exercise.name}-${index}`}
              exercise={exercise}
              onSetComplete={(setIndex, weight, reps) => handleSetComplete(index, setIndex, weight, reps)}
              onSetUncomplete={(setIndex) => handleSetUncomplete(index, setIndex)}
              onPBCheck={handlePBCheck}
            />
          ))}
              </div>

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
      </div>
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