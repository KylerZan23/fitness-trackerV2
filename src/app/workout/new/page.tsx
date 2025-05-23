'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import Link from 'next/link' // No longer used? Keep if needed for other links later
// import { z } from 'zod' // Zod schemas imported but not used directly in component
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkout, logWorkoutGroup, getUserProfile } from '@/lib/db'
import { workoutSchema, workoutGroupSchema } from '@/lib/schemas'
// import { MuscleGroup, getAllMuscleGroups, getExercisesByMuscleGroup } from '@/lib/types' // No longer used
// import { MuscleGroupSelector } from '@/components/workout/MuscleGroupSelector' // REMOVED
// import { ExerciseSelector } from '@/components/workout/ExerciseSelector' // REMOVED
// import { createBrowserClient } from '@supabase/ssr' // Already using supabase client from @/lib/supabase

// Import new UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea' // Correctly import the new component
import { ExerciseCombobox } from '@/components/workout/ExerciseCombobox' // Added ExerciseCombobox import

// Add imports for training program functionality
import { fetchActiveProgramAction } from '@/app/_actions/aiProgramActions'
import { type TrainingProgram, type WorkoutDay, DayOfWeek, type ExerciseDetail } from '@/lib/types/program'
import { type TrainingProgramWithId } from '@/lib/programDb'
import { ExerciseListDisplay } from '@/components/program/ExerciseListDisplay'

// TODO: Create Textarea component in src/components/ui/textarea.tsx if it doesn't exist
// Example:
// import * as React from "react"
// import { cn } from "@/lib/utils"
// const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
//   ({ className, ...props }, ref) => {
//     return (
//       <textarea
//         className={cn(
//           "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Textarea.displayName = "Textarea"
// export { Textarea }

// Interface for storing program context details for linking
interface ProgramContext {
  programId: string
  phaseIndex: number
  weekIndex: number
  dayOfWeek: number
}

// Interfaces remain largely the same, but exerciseName is now direct input
interface WorkoutFormData {
  exerciseName: string
  sets: number
  reps: number
  weight: number
  duration: number
  notes: string
  workoutDate: string
}

interface WorkoutExercise {
  exerciseName: string
  sets: number
  reps: number
  weight: number
}

interface WorkoutGroupFormData {
  name: string
  exercises: WorkoutExercise[]
  duration: number
  notes: string
  workoutDate: string
}

export default function NewWorkoutPage() {
  const router = useRouter()

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Use ISO string for consistency
  }

  // State variables
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null) // Keep for detailed debugging if needed
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  // const [groupMode, setGroupMode] = useState(true) // Default to group mode, no longer needs to be toggled
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<WorkoutExercise>({
    exerciseName: '', // Now direct input
    sets: 3,
    reps: 10,
    weight: 0
  })
  // Single workout form data (REMOVED as single exercise mode is removed)
  // const [formData, setFormData] = useState<WorkoutFormData>({
  //   exerciseName: '',
  //   sets: 3,
  //   reps: 10,
  //   weight: 0,
  //   duration: 30,
  //   notes: '',
  //   workoutDate: getTodayDateString()
  // })
  // Group workout form data
  const [groupFormData, setGroupFormData] = useState<WorkoutGroupFormData>({
    name: '',
    exercises: [],
    duration: 30,
    notes: '',
    workoutDate: getTodayDateString()
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null) // Keep for potential success indicators

  // Add state for training program and today's planned workout
  const [trainingProgram, setTrainingProgram] = useState<TrainingProgramWithId | null>(null)
  const [todaysPlannedWorkout, setTodaysPlannedWorkout] = useState<WorkoutDay | null>(null)
  const [programLoading, setProgramLoading] = useState(false)
  
  // Add state for program context details for linking to logged workouts
  const [currentPlanContext, setCurrentPlanContext] = useState<ProgramContext | null>(null)

  // Utility function to convert JavaScript day (0=Sunday, 1=Monday...) to DayOfWeek enum
  const getJSDateToDayOfWeek = (jsDay: number): DayOfWeek => {
    // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // DayOfWeek enum: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
    const mapping = {
      0: DayOfWeek.SUNDAY,    // Sunday
      1: DayOfWeek.MONDAY,    // Monday
      2: DayOfWeek.TUESDAY,   // Tuesday
      3: DayOfWeek.WEDNESDAY, // Wednesday
      4: DayOfWeek.THURSDAY,  // Thursday
      5: DayOfWeek.FRIDAY,    // Friday
      6: DayOfWeek.SATURDAY   // Saturday
    }
    return mapping[jsDay as keyof typeof mapping] || DayOfWeek.MONDAY
  }

  // Function to find today's planned workout from the training program
  // Returns both the workout and the context for linking
  const findTodaysPlannedWorkout = (program: TrainingProgramWithId): { workout: WorkoutDay | null, context: ProgramContext | null } => {
    if (!program || !program.phases || program.phases.length === 0) {
      return { workout: null, context: null }
    }

    const today = new Date()
    const todayDayOfWeek = getJSDateToDayOfWeek(today.getDay())

    // For MVP: Use the first week of the first phase
    // TODO: In the future, calculate based on program start_date and current date
    const firstPhase = program.phases[0]
    if (!firstPhase || !firstPhase.weeks || firstPhase.weeks.length === 0) {
      return { workout: null, context: null }
    }

    const firstWeek = firstPhase.weeks[0]
    if (!firstWeek || !firstWeek.days || firstWeek.days.length === 0) {
      return { workout: null, context: null }
    }

    // Find the workout day that matches today's day of week
    const todaysWorkout = firstWeek.days.find(day => day.dayOfWeek === todayDayOfWeek)
    
    if (todaysWorkout) {
      // Create context for linking this workout to the program
      const context: ProgramContext = {
        programId: program.id,
        phaseIndex: 0, // Using first phase (index 0)
        weekIndex: 0,  // Using first week (index 0)
        dayOfWeek: todayDayOfWeek
      }
      return { workout: todaysWorkout, context }
    }
    
    return { workout: null, context: null }
  }

  // Utility functions to parse planned exercise data into form format
  const parseExerciseSets = (sets: number): number => {
    return sets || 3 // Default to 3 if invalid
  }

  const parseExerciseReps = (reps: string | number): number => {
    if (typeof reps === 'number') {
      return reps
    }
    
    // Handle string formats like "8-12", "5", "15-20"
    const repsStr = String(reps).trim()
    
    // Check if it's a range (contains dash)
    if (repsStr.includes('-')) {
      const parts = repsStr.split('-')
      if (parts.length === 2) {
        const min = parseInt(parts[0].trim())
        const max = parseInt(parts[1].trim())
        if (!isNaN(min) && !isNaN(max)) {
          // Return middle value of the range, or first value if range is small
          return Math.round((min + max) / 2)
        }
      }
    }
    
    // Try to parse as single number
    const singleValue = parseInt(repsStr)
    return !isNaN(singleValue) ? singleValue : 10 // Default to 10 if unparseable
  }

  const parseExerciseWeight = (weight?: string): number => {
    if (!weight) return 0
    
    // Try to extract number from weight string (e.g., "40kg", "25lbs", "bodyweight")
    const weightStr = String(weight).toLowerCase().trim()
    
    // Handle bodyweight exercises
    if (weightStr.includes('bodyweight') || weightStr.includes('bw')) {
      return 0
    }
    
    // Extract number from string
    const match = weightStr.match(/(\d+(?:\.\d+)?)/)
    if (match) {
      const value = parseFloat(match[1])
      return !isNaN(value) ? value : 0
    }
    
    return 0 // Default to 0 if unparseable
  }

  // Convert planned exercise to workout exercise format
  const convertPlannedExerciseToWorkoutExercise = (exercise: ExerciseDetail): WorkoutExercise => {
    return {
      exerciseName: exercise.name,
      sets: parseExerciseSets(exercise.sets),
      reps: parseExerciseReps(exercise.reps),
      weight: parseExerciseWeight(exercise.weight)
    }
  }

  // Function to load today's planned workout into the form
  const handleLoadPlannedWorkout = () => {
    if (!todaysPlannedWorkout || todaysPlannedWorkout.isRestDay) {
      toast.error('No active workout plan to load for today')
      return
    }

    try {
      // Clear existing exercises
      setExercises([])
      
      // Prepare new exercises array
      const allPlannedExercises: ExerciseDetail[] = []
      
      // Combine all exercise types (warm-up, main, cool-down)
      if (todaysPlannedWorkout.warmUp && todaysPlannedWorkout.warmUp.length > 0) {
        allPlannedExercises.push(...todaysPlannedWorkout.warmUp)
      }
      if (todaysPlannedWorkout.exercises && todaysPlannedWorkout.exercises.length > 0) {
        allPlannedExercises.push(...todaysPlannedWorkout.exercises)
      }
      if (todaysPlannedWorkout.coolDown && todaysPlannedWorkout.coolDown.length > 0) {
        allPlannedExercises.push(...todaysPlannedWorkout.coolDown)
      }

      if (allPlannedExercises.length === 0) {
        toast.warning('No exercises found in today\'s planned workout')
        return
      }

      // Convert planned exercises to workout exercise format
      const workoutExercises = allPlannedExercises.map(convertPlannedExerciseToWorkoutExercise)
      
      // Update state
      setExercises(workoutExercises)
      
      // Set workout name based on focus
      const workoutName = todaysPlannedWorkout.focus 
        ? `Today's ${todaysPlannedWorkout.focus} Workout`
        : 'Today\'s Planned Workout'
      
      // Update group form data
      setGroupFormData(prev => ({
        ...prev,
        name: workoutName,
        exercises: workoutExercises,
        duration: todaysPlannedWorkout.estimatedDurationMinutes || prev.duration,
        notes: todaysPlannedWorkout.notes || ''
      }))

      toast.success(`Loaded ${workoutExercises.length} exercises from your planned workout!`)
      
    } catch (error) {
      console.error('Error loading planned workout:', error)
      toast.error('Failed to load planned workout. Please try again.')
    }
  }

  // Updated useEffect to fetch full profile for Sidebar
  useEffect(() => {
    async function fetchProfileAndAuth() {
      setIsSubmitting(true); // Use isSubmitting to indicate loading state
      try {
        // Use getUserProfile which handles session checking internally now
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          setWeightUnit(userProfile.weight_unit ?? 'kg');
          console.log("User profile fetched:", userProfile);
        } else {
          console.warn('No active session or profile found. Redirecting to login.');
          setProfile(null); // Explicitly set to null if no profile found
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user data.');
        setProfile(null); // Ensure profile is null on error
      } finally {
        setIsSubmitting(false);
      }
    }
    fetchProfileAndAuth();
  }, [router]); // Add router dependency

  // Fetch active training program
  useEffect(() => {
    async function fetchTrainingProgram() {
      if (!profile) return // Don't fetch program until profile is loaded
      
      setProgramLoading(true)
      try {
        const result = await fetchActiveProgramAction()
        
        if (result.error) {
          console.log('No active training program found:', result.error)
          setTrainingProgram(null)
          setTodaysPlannedWorkout(null)
        } else if (result.program) {
          setTrainingProgram(result.program as TrainingProgramWithId)
          
          // Determine today's planned workout
          const { workout, context } = findTodaysPlannedWorkout(result.program as TrainingProgramWithId)
          setTodaysPlannedWorkout(workout)
          setCurrentPlanContext(context)
          
          console.log('Found today\'s planned workout:', workout)
        } else {
          setTrainingProgram(null)
          setTodaysPlannedWorkout(null)
        }
      } catch (err) {
        console.error('Error fetching training program:', err)
        setTrainingProgram(null)
        setTodaysPlannedWorkout(null)
      } finally {
        setProgramLoading(false)
      }
    }

    fetchTrainingProgram()
  }, [profile]) // Depend on profile so it runs after profile is loaded

  // Combined handleChange for both modes and Input/Textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Remove exerciseName from direct handling by handleChange, as Combobox has its own onValueChange
    if (name === 'exerciseName') return;

    const parsedValue = (type === 'number' || name === 'sets' || name === 'reps' || name === 'weight' || name === 'duration' || name === 'group.duration')
      ? parseInt(value) || 0
      : value;

    // if (groupMode) { // groupMode is always true now
    if (name.startsWith('group.')) {
      const groupField = name.split('.')[1];
      setGroupFormData(prev => ({ ...prev, [groupField]: parsedValue }));
    } else {
      // Handle fields for the current exercise being added
      setCurrentExercise(prev => ({ ...prev, [name]: parsedValue }));
    }
    // } else {
      // Handle fields for single workout mode (REMOVED)
      // setFormData(prev => ({ ...prev, [name]: parsedValue }));
    // }
  };

  // handleSelectExercise is REMOVED as ExerciseSelector is removed. Name is typed directly.

  const handleAddExercise = () => {
    // Validate current exercise (ensure name is not empty)
    if (!currentExercise.exerciseName.trim()) {
      toast.error('Please enter an exercise name');
      return;
    }
    if (currentExercise.sets <= 0 || currentExercise.reps <= 0) {
       toast.error('Sets and Reps must be greater than zero.');
       return;
    }

    const newExercise = { ...currentExercise };
    setExercises(prev => [...prev, newExercise]);
    // Update groupFormData immediately (was missing before)
     setGroupFormData(prev => ({
       ...prev,
       exercises: [...prev.exercises, newExercise]
     }));

    // Reset for next exercise
    setCurrentExercise({
      exerciseName: '',
      sets: 3,
      reps: 10,
      weight: 0
    });

    toast.success(`Added ${newExercise.exerciseName} to workout`);
  };

  const handleRemoveExercise = (index: number) => {
    const removedExerciseName = exercises[index]?.exerciseName ?? 'Exercise';
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    setGroupFormData(prev => ({
      ...prev,
      exercises: updatedExercises
    }));
    toast.info(`Removed ${removedExerciseName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setDetailedError(null);
    setSuccessMessage(null);

    // Ensure user is logged in (profile check)
     if (!profile) {
       setError("User profile not loaded. Cannot log workout.");
       setIsSubmitting(false);
       toast.error("User profile not loaded. Please try again.");
       return;
     }

    try {
      console.log('Form submission started'); // groupMode check removed, always group mode

      // if (groupMode) { // groupMode is always true now
      console.log('Group Form data:', groupFormData);
      if (groupFormData.exercises.length === 0) {
        throw new Error('Please add at least one exercise to your workout group');
      }
      // Ensure group name is present
       if (!groupFormData.name.trim()) {
         throw new Error('Please enter a name for your workout group');
       }

      const groupPayload = {
        name: groupFormData.name,
        exercises: groupFormData.exercises, // Use groupFormData.exercises directly
        duration: groupFormData.duration,
        notes: groupFormData.notes,
        workoutDate: groupFormData.workoutDate,
        // Include program linking fields if we have context from today's planned workout
        ...(currentPlanContext && {
          linked_program_id: currentPlanContext.programId,
          linked_program_phase_index: currentPlanContext.phaseIndex,
          linked_program_week_index: currentPlanContext.weekIndex,
          linked_program_day_of_week: currentPlanContext.dayOfWeek,
        }),
      };
      console.log('Workout group payload:', groupPayload);

      const validationResult = workoutGroupSchema.safeParse(groupPayload);
      if (!validationResult.success) {
        console.error('Validation error:', validationResult.error);
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout group data';
        throw new Error(errorMessage);
      }

      await logWorkoutGroup(validationResult.data); // Use validated data
      toast.success('Workout group logged successfully!');
      // Reset form after successful submission
       setGroupFormData({
         name: '',
         exercises: [],
         duration: 30,
         notes: '',
         workoutDate: getTodayDateString()
       });
       setExercises([]); // Clear exercise list too
       // Note: We keep currentPlanContext and todaysPlannedWorkout for continued reference


      // } else {
        // Single Exercise Mode (REMOVED)
        // console.log('Single Form data:', formData);
        //  // Ensure exercise name is present
        //  if (!formData.exerciseName.trim()) {
        //    throw new Error('Please enter an exercise name');
        //  }

        // const singlePayload = {
        //   exerciseName: formData.exerciseName,
        //   sets: formData.sets,
        //   reps: formData.reps,
        //   weight: formData.weight,
        //   duration: formData.duration,
        //   notes: formData.notes,
        //   workoutDate: formData.workoutDate,
        //   weight_unit: weightUnit // Add weight unit
        // };
        // console.log('Single workout payload:', singlePayload);

        // // Validate single workout data (assuming workoutSchema includes weight_unit now)
        // // If workoutSchema doesn't include weight_unit, adjust schema or payload
        // const validationResult = workoutSchema.safeParse(singlePayload);
        //  if (!validationResult.success) {
        //    console.error('Validation error:', validationResult.error);
        //    const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout data';
        //    throw new Error(errorMessage);
        //  }

        // await logWorkout(validationResult.data); // Use validated data
        // toast.success('Workout logged successfully!');
        // // Reset form
        //  setFormData({
        //     exerciseName: '',
        //     sets: 3,
        //     reps: 10,
        //     weight: 0,
        //     duration: 30,
        //     notes: '',
        //     workoutDate: getTodayDateString()
        //   });
      // }

      // Optionally navigate away after success
      // router.push('/workouts'); // Example: navigate to workouts list

    } catch (err: any) {
      console.error('Error submitting workout:', err);
      const message = err.message || 'Failed to log workout. Please try again.';
      setError(message);
      setDetailedError(err); // Store detailed error object
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout handler to pass to Sidebar
  const handleLogout = async () => {
    setIsSubmitting(true); // Show loading state
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null); // Clear profile state
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
      setError('Failed to sign out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare sidebar props conditionally based on profile loading state
  const sidebarProps = profile
   ? {
       userName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
       userEmail: profile.email,
       profilePictureUrl: profile.profile_picture_url,
       onLogout: handleLogout,
     }
   : { // Provide default/empty props if profile is null
       userName: 'Loading...',
       userEmail: '',
       profilePictureUrl: null,
       onLogout: handleLogout, // Logout should still work
     };


  // Loading state before profile is loaded
  if (profile === null && !error && isSubmitting) {
    return (
       <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading user data...</p>
          {/* Consider adding a spinner component */}
        </div>
      </DashboardLayout>
    );
  }
  
   // Error state if profile loading failed
  if (profile === null && error) {
     return (
       <DashboardLayout sidebarProps={sidebarProps}>
         <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Page</h1>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" className="ml-2" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
         </div>
      </DashboardLayout>
     )
  }


  // Main component render
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Log New Workout</h1>

        {/* Today's Planned Workout Section */}
        {!programLoading && (
          <div className="mb-6">
            {todaysPlannedWorkout ? (
              todaysPlannedWorkout.isRestDay ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-green-800 mb-2">
                    🧘 Today's Planned Activity
                  </h2>
                  <p className="text-green-700">
                    Today is a planned rest day in your program. Take time to recover and prepare for tomorrow's workout.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-3">
                    📋 Today's Planned Workout (From Your Program)
                  </h2>
                  <p className="text-blue-700 text-sm mb-4">
                    Reference your AI-generated program while logging what you actually did.
                  </p>
                  
                  <div className="bg-white rounded-md p-3 space-y-3">
                    {todaysPlannedWorkout.focus && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Focus:</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {todaysPlannedWorkout.focus}
                        </span>
                      </div>
                    )}
                    
                    {todaysPlannedWorkout.estimatedDurationMinutes && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Estimated Duration:</span>
                        <span className="text-sm text-gray-800">
                          {todaysPlannedWorkout.estimatedDurationMinutes} minutes
                        </span>
                      </div>
                    )}

                    {/* Warm-up exercises */}
                    {todaysPlannedWorkout.warmUp && todaysPlannedWorkout.warmUp.length > 0 && (
                      <div className="space-y-2">
                        <ExerciseListDisplay 
                          exercises={todaysPlannedWorkout.warmUp} 
                          listTitle="🔥 Planned Warm-up" 
                        />
                      </div>
                    )}

                    {/* Main exercises */}
                    {todaysPlannedWorkout.exercises && todaysPlannedWorkout.exercises.length > 0 && (
                      <div className="space-y-2">
                        <ExerciseListDisplay 
                          exercises={todaysPlannedWorkout.exercises} 
                          listTitle="💪 Planned Main Workout" 
                        />
                      </div>
                    )}

                    {/* Cool-down exercises */}
                    {todaysPlannedWorkout.coolDown && todaysPlannedWorkout.coolDown.length > 0 && (
                      <div className="space-y-2">
                        <ExerciseListDisplay 
                          exercises={todaysPlannedWorkout.coolDown} 
                          listTitle="🧘 Planned Cool-down" 
                        />
                      </div>
                    )}

                    {todaysPlannedWorkout.notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Notes:</strong> {todaysPlannedWorkout.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Load Planned Workout Button */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      onClick={handleLoadPlannedWorkout}
                      disabled={isSubmitting}
                      variant="outline"
                      className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                    >
                      📋 Load Today's Plan into Form
                    </Button>
                  </div>
                </div>
              )
            ) : trainingProgram ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  📅 No Specific Workout Planned for Today
                </h2>
                <p className="text-gray-600 text-sm">
                  You have an active training program, but no specific workout is scheduled for today. 
                  Log whatever workout you decide to do!
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                  💡 No Active Training Program
                </h2>
                <p className="text-yellow-700 text-sm">
                  You don't have an active AI-generated training program yet. 
                  <a href="/onboarding" className="underline hover:text-yellow-900 ml-1">
                    Complete your onboarding
                  </a> to get a personalized program, or just log your workout below.
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* --- Shared or Conditional Fields --- */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Workout Group Details {/* groupMode check removed, always group mode */}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group Name (Group Mode Only) - now always visible */}
              {/* {groupMode && ( */}
                <div className="md:col-span-2">
                  <Label htmlFor="group.name">Workout Name</Label>
                  <Input
                    id="group.name"
                    name="group.name"
                    type="text"
                    value={groupFormData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morning Push Day"
                    required // groupMode check removed
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              {/* )} */}

              {/* Exercise Name (Single Mode Only) (REMOVED) */}
              {/* {!groupMode && (
                 <div>
                   <Label htmlFor="exerciseName">Exercise Name</Label>
                   <ExerciseCombobox
                     value={formData.exerciseName}
                     onValueChange={(value) => setFormData(prev => ({ ...prev, exerciseName: value }))}
                     disabled={isSubmitting}
                     placeholder="Select or type exercise..."
                   />
                 </div>
              )} */}

               {/* Sets, Reps, Weight (Single Mode Only) (REMOVED) */}
               {/* {!groupMode && (
                 <>
                   <div>
                     <Label htmlFor="sets">Sets</Label>
                     <Input
                       id="sets"
                       name="sets"
                       type="number"
                       value={formData.sets}
                       onChange={handleChange}
                       min="1"
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="reps">Reps</Label>
                     <Input
                       id="reps"
                       name="reps"
                       type="number"
                       value={formData.reps}
                       onChange={handleChange}
                       min="1"
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="weight">Weight ({weightUnit})</Label>
                     <Input
                       id="weight"
                       name="weight"
                       type="number"
                       value={formData.weight}
                       onChange={handleChange}
                       min="0"
                       step="any" // Allow decimals
                       required={!groupMode}
                       disabled={isSubmitting}
                       className="mt-1"
                     />
                   </div>
                 </>
               )} */}


              {/* Duration */}
               <div>
                <Label htmlFor="group.duration">Duration (minutes)</Label> {/* groupMode check removed from name/id */}
                <Input
                  id="group.duration" // groupMode check removed
                  name="group.duration" // groupMode check removed
                  type="number"
                  value={groupFormData.duration} // Always use groupFormData
                  onChange={handleChange}
                  min="0"
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              {/* Workout Date */}
              <div>
                <Label htmlFor="group.workoutDate">Workout Date</Label> {/* groupMode check removed from name/id */}
                <Input
                  id="group.workoutDate" // groupMode check removed
                  name="group.workoutDate" // groupMode check removed
                  type="date"
                  value={groupFormData.workoutDate} // Always use groupFormData
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="group.notes">Notes (Optional)</Label> {/* groupMode check removed from name/id */}
                 {/* Assuming Textarea component exists or style similarly */}
                 <Textarea
                   id="group.notes" // groupMode check removed
                   name="group.notes" // groupMode check removed
                   value={groupFormData.notes} // Always use groupFormData
                   onChange={handleChange}
                   placeholder="e.g., Felt strong today, focus on form..."
                   rows={3}
                   disabled={isSubmitting}
                   className="mt-1"
                 />
              </div>
            </div>
          </div>


          {/* --- Group Mode: Add Exercise Section --- */}
          {/* {groupMode && ( */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Exercise to Group</h2>
               {/* Removed MuscleGroupSelector */}
               {/* Removed ExerciseSelector */}

               {/* Direct Input Fields for Exercise */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                 <div className="lg:col-span-2">
                   <Label htmlFor="exerciseName">Exercise Name</Label>
                   <ExerciseCombobox
                     value={currentExercise.exerciseName}
                     onValueChange={(value) => setCurrentExercise(prev => ({ ...prev, exerciseName: value }))}
                     disabled={isSubmitting}
                     placeholder="Select or type exercise..."
                   />
                 </div>
                 <div>
                   <Label htmlFor="sets">Sets</Label>
                   <Input
                     id="sets"
                     name="sets" // Matches state key
                     type="number"
                     value={currentExercise.sets}
                     onChange={handleChange}
                     min="1"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label htmlFor="reps">Reps</Label>
                   <Input
                     id="reps"
                     name="reps" // Matches state key
                     type="number"
                     value={currentExercise.reps}
                     onChange={handleChange}
                     min="1"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label htmlFor="weight">Weight ({weightUnit})</Label>
                   <Input
                     id="weight"
                     name="weight" // Matches state key
                     type="number"
                     value={currentExercise.weight}
                     onChange={handleChange}
                     min="0"
                     step="any"
                     disabled={isSubmitting}
                     className="mt-1"
                   />
                 </div>
               </div>
               <Button
                 type="button" // Important: Prevent form submission
                 onClick={handleAddExercise}
                 disabled={isSubmitting || !currentExercise.exerciseName.trim()}
                 size="sm"
               >
                 Add Exercise
               </Button>
            </div>
          {/* )} */}


           {/* --- Group Mode: Exercise List --- */}
           {/* {groupMode && exercises.length > 0 && ( */}
             <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
               <h2 className="text-xl font-semibold text-gray-800 mb-4">Exercises in this Group</h2>
               <ul className="space-y-3">
                 {exercises.map((exercise, index) => (
                   <li key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-b-0">
                     <div>
                       <p className="font-medium text-gray-900">{exercise.exerciseName}</p>
                       <p className="text-sm text-gray-600">
                         {exercise.sets} sets x {exercise.reps} reps @ {exercise.weight} {weightUnit}
                       </p>
                     </div>
                     <Button
                       type="button"
                       variant="destructive"
                       size="sm"
                       onClick={() => handleRemoveExercise(index)}
                       disabled={isSubmitting}
                     >
                       Remove
                     </Button>
                   </li>
                 ))}
               </ul>
             </div>
           {/* )} */}


          {/* --- Submission Area --- */}
          <div className="mt-6">
            {error && (
              <p className="text-red-600 mb-4">Error: {error}</p>
            )}
             {/* Display detailed error for debugging if needed */}
             {/* {detailedError && process.env.NODE_ENV === 'development' && (
               <pre className="text-xs text-red-700 bg-red-50 p-2 rounded mb-4 overflow-auto">
                 {JSON.stringify(detailedError, null, 2)}
               </pre>
             )} */}

            <Button
              type="submit"
              disabled={isSubmitting || (/* groupMode && */ exercises.length === 0)}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Logging...' : (/* groupMode ? 'Log Workout Group' : */ 'Log Workout Group')}
            </Button>
             {/* Optionally add a cancel button */}
             <Button
               type="button"
               variant="outline"
               onClick={() => router.back()} // Go back to previous page
               className="ml-2 w-full md:w-auto mt-2 md:mt-0"
               disabled={isSubmitting}
             >
               Cancel
             </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 