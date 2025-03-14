'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkout, getUserProfile } from '@/lib/db'
import { workoutSchema } from '@/lib/schemas'
import { MuscleGroup, getAllMuscleGroups, getExercisesByMuscleGroup } from '@/lib/types'
import { MuscleGroupSelector } from '@/components/workout/MuscleGroupSelector'
import { ExerciseSelector } from '@/components/workout/ExerciseSelector'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface WorkoutFormData {
  exerciseName: string
  sets: number
  reps: number
  weight: number
  duration: number
  notes: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [formData, setFormData] = useState<WorkoutFormData>({
    exerciseName: '',
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 30,
    notes: ''
  })

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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sets' || name === 'reps' || name === 'weight' || name === 'duration'
        ? parseInt(value) || 0
        : value
    }))
  }

  const handleSelectExercise = (exerciseName: string) => {
    setFormData(prev => ({
      ...prev,
      exerciseName
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setDetailedError(null)

    try {
      // Validate the form data against schema
      const validationResult = workoutSchema.safeParse(formData)
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid workout data'
        throw new Error(errorMessage)
      }
      
      // Check authentication before trying to log workout
      const { data: sessionData } = await supabase.auth.getSession()
      
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
      toast.success('Workout logged successfully!')
      
      // Reset form data for a new workout
      setFormData({
        exerciseName: '',
        sets: 3,
        reps: 10,
        weight: 0,
        duration: 30,
        notes: ''
      })
      
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
          <div className="flex items-center mb-6">
            <Link 
              href="/dashboard" 
              className="text-white/70 hover:text-white mr-4"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-serif">Workout Tracker</h1>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-medium mb-6">Log a New Workout</h2>
            
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
                      value={formData.exerciseName}
                      onChange={handleChange}
                      placeholder="e.g., Bench Press, Squats, Running"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required
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
                <h3 className="text-xl font-medium mb-4">3. Enter Workout Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="sets" className="block text-gray-300 mb-2">
                      Sets
                    </label>
                    <input
                      type="number"
                      id="sets"
                      name="sets"
                      value={formData.sets}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required
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
                      value={formData.reps}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="weight" className="block text-gray-300 mb-2">
                      Weight ({weightUnit})
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="0"
                      max="1000"
                      step="0.5"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="0"
                      max="360"
                      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="notes" className="block text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add any notes about this workout..."
                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Logging workout...
                  </div>
                ) : (
                  'Log Workout'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 