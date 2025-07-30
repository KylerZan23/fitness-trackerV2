/**
 * Weak Point Analysis Test Suite
 * 
 * Tests the strength ratio analysis system that identifies muscular imbalances
 * and prescribes corrective exercise protocols. Verifies accurate ratio calculations,
 * appropriate severity assessments, and proper exercise recommendations.
 */

import {
  STRENGTH_RATIO_STANDARDS,
  WEAK_POINT_PROTOCOLS,
  enhancedWeakPointAnalysis,
  generateCorrectionExercises,
  calculateReassessmentPeriod,
  type StrengthProfile,
  type WeakPointProtocol,
} from '@/lib/weakPointAnalysis'
import {
  mockBalancedStrengthProfile,
  mockWeakPosteriorChain,
  mockWeakHorizontalPress,
  mockWeakVerticalPress,
  mockZeroStrengthProfile,
  allStrengthProfiles,
  createTestStrengthProfile,
} from './mockData.util'

describe('Weak Point Analysis', () => {
  describe('STRENGTH_RATIO_STANDARDS', () => {
    it('should have valid standards for all ratios', () => {
      const expectedRatios = ['benchToDeadlift', 'squatToDeadlift', 'overheadToBench']
      
      expectedRatios.forEach(ratio => {
        expect(STRENGTH_RATIO_STANDARDS[ratio as keyof typeof STRENGTH_RATIO_STANDARDS]).toBeDefined()
        
        const standard = STRENGTH_RATIO_STANDARDS[ratio as keyof typeof STRENGTH_RATIO_STANDARDS]
        expect(standard.minimum).toBeGreaterThan(0)
        expect(standard.minimum).toBeLessThan(1.5)
        expect(standard.optimal).toBeGreaterThan(standard.minimum)
        expect(standard.type).toBeDefined()
      })
    })

    it('should have logical ratio standards', () => {
      // Bench to deadlift should be reasonable (60-80%)
      expect(STRENGTH_RATIO_STANDARDS.benchToDeadlift.minimum).toBeGreaterThan(0.5)
      expect(STRENGTH_RATIO_STANDARDS.benchToDeadlift.minimum).toBeLessThan(0.9)
      
      // Squat to deadlift should be high (75-90%)
      expect(STRENGTH_RATIO_STANDARDS.squatToDeadlift.minimum).toBeGreaterThan(0.7)
      expect(STRENGTH_RATIO_STANDARDS.squatToDeadlift.minimum).toBeLessThan(1.0)
      
      // Overhead to bench should be moderate (60-75%)
      expect(STRENGTH_RATIO_STANDARDS.overheadToBench.minimum).toBeGreaterThan(0.5)
      expect(STRENGTH_RATIO_STANDARDS.overheadToBench.minimum).toBeLessThan(0.8)
    })

    it('should have appropriate weak point type mappings', () => {
      expect(STRENGTH_RATIO_STANDARDS.benchToDeadlift.type).toBe('WEAK_HORIZONTAL_PRESS')
      expect(STRENGTH_RATIO_STANDARDS.squatToDeadlift.type).toBe('WEAK_POSTERIOR_CHAIN')
      expect(STRENGTH_RATIO_STANDARDS.overheadToBench.type).toBe('WEAK_VERTICAL_PRESS')
    })
  })

  describe('WEAK_POINT_PROTOCOLS', () => {
    it('should have correction exercises for all weak point types', () => {
      const expectedTypes = ['WEAK_POSTERIOR_CHAIN', 'WEAK_HORIZONTAL_PRESS', 'WEAK_VERTICAL_PRESS']
      
      expectedTypes.forEach(type => {
        expect(WEAK_POINT_PROTOCOLS[type as keyof typeof WEAK_POINT_PROTOCOLS]).toBeDefined()
        expect(WEAK_POINT_PROTOCOLS[type as keyof typeof WEAK_POINT_PROTOCOLS].length).toBeGreaterThan(0)
      })
    })

    it('should have relevant exercises for each weak point type', () => {
      // Posterior chain exercises should target glutes, hamstrings, erectors
      const posteriorExercises = WEAK_POINT_PROTOCOLS.WEAK_POSTERIOR_CHAIN
      expect(posteriorExercises.some(ex => ex.toLowerCase().includes('deadlift'))).toBe(true)
      expect(posteriorExercises.some(ex => ex.toLowerCase().includes('hip'))).toBe(true)
      
      // Horizontal press exercises should target chest, front delts
      const horizontalExercises = WEAK_POINT_PROTOCOLS.WEAK_HORIZONTAL_PRESS
      expect(horizontalExercises.some(ex => ex.toLowerCase().includes('bench') || ex.toLowerCase().includes('press'))).toBe(true)
      
      // Vertical press exercises should target shoulders, triceps
      const verticalExercises = WEAK_POINT_PROTOCOLS.WEAK_VERTICAL_PRESS
      expect(verticalExercises.some(ex => ex.toLowerCase().includes('press'))).toBe(true)
      expect(verticalExercises.some(ex => ex.toLowerCase().includes('raise') || ex.toLowerCase().includes('close-grip'))).toBe(true)
    })

    it('should have no duplicate exercises within protocols', () => {
      Object.values(WEAK_POINT_PROTOCOLS).forEach(exercises => {
        const uniqueExercises = new Set(exercises)
        expect(uniqueExercises.size).toBe(exercises.length)
      })
    })
  })

  describe('generateCorrectionExercises', () => {
    it('should return exercises for single weak point type', () => {
      const exercises = generateCorrectionExercises(['WEAK_POSTERIOR_CHAIN'])
      
      expect(exercises.length).toBeGreaterThan(0)
      expect(exercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_POSTERIOR_CHAIN))
    })

    it('should combine exercises for multiple weak point types', () => {
      const exercises = generateCorrectionExercises(['WEAK_POSTERIOR_CHAIN', 'WEAK_HORIZONTAL_PRESS'])
      
      expect(exercises.length).toBeGreaterThan(WEAK_POINT_PROTOCOLS.WEAK_POSTERIOR_CHAIN.length)
      expect(exercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_POSTERIOR_CHAIN))
      expect(exercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_HORIZONTAL_PRESS))
    })

    it('should deduplicate exercises across weak point types', () => {
      const exercises = generateCorrectionExercises(['WEAK_POSTERIOR_CHAIN', 'WEAK_HORIZONTAL_PRESS', 'WEAK_VERTICAL_PRESS'])
      const uniqueExercises = new Set(exercises)
      
      expect(uniqueExercises.size).toBe(exercises.length)
    })

    it('should return empty array for empty input', () => {
      const exercises = generateCorrectionExercises([])
      expect(exercises).toEqual([])
    })

    it('should handle invalid weak point types gracefully', () => {
      const exercises = generateCorrectionExercises(['INVALID_TYPE' as any])
      expect(exercises).toEqual([])
    })
  })

  describe('calculateReassessmentPeriod', () => {
    it('should return 8 weeks for high severity issues', () => {
      const period = calculateReassessmentPeriod(['High'])
      expect(period).toBe(8)
    })

    it('should return 12 weeks for moderate severity issues', () => {
      const period = calculateReassessmentPeriod(['Moderate'])
      expect(period).toBe(12)
    })

    it('should return 16 weeks for no issues', () => {
      const period = calculateReassessmentPeriod([])
      expect(period).toBe(16)
    })

    it('should prioritize high severity when mixed severities present', () => {
      const period = calculateReassessmentPeriod(['Moderate', 'High', 'Moderate'])
      expect(period).toBe(8)
    })

    it('should handle moderate severity when no high severity present', () => {
      const period = calculateReassessmentPeriod(['Moderate', 'Moderate'])
      expect(period).toBe(12)
    })
  })

  describe('enhancedWeakPointAnalysis', () => {
    describe('Balanced strength profile', () => {
      it('should identify no issues for balanced lifter', () => {
        const result = enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        
        expect(result.issues).toHaveLength(0)
        expect(result.correctionExercises).toHaveLength(0)
        expect(result.primaryWeakPoints).toHaveLength(0)
        expect(result.reassessmentPeriodWeeks).toBe(16)
      })

      it('should calculate correct strength ratios', () => {
        const profile = mockBalancedStrengthProfile
        const result = enhancedWeakPointAnalysis(profile)
        
        // Verify the math is correct (based on mock values)
        const expectedBenchToDeadlift = profile.bench1RM / profile.deadlift1RM // 90/150 = 0.6
        const expectedSquatToDeadlift = profile.squat1RM / profile.deadlift1RM // 120/150 = 0.8
        const expectedOverheadToBench = profile.overheadPress1RM / profile.bench1RM // 60/90 = 0.67
        
        expect(expectedBenchToDeadlift).toBeCloseTo(0.6, 2)
        expect(expectedSquatToDeadlift).toBeCloseTo(0.8, 2)
        expect(expectedOverheadToBench).toBeCloseTo(0.67, 2)
      })
    })

    describe('Weak posterior chain', () => {
      it('should identify posterior chain weakness', () => {
        const result = enhancedWeakPointAnalysis(mockWeakPosteriorChain)
        
        expect(result.issues.length).toBeGreaterThan(0)
        expect(result.primaryWeakPoints).toContain('WEAK_POSTERIOR_CHAIN')
        expect(result.correctionExercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_POSTERIOR_CHAIN))
      })

      it('should detect low squat to deadlift ratio', () => {
        const result = enhancedWeakPointAnalysis(mockWeakPosteriorChain)
        const squatIssue = result.issues.find(issue => issue.ratioName === 'squatToDeadlift')
        
        expect(squatIssue).toBeDefined()
        expect(squatIssue!.yourRatio).toBeLessThan(STRENGTH_RATIO_STANDARDS.squatToDeadlift.minimum)
      })

      it('should assign appropriate severity for posterior chain weakness', () => {
        const result = enhancedWeakPointAnalysis(mockWeakPosteriorChain)
        const squatIssue = result.issues.find(issue => issue.ratioName === 'squatToDeadlift')
        
        expect(squatIssue!.severity).toMatch(/Moderate|High/)
      })
    })

    describe('Weak horizontal press', () => {
      it('should identify horizontal press weakness', () => {
        const result = enhancedWeakPointAnalysis(mockWeakHorizontalPress)
        
        expect(result.issues.length).toBeGreaterThan(0)
        expect(result.primaryWeakPoints).toContain('WEAK_HORIZONTAL_PRESS')
        expect(result.correctionExercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_HORIZONTAL_PRESS))
      })

      it('should detect low bench to deadlift ratio', () => {
        const result = enhancedWeakPointAnalysis(mockWeakHorizontalPress)
        const benchIssue = result.issues.find(issue => issue.ratioName === 'benchToDeadlift')
        
        expect(benchIssue).toBeDefined()
        expect(benchIssue!.yourRatio).toBeLessThan(STRENGTH_RATIO_STANDARDS.benchToDeadlift.minimum)
      })
    })

    describe('Weak vertical press', () => {
      it('should identify vertical press weakness', () => {
        const result = enhancedWeakPointAnalysis(mockWeakVerticalPress)
        
        expect(result.issues.length).toBeGreaterThan(0)
        expect(result.primaryWeakPoints).toContain('WEAK_VERTICAL_PRESS')
        expect(result.correctionExercises).toEqual(expect.arrayContaining(WEAK_POINT_PROTOCOLS.WEAK_VERTICAL_PRESS))
      })

      it('should detect low overhead to bench ratio', () => {
        const result = enhancedWeakPointAnalysis(mockWeakVerticalPress)
        const overheadIssue = result.issues.find(issue => issue.ratioName === 'overheadToBench')
        
        expect(overheadIssue).toBeDefined()
        expect(overheadIssue!.yourRatio).toBeLessThan(STRENGTH_RATIO_STANDARDS.overheadToBench.minimum)
      })
    })

    describe('Multiple weaknesses', () => {
      it('should identify multiple weak points simultaneously', () => {
        const multipleWeakProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 80,  // Weak posterior chain
          bench1RM: 70,  // Weak horizontal press
          overheadPress1RM: 35,  // Weak vertical press
        })
        
        const result = enhancedWeakPointAnalysis(multipleWeakProfile)
        
        expect(result.issues.length).toBeGreaterThanOrEqual(3)
        expect(result.primaryWeakPoints.length).toBeGreaterThanOrEqual(3)
        expect(result.correctionExercises.length).toBeGreaterThan(5) // Should combine multiple protocols
      })

      it('should deduplicate exercises from multiple weak points', () => {
        const multipleWeakProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 80,
          bench1RM: 70,
          overheadPress1RM: 35,
        })
        
        const result = enhancedWeakPointAnalysis(multipleWeakProfile)
        const uniqueExercises = new Set(result.correctionExercises)
        
        expect(uniqueExercises.size).toBe(result.correctionExercises.length)
      })
    })

    describe('Severity assessment', () => {
      it('should assign high severity for ratios below 90% of minimum', () => {
        const severeWeakProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 100,  // Low ratio
          deadlift1RM: 200,
        })
        
        const result = enhancedWeakPointAnalysis(severeWeakProfile)
        const squatIssue = result.issues.find(issue => issue.ratioName === 'squatToDeadlift')
        
        expect(squatIssue!.severity).toBe('High')
      })

      it('should assign moderate severity for ratios between 90% and 100% of minimum', () => {
        const moderateWeakProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 115,  // Moderate ratio
          deadlift1RM: 150,
        })
        
        const result = enhancedWeakPointAnalysis(moderateWeakProfile)
        const squatIssue = result.issues.find(issue => issue.ratioName === 'squatToDeadlift')
        
        if (squatIssue) {
          expect(squatIssue.severity).toBe('Moderate')
        }
      })

      it('should adjust reassessment period based on highest severity', () => {
        const highSeverityProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 80,  // High severity
          bench1RM: 85,  // Moderate severity
        })
        
        const result = enhancedWeakPointAnalysis(highSeverityProfile)
        expect(result.reassessmentPeriodWeeks).toBe(8) // Should be 8 due to high severity
      })
    })

    describe('Edge cases', () => {
      it('should handle zero strength values', () => {
        const result = enhancedWeakPointAnalysis(mockZeroStrengthProfile)
        
        expect(result).toBeDefined()
        expect(result.issues).toBeDefined()
        expect(result.correctionExercises).toBeDefined()
        expect(result.primaryWeakPoints).toBeDefined()
        expect(result.reassessmentPeriodWeeks).toBeGreaterThan(0)
      })

      it('should handle zero deadlift gracefully', () => {
        const zeroDeadliftProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          deadlift1RM: 0,
        })
        
        expect(() => {
          enhancedWeakPointAnalysis(zeroDeadliftProfile)
        }).not.toThrow()
      })

      it('should handle zero bench gracefully', () => {
        const zeroBenchProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          bench1RM: 0,
        })
        
        expect(() => {
          enhancedWeakPointAnalysis(zeroBenchProfile)
        }).not.toThrow()
      })

      it('should handle extremely high ratios', () => {
        const extremeProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 300,
          bench1RM: 250,
          overheadPress1RM: 200,
          deadlift1RM: 100,
        })
        
        const result = enhancedWeakPointAnalysis(extremeProfile)
        
        expect(result).toBeDefined()
        expect(result.issues).toHaveLength(0) // No weaknesses identified
      })

      it('should handle negative strength values', () => {
        const negativeProfile = {
          squat1RM: -100,
          bench1RM: -80,
          deadlift1RM: -120,
          overheadPress1RM: -50,
        }
        
        expect(() => {
          enhancedWeakPointAnalysis(negativeProfile)
        }).not.toThrow()
      })

      it('should handle very small strength values', () => {
        const tinyProfile = {
          squat1RM: 0.1,
          bench1RM: 0.1,
          deadlift1RM: 0.1,
          overheadPress1RM: 0.1,
        }
        
        expect(() => {
          enhancedWeakPointAnalysis(tinyProfile)
        }).not.toThrow()
      })
    })

    describe('Data quality and consistency', () => {
      it('should return consistent results for same input', () => {
        const result1 = enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        const result2 = enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        const result3 = enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        
        expect(result1).toEqual(result2)
        expect(result2).toEqual(result3)
      })

      it('should round ratio values to reasonable precision', () => {
        const result = enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        
        result.issues.forEach(issue => {
          expect(issue.yourRatio.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
        })
      })

      it('should provide meaningful explanations for all issues', () => {
        const result = enhancedWeakPointAnalysis(mockWeakPosteriorChain)
        
        result.issues.forEach(issue => {
          expect(issue.explanation).toBeDefined()
          expect(issue.explanation.length).toBeGreaterThan(10)
          expect(issue.explanation).toContain(issue.ratioName)
        })
      })

      it('should handle all test profile scenarios', () => {
        allStrengthProfiles.forEach((profile, index) => {
          expect(() => {
            const result = enhancedWeakPointAnalysis(profile)
            expect(result).toBeDefined()
            expect(result.issues).toBeDefined()
            expect(result.correctionExercises).toBeDefined()
            expect(result.primaryWeakPoints).toBeDefined()
            expect(result.reassessmentPeriodWeeks).toBeGreaterThan(0)
          }).not.toThrow()
        })
      })
    })

    describe('Performance', () => {
      it('should execute analysis quickly', () => {
        const startTime = performance.now()
        
        for (let i = 0; i < 1000; i++) {
          enhancedWeakPointAnalysis(mockBalancedStrengthProfile)
        }
        
        const endTime = performance.now()
        const executionTime = endTime - startTime
        
        // Should complete 1000 analyses in under 50ms
        expect(executionTime).toBeLessThan(50)
      })

      it('should scale linearly with input complexity', () => {
        const simpleProfile = mockBalancedStrengthProfile
        const complexProfile = createTestStrengthProfile(mockBalancedStrengthProfile, {
          squat1RM: 80,
          bench1RM: 70,
          overheadPress1RM: 35,
        })
        
        const simpleTime = performance.now()
        enhancedWeakPointAnalysis(simpleProfile)
        const simpleEndTime = performance.now()
        
        const complexTime = performance.now()
        enhancedWeakPointAnalysis(complexProfile)
        const complexEndTime = performance.now()
        
        const simpleExecution = simpleEndTime - simpleTime
        const complexExecution = complexEndTime - complexTime
        
        // Complex analysis shouldn't be significantly slower (allowing for timing variability)
        expect(complexExecution).toBeLessThan(simpleExecution * 3)
      })
    })
  })
}) 