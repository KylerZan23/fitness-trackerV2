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

// Helper function to calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Helper function to find best fuzzy match
function findBestFuzzyMatch(exerciseName: string): { muscleGroup: MuscleGroup; confidence: number } | null {
  const normalizedInput = exerciseName.toLowerCase().trim()
  let bestMatch = { muscleGroup: MuscleGroup.OTHER, confidence: 0 }
  
  for (const exercise of COMMON_EXERCISES) {
    const normalizedExercise = exercise.name.toLowerCase()
    const distance = levenshteinDistance(normalizedInput, normalizedExercise)
    const maxLength = Math.max(normalizedInput.length, normalizedExercise.length)
    const confidence = 1 - (distance / maxLength)
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { muscleGroup: exercise.muscleGroup, confidence }
    }
  }
  
  return bestMatch.confidence > 0.7 ? bestMatch : null
}

// Comprehensive keyword patterns for muscle group categorization
const MUSCLE_GROUP_KEYWORDS = {
  [MuscleGroup.LEGS]: [
    // Primary leg movements
    'squat', 'lunge', 'leg press', 'deadlift', 'hip thrust', 'glute bridge',
    // Specific muscle targets
    'quad', 'hamstring', 'glute', 'calf', 'adductor', 'abductor',
    // Movement patterns
    'step up', 'step-up', 'split squat', 'bulgarian', 'pistol squat',
    // Equipment variations
    'leg curl', 'leg extension', 'hack squat', 'front squat', 'goblet squat',
    // Posterior chain - specific deadlift variations
    'romanian deadlift', 'romanian deadlifts', 'rdl', 'good morning', 'single leg deadlift', 'sumo deadlift'
  ],
  [MuscleGroup.CHEST]: [
    // Primary chest movements
    'bench press', 'chest press', 'push up', 'push-up', 'pushup',
    // Variations
    'incline', 'decline', 'flat bench', 'dumbbell press', 'barbell press',
    // Isolation movements
    'fly', 'flye', 'pec fly', 'chest fly', 'cable fly',
    // Equipment specific
    'machine press', 'dumbbell bench', 'cable press'
  ],
  [MuscleGroup.BACK]: [
    // Vertical pulling
    'pull up', 'pull-up', 'pullup', 'chin up', 'chin-up', 'chinup',
    'lat pulldown', 'pulldown',
    // Horizontal pulling
    'row', 'bent over row', 'bent-over row', 'seated row', 'cable row',
    'dumbbell row', 'barbell row', 't-bar row', 'chest supported row',
    // Posterior chain (more specific terms)
    'romanian deadlift', 'rdl', 'rack pull',
    // Specific muscles
    'lat', 'latissimus', 'rhomboid', 'middle trap', 'rear delt'
  ],
  [MuscleGroup.SHOULDERS]: [
    // Overhead pressing
    'overhead press', 'shoulder press', 'military press', 'strict press',
    'arnold press', 'dumbbell press', 'seated press', 'standing press',
    // Lateral movements
    'lateral raise', 'side raise', 'lateral fly', 'side fly',
    // Front movements
    'front raise', 'front delt', 'anterior delt',
    // Rear movements
    'rear delt', 'rear fly', 'reverse fly', 'face pull',
    // Other shoulder movements
    'upright row', 'shrug', 'handstand push up', 'pike push up'
  ],
  [MuscleGroup.ARMS]: [
    // Biceps
    'bicep curl', 'biceps curl', 'curl', 'hammer curl', 'preacher curl',
    'concentration curl', 'barbell curl', 'dumbbell curl', 'cable curl',
    'chin up', 'chin-up', 'chinup',
    // Triceps
    'tricep', 'triceps', 'dip', 'skull crusher', 'lying tricep', 'overhead tricep',
    'tricep pushdown', 'tricep extension', 'close grip', 'close-grip',
    'diamond push up', 'diamond pushup', 'tricep dip',
    // General arm
    'arm', 'brachialis', 'forearm'
  ],
  [MuscleGroup.CORE]: [
    // Planks
    'plank', 'side plank', 'front plank', 'elbow plank',
    // Crunches and sit-ups
    'crunch', 'sit up', 'sit-up', 'situp', 'bicycle crunch',
    // Rotation movements
    'russian twist', 'wood chop', 'woodchop', 'cable twist', 'oblique',
    // Hanging movements
    'hanging leg raise', 'hanging knee raise', 'toes to bar',
    // Other core
    'dead bug', 'bird dog', 'mountain climber', 'ab wheel', 'hollow body',
    'v-up', 'toe touch', 'leg raise', 'knee raise'
  ],
  [MuscleGroup.CARDIO]: [
    // Running
    'run', 'jog', 'sprint', 'treadmill', 'incline walk',
    // Cycling
    'bike', 'cycle', 'cycling', 'stationary bike', 'spin',
    // Rowing
    'row', 'rowing', 'rower', 'erg',
    // Jumping
    'jump', 'jumping jack', 'burpee', 'jump rope', 'box jump',
    // Swimming
    'swim', 'swimming', 'freestyle', 'backstroke',
    // Other cardio
    'elliptical', 'stair climber', 'step up', 'step ups', 'cardio',
    'hiit', 'conditioning', 'metabolic', 'circuit'
  ]
}

// Enhanced keyword-based categorization
function categorizeByKeywords(exerciseName: string): MuscleGroup {
  const normalizedName = exerciseName.toLowerCase().trim()
  
  // Score each muscle group based on keyword matches
  const scores: Record<MuscleGroup, number> = {
    [MuscleGroup.LEGS]: 0,
    [MuscleGroup.CHEST]: 0,
    [MuscleGroup.BACK]: 0,
    [MuscleGroup.SHOULDERS]: 0,
    [MuscleGroup.ARMS]: 0,
    [MuscleGroup.CORE]: 0,
    [MuscleGroup.CARDIO]: 0,
    [MuscleGroup.OTHER]: 0,
  }
  
  // Check each muscle group's keywords - process longer keywords first
  Object.entries(MUSCLE_GROUP_KEYWORDS).forEach(([muscleGroup, keywords]) => {
    const group = muscleGroup as MuscleGroup
    // Sort keywords by length (longest first) to prioritize more specific matches
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)
    
    sortedKeywords.forEach(keyword => {
      if (normalizedName.includes(keyword.toLowerCase())) {
        // Give more weight to longer, more specific keywords
        const weight = keyword.length > 10 ? 5 : keyword.length > 8 ? 4 : keyword.length > 5 ? 3 : 2
        scores[group] += weight
      }
    })
  })
  
  // Find the muscle group with the highest score
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return MuscleGroup.OTHER
  
  const bestGroup = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as MuscleGroup
  return bestGroup || MuscleGroup.OTHER
}

// Enhanced helper function to find a muscle group for a given exercise name
export function findMuscleGroupForExercise(exerciseName: string): MuscleGroup {
  if (!exerciseName || exerciseName.trim() === '') {
    return MuscleGroup.OTHER
  }
  
  // Layer 1: Exact match (preserve existing functionality)
  const exactMatch = COMMON_EXERCISES.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase())
  if (exactMatch) {
    return exactMatch.muscleGroup
  }
  
  // Layer 2: Fuzzy similarity matching
  const fuzzyMatch = findBestFuzzyMatch(exerciseName)
  if (fuzzyMatch && fuzzyMatch.confidence > 0.8) {
    return fuzzyMatch.muscleGroup
  }
  
  // Layer 3: Keyword-based pattern matching
  return categorizeByKeywords(exerciseName)
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
