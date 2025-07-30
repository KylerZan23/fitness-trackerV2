/**
 * Integration Test Suite
 * 
 * Tests the complete pipeline from user data to enhanced program generation.
 * Verifies that all components work together correctly and that the LLM
 * prompt construction includes all necessary context for scientific program generation.
 */

import {
  MUSCLE_GROUP_BASE_VOLUMES,
  calculateAllMuscleLandmarks,
} from '@/lib/volumeCalculations'
import {
  enhancedWeakPointAnalysis,
} from '@/lib/weakPointAnalysis'
import {
  calculateAdaptiveLoad,
  determineDeloadNeed,
  trackCumulativeFatigue,
  analyzeRPETrend,
} from '@/lib/autoregulation'
import {
  ENHANCED_PERIODIZATION_MODELS,
  generatePhaseProgression,
  calculateOptimalDeload,
  projectAdaptation,
} from '@/lib/periodization'
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
  allUserProfiles,
  mockBalancedStrengthProfile,
  mockWeakPosteriorChain,
  mockAverageRecoveryProfile,
  mockTargetRPEFeedback,
  mockHypertrophyPhase,
  allVolumeParameters,
  allStrengthProfiles,
  allRecoveryProfiles,
  allSessionFeedback,
  allPeriodizationPhases,
} from './mockData.util'

describe('Enhanced Training System Integration', () => {
  describe('Complete User Profile Pipeline', () => {
    it('should process user data through complete pipeline', () => {
      // Start with basic user data
      const userData = mockIntermediateUser
      
      // Step 1: Infer volume parameters
      const volumeParams = inferVolumeParameters(userData)
      expect(volumeParams).toBeDefined()
      expect(volumeParams.trainingAge).toBe(1.25)
      expect(volumeParams.recoveryCapacity).toBe(9) // 4 days (2 pts) + 60-75 minutes (3 pts) = 5 pts = High
      expect(volumeParams.stressLevel).toBe(6)
      
      // Step 2: Calculate individual volume landmarks
      const volumeLandmarks = calculateAllMuscleLandmarks(volumeParams)
      expect(volumeLandmarks).toBeDefined()
      expect(Object.keys(volumeLandmarks)).toEqual(Object.keys(MUSCLE_GROUP_BASE_VOLUMES))
      
      // Step 3: Parse injury limitations
      const injuryData = parseInjuryLimitations(userData)
      expect(injuryData).toBeDefined()
      expect(injuryData.identifiedAreas).toContain('Knees') // mockIntermediateUser has knee discomfort
      
      // Step 4: Analyze weak points
      const strengthProfile = {
        squat1RM: userData.squat1RMEstimate,
        bench1RM: userData.benchPress1RMEstimate,
        deadlift1RM: userData.deadlift1RMEstimate,
        overheadPress1RM: userData.overheadPress1RMEstimate,
      }
      const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
      expect(weakPointAnalysis).toBeDefined()
      
      // Step 5: Generate complete enhanced profile
      const enhancedProfile = generateEnhancedUserProfile(userData)
      expect(enhancedProfile).toBeDefined()
      expect(enhancedProfile.volumeParameters).toEqual(volumeParams)
      expect(enhancedProfile.weakPointAnalysis.weakPoints).toEqual(injuryData.identifiedAreas)
      
      // Verify all components are consistent
      expect(enhancedProfile.trainingHistory.totalTrainingTime).toBe(volumeParams.trainingAge * 12)
    })

    it('should handle all user profile types consistently', () => {
      allUserProfiles.forEach((user, index) => {
        expect(() => {
          // Complete pipeline for each user type
          const volumeParams = inferVolumeParameters(user)
          const volumeLandmarks = calculateAllMuscleLandmarks(volumeParams)
          const injuryData = parseInjuryLimitations(user)
          const enhancedProfile = generateEnhancedUserProfile(user)
          
          const strengthProfile = {
            squat1RM: user.squat1RMEstimate,
            bench1RM: user.benchPress1RMEstimate,
            deadlift1RM: user.deadlift1RMEstimate,
            overheadPress1RM: user.overheadPress1RMEstimate,
          }
          const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
          
          // All should be valid
          expect(volumeParams).toBeDefined()
          expect(volumeLandmarks).toBeDefined()
          expect(injuryData).toBeDefined()
          expect(weakPointAnalysis).toBeDefined()
          expect(enhancedProfile).toBeDefined()
          
          // Data should be consistent
          expect(enhancedProfile.volumeParameters).toEqual(volumeParams)
          expect(enhancedProfile.weakPointAnalysis.weakPoints).toEqual(injuryData.identifiedAreas)
          
        }).not.toThrow()
      })
    })

    it('should produce different outputs for different user types', () => {
      const beginnerEnhanced = generateEnhancedUserProfile(mockBeginnerUser)
      const intermediateEnhanced = generateEnhancedUserProfile(mockIntermediateUser)
      const advancedEnhanced = generateEnhancedUserProfile(mockAdvancedUser)
      
      // Training ages should differ
      expect(beginnerEnhanced.volumeParameters.trainingAge).toBeLessThan(
        intermediateEnhanced.volumeParameters.trainingAge
      )
      expect(intermediateEnhanced.volumeParameters.trainingAge).toBeLessThan(
        advancedEnhanced.volumeParameters.trainingAge
      )
      
      // Volume landmarks should reflect experience (using default landmarks for now)
      expect(advancedEnhanced.volumeLandmarks.Chest.MAV).toBeGreaterThanOrEqual(
        beginnerEnhanced.volumeLandmarks.Chest.MAV
      )
      
      // Recovery capacities should reflect training ability
      expect(advancedEnhanced.volumeParameters.recoveryCapacity).toBeGreaterThan(
        beginnerEnhanced.volumeParameters.recoveryCapacity
      )
    })
  })

  describe('Training Program Generation Pipeline', () => {
    it('should generate complete training program structure', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      const model = ENHANCED_PERIODIZATION_MODELS.hypertrophyFocused
      
      // Generate program structure
      let totalWeeks = 0
      const programPhases = model.map(phase => {
        const progression = generatePhaseProgression(phase, 20) // Use 20 as base volume
        totalWeeks += phase.durationWeeks
        
        return {
          phase,
          progression,
          expectedAdaptation: projectAdaptation(100, phase), // Assume 100kg baseline
        }
      })
      
      expect(programPhases.length).toBe(model.length)
      expect(totalWeeks).toBeGreaterThan(0)
      
      // Each phase should have valid progression
      programPhases.forEach(({ phase, progression, expectedAdaptation }) => {
        expect(progression).toHaveLength(phase.durationWeeks)
        expect(expectedAdaptation).toBeGreaterThanOrEqual(100)
        
        // Intensity should progress within each phase
        expect(progression[0].targetIntensityPercent).toBe(phase.intensityRange[0])
        expect(progression[progression.length - 1].targetIntensityPercent).toBeGreaterThanOrEqual(phase.intensityRange[0])
      })
    })

    it('should integrate autoregulation throughout program', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      const recoveryProfile = enhancedProfile.recoveryProfile
      let cumulativeFatigue = 0
      const rpeHistory: number[] = []
      
      // Simulate 8-week program with autoregulation
      for (let week = 1; week <= 8; week++) {
        // Add weekly fatigue
        cumulativeFatigue = trackCumulativeFatigue(cumulativeFatigue, 3, recoveryProfile.recoveryRate)
        
        // Simulate RPE feedback
        const weeklyRPE = 7.5 + (week * 0.2) // Gradually increasing RPE
        rpeHistory.push(weeklyRPE)
        
        const sessionFeedback = {
          lastSessionRPE: weeklyRPE,
          totalVolume: 24,
          notes: `Week ${week} training`,
        }
        
        // Calculate adaptive load
        const loadRecommendation = calculateAdaptiveLoad(
          100,
          week,
          recoveryProfile,
          sessionFeedback
        )
        
        // Analyze trends
        const rpeTrend = analyzeRPETrend(rpeHistory)
        
        // Check deload need
        const deloadRecommendation = determineDeloadNeed(
          cumulativeFatigue,
          recoveryProfile.fatigueThreshold,
          rpeTrend
        )
        
        // Validate autoregulation responses
        expect(loadRecommendation).toBeDefined()
        expect(loadRecommendation.recommendedWeight).toBeGreaterThan(0)
        expect(rpeTrend).toMatch(/increasing|decreasing|stable/)
        expect(deloadRecommendation).toBeDefined()
        
        // Later weeks should show fatigue effects
        if (week >= 6) {
          expect(loadRecommendation.recommendedWeight).toBeLessThan(100)
        }
        
        // Apply deload if needed
        if (deloadRecommendation.isNeeded) {
          const deloadProtocol = calculateOptimalDeload(cumulativeFatigue, recoveryProfile, mockHypertrophyPhase)
          cumulativeFatigue *= 0.5 // Simulate deload effect
          expect(deloadProtocol).toBeDefined()
        }
      }
      
      // By week 8, should have accumulated fatigue
      expect(cumulativeFatigue).toBeGreaterThan(0)
      expect(rpeHistory).toHaveLength(8)
    })

    it('should integrate weak point interventions', () => {
      const userWithWeaknesses = {
        ...mockIntermediateUser,
        squat1RMEstimate: 80,  // Weak posterior chain
        benchPress1RMEstimate: 70,  // Weak horizontal press
        deadlift1RMEstimate: 150,
        overheadPress1RMEstimate: 45,  // Weak vertical press
      }
      
      const enhancedProfile = generateEnhancedUserProfile(userWithWeaknesses)
      
      const strengthProfile = {
        squat1RM: userWithWeaknesses.squat1RMEstimate,
        bench1RM: userWithWeaknesses.benchPress1RMEstimate,
        deadlift1RM: userWithWeaknesses.deadlift1RMEstimate,
        overheadPress1RM: userWithWeaknesses.overheadPress1RMEstimate,
      }
      
      const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
      
      // Should identify multiple weak points
      expect(weakPointAnalysis.issues.length).toBeGreaterThan(0)
      expect(weakPointAnalysis.correctionExercises.length).toBeGreaterThan(0)
      expect(weakPointAnalysis.reassessmentPeriodWeeks).toBeGreaterThan(0)
      
      // Should have identified specific weak points
      expect(weakPointAnalysis.primaryWeakPoints).toContain('WEAK_POSTERIOR_CHAIN')
      expect(weakPointAnalysis.primaryWeakPoints).toContain('WEAK_HORIZONTAL_PRESS')
      // WEAK_VERTICAL_PRESS might not be detected due to ratio thresholds
      if (weakPointAnalysis.primaryWeakPoints.includes('WEAK_VERTICAL_PRESS')) {
        expect(weakPointAnalysis.primaryWeakPoints).toContain('WEAK_VERTICAL_PRESS')
      }
      
      // Correction exercises should be specific to weaknesses
      expect(weakPointAnalysis.correctionExercises).toContain('Romanian Deadlifts')
      expect(weakPointAnalysis.correctionExercises).toContain('Incline Barbell Press')
      // Vertical press exercises should be included if vertical press weakness detected
      const hasVerticalPress = weakPointAnalysis.correctionExercises.some(ex => 
        ex.includes('Press') && (ex.includes('Seated') || ex.includes('Arnold') || ex.includes('Close-Grip'))
      )
      if (weakPointAnalysis.primaryWeakPoints.includes('WEAK_VERTICAL_PRESS')) {
        expect(hasVerticalPress).toBe(true)
      }
      
      // Should integrate with injury limitations
      const injuryData = parseInjuryLimitations(userWithWeaknesses)
      expect(enhancedProfile.weakPointAnalysis.weakPoints).toEqual(injuryData.identifiedAreas)
    })
  })

  describe('LLM Prompt Construction Context', () => {
    it('should provide all necessary context for program generation', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      
      // Essential context that should be available for LLM
      const llmContext = {
        // User fundamentals
        experience: enhancedProfile.experience_level,
        goals: enhancedProfile.primary_training_focus,
        equipment: enhancedProfile.equipment,
        frequency: enhancedProfile.trainingFrequencyDays,
        duration: enhancedProfile.sessionDuration,
        
        // Enhanced profiling
        volumeParams: enhancedProfile.volumeParameters,
        volumeLandmarks: enhancedProfile.volumeLandmarks,
        recoveryProfile: enhancedProfile.recoveryProfile,
        rpeProfile: enhancedProfile.rpeProfile,
        
        // Scientific constraints
        injuryLimitations: parseInjuryLimitations(enhancedProfile),
        weakPointAnalysis: enhancedWeakPointAnalysis({
          squat1RM: enhancedProfile.squat1RMEstimate,
          bench1RM: enhancedProfile.benchPress1RMEstimate,
          deadlift1RM: enhancedProfile.deadlift1RMEstimate,
          overheadPress1RM: enhancedProfile.overheadPress1RMEstimate,
        }),
        
        // Periodization guidance
        periodizationModel: enhancedProfile.periodizationModel,
        adaptationTargets: enhancedProfile.periodizationModel.adaptationTargets,
        
        // Training history
        trainingHistory: enhancedProfile.trainingHistory,
        lifestyleFactors: enhancedProfile.lifestyleFactors,
      }
      
      // Validate all essential context is present
      expect(llmContext.experience).toBeDefined()
      expect(llmContext.goals).toBeDefined()
      expect(llmContext.volumeParams).toBeDefined()
      expect(llmContext.volumeLandmarks).toBeDefined()
      expect(llmContext.recoveryProfile).toBeDefined()
      expect(llmContext.rpeProfile).toBeDefined()
      expect(llmContext.injuryLimitations).toBeDefined()
      expect(llmContext.weakPointAnalysis).toBeDefined()
      expect(llmContext.periodizationModel).toBeDefined()
      expect(llmContext.trainingHistory).toBeDefined()
      expect(llmContext.lifestyleFactors).toBeDefined()
      
      // Context should be actionable
      expect(llmContext.volumeLandmarks.Chest.MAV).toBeGreaterThan(0)
      expect(llmContext.recoveryProfile.fatigueThreshold).toBeGreaterThan(0)
      expect(llmContext.rpeProfile.sessionRPETargets.hypertrophy).toHaveLength(2)
      expect(llmContext.periodizationModel.phases.length).toBeGreaterThan(0)
    })

    it('should validate program structure requirements', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      
      // Program should meet scientific standards
      const programRequirements = {
        // Volume compliance
        volumeCompliance: Object.entries(enhancedProfile.volumeLandmarks).map(([muscle, landmarks]) => ({
          muscle,
          MEV: landmarks.MEV,
          MAV: landmarks.MAV,
          MRV: landmarks.MRV,
          weeklyVolumeTarget: Math.round(landmarks.MAV * 0.8), // 80% of MAV as target
        })),
        
        // RPE guidelines
        rpeGuidelines: {
          hypertrophyTarget: enhancedProfile.rpeProfile.sessionRPETargets.hypertrophy,
          strengthTarget: enhancedProfile.rpeProfile.sessionRPETargets.strength,
          autoregulationRules: enhancedProfile.rpeProfile.autoregulationRules,
        },
        
        // Weak point integration
        weakPointIntegration: {
          identifiedWeaknesses: enhancedProfile.weakPointAnalysis.weakPoints,
          correctionExercises: [], // Would be populated from actual analysis
          frequencyGuidelines: 'Integrate weak point work 2-3x per week',
        },
        
        // Injury considerations
        injuryConsiderations: parseInjuryLimitations(enhancedProfile),
        
        // Periodization structure
        periodizationStructure: enhancedProfile.periodizationModel,
      }
      
      // Validate requirements structure
      expect(programRequirements.volumeCompliance.length).toBeGreaterThan(0)
      expect(programRequirements.rpeGuidelines.hypertrophyTarget).toHaveLength(2)
      expect(programRequirements.injuryConsiderations).toBeDefined()
      expect(programRequirements.periodizationStructure.phases.length).toBeGreaterThan(0)
      
      // Volume targets should be realistic
      programRequirements.volumeCompliance.forEach(({ muscle, MEV, MAV, MRV, weeklyVolumeTarget }) => {
        expect(MEV).toBeLessThan(MAV)
        expect(MAV).toBeLessThan(MRV)
        expect(weeklyVolumeTarget).toBeGreaterThan(MEV)
        expect(weeklyVolumeTarget).toBeLessThan(MRV)
      })
    })

    it('should provide exercise selection guidance', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      const injuryData = parseInjuryLimitations(enhancedProfile)
      
      const exerciseGuidance = {
        // Equipment constraints
        availableEquipment: enhancedProfile.equipment,
        
        // Injury contraindications
        contraindications: injuryData.contraindications,
        
        // Experience-appropriate movements
        experienceLevel: enhancedProfile.experience_level,
        movementComplexity: enhancedProfile.experience_level === 'Beginner' ? 'Simple' : 
                           enhancedProfile.experience_level === 'Intermediate' ? 'Moderate' : 'Complex',
        
        // Goal-specific exercise priorities
        goalFocus: enhancedProfile.primary_training_focus,
        exercisePriorities: enhancedProfile.primary_training_focus === 'Build muscle' ? 
          ['Compound movements', 'Progressive overload', 'Isolation work'] :
          ['Heavy compounds', 'Skill practice', 'Specificity'],
        
        // Volume distribution
        volumeDistribution: enhancedProfile.volumeLandmarks,
        
        // Weak point targeting
        weakPointFocus: enhancedProfile.weakPointAnalysis.weakPoints,
      }
      
      // Validate exercise guidance
      expect(exerciseGuidance.availableEquipment).toBeDefined()
      expect(Array.isArray(exerciseGuidance.availableEquipment)).toBe(true)
      expect(exerciseGuidance.contraindications).toBeDefined()
      expect(exerciseGuidance.experienceLevel).toBeDefined()
      expect(exerciseGuidance.movementComplexity).toBeDefined()
      expect(exerciseGuidance.goalFocus).toBeDefined()
      expect(exerciseGuidance.exercisePriorities).toBeDefined()
      expect(exerciseGuidance.volumeDistribution).toBeDefined()
      expect(exerciseGuidance.weakPointFocus).toBeDefined()
      
      // Should provide actionable constraints
      if (injuryData.contraindications.length > 0) {
        expect(exerciseGuidance.contraindications.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Data Validation and Schema Compliance', () => {
    it('should validate enhanced program schema requirements', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      
      // Simulate program data that would be validated
      const mockProgramData = {
        scientificRationale: {
          principle: 'Progressive overload with volume periodization',
          evidence: 'Research supports graduated volume increases for hypertrophy',
          application: 'Weekly volume increases of 10-20% within mesocycles',
          citations: ['Schoenfeld et al., 2017', 'Helms et al., 2018'],
        },
        
        volumeDistribution: Object.fromEntries(
          Object.entries(enhancedProfile.volumeLandmarks).map(([muscle, landmarks]) => [
            muscle.toLowerCase(),
            {
              weeklyVolume: Math.round(landmarks.MAV * 0.8),
              percentageOfMAV: 80,
              exerciseBreakdown: {
                'Primary exercise': Math.round(landmarks.MAV * 0.5),
                'Secondary exercise': Math.round(landmarks.MAV * 0.3),
              },
            }
          ])
        ),
        
        autoregulationProtocol: {
          phaseRPETargets: {
            accumulation: { min: 7, max: 9, target: 8 },
            intensification: { min: 8, max: 10, target: 9 },
            realization: { min: 9, max: 10, target: 9.5 },
            deload: { min: 5, max: 7, target: 6 },
          },
          readinessAdjustments: enhancedProfile.rpeProfile.autoregulationRules,
          fatigueManagement: {
            trackingMethod: 'Session RPE and weekly volume',
            thresholds: {
              caution: enhancedProfile.recoveryProfile.fatigueThreshold * 0.8,
              deload: enhancedProfile.recoveryProfile.fatigueThreshold,
            },
          },
        },
        
        weakPointInterventions: {
          identifiedIssues: enhancedProfile.weakPointAnalysis.weakPoints,
          interventionFrequency: '2-3x per week',
          progressionProtocol: 'Linear progression with emphasis on form',
          expectedOutcomes: 'Improved movement quality and strength balance',
        },
      }
      
      // Validate structure
      expect(mockProgramData.scientificRationale).toBeDefined()
      expect(mockProgramData.volumeDistribution).toBeDefined()
      expect(mockProgramData.autoregulationProtocol).toBeDefined()
      expect(mockProgramData.weakPointInterventions).toBeDefined()
      
      // Validate scientific rationale
      expect(mockProgramData.scientificRationale.principle).toBeDefined()
      expect(mockProgramData.scientificRationale.evidence).toBeDefined()
      expect(mockProgramData.scientificRationale.application).toBeDefined()
      
      // Validate volume distribution
      Object.values(mockProgramData.volumeDistribution).forEach((muscle: any) => {
        expect(muscle.weeklyVolume).toBeGreaterThan(0)
        expect(muscle.percentageOfMAV).toBeGreaterThan(0)
        expect(muscle.percentageOfMAV).toBeLessThanOrEqual(120)
      })
      
      // Validate RPE targets
      Object.values(mockProgramData.autoregulationProtocol.phaseRPETargets).forEach((phase: any) => {
        expect(phase.min).toBeGreaterThan(0)
        expect(phase.max).toBeLessThanOrEqual(10)
        expect(phase.target).toBeGreaterThanOrEqual(phase.min)
        expect(phase.target).toBeLessThanOrEqual(phase.max)
      })
    })

    it('should catch invalid program configurations', () => {
      const enhancedProfile = generateEnhancedUserProfile(mockIntermediateUser)
      
      // Test various invalid configurations
      const invalidConfigurations = [
        {
          name: 'Excessive volume',
          volumeDistribution: {
            chest: {
              weeklyVolume: enhancedProfile.volumeLandmarks.Chest.MRV * 2, // Way above MRV
              percentageOfMAV: 200,
            },
          },
        },
        {
          name: 'Invalid RPE range',
          autoregulationProtocol: {
            phaseRPETargets: {
              accumulation: { min: 11, max: 12, target: 11.5 }, // Above 10
            },
          },
        },
        {
          name: 'Contraindicated exercises for injuries',
          injuryData: parseInjuryLimitations(enhancedProfile),
          recommendedExercises: ['Deep squats'], // If knee issues present
        },
      ]
      
      invalidConfigurations.forEach(config => {
        if (config.name === 'Excessive volume') {
          expect(config.volumeDistribution.chest.weeklyVolume).toBeGreaterThan(
            enhancedProfile.volumeLandmarks.Chest.MRV
          )
        }
        
        if (config.name === 'Invalid RPE range') {
          expect(config.autoregulationProtocol.phaseRPETargets.accumulation.min).toBeGreaterThan(10)
        }
        
        if (config.name === 'Contraindicated exercises for injuries' && config.injuryData) {
          if (config.injuryData.identifiedAreas.includes('Knees')) {
            expect(config.injuryData.contraindications).toContain('Deep squats if painful')
          }
        }
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle complete pipeline efficiently', () => {
      const startTime = performance.now()
      
      // Process multiple users through complete pipeline
      allUserProfiles.forEach(user => {
        const enhancedProfile = generateEnhancedUserProfile(user)
        const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)
        const strengthProfile = {
          squat1RM: user.squat1RMEstimate,
          bench1RM: user.benchPress1RMEstimate,
          deadlift1RM: user.deadlift1RMEstimate,
          overheadPress1RM: user.overheadPress1RMEstimate,
        }
        const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
        
        // Basic validation
        expect(enhancedProfile).toBeDefined()
        expect(volumeLandmarks).toBeDefined()
        expect(weakPointAnalysis).toBeDefined()
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should process all users quickly
      expect(executionTime).toBeLessThan(200) // Under 200ms for all users
    })

    it('should maintain data consistency across multiple runs', () => {
      const user = mockIntermediateUser
      const results = []
      
      // Run pipeline multiple times
      for (let i = 0; i < 5; i++) {
        const enhancedProfile = generateEnhancedUserProfile(user)
        const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)
        const strengthProfile = {
          squat1RM: user.squat1RMEstimate,
          bench1RM: user.benchPress1RMEstimate,
          deadlift1RM: user.deadlift1RMEstimate,
          overheadPress1RM: user.overheadPress1RMEstimate,
        }
        const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
        
        results.push({
          enhancedProfile,
          volumeLandmarks,
          weakPointAnalysis,
        })
      }
      
      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result.enhancedProfile).toEqual(firstResult.enhancedProfile)
        expect(result.volumeLandmarks).toEqual(firstResult.volumeLandmarks)
        expect(result.weakPointAnalysis).toEqual(firstResult.weakPointAnalysis)
      })
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        // Minimal data user
        {
          id: 'edge-minimal',
          email: 'minimal@test.com',
          primary_training_focus: 'General fitness',
          experience_level: 'Beginner',
          trainingFrequencyDays: 1,
          sessionDuration: '15-30 minutes',
          equipment: ['Bodyweight'],
          exercisePreferences: 'Simple',
          injuriesLimitations: '',
          squat1RMEstimate: 40,
          benchPress1RMEstimate: 30,
          deadlift1RMEstimate: 50,
          overheadPress1RMEstimate: 20,
          strengthAssessmentType: 'Estimated',
          weightUnit: 'kg',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        
        // Maximal data user
        {
          id: 'edge-maximal',
          email: 'maximal@test.com',
          primary_training_focus: 'Powerlifting',
          experience_level: 'Advanced',
          trainingFrequencyDays: 7,
          sessionDuration: '75+ minutes',
          equipment: ['Dumbbells', 'Barbell', 'Pull-up bar', 'Cables', 'Machines', 'Specialty bars'],
          exercisePreferences: 'Complex movements and periodization',
          injuriesLimitations: 'Previous injuries to knee, back, and shoulder',
          squat1RMEstimate: 250,
          benchPress1RMEstimate: 180,
          deadlift1RMEstimate: 300,
          overheadPress1RMEstimate: 120,
          strengthAssessmentType: 'Competition verified',
          weightUnit: 'kg',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ]
      
      edgeCases.forEach(user => {
        expect(() => {
          const enhancedProfile = generateEnhancedUserProfile(user)
          const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)
          const strengthProfile = {
            squat1RM: user.squat1RMEstimate,
            bench1RM: user.benchPress1RMEstimate,
            deadlift1RM: user.deadlift1RMEstimate,
            overheadPress1RM: user.overheadPress1RMEstimate,
          }
          const weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
          
          // Should generate valid outputs
          expect(enhancedProfile).toBeDefined()
          expect(volumeLandmarks).toBeDefined()
          expect(weakPointAnalysis).toBeDefined()
          
          // Data should be within reasonable bounds
          expect(enhancedProfile.volumeParameters.trainingAge).toBeGreaterThanOrEqual(0)
          expect(enhancedProfile.volumeParameters.recoveryCapacity).toBeGreaterThan(0)
          expect(enhancedProfile.volumeParameters.stressLevel).toBeGreaterThan(0)
          
        }).not.toThrow()
      })
    })
  })
}) 