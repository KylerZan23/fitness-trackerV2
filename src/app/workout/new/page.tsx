'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkout, logWorkoutGroup, getUserProfile } from '@/lib/db'
import { workoutSchema, workoutGroupSchema } from '@/lib/schemas'
import { MuscleGroup, getAllMuscleGroups, getExercisesByMuscleGroup } from '@/lib/types'
import { MuscleGroupSelector } from '@/components/workout/MuscleGroupSelector'
import { ExerciseSelector } from '@/components/workout/ExerciseSelector'
import { createBrowserClient } from '@supabase/ssr'

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
  
  // Format today's date as YYYY-MM-DD for input fields
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}` // Returns YYYY-MM-DD in local timezone
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [groupMode, setGroupMode] = useState(true)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [currentExercise, setCurrentExercise] = useState<WorkoutExercise>({
    exerciseName: '',
    sets: 3,
    reps: 10,
    weight: 0
  })
  const [formData, setFormData] = useState<WorkoutFormData>({
    exerciseName: '',
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 30,
    notes: '',
    workoutDate: getTodayDateString()
  })
  const [groupFormData, setGroupFormData] = useState<WorkoutGroupFormData>({
    name: '',
    exercises: [],
    duration: 30,
    notes: '',
    workoutDate: getTodayDateString()
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check authentication and get userId for the chart
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          
          // Get user profile to get weight unit preference
          const profile = await getUserProfile()
          if (profile && profile.weight_unit) {
            setWeightUnit(profile.weight_unit)
          }
        } else {
          // If no session, try to refresh it
          const { data: refreshData } = await supabase.auth.refreshSession()
          if (refreshData.session?.user) {
            setUserId(refreshData.session.user.id)
            
            // Get user profile to get weight unit preference
            const profile = await getUserProfile()
            if (profile && profile.weight_unit) {
              setWeightUnit(profile.weight_unit)
            }
          } else {
            console.warn('No active session found. User may need to log in again.')
            // Don't redirect here, let the middleware handle it if needed
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err)
      }
    }
    
    checkAuth()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (groupMode) {
      if (name.startsWith('group.')) {
        const groupField = name.split('.')[1]
        setGroupFormData(prev => ({
          ...prev,
          [groupField]: groupField === 'name' || groupField === 'notes' || groupField === 'workoutDate'
            ? value 
            : parseInt(value) || 0
        }))
      } else {
        setCurrentExercise(prev => ({
          ...prev,
          [name]: name === 'exerciseName' 
            ? value 
            : parseInt(value) || 0
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'sets' || name === 'reps' || name === 'weight' || name === 'duration'
          ? parseInt(value) || 0
          : value
      }))
    }
  }

  const handleSelectExercise = (exerciseName: string) => {
    if (groupMode) {
      setCurrentExercise(prev => ({
        ...prev,
        exerciseName
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        exerciseName
      }))
    }
  }

  const handleAddExercise = () => {
    // Validate current exercise
    if (!currentExercise.exerciseName) {
      toast.error('Please select an exercise name')
      return
    }
    
    // Add to exercises list
    setExercises(prev => [...prev, {...currentExercise}])
    setGroupFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, {...currentExercise}]
    }))
    
    // Reset for next exercise
    setCurrentExercise({
      exerciseName: '',
      sets: 3,
      reps: 10,
      weight: 0
    })
    
    toast.success(`Added ${currentExercise.exerciseName} to workout`)
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index))
    setGroupFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setDetailedError(null)
    setSuccessMessage(null)

    try {
      // Log initial form data for debugging
      console.log('Form submission started', groupMode ? 'Group mode' : 'Single mode');
      console.log('Form data:', groupMode ? groupFormData : formData);
      
      if (groupMode) {
        // Group mode - log multiple exercises
        // First ensure we have at least one exercise
        if (exercises.length === 0) {
          throw new Error('Please add at least one exercise to your workout')
        }
        
        // Validate the workout group data
        const groupPayload = {
          name: groupFormData.name,
          exercises: exercises,
          duration: groupFormData.duration,
          notes: groupFormData.notes,
          workoutDate: groupFormData.workoutDate
        }
        
        console.log('Workout group payload:', groupPayload);
        
        const validationResult = workoutGroupSchema.safeParse(groupPayload)
        
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout group data'
          throw new Error(errorMessage)
        }
        
        // Check authentication
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session check result:', sessionData ? 'Session exists' : 'No session');
        
        if (!sessionData.session?.user) {
          throw new Error('You must be logged in to log a workout. Please sign in again.')
        }
        
        console.log('Submitting workout group data:', groupPayload)
        
        // Submit the workout group to the database
        const result = await logWorkoutGroup(groupPayload)
        console.log('Workout group logging result:', result)
        
        if (!result) {
          const err = new Error('Failed to log workout group. Please try again.')
          // @ts-ignore
          err.details = 'Check browser console and server logs for details'
          throw err
        }
        
        // Show success message
        toast.success('Workout group logged successfully!', {
          duration: 5000,
          position: 'top-center',
        })
        
        // Set success banner message
        setSuccessMessage(`You have successfully added a new workout: "${groupPayload.name}" with ${exercises.length} exercises`)
        
        // Reset form data
        setExercises([])
        setCurrentExercise({
          exerciseName: '',
          sets: 3,
          reps: 10,
          weight: 0
        })
        setGroupFormData({
          name: '',
          exercises: [],
          duration: 30,
          notes: '',
          workoutDate: getTodayDateString()
        })
      } else {
        // Single exercise mode - original functionality
        console.log('Single workout mode - validating data:', formData);
        const validationResult = workoutSchema.safeParse(formData)
        
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout data'
          throw new Error(errorMessage)
        }
        
        // Check authentication before trying to log workout
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session check result:', sessionData ? 'Session exists' : 'No session');
        
        if (!sessionData.session?.user) {
          throw new Error('You must be logged in to log a workout. Please sign in again.')
        }
        
        // Add validation for VARCHAR(50) constraint
        if (formData.exerciseName.length > 50) {
          throw new Error('Exercise name must be less than 50 characters')
        }
        
        console.log('Submitting workout data:', formData)
        
        // Submit the workout to the database
        const result = await logWorkout(formData)
        console.log('Workout logging result:', result)
        
        if (!result) {
          const err = new Error('Failed to log workout. Please try again.')
          // @ts-ignore
          err.details = 'Check browser console and server logs for details'
          throw err
        }
        
        // Show success message
        toast.success('Workout logged successfully!', {
          duration: 5000,
          position: 'top-center',
        })
        
        // Set success banner message
        setSuccessMessage(`You have successfully added a new workout: ${formData.sets} sets of ${formData.exerciseName}`)
        
        // Reset form data for a new workout
        setFormData({
          exerciseName: '',
          sets: 3,
          reps: 10,
          weight: 0,
          duration: 30,
          notes: '',
          workoutDate: getTodayDateString()
        })
      }
      
      // Stay on the same page to allow logging another workout
      // Only redirect if explicitly requested
      const shouldRedirect = new URLSearchParams(window.location.search).get('redirect') === 'true'
      if (shouldRedirect) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error creating workout:', err)
      setDetailedError(err)
      
      let errorMessage = 'Failed to create workout. Please try again.'
      if (err instanceof Error) {
        errorMessage = err.message
        // @ts-ignore - This is for our custom error prop
        if (err.details) {
          // @ts-ignore
          errorMessage += ` (${err.details})`
        }
      }
      
      setError(errorMessage)
      // Add a clear toast error message
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">FitnessTracker</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-8 relative">
            <Link 
              href="/dashboard" 
              className="text-white/70 hover:text-white absolute left-0 top-1/2 -translate-y-1/2"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-serif text-center">Workout Log</h1>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 bg-green-900/60 border border-green-500 text-white rounded-lg p-4 flex items-center shadow-lg animate-fadeIn">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">{successMessage}</p>
                <p className="text-sm text-green-300 mt-1">You can continue adding more workouts or return to dashboard.</p>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)} 
                className="ml-auto text-green-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-medium">Log a New Workout</h2>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-200 font-medium mb-1">{error}</p>
                {detailedError && (
                  <div className="mt-2 text-sm text-red-300 overflow-auto max-h-32">
                    <p className="mb-1">Debug information (for developers):</p>
                    <pre className="whitespace-pre-wrap break-all bg-red-950/50 p-2 rounded">
                      {JSON.stringify(detailedError, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {groupMode && (
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-4">Workout Name</h3>
                  <input
                    type="text"
                    id="group.name"
                    name="group.name"
                    value={groupFormData.name}
                    onChange={handleChange}
                    placeholder="e.g., Push Day, Leg Day, Upper Body"
                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                    required
                  />
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-4">1. Select Muscle Group</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMuscleGroup(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedMuscleGroup === null
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    All Exercises
                  </button>
                  
                  {getAllMuscleGroups().map((muscleGroup) => (
                    <button
                      type="button"
                      key={muscleGroup}
                      onClick={() => setSelectedMuscleGroup(muscleGroup)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedMuscleGroup === muscleGroup
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {muscleGroup}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-4">2. Select Exercise</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="exerciseName" className="block text-gray-300 mb-2">
                      Exercise Name
                    </label>
                    <input
                      type="text"
                      id="exerciseName"
                      name="exerciseName"
                      value={groupMode ? currentExercise.exerciseName : formData.exerciseName}
                      onChange={handleChange}
                      placeholder="e.g., Bench Press, Squats, Running"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required={!groupMode}
                    />
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-gray-300 mb-2">Suggested Exercises:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
                      {(selectedMuscleGroup ? getExercisesByMuscleGroup(selectedMuscleGroup) : getExercisesByMuscleGroup(MuscleGroup.CHEST)).slice(0, 9).map((exercise) => (
                        <button
                          type="button"
                          key={exercise.name}
                          onClick={() => handleSelectExercise(exercise.name)}
                          className="text-left p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                        >
                          <div className="font-medium text-white group-hover:text-white text-sm">{exercise.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-4">3. Enter Exercise Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="sets" className="block text-gray-300 mb-2">
                      Sets
                    </label>
                    <input
                      type="number"
                      id="sets"
                      name="sets"
                      value={groupMode ? currentExercise.sets : formData.sets}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required={!groupMode}
                    />
                  </div>

                  <div>
                    <label htmlFor="reps" className="block text-gray-300 mb-2">
                      Reps
                    </label>
                    <input
                      type="number"
                      id="reps"
                      name="reps"
                      value={groupMode ? currentExercise.reps : formData.reps}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required={!groupMode}
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-gray-300 mb-2">
                      Weight ({weightUnit})
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={groupMode ? currentExercise.weight : formData.weight}
                      onChange={handleChange}
                      min="0"
                      max="1000"
                      step="0.5"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required={!groupMode}
                    />
                  </div>
                </div>

                {groupMode && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="w-full px-4 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Add Exercise to Workout
                    </button>
                  </div>
                )}

                {/* Selected exercises list */}
                {groupMode && exercises.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-2">Selected Exercises</h4>
                    <div className="bg-black/30 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                      {exercises.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border-b border-white/10 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium">{exercise.exerciseName}</p>
                            <p className="text-sm text-gray-400">{exercise.sets} sets × {exercise.reps} reps • {exercise.weight} {weightUnit}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveExercise(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupMode ? (
                  <div className={`grid grid-cols-1 gap-4 mb-6`}>
                    <div>
                      <label htmlFor="group.workoutDate" className="block text-gray-300 mb-2">
                        Workout Date <span className="text-gray-500">(select a past date to log retroactively)</span>
                      </label>
                      <input
                        type="date"
                        id="group.workoutDate"
                        name="group.workoutDate"
                        value={groupFormData.workoutDate}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                        max={getTodayDateString()} // Don't allow future dates
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 gap-4 mb-6`}>
                    <div>
                      <label htmlFor="workoutDate" className="block text-gray-300 mb-2">
                        Workout Date <span className="text-gray-500">(select a past date to log retroactively)</span>
                      </label>
                      <input
                        type="date"
                        id="workoutDate"
                        name="workoutDate"
                        value={formData.workoutDate}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                        max={getTodayDateString()} // Don't allow future dates
                        required
                      />
                    </div>
                  </div>
                )}

                <div className={`grid grid-cols-1 gap-4 mb-6`}>
                  <div>
                    <label htmlFor={groupMode ? "group.duration" : "duration"} className="block text-gray-300 mb-2">
                      Workout Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id={groupMode ? "group.duration" : "duration"}
                      name={groupMode ? "group.duration" : "duration"}
                      value={groupMode ? groupFormData.duration : formData.duration}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor={groupMode ? "group.notes" : "notes"} className="block text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    id={groupMode ? "group.notes" : "notes"}
                    name={groupMode ? "group.notes" : "notes"}
                    value={groupMode ? groupFormData.notes : formData.notes}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white h-32 resize-none"
                    placeholder="Add any notes about your workout here..."
                  ></textarea>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-colors"
                disabled={isSubmitting || (groupMode && exercises.length === 0)}
              >
                {isSubmitting ? 'Saving...' : groupMode ? 'Log Workout Group' : 'Log Workout'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 