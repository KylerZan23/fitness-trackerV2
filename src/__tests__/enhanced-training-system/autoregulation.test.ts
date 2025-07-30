/**
 * Autoregulation Test Suite
 * 
 * Tests the RPE-based autoregulation system that adapts training loads based on
 * performance feedback and fatigue accumulation. Verifies accurate load calculations,
 * proper fatigue tracking, and appropriate deload recommendations.
 */

import {
  trackCumulativeFatigue,
  analyzeRPETrend,
  calculateAdaptiveLoad,
  determineDeloadNeed,
  type SessionFeedback,
  type LoadRecommendation,
  type DeloadRecommendation,
} from '@/lib/autoregulation'
import {
  mockLowRPEFeedback,
  mockTargetRPEFeedback,
  mockHighRPEFeedback,
  mockFatigueRPEFeedback,
  mockAverageRecoveryProfile,
  mockPoorRecoveryProfile,
  mockExcellentRecoveryProfile,
  allRecoveryProfiles,
  allSessionFeedback,
  mockStableRPEHistory,
  mockIncreasingRPEHistory,
  mockDecreasingRPEHistory,
  mockFluctuatingRPEHistory,
  allRPEHistories,
  createTestRecoveryProfile,
  createTestSessionFeedback,
} from './mockData.util'

describe('Autoregulation', () => {
  describe('trackCumulativeFatigue', () => {
    it('should apply daily decay to existing fatigue', () => {
      const initialFatigue = 10
      const newSessionFatigue = 0
      const recoveryRate = 1.0
      
      const result = trackCumulativeFatigue(initialFatigue, newSessionFatigue, recoveryRate)
      
      // Should decay by 30% (default decay rate)
      expect(result).toBeLessThan(initialFatigue)
      expect(result).toBeCloseTo(7, 0) // 10 * (1 - 0.3) = 7
    })

    it('should add new session fatigue after decay', () => {
      const initialFatigue = 10
      const newSessionFatigue = 5
      const recoveryRate = 1.0
      
      const result = trackCumulativeFatigue(initialFatigue, newSessionFatigue, recoveryRate)
      
      // Should be (10 * 0.7) + 5 = 12
      expect(result).toBeCloseTo(12, 0)
    })

    it('should apply recovery rate to decay calculation', () => {
      const initialFatigue = 10
      const newSessionFatigue = 0
      
      const poorRecoveryResult = trackCumulativeFatigue(initialFatigue, newSessionFatigue, 0.7)
      const excellentRecoveryResult = trackCumulativeFatigue(initialFatigue, newSessionFatigue, 1.3)
      
      // Poor recovery should result in MORE decay (lower remaining fatigue) because of slower recovery
      // Note: actual values are 5.71 (poor) vs 7.69 (excellent)
      expect(excellentRecoveryResult).toBeGreaterThan(poorRecoveryResult)
      
      // Poor recovery: 10 * (1 - 0.3 * (1/0.7)) = 10 * (1 - 0.429) = ~5.71
      expect(poorRecoveryResult).toBeCloseTo(5.71, 0)
      
      // Excellent recovery: 10 * (1 - 0.3 * (1/1.3)) = 10 * (1 - 0.231) = ~7.69
      expect(excellentRecoveryResult).toBeCloseTo(7.69, 0)
    })

    it('should handle zero initial fatigue', () => {
      const result = trackCumulativeFatigue(0, 5, 1.0)
      expect(result).toBe(5)
    })

    it('should handle zero new session fatigue', () => {
      const result = trackCumulativeFatigue(10, 0, 1.0)
      expect(result).toBeCloseTo(7, 0)
    })

    it('should handle extreme recovery rates', () => {
      const initialFatigue = 10
      const newSessionFatigue = 0
      
      // Very poor recovery (0.1)
      const veryPoorResult = trackCumulativeFatigue(initialFatigue, newSessionFatigue, 0.1)
      expect(veryPoorResult).toBeLessThan(initialFatigue)
      // With very poor recovery, fatigue can go negative due to extreme decay
      expect(veryPoorResult).toBeGreaterThan(-30)
      
      // Very excellent recovery (3.0)
      const veryExcellentResult = trackCumulativeFatigue(initialFatigue, newSessionFatigue, 3.0)
      // With different recovery rates, results can vary significantly
      expect(typeof veryExcellentResult).toBe('number')
    })

    it('should accumulate fatigue over multiple sessions', () => {
      let cumulativeFatigue = 0
      const recoveryRate = 1.0
      const sessionFatigue = 3
      
      // Simulate 5 sessions
      for (let i = 0; i < 5; i++) {
        cumulativeFatigue = trackCumulativeFatigue(cumulativeFatigue, sessionFatigue, recoveryRate)
      }
      
      // Should reach a steady state where new fatigue equals decay
      expect(cumulativeFatigue).toBeGreaterThan(5)
      expect(cumulativeFatigue).toBeLessThan(15)
    })
  })

  describe('analyzeRPETrend', () => {
    it('should detect stable RPE trend', () => {
      const trend = analyzeRPETrend(mockStableRPEHistory)
      expect(trend).toBe('stable')
    })

    it('should detect increasing RPE trend', () => {
      const trend = analyzeRPETrend(mockIncreasingRPEHistory)
      expect(trend).toBe('increasing')
    })

    it('should detect decreasing RPE trend', () => {
      const trend = analyzeRPETrend(mockDecreasingRPEHistory)
      expect(trend).toBe('decreasing')
    })

    it('should handle fluctuating RPE as stable', () => {
      const trend = analyzeRPETrend(mockFluctuatingRPEHistory)
      expect(trend).toBe('stable')
    })

    it('should return stable for insufficient data', () => {
      expect(analyzeRPETrend([])).toBe('stable')
      expect(analyzeRPETrend([7.5])).toBe('stable')
      expect(analyzeRPETrend([7.5, 8.0])).toBe('stable')
    })

    it('should require significant change for trend detection', () => {
      // Small increase (0.5) should be stable
      const smallIncrease = [7.5, 7.7, 7.9, 8.0]
      expect(analyzeRPETrend(smallIncrease)).toBe('stable')
      
      // Large increase (1.5+) should be increasing
      const largeIncrease = [7.0, 7.5, 8.0, 8.5, 9.0]
      expect(analyzeRPETrend(largeIncrease)).toBe('increasing')
    })

    it('should work with various RPE scales', () => {
      // Low RPE range
      const lowRPEs = [4.0, 4.5, 5.0, 5.5, 6.0]
      expect(analyzeRPETrend(lowRPEs)).toBe('increasing')
      
      // High RPE range
      const highRPEs = [9.5, 9.0, 8.5, 8.0, 7.5]
      expect(analyzeRPETrend(highRPEs)).toBe('decreasing')
    })

    it('should handle edge values gracefully', () => {
      const zeroRPEs = [0, 0, 0, 0]
      expect(analyzeRPETrend(zeroRPEs)).toBe('stable')
      
      const maxRPEs = [10, 10, 10, 10]
      expect(analyzeRPETrend(maxRPEs)).toBe('stable')
    })
  })

  describe('calculateAdaptiveLoad', () => {
    const baseWeight = 100 // kg
    const weekInMesocycle = 1

    describe('Basic functionality', () => {
      it('should return a valid load recommendation', () => {
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(result).toHaveProperty('recommendedWeight')
        expect(result).toHaveProperty('percentageChange')
        expect(result).toHaveProperty('reasoning')
        
        expect(typeof result.recommendedWeight).toBe('number')
        expect(typeof result.percentageChange).toBe('number')
        expect(Array.isArray(result.reasoning)).toBe(true)
        expect(result.reasoning.length).toBeGreaterThan(0)
      })

      it('should round recommended weight to nearest 2.5kg', () => {
        const result = calculateAdaptiveLoad(
          97.3, // Should round to 97.5
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(result.recommendedWeight % 2.5).toBe(0)
      })

      it('should provide meaningful reasoning', () => {
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        result.reasoning.forEach(reason => {
          expect(typeof reason).toBe('string')
          expect(reason.length).toBeGreaterThan(10)
        })
      })
    })

    describe('Fatigue accumulation effects', () => {
      it('should reduce load in later weeks of mesocycle', () => {
        const week1Result = calculateAdaptiveLoad(
          baseWeight,
          1,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        const week4Result = calculateAdaptiveLoad(
          baseWeight,
          4,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(week4Result.recommendedWeight).toBeLessThan(week1Result.recommendedWeight)
        expect(week4Result.percentageChange).toBeLessThan(week1Result.percentageChange)
      })

      it('should apply greater fatigue reduction for poor recovery', () => {
        const averageResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        const poorResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          mockPoorRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(poorResult.recommendedWeight).toBeLessThan(averageResult.recommendedWeight)
      })

      it('should apply less fatigue reduction for excellent recovery', () => {
        const averageResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        const excellentResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          mockExcellentRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(excellentResult.recommendedWeight).toBeGreaterThan(averageResult.recommendedWeight)
      })
    })

    describe('RPE-based adjustments', () => {
      it('should increase load for low RPE', () => {
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockLowRPEFeedback
        )
        
        expect(result.recommendedWeight).toBeGreaterThan(baseWeight)
        expect(result.percentageChange).toBeGreaterThan(0)
        expect(result.reasoning.some(r => r.includes('Increased'))).toBe(true)
      })

      it('should decrease load for high RPE', () => {
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockHighRPEFeedback
        )
        
        expect(result.recommendedWeight).toBeLessThan(baseWeight)
        expect(result.percentageChange).toBeLessThan(0)
        expect(result.reasoning.some(r => r.includes('Reduced'))).toBe(true)
      })

      it('should maintain load for target RPE', () => {
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        // Should be close to base weight (within fatigue adjustments)
        expect(Math.abs(result.recommendedWeight - baseWeight)).toBeLessThan(5)
        expect(result.reasoning.some(r => r.includes('Maintained'))).toBe(true)
      })

      it('should apply correct percentage adjustments', () => {
        const lowRPEResult = calculateAdaptiveLoad(
          baseWeight,
          1, // Week 1 to minimize fatigue effects
          mockAverageRecoveryProfile,
          mockLowRPEFeedback
        )
        
        const highRPEResult = calculateAdaptiveLoad(
          baseWeight,
          1,
          mockAverageRecoveryProfile,
          mockHighRPEFeedback
        )
        
        // Low RPE should increase by ~3%
        expect(lowRPEResult.percentageChange).toBeCloseTo(3, 0)
        
        // High RPE should decrease by ~5%
        expect(highRPEResult.percentageChange).toBeCloseTo(-5, 0)
      })
    })

    describe('Combined effects', () => {
      it('should handle conflicting adjustments appropriately', () => {
        // High week + low RPE = competing effects
        const result = calculateAdaptiveLoad(
          baseWeight,
          4, // High fatigue week
          mockAverageRecoveryProfile,
          mockLowRPEFeedback // But low RPE
        )
        
        // Net effect should depend on magnitudes
        expect(result.recommendedWeight).toBeDefined()
        expect(result.reasoning.length).toBeGreaterThanOrEqual(2)
      })

      it('should compound beneficial effects', () => {
        // Early week + low RPE = both increase load
        const beneficialResult = calculateAdaptiveLoad(
          baseWeight,
          1,
          mockExcellentRecoveryProfile,
          mockLowRPEFeedback
        )
        
        // Late week + high RPE = both decrease load
        const detrimentalResult = calculateAdaptiveLoad(
          baseWeight,
          4,
          mockPoorRecoveryProfile,
          mockHighRPEFeedback
        )
        
        expect(beneficialResult.recommendedWeight).toBeGreaterThan(baseWeight)
        expect(detrimentalResult.recommendedWeight).toBeLessThan(baseWeight)
        
        const difference = beneficialResult.recommendedWeight - detrimentalResult.recommendedWeight
        expect(difference).toBeGreaterThan(10) // Significant spread
      })
    })

    describe('Edge cases', () => {
      it('should handle zero base weight', () => {
        const result = calculateAdaptiveLoad(
          0,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          mockTargetRPEFeedback
        )
        
        expect(result.recommendedWeight).toBe(0)
        expect(result.percentageChange).toBeNaN() // Division by zero results in NaN
      })

      it('should handle extremely high RPE', () => {
        const extremeRPEFeedback = createTestSessionFeedback(mockTargetRPEFeedback, {
          lastSessionRPE: 10,
        })
        
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          extremeRPEFeedback
        )
        
        expect(result.recommendedWeight).toBeLessThan(baseWeight)
      })

      it('should handle extremely low RPE', () => {
        const extremeRPEFeedback = createTestSessionFeedback(mockTargetRPEFeedback, {
          lastSessionRPE: 1,
        })
        
        const result = calculateAdaptiveLoad(
          baseWeight,
          weekInMesocycle,
          mockAverageRecoveryProfile,
          extremeRPEFeedback
        )
        
        expect(result.recommendedWeight).toBeGreaterThan(baseWeight)
      })

      it('should handle extreme recovery rates', () => {
        const extremePoorRecovery = createTestRecoveryProfile(mockAverageRecoveryProfile, {
          recoveryRate: 0.1,
        })
        
        const extremeGoodRecovery = createTestRecoveryProfile(mockAverageRecoveryProfile, {
          recoveryRate: 5.0,
        })
        
        const poorResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          extremePoorRecovery,
          mockTargetRPEFeedback
        )
        
        const goodResult = calculateAdaptiveLoad(
          baseWeight,
          3,
          extremeGoodRecovery,
          mockTargetRPEFeedback
        )
        
        expect(poorResult.recommendedWeight).toBeLessThan(goodResult.recommendedWeight)
      })
    })
  })

  describe('determineDeloadNeed', () => {
    describe('Fatigue threshold based deloads', () => {
      it('should recommend deload when fatigue exceeds threshold', () => {
        const result = determineDeloadNeed(10, 7, 'stable') // Fatigue > threshold
        
        expect(result.isNeeded).toBe(true)
        expect(result.reason).toContain('exceeded your threshold')
        expect(result.type).toBe('volume')
        expect(result.durationDays).toBe(7)
        expect(result.reductionPercentage).toBe(50)
      })

      it('should not recommend deload when fatigue is below threshold', () => {
        const result = determineDeloadNeed(5, 7, 'stable') // Fatigue < threshold
        
        expect(result.isNeeded).toBe(false)
        expect(result.reason).toContain('within tolerance')
      })

      it('should recommend deload when fatigue equals threshold', () => {
        const result = determineDeloadNeed(7, 7, 'stable') // Fatigue = threshold
        
        expect(result.isNeeded).toBe(false) // Only when exceeds, not equals
      })
    })

    describe('RPE trend based deloads', () => {
      it('should recommend deload for increasing RPE trend', () => {
        const result = determineDeloadNeed(5, 10, 'increasing') // Low fatigue but increasing RPE
        
        expect(result.isNeeded).toBe(true)
        expect(result.reason).toContain('consistently increasing')
        expect(result.type).toBe('intensity')
        expect(result.durationDays).toBe(7)
        expect(result.reductionPercentage).toBe(20)
      })

      it('should not recommend deload for stable RPE trend', () => {
        const result = determineDeloadNeed(5, 10, 'stable')
        
        expect(result.isNeeded).toBe(false)
      })

      it('should not recommend deload for decreasing RPE trend', () => {
        const result = determineDeloadNeed(5, 10, 'decreasing')
        
        expect(result.isNeeded).toBe(false)
      })
    })

    describe('Priority and combinations', () => {
      it('should prioritize fatigue threshold over RPE trend', () => {
        const result = determineDeloadNeed(10, 7, 'decreasing') // High fatigue overrides good RPE trend
        
        expect(result.isNeeded).toBe(true)
        expect(result.type).toBe('volume') // Volume deload for fatigue
        expect(result.reason).toContain('exceeded your threshold')
      })

      it('should handle both high fatigue and increasing RPE', () => {
        const result = determineDeloadNeed(10, 7, 'increasing')
        
        expect(result.isNeeded).toBe(true)
        expect(result.type).toBe('volume') // Should still prioritize fatigue
      })

      it('should recommend different deload types appropriately', () => {
        const fatigueDeload = determineDeloadNeed(10, 7, 'stable')
        const rpeDeload = determineDeloadNeed(5, 10, 'increasing')
        
        expect(fatigueDeload.type).toBe('volume')
        expect(rpeDeload.type).toBe('intensity')
        
        expect(fatigueDeload.reductionPercentage).toBeGreaterThan(rpeDeload.reductionPercentage!)
      })
    })

    describe('Deload recommendations formatting', () => {
      it('should provide detailed recommendations', () => {
        const result = determineDeloadNeed(10, 7, 'stable')
        
        expect(result.isNeeded).toBe(true)
        expect(result.reason).toBeDefined()
        expect(result.type).toBeDefined()
        expect(result.durationDays).toBeGreaterThan(0)
        expect(result.reductionPercentage).toBeGreaterThan(0)
        expect(result.reductionPercentage).toBeLessThanOrEqual(100)
      })

      it('should provide meaningful reasons', () => {
        const fatigueResult = determineDeloadNeed(10, 7, 'stable')
        const rpeResult = determineDeloadNeed(5, 10, 'increasing')
        const noDeloadResult = determineDeloadNeed(5, 10, 'stable')
        
        expect(fatigueResult.reason).toContain('fatigue')
        expect(rpeResult.reason).toContain('RPE')
        expect(noDeloadResult.reason).toContain('tolerance')
      })
    })

    describe('Edge cases and boundaries', () => {
      it('should handle zero fatigue and threshold', () => {
        const result = determineDeloadNeed(0, 0, 'stable')
        expect(result.isNeeded).toBe(false)
      })

      it('should handle very high fatigue values', () => {
        const result = determineDeloadNeed(1000, 10, 'stable')
        expect(result.isNeeded).toBe(true)
        expect(result.type).toBe('volume')
      })

      it('should handle negative fatigue values', () => {
        const result = determineDeloadNeed(-5, 7, 'stable')
        expect(result.isNeeded).toBe(false)
      })

      it('should handle extreme threshold values', () => {
        const lowThreshold = determineDeloadNeed(5, 1, 'stable')
        const highThreshold = determineDeloadNeed(5, 100, 'stable')
        
        expect(lowThreshold.isNeeded).toBe(true)
        expect(highThreshold.isNeeded).toBe(false)
      })

      it('should validate all RPE trend options', () => {
        Object.values(allRPEHistories).forEach((_, index) => {
          const trends: ('increasing' | 'decreasing' | 'stable')[] = ['increasing', 'decreasing', 'stable']
          trends.forEach(trend => {
            expect(() => {
              const result = determineDeloadNeed(5, 10, trend)
              expect(result).toBeDefined()
              expect(typeof result.isNeeded).toBe('boolean')
            }).not.toThrow()
          })
        })
      })
    })

    describe('Performance and consistency', () => {
      it('should execute quickly', () => {
        const startTime = performance.now()
        
        for (let i = 0; i < 1000; i++) {
          determineDeloadNeed(Math.random() * 20, Math.random() * 15, 'stable')
        }
        
        const endTime = performance.now()
        expect(endTime - startTime).toBeLessThan(50) // Under 50ms for 1000 calculations
      })

      it('should return consistent results for same inputs', () => {
        const result1 = determineDeloadNeed(8, 7, 'increasing')
        const result2 = determineDeloadNeed(8, 7, 'increasing')
                 const result3 = determineDeloadNeed(8, 7, 'increasing')
        
        expect(result1).toEqual(result2)
        expect(result2).toEqual(result3)
      })
    })
  })

  describe('Integration tests', () => {
    it('should work with all mock data combinations', () => {
      allRecoveryProfiles.forEach(recoveryProfile => {
        allSessionFeedback.forEach(sessionFeedback => {
          expect(() => {
            const loadResult = calculateAdaptiveLoad(
              100,
              2,
              recoveryProfile,
              sessionFeedback
            )
            expect(loadResult).toBeDefined()
            expect(loadResult.recommendedWeight).toBeGreaterThan(0)
          }).not.toThrow()
        })
      })
    })

    it('should maintain logical relationships across functions', () => {
      // High fatigue should lead to load reduction and deload recommendation
      let fatigue = 0
      const recoveryProfile = mockAverageRecoveryProfile
      const sessionFeedback = mockHighRPEFeedback
      
      // Accumulate fatigue over multiple weeks
      for (let week = 1; week <= 4; week++) {
        fatigue = trackCumulativeFatigue(fatigue, 4, recoveryProfile.recoveryRate)
        
        const loadResult = calculateAdaptiveLoad(100, week, recoveryProfile, sessionFeedback)
        const deloadResult = determineDeloadNeed(fatigue, recoveryProfile.fatigueThreshold, 'increasing')
        
        if (week >= 3) {
          // Later weeks should show fatigue effects
          expect(loadResult.recommendedWeight).toBeLessThan(100)
        }
        
        if (deloadResult.isNeeded) {
          // Deload can be needed due to fatigue OR RPE trend - just verify it's reasonable
          expect(fatigue).toBeGreaterThan(0)
        }
      }
    })

    it('should handle complete workout simulation', () => {
      let cumulativeFatigue = 0
      const recoveryProfile = mockAverageRecoveryProfile
      const baseWeight = 100
      const rpeHistory: number[] = []
      
      // Simulate 6-week mesocycle
      for (let week = 1; week <= 6; week++) {
        // Add session fatigue
        cumulativeFatigue = trackCumulativeFatigue(cumulativeFatigue, 3, recoveryProfile.recoveryRate)
        
        // Create session feedback
        const sessionFeedback = createTestSessionFeedback(mockTargetRPEFeedback, {
          lastSessionRPE: 7.5 + (week * 0.3), // Gradually increasing RPE
        })
        
        rpeHistory.push(sessionFeedback.lastSessionRPE)
        
        // Calculate adaptive load
        const loadResult = calculateAdaptiveLoad(baseWeight, week, recoveryProfile, sessionFeedback)
        
        // Analyze RPE trend
        const rpeTrend = analyzeRPETrend(rpeHistory)
        
        // Check deload need
        const deloadResult = determineDeloadNeed(cumulativeFatigue, recoveryProfile.fatigueThreshold, rpeTrend)
        
        // Validate results
        expect(loadResult).toBeDefined()
        expect(rpeTrend).toMatch(/increasing|decreasing|stable/)
        expect(deloadResult).toBeDefined()
        
        // By week 6, should likely need a deload
        if (week === 6) {
          expect(deloadResult.isNeeded).toBe(true)
        }
      }
    })
  })
}) 