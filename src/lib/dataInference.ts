/**
 * This module derives advanced user profiling parameters from existing onboarding data,
 * eliminating the need for additional user questions. It uses inference and
 * evidence-based defaults to construct a scientifically-grounded user profile.
 */
import {
  UserData,
  VolumeParameters,
  VolumeLandmarks,
  RecoveryProfile,
  WeakPointAnalysis,
  RPEProfile,
  PeriodizationModel,
  EnhancedUserData,
} from './types/program'

/**
 * Infers training age in years from the user's stated experience level.
 * This provides a quantitative measure for volume and progression models.
 * @param experienceLevel - User's self-reported experience.
 * @returns Training age in years.
 */
const inferTrainingAge = (experienceLevel: string = 'Beginner'): number => {
  switch (experienceLevel) {
    case 'Intermediate':
      return 1.25 // Approx 15 months
    case 'Advanced':
      return 3.0 // Approx 36 months
    case 'Beginner':
    default:
      return 0.25 // Approx 3 months
  }
}

/**
 * Infers recovery capacity on a 1-10 scale based on training frequency and duration.
 * This serves as a proxy for how well a user can handle and recover from training stress.
 * @param trainingFrequencyDays - Number of training days per week.
 * @param sessionDuration - Typical workout duration.
 * @returns A numeric recovery capacity rating (1-10).
 */
const inferRecoveryCapacity = (
  trainingFrequencyDays: number = 3,
  sessionDuration: string = '30-45 minutes'
): number => {
  let score = 0
  if (trainingFrequencyDays >= 6) score += 3
  else if (trainingFrequencyDays >= 4) score += 2
  else score += 1

  if (sessionDuration === '60-75 minutes' || sessionDuration === '75+ minutes') score += 3
  else if (sessionDuration === '45-60 minutes') score += 2
  else score += 1

  if (score >= 5) return 9 // High
  if (score >= 3) return 6 // Moderate
  return 3 // Low
}

/**
 * Infers stress level on a 1-10 scale from training frequency.
 * Rationale: Higher commitment to training frequency may indicate better
 * overall stress management or a lifestyle that can accommodate high training demands.
 * This is a proxy and should be refined with more direct user input later.
 * @param trainingFrequencyDays - Number of training days per week.
 * @returns A numeric stress level (1-10), where higher is more stress.
 */
const inferStressLevel = (trainingFrequencyDays: number = 3): number => {
  if (trainingFrequencyDays >= 6) return 3 // Low stress
  if (trainingFrequencyDays >= 4) return 6 // Moderate stress
  return 8 // High stress
}

/**
 * Infers VolumeParameters from a user's base profile.
 * This function translates qualitative onboarding answers into quantitative metrics
 * for the AI program generator.
 * @param profile - The user's base profile data.
 * @returns A `VolumeParameters` object with inferred values.
 */
export const inferVolumeParameters = (profile: UserData): VolumeParameters => {
  return {
    trainingAge: inferTrainingAge(profile.experience_level),
    recoveryCapacity: inferRecoveryCapacity(
      profile.trainingFrequencyDays,
      profile.sessionDuration
    ),
    stressLevel: inferStressLevel(profile.trainingFrequencyDays),
    /** 
     * Volume tolerance is set to a baseline average. 
     * Future iterations could adjust this based on user feedback or performance trends.
     */
    volumeTolerance: 1.0,
  }
}

/**
 * Parses the free-text `injuriesLimitations` field to identify potential weak points.
 * This uses simple keyword matching to extract structured data from user input.
 * @param profile - The user's base profile data.
 * @returns A structured object with identified areas and potential contraindications.
 */
export const parseInjuryLimitations = (
  profile: UserData
): { identifiedAreas: string[], contraindications: string[] } => {
  const text = profile.injuriesLimitations?.toLowerCase() ?? ''
  if (!text) return { identifiedAreas: [], contraindications: [] }

  const areas: Set<string> = new Set()
  const contraindications: Set<string> = new Set()

  if (/\b(knee|patella)\b/.test(text)) {
    areas.add('Knees')
    contraindications.add('High-impact plyometrics')
    contraindications.add('Deep squats if painful')
  }
  if (/\b(back|spine|disc)\b/.test(text)) {
    areas.add('Lower Back')
    contraindications.add('Heavy deadlifts from floor')
    contraindications.add('Barbell back squats')
  }
  if (/\b(shoulder|rotator cuff)\b/.test(text)) {
    areas.add('Shoulders')
    contraindications.add('Overhead pressing')
    contraindications.add('Behind-the-neck movements')
  }

  return {
    identifiedAreas: Array.from(areas),
    contraindications: Array.from(contraindications),
  }
}

// --- Default Data Generators ---
// These functions create baseline scientific parameters.
// They serve as placeholders until more sophisticated inference or user input is available.

const generateDefaultVolumeLandmarks = (): Record<string, VolumeLandmarks> => ({
  Chest: { MEV: 10, MAV: 20, MRV: 22 },
  Back: { MEV: 10, MAV: 22, MRV: 25 },
  Quads: { MEV: 8, MAV: 18, MRV: 20 },
  Hamstrings: { MEV: 6, MAV: 16, MRV: 18 },
  Shoulders: { MEV: 8, MAV: 22, MRV: 26 },
  Biceps: { MEV: 8, MAV: 18, MRV: 20 },
  Triceps: { MEV: 6, MAV: 16, MRV: 18 },
})

const generateDefaultRecoveryProfile = (): RecoveryProfile => ({
  fatigueThreshold: 7,
  recoveryRate: 1.0,
  sleepQuality: 7,
  recoveryModalities: ['Stretching', 'Hydration'],
})

const generateDefaultWeakPointAnalysis = (
  injuryData: { identifiedAreas: string[] }
): WeakPointAnalysis => ({
  strengthRatios: {},
  weakPoints: injuryData.identifiedAreas,
  correctionExercises: {},
})

const generateDefaultRPEProfile = (): RPEProfile => ({
  sessionRPETargets: {
    hypertrophy: [7, 9],
    strength: [8, 10],
  },
  autoregulationRules: {
    readyToGo: 1, // Add 1 to RPE target
    feelingGood: 0, // No change
    soreTired: -1, // Subtract 1 from RPE target
  },
})

const generateDefaultPeriodizationModel = (): PeriodizationModel => ({
  type: 'linear',
  phases: [
    { name: 'Hypertrophy Accumulation', duration: 4, focus: 'hypertrophy', intensityRange: [60, 75], volumeMultiplier: 1.0 },
    { name: 'Strength Intensification', duration: 4, focus: 'strength', intensityRange: [75, 85], volumeMultiplier: 0.9 },
  ],
  adaptationTargets: {},
  deloadProtocol: { frequency: 4, type: 'volume', reductionPercentage: 50 },
})

/**
 * Generates an enhanced user profile by combining base data with inferred parameters.
 * This is the primary function to create a complete, science-based user profile
 * ready for the AI program generator.
 *
 * @param profile - The user's base profile data from onboarding.
 * @returns An `EnhancedUserData` object with all necessary fields populated.
 */
export const generateEnhancedUserProfile = (
  profile: UserData
): EnhancedUserData => {
  const injuryData = parseInjuryLimitations(profile)

  const enhancedProfile: EnhancedUserData = {
    ...profile,
    volumeParameters: inferVolumeParameters(profile),
    volumeLandmarks: generateDefaultVolumeLandmarks(),
    recoveryProfile: generateDefaultRecoveryProfile(),
    weakPointAnalysis: generateDefaultWeakPointAnalysis(injuryData),
    rpeProfile: generateDefaultRPEProfile(),
    periodizationModel: generateDefaultPeriodizationModel(),
    trainingHistory: {
        totalTrainingTime: inferTrainingAge(profile.experience_level) * 12, // in months
        injuryHistory: injuryData.identifiedAreas,
        peakPerformances: {},
        trainingResponseProfile: {}
    },
    lifestyleFactors: {
        occupationType: 'sedentary',
        averageSleepHours: 7,
        stressManagement: [],
        nutritionAdherence: 5
    }
  }

  return enhancedProfile
} 