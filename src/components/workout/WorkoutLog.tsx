'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkoutFormData, workoutSchema } from '@/lib/schemas'
import { logWorkout } from '@/lib/db'

interface WorkoutLogProps {
  onSuccess?: () => void
}

export function WorkoutLog({ onSuccess }: WorkoutLogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
  })

  const onSubmit = async (data: WorkoutFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const workout = await logWorkout(data)

      if (!workout) {
        throw new Error('Failed to log workout')
      }

      setSuccess(true)
      reset() // Reset form after successful submission
      onSuccess?.() // Call success callback if provided
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while logging your workout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Log Workout</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-800 p-4 rounded-md">
            Workout logged successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Exercise Name */}
        <div>
          <label htmlFor="exerciseName" className="block text-sm font-medium text-foreground">
            Exercise Name
          </label>
          <input
            id="exerciseName"
            type="text"
            {...register('exerciseName')}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="e.g., Bench Press"
            disabled={isLoading}
          />
          {errors.exerciseName && (
            <p className="mt-1 text-sm text-destructive">{errors.exerciseName.message}</p>
          )}
        </div>

        {/* Sets and Reps */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sets" className="block text-sm font-medium text-foreground">
              Sets
            </label>
            <input
              id="sets"
              type="number"
              {...register('sets', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={isLoading}
            />
            {errors.sets && (
              <p className="mt-1 text-sm text-destructive">{errors.sets.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-foreground">
              Reps
            </label>
            <input
              id="reps"
              type="number"
              {...register('reps', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={isLoading}
            />
            {errors.reps && (
              <p className="mt-1 text-sm text-destructive">{errors.reps.message}</p>
            )}
          </div>
        </div>

        {/* Weight and Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-foreground">
              Weight (kg/lbs)
            </label>
            <input
              id="weight"
              type="number"
              step="0.5"
              {...register('weight', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={isLoading}
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              disabled={isLoading}
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Add any additional notes about your workout"
            disabled={isLoading}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging workout...' : 'Log Workout'}
        </button>
      </form>
    </div>
  )
} 