/**
 * Periodization Test Suite
 * 
 * Tests the research-based periodization system that structures long-term training
 * progressions. Verifies accurate phase calculations, appropriate deload protocols,
 * and proper adaptation projections.
 */

import {
  ENHANCED_PERIODIZATION_MODELS,
  generatePhaseProgression,
  calculateOptimalDeload,
  projectAdaptation,
  type PeriodizationPhase,
  type WeeklyProgression,
  type DetailedDeloadProtocol,
} from '@/lib/periodization'
import {
  mockHypertrophyPhase,
  mockStrengthPhase,
  mockPeakingPhase,
  allPeriodizationPhases,
  mockAverageRecoveryProfile,
  mockPoorRecoveryProfile,
  mockExcellentRecoveryProfile,
  allRecoveryProfiles,
} from './mockData.util'

describe('Periodization', () => {
  describe('ENHANCED_PERIODIZATION_MODELS', () => {
    it('should have valid periodization models', () => {
      const expectedModels = ['hypertrophyFocused', 'strengthFocused', 'generalFitness']
      
      expectedModels.forEach(model => {
        expect(ENHANCED_PERIODIZATION_MODELS[model]).toBeDefined()
        expect(Array.isArray(ENHANCED_PERIODIZATION_MODELS[model])).toBe(true)
        expect(ENHANCED_PERIODIZATION_MODELS[model].length).toBeGreaterThan(0)
      })
    })

    it('should have logical phase structures for each model', () => {
      Object.entries(ENHANCED_PERIODIZATION_MODELS).forEach(([modelName, phases]) => {
        phases.forEach(phase => {
          expect(phase.name).toBeDefined()
          expect(phase.durationWeeks).toBeGreaterThan(0)
          expect(phase.durationWeeks).toBeLessThan(20) // Reasonable max duration
          
          expect(phase.intensityRange[0]).toBeGreaterThan(0)
          expect(phase.intensityRange[1]).toBeGreaterThan(phase.intensityRange[0])
          expect(phase.intensityRange[1]).toBeLessThanOrEqual(102.5) // Max intensity
          
          expect(['linear', 'ramping', 'stable']).toContain(phase.volumeProgression)
          expect(['hypertrophy', 'strength', 'peaking', 'recovery']).toContain(phase.primaryAdaptation)
        })
      })
    })

    it('should have appropriate progression in intensity ranges', () => {
      // Hypertrophy focused should start lower intensity
      const hypertrophyModel = ENHANCED_PERIODIZATION_MODELS.hypertrophyFocused
      expect(hypertrophyModel[0].intensityRange[0]).toBeLessThan(75)
      
      // Strength focused should have higher intensities
      const strengthModel = ENHANCED_PERIODIZATION_MODELS.strengthFocused
      const lastPhase = strengthModel[strengthModel.length - 1]
      expect(lastPhase.intensityRange[1]).toBeGreaterThan(95)
      
      // General fitness should be moderate
      const generalModel = ENHANCED_PERIODIZATION_MODELS.generalFitness
      expect(generalModel[0].intensityRange[0]).toBeGreaterThan(65)
      expect(generalModel[0].intensityRange[1]).toBeLessThan(90)
    })

    it('should have logical adaptation progressions', () => {
      // Models should generally progress from volume to intensity
      Object.values(ENHANCED_PERIODIZATION_MODELS).forEach(phases => {
        if (phases.length > 1) {
          const firstPhase = phases[0]
          const lastPhase = phases[phases.length - 1]
          
          // First phase should be lower intensity than last
          expect(firstPhase.intensityRange[0]).toBeLessThan(lastPhase.intensityRange[0])
        }
      })
    })
  })

  describe('generatePhaseProgression', () => {
    const baseVolumeSets = 20

    describe('Basic functionality', () => {
      it('should generate correct number of weeks', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        expect(progression).toHaveLength(mockHypertrophyPhase.durationWeeks)
        
        progression.forEach((week, index) => {
          expect(week.weekInPhase).toBe(index + 1)
        })
      })

      it('should return valid weekly progressions', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        progression.forEach(week => {
          expect(week).toHaveProperty('weekInPhase')
          expect(week).toHaveProperty('targetVolumeSets')
          expect(week).toHaveProperty('targetIntensityPercent')
          expect(week).toHaveProperty('focus')
          
          expect(typeof week.weekInPhase).toBe('number')
          expect(typeof week.targetVolumeSets).toBe('number')
          expect(typeof week.targetIntensityPercent).toBe('number')
          expect(typeof week.focus).toBe('string')
          
          expect(week.targetVolumeSets).toBeGreaterThan(0)
          expect(week.targetIntensityPercent).toBeGreaterThan(0)
          expect(week.focus.length).toBeGreaterThan(10)
        })
      })

      it('should round volume sets to whole numbers', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        progression.forEach(week => {
          expect(week.targetVolumeSets % 1).toBe(0)
        })
      })

      it('should round intensity to one decimal place', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        progression.forEach(week => {
          const decimalPlaces = week.targetIntensityPercent.toString().split('.')[1]?.length || 0
          expect(decimalPlaces).toBeLessThanOrEqual(1)
        })
      })
    })

    describe('Volume progression patterns', () => {
      it('should implement ramping volume correctly', () => {
        const rampingPhase = { ...mockHypertrophyPhase, volumeProgression: 'ramping' as const }
        const progression = generatePhaseProgression(rampingPhase, baseVolumeSets)
        
        // Should start lower and ramp higher
        expect(progression[0].targetVolumeSets).toBeLessThan(baseVolumeSets)
        expect(progression[progression.length - 1].targetVolumeSets).toBeGreaterThan(baseVolumeSets)
        
        // Should progressively increase
        for (let i = 1; i < progression.length; i++) {
          expect(progression[i].targetVolumeSets).toBeGreaterThanOrEqual(progression[i - 1].targetVolumeSets)
        }
      })

      it('should implement stable volume correctly', () => {
        const stablePhase = { ...mockHypertrophyPhase, volumeProgression: 'stable' as const }
        const progression = generatePhaseProgression(stablePhase, baseVolumeSets)
        
        // All weeks should have same volume
        progression.forEach(week => {
          expect(week.targetVolumeSets).toBe(baseVolumeSets)
        })
      })

      it('should implement linear volume correctly', () => {
        const linearPhase = { ...mockHypertrophyPhase, volumeProgression: 'linear' as const }
        const progression = generatePhaseProgression(linearPhase, baseVolumeSets)
        
        // Should start at base volume and decrease slightly
        expect(progression[0].targetVolumeSets).toBe(baseVolumeSets)
        expect(progression[progression.length - 1].targetVolumeSets).toBeLessThan(baseVolumeSets)
        
        // Should progressively decrease
        for (let i = 1; i < progression.length; i++) {
          expect(progression[i].targetVolumeSets).toBeLessThanOrEqual(progression[i - 1].targetVolumeSets)
        }
      })
    })

    describe('Intensity progression', () => {
      it('should progress intensity from start to end range', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        expect(progression[0].targetIntensityPercent).toBe(mockHypertrophyPhase.intensityRange[0])
        expect(progression[progression.length - 1].targetIntensityPercent).toBe(mockHypertrophyPhase.intensityRange[1])
      })

      it('should progressively increase intensity', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        for (let i = 1; i < progression.length; i++) {
          expect(progression[i].targetIntensityPercent).toBeGreaterThanOrEqual(progression[i - 1].targetIntensityPercent)
        }
      })

      it('should handle single week phases', () => {
        const singleWeekPhase = { ...mockHypertrophyPhase, durationWeeks: 1 }
        const progression = generatePhaseProgression(singleWeekPhase, baseVolumeSets)
        
        expect(progression).toHaveLength(1)
        expect(progression[0].targetIntensityPercent).toBe(singleWeekPhase.intensityRange[0])
      })
    })

    describe('Focus descriptions', () => {
      it('should include adaptation type in focus', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        progression.forEach(week => {
          expect(week.focus).toContain(mockHypertrophyPhase.primaryAdaptation)
        })
      })

      it('should include intensity information in focus', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, baseVolumeSets)
        
        progression.forEach(week => {
          expect(week.focus).toContain(week.targetIntensityPercent.toFixed(0))
        })
      })
    })

    describe('Edge cases', () => {
      it('should handle zero base volume', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, 0)
        
        progression.forEach(week => {
          expect(week.targetVolumeSets).toBeGreaterThanOrEqual(0)
        })
      })

      it('should handle very high base volume', () => {
        const progression = generatePhaseProgression(mockHypertrophyPhase, 100)
        
        progression.forEach(week => {
          expect(week.targetVolumeSets).toBeGreaterThan(0)
          expect(week.targetVolumeSets).toBeLessThan(200) // Reasonable upper bound
        })
      })

      it('should handle all phase types', () => {
        allPeriodizationPhases.forEach(phase => {
          expect(() => {
            const progression = generatePhaseProgression(phase, baseVolumeSets)
            expect(progression).toHaveLength(phase.durationWeeks)
          }).not.toThrow()
        })
      })
    })
  })

  describe('calculateOptimalDeload', () => {
    const cumulativeFatigue = 8
    const lastPhase = mockHypertrophyPhase

    describe('Basic functionality', () => {
      it('should return a valid deload protocol', () => {
        const deload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, lastPhase)
        
        expect(deload).toHaveProperty('type')
        expect(deload).toHaveProperty('durationDays')
        expect(deload).toHaveProperty('volumeReductionPercent')
        expect(deload).toHaveProperty('intensityReductionPercent')
        expect(deload).toHaveProperty('specializationFocus')
        
        expect(['active', 'passive']).toContain(deload.type)
        expect(deload.durationDays).toBeGreaterThan(0)
        expect(deload.volumeReductionPercent).toBeGreaterThanOrEqual(0)
        expect(deload.volumeReductionPercent).toBeLessThanOrEqual(100)
        expect(deload.intensityReductionPercent).toBeGreaterThanOrEqual(0)
        expect(deload.intensityReductionPercent).toBeLessThanOrEqual(100)
        expect(deload.specializationFocus.length).toBeGreaterThan(5)
      })
    })

    describe('Fatigue-based decisions', () => {
      it('should recommend passive deload for extremely high fatigue', () => {
        const extremeFatigue = mockAverageRecoveryProfile.fatigueThreshold * 1.5
        const deload = calculateOptimalDeload(extremeFatigue, mockAverageRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('passive')
        expect(deload.volumeReductionPercent).toBe(100)
        expect(deload.intensityReductionPercent).toBe(100)
        expect(deload.specializationFocus).toContain('Complete rest')
      })

      it('should recommend active deload for moderate fatigue', () => {
        const moderateFatigue = mockAverageRecoveryProfile.fatigueThreshold * 0.8
        const deload = calculateOptimalDeload(moderateFatigue, mockAverageRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('active')
        expect(deload.volumeReductionPercent).toBeLessThan(100)
        expect(deload.intensityReductionPercent).toBeLessThan(100)
      })
    })

    describe('Recovery profile effects', () => {
      it('should recommend passive deload for poor recovery even with moderate fatigue', () => {
        const moderateFatigue = mockPoorRecoveryProfile.fatigueThreshold * 0.9
        const deload = calculateOptimalDeload(moderateFatigue, mockPoorRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('passive')
      })

      it('should be more conservative with poor recovery', () => {
        const sameFatigue = 6
        
        const averageDeload = calculateOptimalDeload(sameFatigue, mockAverageRecoveryProfile, lastPhase)
        const poorDeload = calculateOptimalDeload(sameFatigue, mockPoorRecoveryProfile, lastPhase)
        
        if (averageDeload.type === 'active' && poorDeload.type === 'active') {
          expect(poorDeload.volumeReductionPercent).toBeGreaterThanOrEqual(averageDeload.volumeReductionPercent)
        }
      })

      it('should handle excellent recovery more aggressively', () => {
        const moderateFatigue = mockExcellentRecoveryProfile.fatigueThreshold * 0.9
        const deload = calculateOptimalDeload(moderateFatigue, mockExcellentRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('active')
        expect(deload.volumeReductionPercent).toBeLessThan(80)
      })
    })

    describe('Phase-specific adjustments', () => {
      it('should increase deload magnitude after peaking phases', () => {
        const peakingPhase = { ...mockPeakingPhase, primaryAdaptation: 'peaking' as const }
        const hypertrophyPhase = { ...mockHypertrophyPhase, primaryAdaptation: 'hypertrophy' as const }
        
        const peakingDeload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, peakingPhase)
        const hypertrophyDeload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, hypertrophyPhase)
        
        if (peakingDeload.type === 'active' && hypertrophyDeload.type === 'active') {
          expect(peakingDeload.volumeReductionPercent).toBeGreaterThan(hypertrophyDeload.volumeReductionPercent)
          expect(peakingDeload.intensityReductionPercent).toBeGreaterThan(hypertrophyDeload.intensityReductionPercent)
        }
      })

      it('should adjust deload focus based on last phase adaptation', () => {
        const strengthPhase = { ...mockStrengthPhase, primaryAdaptation: 'strength' as const }
        const deload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, strengthPhase)
        
        expect(deload.specializationFocus).toBeDefined()
        expect(deload.specializationFocus.length).toBeGreaterThan(10)
      })
    })

    describe('Edge cases', () => {
      it('should handle zero fatigue', () => {
        const deload = calculateOptimalDeload(0, mockAverageRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('active')
        expect(deload.volumeReductionPercent).toBeGreaterThan(0)
      })

      it('should handle extremely high fatigue', () => {
        const extremeFatigue = 1000
        const deload = calculateOptimalDeload(extremeFatigue, mockAverageRecoveryProfile, lastPhase)
        
        expect(deload.type).toBe('passive')
        expect(deload.durationDays).toBeGreaterThan(0)
      })

      it('should handle all recovery profiles', () => {
        allRecoveryProfiles.forEach(profile => {
          expect(() => {
            const deload = calculateOptimalDeload(cumulativeFatigue, profile, lastPhase)
            expect(deload).toBeDefined()
            expect(deload.type).toMatch(/active|passive/)
          }).not.toThrow()
        })
      })

      it('should handle all phase adaptations', () => {
        const adaptations: ('hypertrophy' | 'strength' | 'peaking' | 'recovery')[] = 
          ['hypertrophy', 'strength', 'peaking', 'recovery']
        
        adaptations.forEach(adaptation => {
          const testPhase = { ...lastPhase, primaryAdaptation: adaptation }
          const deload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, testPhase)
          
          expect(deload).toBeDefined()
          expect(deload.specializationFocus).toBeDefined()
        })
      })
    })

    describe('Fatigue ratio calculations', () => {
      it('should use fatigue ratio for decision making', () => {
        const threshold = 10
        const lowRatioFatigue = threshold * 0.5 // 0.5 ratio
        const highRatioFatigue = threshold * 1.5 // 1.5 ratio
        
        const profile = { ...mockAverageRecoveryProfile, fatigueThreshold: threshold }
        
        const lowRatioDeload = calculateOptimalDeload(lowRatioFatigue, profile, lastPhase)
        const highRatioDeload = calculateOptimalDeload(highRatioFatigue, profile, lastPhase)
        
        expect(lowRatioDeload.type).toBe('active')
        expect(highRatioDeload.type).toBe('passive')
      })

      it('should handle threshold edge cases', () => {
        const profile = { ...mockAverageRecoveryProfile, fatigueThreshold: 0 }
        
        expect(() => {
          const deload = calculateOptimalDeload(5, profile, lastPhase)
          expect(deload).toBeDefined()
        }).not.toThrow()
      })
    })
  })

  describe('projectAdaptation', () => {
    const current1RM = 100

    describe('Basic functionality', () => {
      it('should return a projected 1RM', () => {
        const projected = projectAdaptation(current1RM, mockHypertrophyPhase)
        
        expect(typeof projected).toBe('number')
        expect(projected).toBeGreaterThan(0)
      })

      it('should round to one decimal place', () => {
        const projected = projectAdaptation(current1RM, mockHypertrophyPhase)
        const decimalPlaces = projected.toString().split('.')[1]?.length || 0
        
        expect(decimalPlaces).toBeLessThanOrEqual(1)
      })
    })

    describe('Adaptation-specific projections', () => {
      it('should provide largest gains for peaking phases', () => {
        const peakingPhase = { ...mockPeakingPhase, primaryAdaptation: 'peaking' as const }
        const strengthPhase = { ...mockStrengthPhase, primaryAdaptation: 'strength' as const }
        const hypertrophyPhase = { ...mockHypertrophyPhase, primaryAdaptation: 'hypertrophy' as const }
        
        const peakingGain = projectAdaptation(current1RM, peakingPhase)
        const strengthGain = projectAdaptation(current1RM, strengthPhase)
        const hypertrophyGain = projectAdaptation(current1RM, hypertrophyPhase)
        
        expect(peakingGain).toBeGreaterThan(strengthGain)
        expect(strengthGain).toBeGreaterThan(hypertrophyGain)
      })

      it('should apply correct multipliers for each adaptation', () => {
        const strengthPhase = { ...mockStrengthPhase, primaryAdaptation: 'strength' as const }
        const peakingPhase = { ...mockPeakingPhase, primaryAdaptation: 'peaking' as const }
        const hypertrophyPhase = { ...mockHypertrophyPhase, primaryAdaptation: 'hypertrophy' as const }
        
        const strengthProjected = projectAdaptation(current1RM, strengthPhase)
        const peakingProjected = projectAdaptation(current1RM, peakingPhase)
        const hypertrophyProjected = projectAdaptation(current1RM, hypertrophyPhase)
        
        // Strength should be ~2.5% increase
        expect(strengthProjected).toBeCloseTo(current1RM * 1.025, 1)
        
        // Peaking should be ~3% increase
        expect(peakingProjected).toBeCloseTo(current1RM * 1.03, 1)
        
        // Hypertrophy should be ~1% increase
        expect(hypertrophyProjected).toBeCloseTo(current1RM * 1.01, 1)
      })

      it('should handle recovery phases appropriately', () => {
        const recoveryPhase = { ...mockHypertrophyPhase, primaryAdaptation: 'recovery' as const }
        const projected = projectAdaptation(current1RM, recoveryPhase)
        
        // Recovery should maintain strength (1.0 multiplier)
        expect(projected).toBe(current1RM)
      })
    })

    describe('Edge cases', () => {
      it('should handle zero 1RM', () => {
        const projected = projectAdaptation(0, mockHypertrophyPhase)
        expect(projected).toBe(0)
      })

      it('should handle very small 1RMs', () => {
        const projected = projectAdaptation(0.1, mockHypertrophyPhase)
        expect(projected).toBeGreaterThan(0)
        expect(projected).toBeLessThan(1)
      })

      it('should handle very large 1RMs', () => {
        const projected = projectAdaptation(1000, mockHypertrophyPhase)
        expect(projected).toBeGreaterThan(1000)
        expect(projected).toBeLessThan(1100) // Reasonable upper bound
      })

      it('should be consistent for same inputs', () => {
        const projected1 = projectAdaptation(current1RM, mockHypertrophyPhase)
        const projected2 = projectAdaptation(current1RM, mockHypertrophyPhase)
        const projected3 = projectAdaptation(current1RM, mockHypertrophyPhase)
        
        expect(projected1).toBe(projected2)
        expect(projected2).toBe(projected3)
      })

      it('should handle all adaptation types', () => {
        const adaptations: ('hypertrophy' | 'strength' | 'peaking' | 'recovery')[] = 
          ['hypertrophy', 'strength', 'peaking', 'recovery']
        
        adaptations.forEach(adaptation => {
          const testPhase = { ...mockHypertrophyPhase, primaryAdaptation: adaptation }
          const projected = projectAdaptation(current1RM, testPhase)
          
          expect(projected).toBeGreaterThanOrEqual(current1RM)
          expect(projected).toBeLessThan(current1RM * 1.1) // Max 10% gain
        })
      })
    })

    describe('Realistic projections', () => {
      it('should provide realistic strength gains', () => {
        const strengthPhase = { ...mockStrengthPhase, primaryAdaptation: 'strength' as const }
        const projected = projectAdaptation(current1RM, strengthPhase)
        
        const percentageGain = ((projected - current1RM) / current1RM) * 100
        expect(percentageGain).toBeGreaterThan(1) // At least 1%
        expect(percentageGain).toBeLessThan(5) // Less than 5%
      })

      it('should be progressive across different 1RM values', () => {
        const testValues = [50, 100, 150, 200]
        const strengthPhase = { ...mockStrengthPhase, primaryAdaptation: 'strength' as const }
        
        testValues.forEach(value => {
          const projected = projectAdaptation(value, strengthPhase)
          const percentageGain = ((projected - value) / value) * 100
          
          // Should provide consistent percentage gains regardless of starting value
          expect(percentageGain).toBeCloseTo(2.5, 0.5)
        })
      })
    })
  })

  describe('Integration tests', () => {
    it('should work with all periodization models', () => {
      Object.entries(ENHANCED_PERIODIZATION_MODELS).forEach(([modelName, phases]) => {
        phases.forEach(phase => {
          expect(() => {
            const progression = generatePhaseProgression(phase, 20)
            const deload = calculateOptimalDeload(8, mockAverageRecoveryProfile, phase)
            const adaptation = projectAdaptation(100, phase)
            
            expect(progression).toHaveLength(phase.durationWeeks)
            expect(deload).toBeDefined()
            expect(adaptation).toBeGreaterThanOrEqual(100)
          }).not.toThrow()
        })
      })
    })

    it('should maintain logical relationships across functions', () => {
      const phase = mockStrengthPhase
      const baseVolume = 20
      const current1RM = 100
      
      // Generate progression
      const progression = generatePhaseProgression(phase, baseVolume)
      
      // Calculate deload
      const deload = calculateOptimalDeload(8, mockAverageRecoveryProfile, phase)
      
      // Project adaptation
      const projected = projectAdaptation(current1RM, phase)
      
      // Validate relationships
      expect(progression).toHaveLength(phase.durationWeeks)
      expect(progression[0].targetIntensityPercent).toBe(phase.intensityRange[0])
      expect(progression[progression.length - 1].targetIntensityPercent).toBe(phase.intensityRange[1])
      
      expect(deload.type).toMatch(/active|passive/)
      expect(projected).toBeGreaterThan(current1RM)
      
      // For strength phases, should see meaningful adaptations
      if (phase.primaryAdaptation === 'strength') {
        expect(projected).toBeGreaterThan(current1RM * 1.02)
      }
    })

    it('should handle complete periodization cycle', () => {
      const model = ENHANCED_PERIODIZATION_MODELS.strengthFocused
      const baseVolume = 20
      const current1RM = 100
      let cumulativeFatigue = 0
      
      model.forEach((phase, phaseIndex) => {
        // Generate phase progression
        const progression = generatePhaseProgression(phase, baseVolume)
        
        // Simulate fatigue accumulation through phase
        progression.forEach((week, weekIndex) => {
          cumulativeFatigue += 2 // Simulate fatigue per week
          
                     // Check if deload needed (deload is always recommended by calculateOptimalDeload)
           const deload = calculateOptimalDeload(cumulativeFatigue, mockAverageRecoveryProfile, phase)
           
           // Apply deload if it's a passive deload or high reduction
           if (deload.type === 'passive' || deload.volumeReductionPercent > 50) {
             cumulativeFatigue *= (1 - deload.volumeReductionPercent / 100) * 0.5
           }
        })
        
        // Project adaptation for this phase
        const adaptedRM = projectAdaptation(current1RM, phase)
        expect(adaptedRM).toBeGreaterThanOrEqual(current1RM)
        
        // Validate progression structure
        expect(progression).toHaveLength(phase.durationWeeks)
        expect(progression[0].weekInPhase).toBe(1)
        expect(progression[progression.length - 1].weekInPhase).toBe(phase.durationWeeks)
      })
    })

    it('should provide performance benefits', () => {
      const startTime = performance.now()
      
      // Test all major functions
      for (let i = 0; i < 100; i++) {
        generatePhaseProgression(mockHypertrophyPhase, 20)
        calculateOptimalDeload(8, mockAverageRecoveryProfile, mockHypertrophyPhase)
        projectAdaptation(100, mockHypertrophyPhase)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete 100 iterations quickly
      expect(executionTime).toBeLessThan(100) // Under 100ms
    })
  })
}) 