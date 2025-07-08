/**
 * Tests for strength metrics utilities
 */

import {
  calculateE1RM,
  calculateE1RMWithConfidence,
  isValidForE1RM,
  getTrainingPercentages,
  calculateImprovement,
  getBestE1RM
} from '../strength'

describe('Strength Metrics', () => {
  describe('calculateE1RM', () => {
    it('should return the weight for 1 rep', () => {
      expect(calculateE1RM(100, 1)).toBe(100)
    })

    it('should calculate e1RM using Brzycki formula', () => {
      // For 100kg at 5 reps: 100 / (1.0278 - 0.0278 * 5) = 100 / 0.889 ≈ 112.5
      const result = calculateE1RM(100, 5)
      expect(result).toBeCloseTo(112.5, 1)
    })

    it('should cap reps at 12 for reliability', () => {
      const result12 = calculateE1RM(100, 12)
      const result15 = calculateE1RM(100, 15)
      expect(result12).toBe(result15) // Should be the same due to capping
    })

    it('should throw error for invalid weight', () => {
      expect(() => calculateE1RM(0, 5)).toThrow('Weight must be greater than 0')
      expect(() => calculateE1RM(-10, 5)).toThrow('Weight must be greater than 0')
    })

    it('should throw error for invalid reps', () => {
      expect(() => calculateE1RM(100, 0)).toThrow('Repetitions must be greater than 0')
      expect(() => calculateE1RM(100, -1)).toThrow('Repetitions must be greater than 0')
    })
  })

  describe('calculateE1RMWithConfidence', () => {
    it('should provide high confidence for low reps (1-3)', () => {
      const result = calculateE1RMWithConfidence(100, 3)
      expect(result.confidence).toBe('high')
    })

    it('should provide medium confidence for moderate reps (4-8)', () => {
      const result = calculateE1RMWithConfidence(100, 6)
      expect(result.confidence).toBe('medium')
    })

    it('should provide low confidence for high reps (9+)', () => {
      const result = calculateE1RMWithConfidence(100, 10)
      expect(result.confidence).toBe('low')
    })
  })

  describe('isValidForE1RM', () => {
    it('should validate correct input', () => {
      expect(isValidForE1RM(100, 5)).toBe(true)
    })

    it('should invalidate zero or negative weight', () => {
      expect(isValidForE1RM(0, 5)).toBe(false)
      expect(isValidForE1RM(-10, 5)).toBe(false)
    })

    it('should invalidate zero or negative reps', () => {
      expect(isValidForE1RM(100, 0)).toBe(false)
      expect(isValidForE1RM(100, -1)).toBe(false)
    })

    it('should invalidate extremely high reps', () => {
      expect(isValidForE1RM(100, 25)).toBe(false)
    })
  })

  describe('getTrainingPercentages', () => {
    it('should calculate training percentages correctly', () => {
      const percentages = getTrainingPercentages(100)
      expect(percentages.light).toBe(65)     // 65%
      expect(percentages.moderate).toBe(75)  // 75%
      expect(percentages.heavy).toBe(85)     // 85%
      expect(percentages.maxEffort).toBe(95) // 95%
    })
  })

  describe('calculateImprovement', () => {
    it('should calculate positive improvement', () => {
      const improvement = calculateImprovement(110, 100)
      expect(improvement).toBe(10) // 10% improvement
    })

    it('should calculate negative improvement (decline)', () => {
      const improvement = calculateImprovement(90, 100)
      expect(improvement).toBe(-10) // 10% decline
    })

    it('should return 0 for invalid baseline', () => {
      expect(calculateImprovement(100, 0)).toBe(0)
      expect(calculateImprovement(100, -10)).toBe(0)
    })
  })

  describe('getBestE1RM', () => {
    it('should return null for empty workouts', () => {
      expect(getBestE1RM([])).toBeNull()
    })

    it('should prioritize high confidence estimates', () => {
      const workouts = [
        { weight: 100, reps: 10 }, // Low confidence
        { weight: 95, reps: 3 },   // High confidence
        { weight: 90, reps: 6 }    // Medium confidence
      ]
      
      const result = getBestE1RM(workouts)
      expect(result).not.toBeNull()
      expect(result!.confidence).toBe('high')
      expect(result!.source.reps).toBe(3)
    })

    it('should prefer higher e1RM when confidence is equal', () => {
      const workouts = [
        { weight: 90, reps: 3 },   // High confidence, lower e1RM
        { weight: 100, reps: 3 }   // High confidence, higher e1RM
      ]
      
      const result = getBestE1RM(workouts)
      expect(result).not.toBeNull()
      expect(result!.source.weight).toBe(100)
    })

    it('should filter out invalid workouts', () => {
      const workouts = [
        { weight: 0, reps: 5 },    // Invalid
        { weight: 100, reps: 0 },  // Invalid
        { weight: 100, reps: 5 }   // Valid
      ]
      
      const result = getBestE1RM(workouts)
      expect(result).not.toBeNull()
      expect(result!.source.weight).toBe(100)
      expect(result!.source.reps).toBe(5)
    })
  })
}) 