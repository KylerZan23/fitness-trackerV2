/**
 * Strength calculation utilities for e1RM estimation and workout analysis
 * Provides multiple 1-rep max formulas and data aggregation functions
 */

import { format, subDays, isAfter } from 'date-fns'

// Workout data interface for calculations
export interface WorkoutData {
  id?: string
  exercise_name: string
  sets: number
  reps: number
  weight: number
  created_at: string
  muscle_group?: string
  notes?: string
}

// e1RM calculation result
export interface E1RMResult {
  value: number
  formula: string
  confidence: 'high' | 'medium' | 'low'
  date: string
}

// Strength progression data point
export interface StrengthDataPoint {
  date: string
  e1rm: number
  workout: WorkoutData
  formula: string
}

// Supported e1RM calculation formulas
export type E1RMFormula = 'epley' | 'brzycki' | 'mcglothin' | 'lombardi'

/**
 * Calculate estimated 1-rep max using various formulas
 * @param weight - Weight lifted
 * @param reps - Number of repetitions performed
 * @param formula - Formula to use for calculation
 * @returns Calculated e1RM value
 */
export function calculateE1RM(
  weight: number, 
  reps: number, 
  formula: E1RMFormula = 'epley'
): number {
  // If already 1 rep, return the weight
  if (reps === 1) return weight
  
  // Validate inputs
  if (weight <= 0 || reps <= 0 || reps > 20) {
    throw new Error('Invalid weight or rep count for e1RM calculation')
  }
  
  switch (formula) {
    case 'epley':
      // Most common formula: weight × (1 + 0.0333 × reps)
      return weight * (1 + 0.0333 * reps)
    
    case 'brzycki':
      // Alternative formula: weight × (36 / (37 - reps))
      if (reps >= 37) return weight * 10 // Fallback for high reps
      return weight * (36 / (37 - reps))
    
    case 'mcglothin':
      // McGlothin formula: weight × (100 / (101.3 - 2.67123 × reps))
      const denominator = 101.3 - (2.67123 * reps)
      if (denominator <= 0) return weight * 5 // Fallback
      return weight * (100 / denominator)
    
    case 'lombardi':
      // Lombardi formula: weight × (reps^0.10)
      return weight * Math.pow(reps, 0.10)
    
    default:
      return calculateE1RM(weight, reps, 'epley')
  }
}

/**
 * Calculate e1RM with confidence scoring based on rep range
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @param formula - Formula to use
 * @returns E1RM result with confidence level
 */
export function calculateE1RMWithConfidence(
  weight: number,
  reps: number,
  formula: E1RMFormula = 'epley'
): { value: number; confidence: 'high' | 'medium' | 'low' } {
  const e1rm = calculateE1RM(weight, reps, formula)
  
  // Confidence based on rep range (lower reps = higher confidence)
  let confidence: 'high' | 'medium' | 'low'
  if (reps >= 1 && reps <= 5) {
    confidence = 'high'
  } else if (reps >= 6 && reps <= 10) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  return { value: e1rm, confidence }
}

/**
 * Find the best e1RM estimate from multiple workouts for the same exercise
 * @param workouts - Array of workout data for a specific exercise
 * @param preferredFormula - Preferred calculation formula
 * @returns Best e1RM estimate with metadata
 */
export function getBestE1RMEstimate(
  workouts: WorkoutData[],
  preferredFormula: E1RMFormula = 'epley'
): E1RMResult | null {
  if (workouts.length === 0) return null
  
  // Calculate e1RM for each workout
  const estimates = workouts.map(workout => {
    const { value, confidence } = calculateE1RMWithConfidence(
      workout.weight,
      workout.reps,
      preferredFormula
    )
    
    return {
      value,
      confidence,
      date: workout.created_at,
      workout,
      formula: preferredFormula
    }
  })
  
  // Sort by confidence (high > medium > low) and then by date (recent first)
  estimates.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    
    if (confidenceDiff !== 0) return confidenceDiff
    
    // If same confidence, prefer more recent
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  
  const best = estimates[0]
  return {
    value: Math.round(best.value * 10) / 10, // Round to 1 decimal
    formula: best.formula,
    confidence: best.confidence,
    date: best.date
  }
}

/**
 * Calculate strength progression timeline for a specific exercise
 * @param workouts - Workout history for an exercise
 * @param formula - e1RM calculation formula
 * @returns Array of strength progression data points
 */
export function calculateStrengthProgression(
  workouts: WorkoutData[],
  formula: E1RMFormula = 'epley'
): StrengthDataPoint[] {
  if (workouts.length === 0) return []
  
  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  // Calculate e1RM for each workout and create data points
  return sortedWorkouts.map(workout => {
    const e1rm = calculateE1RM(workout.weight, workout.reps, formula)
    
    return {
      date: format(new Date(workout.created_at), 'yyyy-MM-dd'),
      e1rm: Math.round(e1rm * 10) / 10,
      workout,
      formula
    }
  })
}

/**
 * Calculate 7-day total volume (weight × sets × reps)
 * @param workouts - All workout data
 * @param weightUnit - User's preferred weight unit
 * @returns Total volume for the last 7 days
 */
export function calculate7DayVolume(
  workouts: WorkoutData[],
  weightUnit: 'kg' | 'lbs' = 'kg'
): { value: number; unit: string } {
  const sevenDaysAgo = subDays(new Date(), 7)
  
  const recentWorkouts = workouts.filter(workout => 
    isAfter(new Date(workout.created_at), sevenDaysAgo)
  )
  
  const totalVolume = recentWorkouts.reduce((total, workout) => {
    return total + (workout.sets * workout.reps * workout.weight)
  }, 0)
  
  return {
    value: Math.round(totalVolume),
    unit: weightUnit
  }
}

/**
 * Onboarding strength data interface
 */
export interface OnboardingStrengthData {
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
  strengthAssessmentType?: 'actual_1rm' | 'estimated_1rm' | 'unsure'
}

/**
 * Get current strength levels for major compound lifts, combining workout history with onboarding data
 * @param allWorkouts - Complete workout history
 * @param onboardingData - Strength data from onboarding
 * @param exerciseMapping - Optional custom exercise name mapping
 * @returns Object with current e1RM for each major lift
 */
export function getCurrentStrengthLevelsWithOnboarding(
  allWorkouts: WorkoutData[],
  onboardingData?: OnboardingStrengthData,
  exerciseMapping?: Record<string, string>
): Record<string, E1RMResult | null> {
  // Get the workout-based strength levels first
  const workoutBasedLevels = getCurrentStrengthLevels(allWorkouts, exerciseMapping)
  
  // If we have no onboarding data, return workout-based levels
  if (!onboardingData) {
    return workoutBasedLevels
  }
  
  // If we have complete workout data for all lifts, prefer that over onboarding
  if (
    workoutBasedLevels.squat && 
    workoutBasedLevels.bench && 
    workoutBasedLevels.deadlift && 
    workoutBasedLevels.overhead_press
  ) {
    return workoutBasedLevels
  }
  
  // Fill in missing data with onboarding estimates
  const result = { ...workoutBasedLevels }
  
  // Map onboarding fields to lift types
  const onboardingMapping = {
    squat: onboardingData.squat1RMEstimate,
    bench: onboardingData.benchPress1RMEstimate,
    deadlift: onboardingData.deadlift1RMEstimate,
    overhead_press: onboardingData.overheadPress1RMEstimate,
  }
  
  // Determine confidence based on assessment type
  const getOnboardingConfidence = (): 'high' | 'medium' | 'low' => {
    switch (onboardingData.strengthAssessmentType) {
      case 'actual_1rm': return 'high'
      case 'estimated_1rm': return 'medium'
      case 'unsure': return 'low'
      default: return 'medium'
    }
  }
  
  const onboardingConfidence = getOnboardingConfidence()
  const onboardingDate = new Date().toISOString() // Use current date for onboarding estimates
  
  // Fill in missing lifts with onboarding data
  Object.entries(onboardingMapping).forEach(([liftType, onboardingValue]) => {
    if (!result[liftType] && onboardingValue && onboardingValue > 0) {
      result[liftType] = {
        value: onboardingValue,
        formula: 'onboarding_estimate',
        confidence: onboardingConfidence,
        date: onboardingDate
      }
    }
  })
  
  return result
}

/**
 * Get current e1RM for major lifts (Squat, Bench, Deadlift, OHP)
 * @param allWorkouts - All workout data
 * @param exerciseMapping - Mapping of exercise names to standard lift names
 * @returns Object with current e1RM for each major lift
 */
export function getCurrentStrengthLevels(
  allWorkouts: WorkoutData[],
  exerciseMapping?: Record<string, string>
): Record<string, E1RMResult | null> {
  // Default exercise name mappings
  const defaultMapping = {
    // Squat variations
    'back squat': 'squat',
    'front squat': 'squat',
    'squat': 'squat',
    'barbell squat': 'squat',
    
    // Bench variations
    'bench press': 'bench',
    'barbell bench press': 'bench',
    'bench': 'bench',
    'flat bench press': 'bench',
    
    // Deadlift variations
    'deadlift': 'deadlift',
    'conventional deadlift': 'deadlift',
    'sumo deadlift': 'deadlift',
    'barbell deadlift': 'deadlift',
    
    // Overhead press variations
    'overhead press': 'overhead_press',
    'military press': 'overhead_press',
    'standing press': 'overhead_press',
    'shoulder press': 'overhead_press',
    'ohp': 'overhead_press'
  }
  
  const mapping = exerciseMapping || defaultMapping
  
  // Group workouts by lift type
  const liftGroups: Record<string, WorkoutData[]> = {
    squat: [],
    bench: [],
    deadlift: [],
    overhead_press: []
  }
  
  // Categorize workouts
  allWorkouts.forEach(workout => {
    const exerciseName = workout.exercise_name.toLowerCase()
    const liftType = mapping[exerciseName as keyof typeof mapping]
    
    if (liftType && liftGroups[liftType]) {
      liftGroups[liftType].push(workout)
    }
  })
  
  // Calculate current e1RM for each lift
  const results: Record<string, E1RMResult | null> = {}
  
  Object.entries(liftGroups).forEach(([liftType, workouts]) => {
    // Only use workouts from the last 90 days for "current" strength
    const recentWorkouts = workouts.filter(workout => 
      isAfter(new Date(workout.created_at), subDays(new Date(), 90))
    )
    
    results[liftType] = getBestE1RMEstimate(recentWorkouts)
  })
  
  return results
}

/**
 * Calculate strength trends (improving, declining, stable)
 * @param progressionData - Strength progression timeline
 * @param windowDays - Number of days to compare (default 30)
 * @returns Trend analysis
 */
export function calculateStrengthTrend(
  progressionData: StrengthDataPoint[],
  windowDays: number = 30
): { trend: 'improving' | 'declining' | 'stable'; changePercent: number } {
  if (progressionData.length < 2) {
    return { trend: 'stable', changePercent: 0 }
  }
  
  const cutoffDate = subDays(new Date(), windowDays)
  const recentData = progressionData.filter(point => 
    isAfter(new Date(point.date), cutoffDate)
  )
  
  if (recentData.length < 2) {
    return { trend: 'stable', changePercent: 0 }
  }
  
  const firstValue = recentData[0].e1rm
  const lastValue = recentData[recentData.length - 1].e1rm
  
  const changePercent = ((lastValue - firstValue) / firstValue) * 100
  
  let trend: 'improving' | 'declining' | 'stable'
  if (changePercent > 2) {
    trend = 'improving'
  } else if (changePercent < -2) {
    trend = 'declining'
  } else {
    trend = 'stable'
  }
  
  return {
    trend,
    changePercent: Math.round(changePercent * 10) / 10
  }
}

/**
 * Validate workout data for e1RM calculations
 * @param workout - Workout data to validate
 * @returns Whether the workout is valid for calculations
 */
export function isValidWorkoutForE1RM(workout: WorkoutData): boolean {
  return (
    workout.weight > 0 &&
    workout.reps > 0 &&
    workout.reps <= 20 &&
    workout.sets > 0 &&
    workout.exercise_name.trim().length > 0
  )
}

/**
 * Format e1RM value for display
 * @param value - e1RM value
 * @param weightUnit - Weight unit
 * @returns Formatted string
 */
export function formatE1RM(value: number, weightUnit: 'kg' | 'lbs'): string {
  return `${Math.round(value)} ${weightUnit}`
}

/**
 * Get exercise-specific rep range recommendations based on e1RM
 * @param e1rm - Estimated 1-rep max
 * @param repRange - Target rep range
 * @returns Recommended weight range
 */
export function getWeightRecommendation(
  e1rm: number,
  repRange: '1-5' | '6-12' | '12+'
): { min: number; max: number } {
  switch (repRange) {
    case '1-5':
      return {
        min: Math.round(e1rm * 0.85),
        max: Math.round(e1rm * 0.95)
      }
    case '6-12':
      return {
        min: Math.round(e1rm * 0.65),
        max: Math.round(e1rm * 0.80)
      }
    case '12+':
      return {
        min: Math.round(e1rm * 0.50),
        max: Math.round(e1rm * 0.65)
      }
    default:
      return {
        min: Math.round(e1rm * 0.70),
        max: Math.round(e1rm * 0.85)
      }
  }
} 