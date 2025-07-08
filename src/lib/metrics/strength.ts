/**
 * Strength metrics utilities for calculating e1RM and related strength data
 * Uses the Brzycki formula for reliable 1-rep max estimation
 */

/**
 * Calculate estimated 1-rep max using the Brzycki formula
 * Formula: weight / (1.0278 - 0.0278 * reps)
 * 
 * @param weight - Weight lifted in any unit (kg/lbs)
 * @param reps - Number of repetitions performed
 * @returns Estimated 1-rep max in the same unit as input weight
 */
export function calculateE1RM(weight: number, reps: number): number {
  // Input validation
  if (weight <= 0) {
    throw new Error('Weight must be greater than 0')
  }
  
  if (reps <= 0) {
    throw new Error('Repetitions must be greater than 0')
  }
  
  // If already 1 rep, return the weight (actual 1RM)
  if (reps === 1) {
    return weight
  }
  
  // Cap repetitions at 12 for reliability
  // The Brzycki formula becomes less accurate beyond 12 reps
  const cappedReps = Math.min(reps, 12)
  
  // Brzycki formula: weight / (1.0278 - 0.0278 * reps)
  const denominator = 1.0278 - (0.0278 * cappedReps)
  
  // Safety check to prevent division by zero or negative denominators
  if (denominator <= 0) {
    // This should theoretically never happen with capped reps, but safety first
    return weight * 1.5 // Conservative fallback
  }
  
  const e1rm = weight / denominator
  
  // Round to 1 decimal place for practical use
  return Math.round(e1rm * 10) / 10
}

/**
 * Calculate e1RM with confidence level based on rep range
 * Lower rep ranges provide more accurate estimates
 * 
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @returns Object with e1RM value and confidence level
 */
export function calculateE1RMWithConfidence(
  weight: number, 
  reps: number
): { e1rm: number; confidence: 'high' | 'medium' | 'low' } {
  const e1rm = calculateE1RM(weight, reps)
  
  let confidence: 'high' | 'medium' | 'low'
  
  if (reps >= 1 && reps <= 3) {
    confidence = 'high'    // Very reliable for low reps
  } else if (reps >= 4 && reps <= 8) {
    confidence = 'medium'  // Good reliability for moderate reps
  } else {
    confidence = 'low'     // Less reliable for high reps (9-12)
  }
  
  return { e1rm, confidence }
}

/**
 * Validate if workout data is suitable for e1RM calculation
 * 
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @returns True if data is valid for e1RM calculation
 */
export function isValidForE1RM(weight: number, reps: number): boolean {
  return weight > 0 && reps > 0 && reps <= 20 // Extended range but with lower confidence
}

/**
 * Calculate training percentages based on e1RM
 * Useful for programming training loads
 * 
 * @param e1rm - Estimated 1-rep max
 * @returns Object with various training percentages
 */
export function getTrainingPercentages(e1rm: number) {
  return {
    light: Math.round(e1rm * 0.65),      // 65% - 12-15 reps
    moderate: Math.round(e1rm * 0.75),   // 75% - 8-12 reps  
    heavy: Math.round(e1rm * 0.85),      // 85% - 3-6 reps
    maxEffort: Math.round(e1rm * 0.95),  // 95% - 1-3 reps
  }
}

/**
 * Compare e1RM values and calculate improvement percentage
 * 
 * @param currentE1RM - Current estimated 1RM
 * @param previousE1RM - Previous estimated 1RM
 * @returns Improvement percentage (positive for improvement, negative for decline)
 */
export function calculateImprovement(currentE1RM: number, previousE1RM: number): number {
  if (previousE1RM <= 0) {
    return 0 // Cannot calculate improvement without baseline
  }
  
  const improvement = ((currentE1RM - previousE1RM) / previousE1RM) * 100
  return Math.round(improvement * 10) / 10 // Round to 1 decimal place
}

/**
 * Find the best e1RM from multiple workout sessions
 * Prioritizes higher confidence estimates when e1RM values are close
 * 
 * @param workouts - Array of workout data with weight and reps
 * @returns Best e1RM estimate with metadata
 */
export function getBestE1RM(
  workouts: Array<{ weight: number; reps: number; date?: string }>
): { e1rm: number; confidence: 'high' | 'medium' | 'low'; source: { weight: number; reps: number } } | null {
  if (workouts.length === 0) {
    return null
  }
  
  // Calculate e1RM with confidence for each workout
  const estimates = workouts
    .filter(w => isValidForE1RM(w.weight, w.reps))
    .map(workout => {
      const { e1rm, confidence } = calculateE1RMWithConfidence(workout.weight, workout.reps)
      return {
        e1rm,
        confidence,
        source: { weight: workout.weight, reps: workout.reps },
        workout
      }
    })
  
  if (estimates.length === 0) {
    return null
  }
  
  // Sort by confidence level first, then by e1RM value
  const confidenceOrder = { high: 3, medium: 2, low: 1 }
  
  estimates.sort((a, b) => {
    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    if (confidenceDiff !== 0) {
      return confidenceDiff
    }
    // If same confidence, prefer higher e1RM
    return b.e1rm - a.e1rm
  })
  
  const best = estimates[0]
  return {
    e1rm: best.e1rm,
    confidence: best.confidence,
    source: best.source
  }
} 