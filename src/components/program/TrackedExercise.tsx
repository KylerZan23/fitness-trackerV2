'use client'

import { useState } from 'react'
import { Check, Circle, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExerciseDetail } from '@/lib/types/program'

interface SetData {
  completed: boolean
  actualWeight?: number
  actualReps?: number
  isPB?: boolean
  pbType?: string
}

interface TrackedExerciseProps {
  exercise: ExerciseDetail
  onSetComplete: (setIndex: number, weight: number, reps: number) => void
  onSetUncomplete: (setIndex: number) => void
  onPBCheck?: (exerciseName: string, weight: number, reps: number) => Promise<{ isPB: boolean; pbType?: string }>
  isWarmupOrCooldown?: boolean
}

export function TrackedExercise({ exercise, onSetComplete, onSetUncomplete, onPBCheck, isWarmupOrCooldown = false }: TrackedExerciseProps) {
  const [sets, setSets] = useState<SetData[]>(
    Array.from({ length: exercise.sets }, () => ({ completed: false }))
  )
  
  // State for simple completion tracking (warmup/cooldown)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleSetToggle = (setIndex: number) => {
    const currentSet = sets[setIndex]
    
    if (currentSet.completed) {
      // Uncomplete the set
      setSets(prev => prev.map((set, i) => 
        i === setIndex ? { ...set, completed: false, actualWeight: undefined, actualReps: undefined } : set
      ))
      onSetUncomplete(setIndex)
    } else {
      // Mark as completed - this will show the input fields
      setSets(prev => prev.map((set, i) => 
        i === setIndex ? { ...set, completed: true } : set
      ))
    }
  }

  const handleWeightChange = (setIndex: number, weight: string) => {
    const weightNum = parseFloat(weight) || 0
    setSets(prev => prev.map((set, i) => 
      i === setIndex ? { ...set, actualWeight: weightNum } : set
    ))
  }

  const handleRepsChange = (setIndex: number, reps: string) => {
    const repsNum = parseInt(reps) || 0
    setSets(prev => prev.map((set, i) => 
      i === setIndex ? { ...set, actualReps: repsNum } : set
    ))
  }

  const handleSetSave = async (setIndex: number) => {
    const set = sets[setIndex]
    if (set.actualWeight && set.actualReps) {
      // Check for PR if callback is provided
      if (onPBCheck) {
        try {
          const pbResult = await onPBCheck(exercise.name, set.actualWeight, set.actualReps)
          if (pbResult.isPB) {
            // Update the set with PR information
            setSets(prev => prev.map((s, i) => 
              i === setIndex ? { ...s, isPB: true, pbType: pbResult.pbType } : s
            ))
          }
        } catch (error) {
          console.error('Error checking for PR:', error)
        }
      }
      
      onSetComplete(setIndex, set.actualWeight, set.actualReps)
    }
  }

  // Handle simple completion toggle for warmup/cooldown
  const handleSimpleCompletionToggle = () => {
    const newCompletedState = !isCompleted
    setIsCompleted(newCompletedState)
    
    if (newCompletedState) {
      // Mark as completed - call onSetComplete with dummy values for warmup/cooldown
      onSetComplete(0, 0, 1) // Weight 0, Reps 1 to indicate completion
    } else {
      // Mark as not completed
      onSetUncomplete(0)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
        <div className="text-sm text-gray-600">
          {exercise.category && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
              {exercise.category}
            </span>
          )}
        </div>
      </div>

      {/* Planned Performance */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Planned Performance</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Sets: {exercise.sets}</div>
          <div>Reps: {exercise.reps}</div>
          {exercise.rest && <div>Rest: {exercise.rest}</div>}
          {exercise.weight && <div>Weight: {exercise.weight}</div>}
          {exercise.rpe && <div>RPE: {exercise.rpe}/10</div>}
          {exercise.tempo && <div>Tempo: {exercise.tempo}</div>}
        </div>
        {exercise.notes && (
          <div className="mt-2 text-sm text-blue-700 italic">
            Notes: {exercise.notes}
          </div>
        )}
      </div>

      {/* Conditional Rendering: Simple Completion vs Set Tracking */}
      {isWarmupOrCooldown ? (
        // Simple completion checkbox for warmup/cooldown exercises
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Mark as Completed</h4>
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Exercise completed:
              </span>
              <button
                onClick={handleSimpleCompletionToggle}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>
            </div>
            {isCompleted && (
              <span className="text-sm text-green-600 font-medium">✓ Completed</span>
            )}
          </div>
        </div>
      ) : (
        // Full set tracking for regular exercises
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Track Your Sets</h4>
          {sets.map((set, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              {/* Set Number and Checkbox */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                  Set {index + 1}:
                </span>
                <button
                  onClick={() => handleSetToggle(index)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    set.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {set.completed ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>

                {/* Quick Log Button - appears when set is not completed and planned values exist */}
                {!set.completed && exercise.weight && exercise.reps && (
                  <button
                    onClick={() => {
                      const plannedWeight = exercise.weight ? 
                        (typeof exercise.weight === 'string' ? parseFloat(exercise.weight) || 0 : exercise.weight) : 0
                      const plannedReps = typeof exercise.reps === 'string' ? 
                        parseInt(exercise.reps) || 0 : exercise.reps
                      
                      // First mark the set as completed to show input fields
                      setSets(prev => prev.map((s, i) => 
                        i === index ? { 
                          ...s, 
                          completed: true, 
                          actualWeight: plannedWeight, 
                          actualReps: plannedReps 
                        } : s
                      ))
                      // Then automatically save the set after a brief delay to allow state update
                      setTimeout(async () => {
                        if (onPBCheck) {
                          try {
                            const pbResult = await onPBCheck(exercise.name, plannedWeight, plannedReps)
                            if (pbResult.isPB) {
                              setSets(prev => prev.map((s, i) => 
                                i === index ? { ...s, isPB: true, pbType: pbResult.pbType } : s
                              ))
                            }
                          } catch (error) {
                            console.error('Error checking for PR:', error)
                          }
                        }
                        onSetComplete(index, plannedWeight, plannedReps)
                      }, 100)
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                    title={`Quick log: ${exercise.weight} × ${exercise.reps}`}
                  >
                    Quick Log
                  </button>
                )}
              </div>

              {/* Input Fields (shown when set is marked complete) */}
              {set.completed && (
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`weight-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
                      Weight:
                    </Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      placeholder="0"
                      value={set.actualWeight || ''}
                      onChange={(e) => handleWeightChange(index, e.target.value)}
                      className="w-20 h-8 text-sm"
                      step="0.5"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`reps-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
                      Reps:
                    </Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      placeholder="0"
                      value={set.actualReps || ''}
                      onChange={(e) => handleRepsChange(index, e.target.value)}
                      className="w-16 h-8 text-sm"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={() => handleSetSave(index)}
                    disabled={!set.actualWeight || !set.actualReps}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  
                  {/* PR Celebration */}
                  {set.isPB && (
                    <div className="flex items-center space-x-2 animate-bounce">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                        🏆 New PR!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          {isWarmupOrCooldown ? (
            <span className="text-gray-600">
              Status: {isCompleted ? 'Completed' : 'Not completed'}
            </span>
          ) : (
            <span className="text-gray-600">
              Progress: {sets.filter(s => s.completed && s.actualWeight && s.actualReps).length}/{exercise.sets} sets
            </span>
          )}
          <div className="flex space-x-1">
            {isWarmupOrCooldown ? (
              <div
                className={`w-3 h-3 rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ) : (
              sets.map((set, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    set.completed && set.actualWeight && set.actualReps
                      ? 'bg-green-500'
                      : set.completed
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 