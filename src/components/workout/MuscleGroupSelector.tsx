'use client'

import { useState } from 'react'
import { MuscleGroup, getAllMuscleGroups } from '@/lib/types'

interface MuscleGroupSelectorProps {
  selectedMuscleGroup: MuscleGroup | null;
  onSelectMuscleGroup: (muscleGroup: MuscleGroup | null) => void;
}

export function MuscleGroupSelector({
  selectedMuscleGroup,
  onSelectMuscleGroup,
}: MuscleGroupSelectorProps) {
  const muscleGroups = getAllMuscleGroups();
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-white mb-3">Filter by Muscle Group</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectMuscleGroup(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedMuscleGroup === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          All Exercises
        </button>
        
        {muscleGroups.map((muscleGroup) => (
          <button
            key={muscleGroup}
            onClick={() => onSelectMuscleGroup(muscleGroup)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedMuscleGroup === muscleGroup
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {muscleGroup}
          </button>
        ))}
      </div>
    </div>
  )
} 