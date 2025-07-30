/**
 * Volume Calculations Test Suite
 * 
 * Tests the individualized volume landmark calculations that form the foundation
 * of the enhanced training system. Verifies that volume calculations work correctly
 * across all user profiles and edge cases.
 */

import {
  MUSCLE_GROUP_BASE_VOLUMES,
  calculateIndividualVolumeLandmarks,
  calculateAllMuscleLandmarks,
} from '@/lib/volumeCalculations'
import {
  mockBeginnerVolumeParams,
  mockIntermediateVolumeParams,
  mockAdvancedVolumeParams,
  mockHighStressVolumeParams,
  mockVeteranVolumeParams,
  allVolumeParameters,
  createTestVolumeParams,
} from './mockData.util'

describe('Volume Calculations', () => {
  describe('MUSCLE_GROUP_BASE_VOLUMES', () => {
    it('should have valid base volumes for all muscle groups', () => {
      const expectedMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs']
      
      expectedMuscleGroups.forEach(muscleGroup => {
        expect(MUSCLE_GROUP_BASE_VOLUMES[muscleGroup]).toBeDefined()
        
        const landmarks = MUSCLE_GROUP_BASE_VOLUMES[muscleGroup]
        expect(landmarks.MEV).toBeGreaterThanOrEqual(0)
        expect(landmarks.MAV).toBeGreaterThan(landmarks.MEV)
        expect(landmarks.MRV).toBeGreaterThan(landmarks.MAV)
      })
    })

    it('should follow logical volume progression (MEV < MAV < MRV)', () => {
      Object.entries(MUSCLE_GROUP_BASE_VOLUMES).forEach(([muscleGroup, landmarks]) => {
        expect(landmarks.MEV).toBeLessThan(landmarks.MAV)
        expect(landmarks.MAV).toBeLessThan(landmarks.MRV)
      })
    })

    it('should have realistic volume ranges for each muscle group', () => {
      // Test that volumes are within reasonable bounds
      Object.entries(MUSCLE_GROUP_BASE_VOLUMES).forEach(([muscleGroup, landmarks]) => {
        expect(landmarks.MEV).toBeGreaterThanOrEqual(0)
        expect(landmarks.MEV).toBeLessThan(20) // No muscle needs more than 20 sets MEV
        expect(landmarks.MRV).toBeLessThan(50) // No muscle should exceed 50 sets MRV
      })
    })
  })

  describe('calculateIndividualVolumeLandmarks', () => {
    describe('Basic functionality', () => {
      it('should calculate landmarks for valid muscle group', () => {
        const result = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'chest')
        
        expect(result).not.toBeNull()
        expect(result).toHaveProperty('MEV')
        expect(result).toHaveProperty('MAV')
        expect(result).toHaveProperty('MRV')
        
        // Values should be numbers
        expect(typeof result!.MEV).toBe('number')
        expect(typeof result!.MAV).toBe('number')
        expect(typeof result!.MRV).toBe('number')
      })

      it('should return null for invalid muscle group', () => {
        const result = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'invalid-muscle')
        expect(result).toBeNull()
      })

      it('should handle case-insensitive muscle group names', () => {
        const lowerResult = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'chest')
        const upperResult = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'CHEST')
        const mixedResult = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'ChEsT')
        
        expect(lowerResult).toEqual(upperResult)
        expect(lowerResult).toEqual(mixedResult)
      })

      it('should round all values to whole numbers', () => {
        const result = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, 'chest')
        
        expect(result!.MEV % 1).toBe(0)
        expect(result!.MAV % 1).toBe(0)
        expect(result!.MRV % 1).toBe(0)
      })
    })

    describe('Training age multiplier effects', () => {
      it('should increase volume with higher training age', () => {
        const beginnerResult = calculateIndividualVolumeLandmarks(mockBeginnerVolumeParams, 'chest')
        const advancedResult = calculateIndividualVolumeLandmarks(mockAdvancedVolumeParams, 'chest')
        
        expect(advancedResult!.MEV).toBeGreaterThan(beginnerResult!.MEV)
        expect(advancedResult!.MAV).toBeGreaterThan(beginnerResult!.MAV)
        expect(advancedResult!.MRV).toBeGreaterThan(beginnerResult!.MRV)
      })

      it('should cap training age effects at 2 years', () => {
        const twoYearParams = createTestVolumeParams(mockIntermediateVolumeParams, { trainingAge: 2.0 })
        const tenYearParams = createTestVolumeParams(mockIntermediateVolumeParams, { trainingAge: 10.0 })
        
        const twoYearResult = calculateIndividualVolumeLandmarks(twoYearParams, 'chest')
        const tenYearResult = calculateIndividualVolumeLandmarks(tenYearParams, 'chest')
        
        expect(twoYearResult).toEqual(tenYearResult)
      })

      it('should handle zero training age', () => {
        const zeroParams = createTestVolumeParams(mockIntermediateVolumeParams, { trainingAge: 0 })
        const result = calculateIndividualVolumeLandmarks(zeroParams, 'chest')
        
        expect(result).not.toBeNull()
        expect(result!.MEV).toBeGreaterThan(0)
      })
    })

    describe('Recovery capacity multiplier effects', () => {
      it('should decrease volume with low recovery capacity', () => {
        const lowRecoveryParams = createTestVolumeParams(mockIntermediateVolumeParams, { recoveryCapacity: 2 })
        const highRecoveryParams = createTestVolumeParams(mockIntermediateVolumeParams, { recoveryCapacity: 9 })
        
        const lowResult = calculateIndividualVolumeLandmarks(lowRecoveryParams, 'chest')
        const highResult = calculateIndividualVolumeLandmarks(highRecoveryParams, 'chest')
        
        expect(lowResult!.MEV).toBeLessThan(highResult!.MEV)
        expect(lowResult!.MAV).toBeLessThan(highResult!.MAV)
        expect(lowResult!.MRV).toBeLessThan(highResult!.MRV)
      })

      it('should apply correct multipliers for recovery tiers', () => {
        const baseParams = mockIntermediateVolumeParams
        const baseline = calculateIndividualVolumeLandmarks(baseParams, 'chest')
        
        // Test low recovery (≤3) = 0.7x
        const lowParams = createTestVolumeParams(baseParams, { recoveryCapacity: 3 })
        const lowResult = calculateIndividualVolumeLandmarks(lowParams, 'chest')
        expect(lowResult!.MAV).toBeLessThan(baseline!.MAV)
        
        // Test moderate recovery (4-7) = 1.0x
        const moderateParams = createTestVolumeParams(baseParams, { recoveryCapacity: 6 })
        const moderateResult = calculateIndividualVolumeLandmarks(moderateParams, 'chest')
        
        // Test high recovery (≥8) = 1.3x
        const highParams = createTestVolumeParams(baseParams, { recoveryCapacity: 9 })
        const highResult = calculateIndividualVolumeLandmarks(highParams, 'chest')
        expect(highResult!.MAV).toBeGreaterThan(baseline!.MAV)
      })
    })

    describe('Stress level multiplier effects', () => {
      it('should decrease volume with high stress', () => {
        const lowStressParams = createTestVolumeParams(mockIntermediateVolumeParams, { stressLevel: 2 })
        const highStressParams = createTestVolumeParams(mockIntermediateVolumeParams, { stressLevel: 9 })
        
        const lowResult = calculateIndividualVolumeLandmarks(lowStressParams, 'chest')
        const highResult = calculateIndividualVolumeLandmarks(highStressParams, 'chest')
        
        expect(highResult!.MEV).toBeLessThan(lowResult!.MEV)
        expect(highResult!.MAV).toBeLessThan(lowResult!.MAV)
        expect(highResult!.MRV).toBeLessThan(lowResult!.MRV)
      })

      it('should apply correct multipliers for stress tiers', () => {
        const baseParams = mockIntermediateVolumeParams
        
        // Test very low stress (≤2) = 1.1x
        const veryLowParams = createTestVolumeParams(baseParams, { stressLevel: 1 })
        const veryLowResult = calculateIndividualVolumeLandmarks(veryLowParams, 'chest')
        
        // Test low stress (3-4) = 1.0x
        const lowParams = createTestVolumeParams(baseParams, { stressLevel: 4 })
        const lowResult = calculateIndividualVolumeLandmarks(lowParams, 'chest')
        
        // Test moderate stress (5-6) = 0.9x
        const moderateParams = createTestVolumeParams(baseParams, { stressLevel: 6 })
        const moderateResult = calculateIndividualVolumeLandmarks(moderateParams, 'chest')
        
        // Test high stress (7-8) = 0.7x
        const highParams = createTestVolumeParams(baseParams, { stressLevel: 8 })
        const highResult = calculateIndividualVolumeLandmarks(highParams, 'chest')
        
        // Test very high stress (≥9) = 0.6x
        const veryHighParams = createTestVolumeParams(baseParams, { stressLevel: 10 })
        const veryHighResult = calculateIndividualVolumeLandmarks(veryHighParams, 'chest')
        
        expect(veryLowResult!.MAV).toBeGreaterThan(lowResult!.MAV)
        expect(lowResult!.MAV).toBeGreaterThan(moderateResult!.MAV)
        expect(moderateResult!.MAV).toBeGreaterThan(highResult!.MAV)
        expect(highResult!.MAV).toBeGreaterThan(veryHighResult!.MAV)
      })
    })

    describe('Volume tolerance multiplier effects', () => {
      it('should scale volume proportionally with tolerance', () => {
        const lowToleranceParams = createTestVolumeParams(mockIntermediateVolumeParams, { volumeTolerance: 0.5 })
        const highToleranceParams = createTestVolumeParams(mockIntermediateVolumeParams, { volumeTolerance: 1.5 })
        
        const lowResult = calculateIndividualVolumeLandmarks(lowToleranceParams, 'chest')
        const highResult = calculateIndividualVolumeLandmarks(highToleranceParams, 'chest')
        
        expect(highResult!.MEV).toBeGreaterThan(lowResult!.MEV)
        expect(highResult!.MAV).toBeGreaterThan(lowResult!.MAV)
        expect(highResult!.MRV).toBeGreaterThan(lowResult!.MRV)
        
        // High tolerance should be approximately 3x low tolerance
        expect(highResult!.MAV).toBeCloseTo(lowResult!.MAV * 3, 0)
      })

      it('should handle extreme volume tolerance values', () => {
        const zeroToleranceParams = createTestVolumeParams(mockIntermediateVolumeParams, { volumeTolerance: 0 })
        const extremeToleranceParams = createTestVolumeParams(mockIntermediateVolumeParams, { volumeTolerance: 5 })
        
        const zeroResult = calculateIndividualVolumeLandmarks(zeroToleranceParams, 'chest')
        const extremeResult = calculateIndividualVolumeLandmarks(extremeToleranceParams, 'chest')
        
        expect(zeroResult!.MEV).toBe(0)
        expect(zeroResult!.MAV).toBe(0)
        expect(zeroResult!.MRV).toBe(0)
        
        expect(extremeResult!.MEV).toBeGreaterThan(0)
      })
    })

    describe('Combined multiplier effects', () => {
      it('should correctly combine all multipliers', () => {
        // Test extreme low scenario
        const extremeLowParams = createTestVolumeParams(mockIntermediateVolumeParams, {
          trainingAge: 0,
          recoveryCapacity: 1,
          stressLevel: 10,
          volumeTolerance: 0.5,
        })
        
        // Test extreme high scenario
        const extremeHighParams = createTestVolumeParams(mockIntermediateVolumeParams, {
          trainingAge: 3,
          recoveryCapacity: 10,
          stressLevel: 1,
          volumeTolerance: 2.0,
        })
        
        const lowResult = calculateIndividualVolumeLandmarks(extremeLowParams, 'chest')
        const highResult = calculateIndividualVolumeLandmarks(extremeHighParams, 'chest')
        
        expect(lowResult!.MEV).toBeLessThan(highResult!.MEV)
        expect(lowResult!.MAV).toBeLessThan(highResult!.MAV)
        expect(lowResult!.MRV).toBeLessThan(highResult!.MRV)
        
        // High scenario should result in significantly higher volume
        expect(highResult!.MAV).toBeGreaterThan(lowResult!.MAV * 5)
      })

      it('should maintain logical volume progression even with extreme multipliers', () => {
        const extremeParams = createTestVolumeParams(mockIntermediateVolumeParams, {
          trainingAge: 0,
          recoveryCapacity: 1,
          stressLevel: 10,
          volumeTolerance: 0.1,
        })
        
        const result = calculateIndividualVolumeLandmarks(extremeParams, 'chest')
        
        if (result!.MEV > 0) {
          expect(result!.MEV).toBeLessThanOrEqual(result!.MAV)
          expect(result!.MAV).toBeLessThanOrEqual(result!.MRV)
        }
      })
    })

    describe('Edge cases', () => {
      it('should handle negative parameters gracefully', () => {
        const negativeParams = createTestVolumeParams(mockIntermediateVolumeParams, {
          trainingAge: -1,
          recoveryCapacity: -5,
          stressLevel: -2,
          volumeTolerance: -0.5,
        })
        
        const result = calculateIndividualVolumeLandmarks(negativeParams, 'chest')
        
        expect(result).not.toBeNull()
        // With negative parameters, volumes can be negative due to multipliers
        expect(typeof result!.MEV).toBe('number')
        expect(typeof result!.MAV).toBe('number')
        expect(typeof result!.MRV).toBe('number')
      })

      it('should handle undefined/null parameters gracefully', () => {
        const invalidParams = {
          trainingAge: NaN,
          recoveryCapacity: NaN,
          stressLevel: NaN,
          volumeTolerance: NaN,
        }
        
        expect(() => {
          calculateIndividualVolumeLandmarks(invalidParams, 'chest')
        }).not.toThrow()
      })
    })
  })

  describe('calculateAllMuscleLandmarks', () => {
    it('should calculate landmarks for all muscle groups', () => {
      const result = calculateAllMuscleLandmarks(mockIntermediateVolumeParams)
      
      const expectedMuscleGroups = Object.keys(MUSCLE_GROUP_BASE_VOLUMES)
      expectedMuscleGroups.forEach(muscleGroup => {
        expect(result[muscleGroup]).toBeDefined()
        expect(result[muscleGroup]).toHaveProperty('MEV')
        expect(result[muscleGroup]).toHaveProperty('MAV')
        expect(result[muscleGroup]).toHaveProperty('MRV')
      })
    })

    it('should return consistent results with individual calculations', () => {
      const allResults = calculateAllMuscleLandmarks(mockIntermediateVolumeParams)
      
      Object.keys(MUSCLE_GROUP_BASE_VOLUMES).forEach(muscleGroup => {
        const individualResult = calculateIndividualVolumeLandmarks(mockIntermediateVolumeParams, muscleGroup)
        expect(allResults[muscleGroup]).toEqual(individualResult)
      })
    })

    it('should maintain logical progression across all muscle groups', () => {
      const result = calculateAllMuscleLandmarks(mockIntermediateVolumeParams)
      
      Object.entries(result).forEach(([muscleGroup, landmarks]) => {
        expect(landmarks.MEV).toBeLessThanOrEqual(landmarks.MAV)
        expect(landmarks.MAV).toBeLessThanOrEqual(landmarks.MRV)
      })
    })

    it('should handle all user profile scenarios', () => {
      allVolumeParameters.forEach((params, index) => {
        const result = calculateAllMuscleLandmarks(params)
        
        expect(Object.keys(result)).toHaveLength(Object.keys(MUSCLE_GROUP_BASE_VOLUMES).length)
        
        Object.entries(result).forEach(([muscleGroup, landmarks]) => {
          expect(landmarks.MEV).toBeGreaterThanOrEqual(0)
          expect(landmarks.MAV).toBeGreaterThanOrEqual(landmarks.MEV)
          expect(landmarks.MRV).toBeGreaterThanOrEqual(landmarks.MAV)
        })
      })
    })

    it('should show variation between different user profiles', () => {
      const beginnerResults = calculateAllMuscleLandmarks(mockBeginnerVolumeParams)
      const advancedResults = calculateAllMuscleLandmarks(mockAdvancedVolumeParams)
      const highStressResults = calculateAllMuscleLandmarks(mockHighStressVolumeParams)
      
      // Advanced should generally have higher volumes than beginner
      expect(advancedResults.chest.MAV).toBeGreaterThan(beginnerResults.chest.MAV)
      
      // High stress should generally have lower volumes than normal
      expect(highStressResults.chest.MAV).toBeLessThan(mockIntermediateVolumeParams.volumeTolerance * 
        MUSCLE_GROUP_BASE_VOLUMES.chest.MAV)
    })
  })

  describe('Performance and reliability', () => {
    it('should execute calculations quickly', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        calculateAllMuscleLandmarks(mockIntermediateVolumeParams)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete 1000 calculations in under 100ms
      expect(executionTime).toBeLessThan(100)
    })

    it('should produce consistent results across multiple calls', () => {
      const results = []
      
      for (let i = 0; i < 10; i++) {
        results.push(calculateAllMuscleLandmarks(mockIntermediateVolumeParams))
      }
      
      const firstResult = results[0]
      results.forEach(result => {
        expect(result).toEqual(firstResult)
      })
    })

    it('should be deterministic for same inputs', () => {
      const params = createTestVolumeParams(mockIntermediateVolumeParams, {
        trainingAge: 1.5,
        recoveryCapacity: 7,
        stressLevel: 5,
        volumeTolerance: 1.0,
      })
      
      const result1 = calculateIndividualVolumeLandmarks(params, 'chest')
      const result2 = calculateIndividualVolumeLandmarks(params, 'chest')
      const result3 = calculateIndividualVolumeLandmarks(params, 'chest')
      
      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
    })
  })
}) 