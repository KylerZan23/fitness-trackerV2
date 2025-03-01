'use client'

import { useState } from 'react'
import { MuscleGroup, Exercise, getExercisesByMuscleGroup, COMMON_EXERCISES } from '@/lib/types'

interface ExerciseSelectorProps {
  selectedMuscleGroup: MuscleGroup | null;
  onSelectExercise: (exerciseName: string) => void;
}

export function ExerciseSelector({
  selectedMuscleGroup,
  onSelectExercise,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get exercises based on selected muscle group or search query
  const exercises = selectedMuscleGroup 
    ? getExercisesByMuscleGroup(selectedMuscleGroup)
    : COMMON_EXERCISES;

  // Filter exercises by search query if present
  const filteredExercises = searchQuery
    ? exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : exercises;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Select an Exercise</h2>
      
      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder:text-gray-500"
        />
      </div>
      
      {/* Exercise list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <button
              key={exercise.name}
              onClick={() => onSelectExercise(exercise.name)}
              className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
            >
              <div className="font-medium text-white group-hover:text-white">{exercise.name}</div>
              {exercise.description && (
                <div className="text-sm text-gray-400 mt-1">{exercise.description}</div>
              )}
              <div className="text-xs text-primary mt-2">{exercise.muscleGroup}</div>
            </button>
          ))
        ) : (
          <div className="col-span-full text-center py-6 text-gray-400">
            No exercises found. Try a different search or muscle group.
          </div>
        )}
      </div>
    </div>
  )
} 