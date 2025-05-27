// Muscle group definitions for categorizing exercises
export enum MuscleGroup {
  LEGS = 'Legs',
  CHEST = 'Chest',
  BACK = 'Back',
  SHOULDERS = 'Shoulders',
  ARMS = 'Arms',
  CORE = 'Core',
  CARDIO = 'Cardio',
  OTHER = 'Other',
}

// Exercise definitions with their associated muscle groups
export interface Exercise {
  name: string
  muscleGroup: MuscleGroup
  description?: string
}

// Dictionary of common exercises organized by muscle group
export const COMMON_EXERCISES: Exercise[] = [
  // Legs
  {
    name: 'Squats',
    muscleGroup: MuscleGroup.LEGS,
    description: 'Compound leg exercise targeting quads, hamstrings, and glutes',
  },
  { name: 'Front Squats', muscleGroup: MuscleGroup.LEGS },
  { name: 'Goblet Squats', muscleGroup: MuscleGroup.LEGS },
  { name: 'Lunges', muscleGroup: MuscleGroup.LEGS },
  { name: 'Forward Lunges', muscleGroup: MuscleGroup.LEGS },
  { name: 'Reverse Lunges', muscleGroup: MuscleGroup.LEGS },
  { name: 'Walking Lunges', muscleGroup: MuscleGroup.LEGS },
  { name: 'Leg Press', muscleGroup: MuscleGroup.LEGS },
  {
    name: 'Deadlifts',
    muscleGroup: MuscleGroup.LEGS,
    description: 'Compound exercise targeting posterior chain',
  },
  { name: 'Sumo Deadlifts', muscleGroup: MuscleGroup.LEGS },
  { name: 'Hamstring Curls', muscleGroup: MuscleGroup.LEGS },
  { name: 'Calf Raises', muscleGroup: MuscleGroup.LEGS },
  { name: 'Hip Thrusts', muscleGroup: MuscleGroup.LEGS },

  // Chest
  {
    name: 'Bench Press',
    muscleGroup: MuscleGroup.CHEST,
    description: 'Compound pushing exercise targeting chest, shoulders, and triceps',
  },
  { name: 'Incline Bench Press', muscleGroup: MuscleGroup.CHEST },
  { name: 'Decline Bench Press', muscleGroup: MuscleGroup.CHEST },
  { name: 'Dumbbell Press', muscleGroup: MuscleGroup.CHEST },
  { name: 'Chest Fly', muscleGroup: MuscleGroup.CHEST },
  { name: 'Cable Fly', muscleGroup: MuscleGroup.CHEST },
  { name: 'Push-Ups', muscleGroup: MuscleGroup.CHEST },

  // Back
  {
    name: 'Pull-Ups',
    muscleGroup: MuscleGroup.BACK,
    description: 'Compound pulling exercise targeting lats and biceps',
  },
  { name: 'Chin-Ups', muscleGroup: MuscleGroup.BACK },
  { name: 'Lat Pulldowns', muscleGroup: MuscleGroup.BACK },
  { name: 'Bent-Over Rows', muscleGroup: MuscleGroup.BACK },
  { name: 'Dumbbell Rows', muscleGroup: MuscleGroup.BACK },
  { name: 'Seated Cable Rows', muscleGroup: MuscleGroup.BACK },
  { name: 'Romanian Deadlift', muscleGroup: MuscleGroup.BACK },

  // Shoulders
  {
    name: 'Overhead Press',
    muscleGroup: MuscleGroup.SHOULDERS,
    description: 'Compound pressing exercise for deltoids',
  },
  { name: 'Arnold Press', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Lateral Raises', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Front Raises', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Rear Delt Raises', muscleGroup: MuscleGroup.SHOULDERS },
  { name: 'Upright Rows', muscleGroup: MuscleGroup.SHOULDERS },

  // Arms
  {
    name: 'Bicep Curls',
    muscleGroup: MuscleGroup.ARMS,
    description: 'Isolation exercise for biceps',
  },
  { name: 'Hammer Curls', muscleGroup: MuscleGroup.ARMS },
  { name: 'Preacher Curls', muscleGroup: MuscleGroup.ARMS },
  { name: 'Tricep Dips', muscleGroup: MuscleGroup.ARMS },
  { name: 'Skull Crushers', muscleGroup: MuscleGroup.ARMS },
  { name: 'Tricep Pushdowns', muscleGroup: MuscleGroup.ARMS },
  { name: 'Close-Grip Bench Press', muscleGroup: MuscleGroup.ARMS },

  // Core
  { name: 'Planks', muscleGroup: MuscleGroup.CORE, description: 'Core stability exercise' },
  { name: 'Crunches', muscleGroup: MuscleGroup.CORE },
  { name: 'Sit-Ups', muscleGroup: MuscleGroup.CORE },
  { name: 'Russian Twists', muscleGroup: MuscleGroup.CORE },
  { name: 'Hanging Leg Raises', muscleGroup: MuscleGroup.CORE },
  { name: 'Cable Woodchops', muscleGroup: MuscleGroup.CORE },

  // Cardio
  { name: 'Running', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Cycling', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Jumping Rope', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Rowing', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Swimming', muscleGroup: MuscleGroup.CARDIO },
  { name: 'Stair Climber', muscleGroup: MuscleGroup.CARDIO },
]

// Helper function to get exercises by muscle group
export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return COMMON_EXERCISES.filter(exercise => exercise.muscleGroup === muscleGroup)
}

// Helper function to get all unique muscle groups
export function getAllMuscleGroups(): MuscleGroup[] {
  return Object.values(MuscleGroup)
}

// Helper function to find a muscle group for a given exercise name
export function findMuscleGroupForExercise(exerciseName: string): MuscleGroup {
  const exercise = COMMON_EXERCISES.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())
  return exercise?.muscleGroup || MuscleGroup.OTHER
}

// Represents a goal returned from the DB with calculated progress
export interface GoalWithProgress {
  id: string // uuid
  user_id: string // uuid
  metric_type: string
  target_value: number // numeric
  target_unit: string | null
  time_period: string
  start_date: string // timestamp with time zone (ISO string)
  end_date: string // timestamp with time zone (ISO string)
  label: string | null
  is_active: boolean
  created_at: string // timestamp with time zone (ISO string)
  updated_at: string // timestamp with time zone (ISO string)
  current_value: number // numeric (calculated)
}
