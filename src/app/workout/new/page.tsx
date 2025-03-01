'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logWorkout } from '@/lib/db'
import { workoutSchema } from '@/lib/schemas'
import { MuscleGroup } from '@/lib/types'
import { MuscleGroupSelector } from '@/components/workout/MuscleGroupSelector'
import { ExerciseSelector } from '@/components/workout/ExerciseSelector'
import { MuscleHeatmap } from '@/components/workout/MuscleHeatmap'

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
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [formData, setFormData] = useState<WorkoutFormData>({
    exerciseName: '',
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 30,
    notes: ''
  })

  // Check authentication and get userId for the heatmap
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
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
      
      // Redirect back to dashboard
      router.push('/dashboard')
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

          {/* Toggle button for heatmap visibility */}
          <div className="flex justify-end mb-6">
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="flex items-center text-white/70 hover:text-white"
            >
              {showHeatmap ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                  Hide Muscle Heatmap
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Show Muscle Heatmap
                </>
              )}
            </button>
          </div>

          {/* Integrated Muscle Heatmap */}
          {showHeatmap && (
            <div className="mb-10 bg-black/20 border border-white/10 rounded-xl p-4">
              <h2 className="text-xl font-medium mb-4">Your Muscle Training Map</h2>
              <MuscleHeatmap userId={userId || undefined} />
            </div>
          )}

          <h2 className="text-2xl font-medium mb-6">Log a New Workout</h2>

          {/* Muscle Group Selector */}
          <MuscleGroupSelector 
            selectedMuscleGroup={selectedMuscleGroup}
            onSelectMuscleGroup={setSelectedMuscleGroup}
          />

          {/* Exercise Selector */}
          <ExerciseSelector
            selectedMuscleGroup={selectedMuscleGroup}
            onSelectExercise={handleSelectExercise}
          />

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
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
                    Reps per Set
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
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    max="1000"
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
                    min="1"
                    max="360"
                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="notes" className="block text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="How did this workout go? Any PRs or challenges?"
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging Workout...
                    </span>
                  ) : (
                    'Log Workout'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 