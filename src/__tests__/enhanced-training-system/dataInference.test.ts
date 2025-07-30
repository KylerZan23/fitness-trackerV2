/**
 * Data Inference Test Suite
 * 
 * Tests the data inference system that derives advanced user profiling parameters
 * from existing onboarding data. Verifies accurate parameter inference, proper
 * profile generation, and appropriate default values.
 */

import {
  inferVolumeParameters,
  parseInjuryLimitations,
  generateEnhancedUserProfile,
} from '@/lib/dataInference'
import {
  mockBeginnerUser,
  mockIntermediateUser,
  mockAdvancedUser,
  mockHighStressUser,
  mockMinimalTrainingUser,
  mockMaximalTrainingUser,
  allUserProfiles,
  createTestUserProfile,
} from './mockData.util'

describe('Data Inference', () => {
  describe('inferVolumeParameters', () => {
    describe('Training age inference', () => {
      it('should infer correct training age for beginners', () => {
        const params = inferVolumeParameters(mockBeginnerUser)
        expect(params.trainingAge).toBe(0.25) // ~3 months
      })

      it('should infer correct training age for intermediates', () => {
        const params = inferVolumeParameters(mockIntermediateUser)
        expect(params.trainingAge).toBe(1.25) // ~15 months
      })

      it('should infer correct training age for advanced', () => {
        const params = inferVolumeParameters(mockAdvancedUser)
        expect(params.trainingAge).toBe(3.0) // ~36 months
      })

      it('should default to beginner for undefined experience', () => {
        const userWithoutExperience = createTestUserProfile(mockBeginnerUser, {
          experience_level: undefined,
        })
        const params = inferVolumeParameters(userWithoutExperience)
        expect(params.trainingAge).toBe(0.25)
      })

      it('should handle invalid experience levels', () => {
        const userWithInvalidExperience = createTestUserProfile(mockBeginnerUser, {
          experience_level: 'Expert' as any,
        })
        const params = inferVolumeParameters(userWithInvalidExperience)
        expect(params.trainingAge).toBe(0.25) // Should default to beginner
      })
    })

    describe('Recovery capacity inference', () => {
      it('should infer high capacity for frequent, long training', () => {
        const highVolumeUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 6,
          sessionDuration: '75+ minutes',
        })
        const params = inferVolumeParameters(highVolumeUser)
        expect(params.recoveryCapacity).toBe(9) // High capacity
      })

      it('should infer moderate capacity for moderate training', () => {
        const moderateUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 4,
          sessionDuration: '45-60 minutes',
        })
        const params = inferVolumeParameters(moderateUser)
        expect(params.recoveryCapacity).toBe(6) // Moderate capacity
      })

      it('should infer low capacity for minimal training', () => {
        const lowVolumeUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 2,
          sessionDuration: '30-45 minutes',
        })
        const params = inferVolumeParameters(lowVolumeUser)
        expect(params.recoveryCapacity).toBe(3) // Low capacity
      })

      it('should handle undefined training parameters', () => {
        const userWithoutTrainingData = createTestUserProfile(mockBeginnerUser, {
          trainingFrequencyDays: undefined,
          sessionDuration: undefined,
        })
        const params = inferVolumeParameters(userWithoutTrainingData)
        expect(params.recoveryCapacity).toBe(3) // Should default to low
      })

      it('should handle extreme training frequencies', () => {
        const extremeUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 10, // More than 7 days a week (invalid)
          sessionDuration: '75+ minutes',
        })
        const params = inferVolumeParameters(extremeUser)
        expect(params.recoveryCapacity).toBe(9) // Should still handle it
      })

      it('should handle edge case session durations', () => {
        const testDurations = ['15-30 minutes', '60-75 minutes', '75+ minutes']
        testDurations.forEach(duration => {
          const user = createTestUserProfile(mockIntermediateUser, {
            sessionDuration: duration,
          })
          const params = inferVolumeParameters(user)
          expect(params.recoveryCapacity).toBeGreaterThan(0)
          expect(params.recoveryCapacity).toBeLessThanOrEqual(10)
        })
      })
    })

    describe('Stress level inference', () => {
      it('should infer low stress for high training frequency', () => {
        const highFrequencyUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 6,
        })
        const params = inferVolumeParameters(highFrequencyUser)
        expect(params.stressLevel).toBe(3) // Low stress
      })

      it('should infer moderate stress for moderate training frequency', () => {
        const moderateUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 4,
        })
        const params = inferVolumeParameters(moderateUser)
        expect(params.stressLevel).toBe(6) // Moderate stress
      })

      it('should infer high stress for low training frequency', () => {
        const lowFrequencyUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 2,
        })
        const params = inferVolumeParameters(lowFrequencyUser)
        expect(params.stressLevel).toBe(8) // High stress
      })

      it('should handle zero training frequency', () => {
        const zeroFrequencyUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: 0,
        })
        const params = inferVolumeParameters(zeroFrequencyUser)
        expect(params.stressLevel).toBe(8) // Should default to high stress
      })

      it('should handle undefined training frequency', () => {
        const undefinedFrequencyUser = createTestUserProfile(mockIntermediateUser, {
          trainingFrequencyDays: undefined,
        })
        const params = inferVolumeParameters(undefinedFrequencyUser)
        expect(params.stressLevel).toBe(8) // Should default to high stress
      })
    })

    describe('Volume tolerance', () => {
      it('should set volume tolerance to baseline 1.0', () => {
        const params = inferVolumeParameters(mockIntermediateUser)
        expect(params.volumeTolerance).toBe(1.0)
      })

      it('should be consistent across all user types', () => {
        allUserProfiles.forEach(user => {
          const params = inferVolumeParameters(user)
          expect(params.volumeTolerance).toBe(1.0)
        })
      })
    })

    describe('Edge cases and validation', () => {
      it('should handle all user profile scenarios', () => {
        allUserProfiles.forEach(user => {
          expect(() => {
            const params = inferVolumeParameters(user)
            expect(params).toHaveProperty('trainingAge')
            expect(params).toHaveProperty('recoveryCapacity')
            expect(params).toHaveProperty('stressLevel')
            expect(params).toHaveProperty('volumeTolerance')
            
            expect(params.trainingAge).toBeGreaterThanOrEqual(0)
            expect(params.recoveryCapacity).toBeGreaterThan(0)
            expect(params.recoveryCapacity).toBeLessThanOrEqual(10)
            expect(params.stressLevel).toBeGreaterThan(0)
            expect(params.stressLevel).toBeLessThanOrEqual(10)
            expect(params.volumeTolerance).toBeGreaterThan(0)
          }).not.toThrow()
        })
      })

      it('should be deterministic for same inputs', () => {
        const params1 = inferVolumeParameters(mockIntermediateUser)
        const params2 = inferVolumeParameters(mockIntermediateUser)
        const params3 = inferVolumeParameters(mockIntermediateUser)
        
        expect(params1).toEqual(params2)
        expect(params2).toEqual(params3)
      })
    })
  })

  describe('parseInjuryLimitations', () => {
    describe('Knee injury parsing', () => {
      it('should identify knee injuries', () => {
        const userWithKneeIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'I have knee pain and patella issues',
        })
        const result = parseInjuryLimitations(userWithKneeIssue)
        
        expect(result.identifiedAreas).toContain('Knees')
        expect(result.contraindications).toContain('High-impact plyometrics')
        expect(result.contraindications).toContain('Deep squats if painful')
      })

      it('should handle case insensitive knee terms', () => {
        const userWithKneeIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'KNEE problems and PATELLA discomfort',
        })
        const result = parseInjuryLimitations(userWithKneeIssue)
        
        expect(result.identifiedAreas).toContain('Knees')
      })

      it('should detect patella specifically', () => {
        const userWithPatellaIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'patella tendonitis',
        })
        const result = parseInjuryLimitations(userWithPatellaIssue)
        
        expect(result.identifiedAreas).toContain('Knees')
      })
    })

    describe('Back injury parsing', () => {
      it('should identify back injuries', () => {
        const userWithBackIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'lower back pain and disc problems',
        })
        const result = parseInjuryLimitations(userWithBackIssue)
        
        expect(result.identifiedAreas).toContain('Lower Back')
        expect(result.contraindications).toContain('Heavy deadlifts from floor')
        expect(result.contraindications).toContain('Barbell back squats')
      })

      it('should detect spine and disc issues', () => {
        const userWithSpineIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'spine issues and herniated disc',
        })
        const result = parseInjuryLimitations(userWithSpineIssue)
        
        expect(result.identifiedAreas).toContain('Lower Back')
      })
    })

    describe('Shoulder injury parsing', () => {
      it('should identify shoulder injuries', () => {
        const userWithShoulderIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'shoulder impingement and rotator cuff issues',
        })
        const result = parseInjuryLimitations(userWithShoulderIssue)
        
        expect(result.identifiedAreas).toContain('Shoulders')
        expect(result.contraindications).toContain('Overhead pressing')
        expect(result.contraindications).toContain('Behind-the-neck movements')
      })

      it('should detect rotator cuff specifically', () => {
        const userWithRotatorCuffIssue = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'rotator cuff tear',
        })
        const result = parseInjuryLimitations(userWithRotatorCuffIssue)
        
        expect(result.identifiedAreas).toContain('Shoulders')
      })
    })

    describe('Multiple injuries', () => {
      it('should identify multiple injury areas', () => {
        const userWithMultipleIssues = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'knee pain, lower back issues, and shoulder problems',
        })
        const result = parseInjuryLimitations(userWithMultipleIssues)
        
        expect(result.identifiedAreas).toContain('Knees')
        expect(result.identifiedAreas).toContain('Lower Back')
        expect(result.identifiedAreas).toContain('Shoulders')
        expect(result.identifiedAreas.length).toBe(3)
      })

      it('should combine contraindications from multiple areas', () => {
        const userWithMultipleIssues = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'knee and back problems',
        })
        const result = parseInjuryLimitations(userWithMultipleIssues)
        
        expect(result.contraindications.length).toBeGreaterThan(2)
        expect(result.contraindications).toContain('High-impact plyometrics') // From knees
        expect(result.contraindications).toContain('Heavy deadlifts from floor') // From back
      })

      it('should deduplicate duplicate areas', () => {
        const userWithDuplicates = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'knee pain, patella issues, knee discomfort',
        })
        const result = parseInjuryLimitations(userWithDuplicates)
        
        expect(result.identifiedAreas.filter(area => area === 'Knees')).toHaveLength(1)
      })
    })

    describe('Edge cases', () => {
      it('should handle no injury limitations', () => {
        const result = parseInjuryLimitations(mockIntermediateUser) // Has 'Minor knee discomfort'
        expect(result.identifiedAreas).toContain('Knees')
      })

      it('should handle empty injury limitations', () => {
        const userWithNoInjuries = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: '',
        })
        const result = parseInjuryLimitations(userWithNoInjuries)
        
        expect(result.identifiedAreas).toEqual([])
        expect(result.contraindications).toEqual([])
      })

      it('should handle undefined injury limitations', () => {
        const userWithUndefinedInjuries = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: undefined,
        })
        const result = parseInjuryLimitations(userWithUndefinedInjuries)
        
        expect(result.identifiedAreas).toEqual([])
        expect(result.contraindications).toEqual([])
      })

      it('should handle null injury limitations', () => {
        const userWithNullInjuries = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: null,
        })
        const result = parseInjuryLimitations(userWithNullInjuries)
        
        expect(result.identifiedAreas).toEqual([])
        expect(result.contraindications).toEqual([])
      })

      it('should handle irrelevant text', () => {
        const userWithIrrelevantText = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'I like pizza and cats',
        })
        const result = parseInjuryLimitations(userWithIrrelevantText)
        
        expect(result.identifiedAreas).toEqual([])
        expect(result.contraindications).toEqual([])
      })

      it('should handle word boundaries correctly', () => {
        const userWithFalsePositive = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'I work as a backup dancer',
        })
        const result = parseInjuryLimitations(userWithFalsePositive)
        
        // Should not detect 'back' in 'backup'
        expect(result.identifiedAreas).not.toContain('Lower Back')
      })
    })

    describe('Text processing', () => {
      it('should be case insensitive', () => {
        const upperCaseUser = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'KNEE PAIN',
        })
        const lowerCaseUser = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'knee pain',
        })
        const mixedCaseUser = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'KnEe PaIn',
        })
        
        const upperResult = parseInjuryLimitations(upperCaseUser)
        const lowerResult = parseInjuryLimitations(lowerCaseUser)
        const mixedResult = parseInjuryLimitations(mixedCaseUser)
        
        expect(upperResult).toEqual(lowerResult)
        expect(lowerResult).toEqual(mixedResult)
      })

      it('should handle punctuation and special characters', () => {
        const userWithPunctuation = createTestUserProfile(mockIntermediateUser, {
          injuriesLimitations: 'knee pain, back issues; shoulder problems!',
        })
        const result = parseInjuryLimitations(userWithPunctuation)
        
        expect(result.identifiedAreas).toContain('Knees')
        expect(result.identifiedAreas).toContain('Lower Back')
        expect(result.identifiedAreas).toContain('Shoulders')
      })
    })
  })

  describe('generateEnhancedUserProfile', () => {
    describe('Basic functionality', () => {
      it('should generate a complete enhanced profile', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        // Should include all original properties
        expect(enhanced.id).toBe(mockIntermediateUser.id)
        expect(enhanced.email).toBe(mockIntermediateUser.email)
        expect(enhanced.primary_training_focus).toBe(mockIntermediateUser.primary_training_focus)
        
        // Should include new enhanced properties
        expect(enhanced).toHaveProperty('volumeParameters')
        expect(enhanced).toHaveProperty('volumeLandmarks')
        expect(enhanced).toHaveProperty('recoveryProfile')
        expect(enhanced).toHaveProperty('weakPointAnalysis')
        expect(enhanced).toHaveProperty('rpeProfile')
        expect(enhanced).toHaveProperty('periodizationModel')
        expect(enhanced).toHaveProperty('trainingHistory')
        expect(enhanced).toHaveProperty('lifestyleFactors')
      })

      it('should integrate volume parameters correctly', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        const directParams = inferVolumeParameters(mockIntermediateUser)
        
        expect(enhanced.volumeParameters).toEqual(directParams)
      })

      it('should integrate injury parsing correctly', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        const directParsing = parseInjuryLimitations(mockIntermediateUser)
        
        expect(enhanced.weakPointAnalysis.weakPoints).toEqual(directParsing.identifiedAreas)
        expect(enhanced.trainingHistory.injuryHistory).toEqual(directParsing.identifiedAreas)
      })
    })

    describe('Volume landmarks', () => {
      it('should generate default volume landmarks', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.volumeLandmarks).toBeDefined()
        expect(enhanced.volumeLandmarks.Chest).toBeDefined()
        expect(enhanced.volumeLandmarks.Back).toBeDefined()
        expect(enhanced.volumeLandmarks.Quads).toBeDefined()
        
        // Should have proper structure
        Object.values(enhanced.volumeLandmarks).forEach(landmarks => {
          expect(landmarks).toHaveProperty('MEV')
          expect(landmarks).toHaveProperty('MAV')
          expect(landmarks).toHaveProperty('MRV')
          expect(landmarks.MEV).toBeLessThan(landmarks.MAV)
          expect(landmarks.MAV).toBeLessThan(landmarks.MRV)
        })
      })

      it('should have realistic volume values', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        Object.values(enhanced.volumeLandmarks).forEach(landmarks => {
          expect(landmarks.MEV).toBeGreaterThanOrEqual(0)
          expect(landmarks.MEV).toBeLessThan(30)
          expect(landmarks.MRV).toBeLessThan(50)
        })
      })
    })

    describe('Recovery profile', () => {
      it('should generate default recovery profile', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.recoveryProfile).toBeDefined()
        expect(enhanced.recoveryProfile).toHaveProperty('fatigueThreshold')
        expect(enhanced.recoveryProfile).toHaveProperty('recoveryRate')
        expect(enhanced.recoveryProfile).toHaveProperty('sleepQuality')
        expect(enhanced.recoveryProfile).toHaveProperty('recoveryModalities')
        
        expect(enhanced.recoveryProfile.fatigueThreshold).toBe(7)
        expect(enhanced.recoveryProfile.recoveryRate).toBe(1.0)
        expect(enhanced.recoveryProfile.sleepQuality).toBe(7)
        expect(Array.isArray(enhanced.recoveryProfile.recoveryModalities)).toBe(true)
      })
    })

    describe('RPE profile', () => {
      it('should generate default RPE profile', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.rpeProfile).toBeDefined()
        expect(enhanced.rpeProfile).toHaveProperty('sessionRPETargets')
        expect(enhanced.rpeProfile).toHaveProperty('autoregulationRules')
        
        expect(enhanced.rpeProfile.sessionRPETargets.hypertrophy).toEqual([7, 9])
        expect(enhanced.rpeProfile.sessionRPETargets.strength).toEqual([8, 10])
        
        expect(enhanced.rpeProfile.autoregulationRules.readyToGo).toBe(1)
        expect(enhanced.rpeProfile.autoregulationRules.feelingGood).toBe(0)
        expect(enhanced.rpeProfile.autoregulationRules.soreTired).toBe(-1)
      })
    })

    describe('Periodization model', () => {
      it('should generate default periodization model', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.periodizationModel).toBeDefined()
        expect(enhanced.periodizationModel).toHaveProperty('type')
        expect(enhanced.periodizationModel).toHaveProperty('phases')
        expect(enhanced.periodizationModel).toHaveProperty('adaptationTargets')
        expect(enhanced.periodizationModel).toHaveProperty('deloadProtocol')
        
        expect(enhanced.periodizationModel.type).toBe('linear')
        expect(Array.isArray(enhanced.periodizationModel.phases)).toBe(true)
        expect(enhanced.periodizationModel.phases.length).toBeGreaterThan(0)
      })

      it('should have logical phase structure', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        enhanced.periodizationModel.phases.forEach(phase => {
          expect(phase).toHaveProperty('name')
          expect(phase).toHaveProperty('duration')
          expect(phase).toHaveProperty('focus')
          expect(phase).toHaveProperty('intensityRange')
          expect(phase).toHaveProperty('volumeMultiplier')
          
          expect(phase.duration).toBeGreaterThan(0)
          expect(Array.isArray(phase.intensityRange)).toBe(true)
          expect(phase.intensityRange.length).toBe(2)
          expect(phase.volumeMultiplier).toBeGreaterThan(0)
        })
      })
    })

    describe('Training history', () => {
      it('should generate training history from inferred data', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.trainingHistory).toBeDefined()
        expect(enhanced.trainingHistory).toHaveProperty('totalTrainingTime')
        expect(enhanced.trainingHistory).toHaveProperty('injuryHistory')
        expect(enhanced.trainingHistory).toHaveProperty('peakPerformances')
        expect(enhanced.trainingHistory).toHaveProperty('trainingResponseProfile')
        
        expect(enhanced.trainingHistory.totalTrainingTime).toBe(1.25 * 12) // 15 months for intermediate
        expect(Array.isArray(enhanced.trainingHistory.injuryHistory)).toBe(true)
      })

      it('should calculate correct training time for different experience levels', () => {
        const beginnerEnhanced = generateEnhancedUserProfile(mockBeginnerUser)
        const intermediateEnhanced = generateEnhancedUserProfile(mockIntermediateUser)
        const advancedEnhanced = generateEnhancedUserProfile(mockAdvancedUser)
        
        expect(beginnerEnhanced.trainingHistory.totalTrainingTime).toBe(0.25 * 12) // 3 months
        expect(intermediateEnhanced.trainingHistory.totalTrainingTime).toBe(1.25 * 12) // 15 months
        expect(advancedEnhanced.trainingHistory.totalTrainingTime).toBe(3.0 * 12) // 36 months
      })
    })

    describe('Lifestyle factors', () => {
      it('should generate default lifestyle factors', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced.lifestyleFactors).toBeDefined()
        expect(enhanced.lifestyleFactors).toHaveProperty('occupationType')
        expect(enhanced.lifestyleFactors).toHaveProperty('averageSleepHours')
        expect(enhanced.lifestyleFactors).toHaveProperty('stressManagement')
        expect(enhanced.lifestyleFactors).toHaveProperty('nutritionAdherence')
        
        expect(enhanced.lifestyleFactors.occupationType).toBe('sedentary')
        expect(enhanced.lifestyleFactors.averageSleepHours).toBe(7)
        expect(Array.isArray(enhanced.lifestyleFactors.stressManagement)).toBe(true)
        expect(enhanced.lifestyleFactors.nutritionAdherence).toBe(5)
      })
    })

    describe('Data consistency', () => {
      it('should be deterministic for same input', () => {
        const enhanced1 = generateEnhancedUserProfile(mockIntermediateUser)
        const enhanced2 = generateEnhancedUserProfile(mockIntermediateUser)
        const enhanced3 = generateEnhancedUserProfile(mockIntermediateUser)
        
        expect(enhanced1).toEqual(enhanced2)
        expect(enhanced2).toEqual(enhanced3)
      })

      it('should handle all user profile scenarios', () => {
        allUserProfiles.forEach(user => {
          expect(() => {
            const enhanced = generateEnhancedUserProfile(user)
            expect(enhanced).toBeDefined()
            expect(enhanced.volumeParameters).toBeDefined()
            expect(enhanced.recoveryProfile).toBeDefined()
            expect(enhanced.trainingHistory).toBeDefined()
          }).not.toThrow()
        })
      })

      it('should maintain data relationships', () => {
        const enhanced = generateEnhancedUserProfile(mockIntermediateUser)
        
        // Volume parameters should match direct inference
        const directVolumeParams = inferVolumeParameters(mockIntermediateUser)
        expect(enhanced.volumeParameters).toEqual(directVolumeParams)
        
        // Injury data should be consistent
        const directInjuryData = parseInjuryLimitations(mockIntermediateUser)
        expect(enhanced.weakPointAnalysis.weakPoints).toEqual(directInjuryData.identifiedAreas)
        
        // Training history should reflect experience level
        expect(enhanced.trainingHistory.totalTrainingTime).toBe(enhanced.volumeParameters.trainingAge * 12)
      })
    })

    describe('Performance', () => {
      it('should execute quickly', () => {
        const startTime = performance.now()
        
        for (let i = 0; i < 100; i++) {
          generateEnhancedUserProfile(mockIntermediateUser)
        }
        
        const endTime = performance.now()
        const executionTime = endTime - startTime
        
        // Should complete 100 generations in under 100ms
        expect(executionTime).toBeLessThan(100)
      })

      it('should handle concurrent generation', () => {
        const promises = Array(10).fill(null).map(() => 
          Promise.resolve(generateEnhancedUserProfile(mockIntermediateUser))
        )
        
        return Promise.all(promises).then(results => {
          // All results should be identical
          const firstResult = results[0]
          results.forEach(result => {
            expect(result).toEqual(firstResult)
          })
        })
      })
    })
  })

  describe('Integration tests', () => {
    it('should work with all user profile combinations', () => {
      allUserProfiles.forEach(user => {
        expect(() => {
          const volumeParams = inferVolumeParameters(user)
          const injuryData = parseInjuryLimitations(user)
          const enhanced = generateEnhancedUserProfile(user)
          
          expect(volumeParams).toBeDefined()
          expect(injuryData).toBeDefined()
          expect(enhanced).toBeDefined()
          
          // Validate consistency
          expect(enhanced.volumeParameters).toEqual(volumeParams)
          expect(enhanced.weakPointAnalysis.weakPoints).toEqual(injuryData.identifiedAreas)
        }).not.toThrow()
      })
    })

    it('should maintain logical relationships across all functions', () => {
      const user = mockAdvancedUser
      
      const volumeParams = inferVolumeParameters(user)
      const injuryData = parseInjuryLimitations(user)
      const enhanced = generateEnhancedUserProfile(user)
      
      // Volume parameters should reflect advanced status
      expect(volumeParams.trainingAge).toBe(3.0)
      expect(volumeParams.recoveryCapacity).toBeGreaterThan(5) // Should handle high frequency well
      
      // Enhanced profile should integrate all data
      expect(enhanced.volumeParameters).toEqual(volumeParams)
      expect(enhanced.weakPointAnalysis.weakPoints).toEqual(injuryData.identifiedAreas)
      expect(enhanced.trainingHistory.totalTrainingTime).toBe(volumeParams.trainingAge * 12)
      expect(enhanced.trainingHistory.injuryHistory).toEqual(injuryData.identifiedAreas)
    })

    it('should provide realistic defaults for missing data', () => {
      const incompleteUser = createTestUserProfile(mockBeginnerUser, {
        experience_level: undefined,
        trainingFrequencyDays: undefined,
        sessionDuration: undefined,
        injuriesLimitations: undefined,
      })
      
      const enhanced = generateEnhancedUserProfile(incompleteUser)
      
      // Should still generate a complete profile with defaults
      expect(enhanced.volumeParameters.trainingAge).toBe(0.25) // Default to beginner
      expect(enhanced.volumeParameters.recoveryCapacity).toBe(3) // Default to low
      expect(enhanced.volumeParameters.stressLevel).toBe(8) // Default to high
      expect(enhanced.weakPointAnalysis.weakPoints).toEqual([]) // No injuries
      expect(enhanced.trainingHistory.injuryHistory).toEqual([]) // No injuries
    })
  })
}) 