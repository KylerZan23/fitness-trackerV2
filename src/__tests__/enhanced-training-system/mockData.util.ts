/**
 * Comprehensive Mock Data for Enhanced Training System Tests
 * 
 * This module provides realistic user profiles and training data to test
 * various scenarios in the enhanced training system, including edge cases
 * and boundary conditions.
 * 
 * @jest-environment jsdom
 */

import {
  UserData,
  VolumeParameters,
  RecoveryProfile,
  EnhancedUserData,
  StrengthProfile,
  EnhancedTrainingProgram,
} from '@/lib/types/program'
import { 
  PeriodizationPhase,
  WeeklyProgression,
  DetailedDeloadProtocol 
} from '@/lib/periodization'
import {
  SessionFeedback,
  LoadRecommendation,
  DeloadRecommendation,
  EnhancedRPESystem
} from '@/lib/autoregulation'

// ══════════════════════════════════════════════════════════════════════════════
//                           USER PROFILE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Novice trainee with minimal experience
 */
export const mockBeginnerUser: UserData = {
  id: 'beginner-user-id',
  email: 'beginner@test.com',
  primary_training_focus: 'Build muscle',
  experience_level: 'Beginner',
  trainingFrequencyDays: 3,
  sessionDuration: '30-45 minutes',
  equipment: ['Dumbbells', 'Bodyweight'],
  exercisePreferences: 'Simple compound movements',
  injuriesLimitations: 'None',
  squat1RMEstimate: 60,
  benchPress1RMEstimate: 40,
  deadlift1RMEstimate: 80,
  overheadPress1RMEstimate: 25,
  strengthAssessmentType: 'Estimated',
  weightUnit: 'kg',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

/**
 * Intermediate trainee with solid foundation
 */
export const mockIntermediateUser: UserData = {
  id: 'intermediate-user-id',
  email: 'intermediate@test.com',
  primary_training_focus: 'Get stronger',
  experience_level: 'Intermediate',
  trainingFrequencyDays: 4,
  sessionDuration: '60-75 minutes',
  equipment: ['Dumbbells', 'Barbell', 'Pull-up bar', 'Cables'],
  exercisePreferences: 'Variety of compound and isolation',
  injuriesLimitations: 'Minor knee discomfort',
  squat1RMEstimate: 120,
  benchPress1RMEstimate: 90,
  deadlift1RMEstimate: 150,
  overheadPress1RMEstimate: 60,
  strengthAssessmentType: 'Actual 1RM',
  weightUnit: 'kg',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

/**
 * Advanced trainee with significant experience
 */
export const mockAdvancedUser: UserData = {
  id: 'advanced-user-id',
  email: 'advanced@test.com',
  primary_training_focus: 'Powerlifting',
  experience_level: 'Advanced',
  trainingFrequencyDays: 6,
  sessionDuration: '75+ minutes',
  equipment: ['Dumbbells', 'Barbell', 'Pull-up bar', 'Cables', 'Machines', 'Specialty bars'],
  exercisePreferences: 'Complex movements and periodization',
  injuriesLimitations: 'Previous lower back injury - no deficit deadlifts',
  squat1RMEstimate: 180,
  benchPress1RMEstimate: 140,
  deadlift1RMEstimate: 220,
  overheadPress1RMEstimate: 85,
  strengthAssessmentType: 'Competition verified',
  weightUnit: 'kg',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

/**
 * High-stress user with poor recovery
 */
export const mockHighStressUser: UserData = {
  id: 'highstress-user-id',
  email: 'stressed@test.com',
  primary_training_focus: 'General fitness',
  experience_level: 'Intermediate',
  trainingFrequencyDays: 2,
  sessionDuration: '30-45 minutes',
  equipment: ['Dumbbells', 'Bodyweight'],
  exercisePreferences: 'Quick and efficient',
  injuriesLimitations: 'Chronic fatigue, poor sleep',
  squat1RMEstimate: 90,
  benchPress1RMEstimate: 70,
  deadlift1RMEstimate: 110,
  overheadPress1RMEstimate: 45,
  strengthAssessmentType: 'Estimated',
  weightUnit: 'kg',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// ══════════════════════════════════════════════════════════════════════════════
//                           VOLUME PARAMETER VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mockBeginnerVolumeParams: VolumeParameters = {
  trainingAge: 0.25,
  recoveryCapacity: 6,
  stressLevel: 7,
  volumeTolerance: 0.8,
}

export const mockIntermediateVolumeParams: VolumeParameters = {
  trainingAge: 1.5,
  recoveryCapacity: 7,
  stressLevel: 5,
  volumeTolerance: 1.0,
}

export const mockAdvancedVolumeParams: VolumeParameters = {
  trainingAge: 3.0,
  recoveryCapacity: 8,
  stressLevel: 4,
  volumeTolerance: 1.2,
}

export const mockHighStressVolumeParams: VolumeParameters = {
  trainingAge: 1.0,
  recoveryCapacity: 3,
  stressLevel: 9,
  volumeTolerance: 0.6,
}

// ══════════════════════════════════════════════════════════════════════════════
//                           RECOVERY PROFILE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mockPoorRecoveryProfile: RecoveryProfile = {
  fatigueThreshold: 5,
  recoveryRate: 0.7,
  sleepQuality: 4,
  recoveryModalities: ['Caffeine'],
}

export const mockAverageRecoveryProfile: RecoveryProfile = {
  fatigueThreshold: 7,
  recoveryRate: 1.0,
  sleepQuality: 7,
  recoveryModalities: ['Stretching', 'Hydration', 'Sleep hygiene'],
}

export const mockExcellentRecoveryProfile: RecoveryProfile = {
  fatigueThreshold: 10,
  recoveryRate: 1.3,
  sleepQuality: 9,
  recoveryModalities: ['Massage', 'Cold therapy', 'Meditation', 'Optimal nutrition'],
}

// ══════════════════════════════════════════════════════════════════════════════
//                           STRENGTH PROFILE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mockBalancedStrengthProfile: StrengthProfile = {
  squat1RM: 120,
  bench1RM: 90,
  deadlift1RM: 150,
  overheadPress1RM: 60,
}

export const mockWeakPosteriorChain: StrengthProfile = {
  squat1RM: 80,
  bench1RM: 90,
  deadlift1RM: 110,
  overheadPress1RM: 60,
}

export const mockWeakHorizontalPress: StrengthProfile = {
  squat1RM: 120,
  bench1RM: 70,
  deadlift1RM: 150,
  overheadPress1RM: 55,
}

export const mockWeakVerticalPress: StrengthProfile = {
  squat1RM: 120,
  bench1RM: 90,
  deadlift1RM: 150,
  overheadPress1RM: 45,
}

// ══════════════════════════════════════════════════════════════════════════════
//                           SESSION FEEDBACK VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mockLowRPEFeedback: SessionFeedback = {
  lastSessionRPE: 6.5,
  totalVolume: 24,
  notes: 'Felt very strong today',
}

export const mockTargetRPEFeedback: SessionFeedback = {
  lastSessionRPE: 8.0,
  totalVolume: 24,
  notes: 'Right on target',
}

export const mockHighRPEFeedback: SessionFeedback = {
  lastSessionRPE: 9.5,
  totalVolume: 24,
  notes: 'Very challenging, form started breaking down',
}

export const mockFatigueRPEFeedback: SessionFeedback = {
  lastSessionRPE: 9.0,
  totalVolume: 20,
  notes: 'Feeling accumulated fatigue',
}

// ══════════════════════════════════════════════════════════════════════════════
//                           PERIODIZATION VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mockHypertrophyPhase: PeriodizationPhase = {
  name: 'Volume Accumulation',
  durationWeeks: 4,
  intensityRange: [65, 80],
  volumeProgression: 'ramping',
  primaryAdaptation: 'hypertrophy',
}

export const mockStrengthPhase: PeriodizationPhase = {
  name: 'Strength Intensification',
  durationWeeks: 3,
  intensityRange: [80, 90],
  volumeProgression: 'stable',
  primaryAdaptation: 'strength',
}

export const mockPeakingPhase: PeriodizationPhase = {
  name: 'Realization',
  durationWeeks: 2,
  intensityRange: [90, 100],
  volumeProgression: 'linear',
  primaryAdaptation: 'peaking',
}

// ══════════════════════════════════════════════════════════════════════════════
//                           RPE HISTORY PATTERNS
// ══════════════════════════════════════════════════════════════════════════════

export const mockStableRPEHistory = [7.5, 7.0, 8.0, 7.5, 8.0, 7.5]
export const mockIncreasingRPEHistory = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5]
export const mockDecreasingRPEHistory = [9.0, 8.5, 8.0, 7.5, 7.0, 6.5]
export const mockFluctuatingRPEHistory = [7.0, 9.0, 6.5, 8.5, 7.5, 8.0]

// ══════════════════════════════════════════════════════════════════════════════
//                           EDGE CASE SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * User with zero strength values (edge case)
 */
export const mockZeroStrengthProfile: StrengthProfile = {
  squat1RM: 0,
  bench1RM: 0,
  deadlift1RM: 0,
  overheadPress1RM: 0,
}

/**
 * User with extremely high training age
 */
export const mockVeteranVolumeParams: VolumeParameters = {
  trainingAge: 10,
  recoveryCapacity: 5,
  stressLevel: 6,
  volumeTolerance: 1.5,
}

/**
 * User with minimal training frequency
 */
export const mockMinimalTrainingUser: UserData = {
  ...mockBeginnerUser,
  trainingFrequencyDays: 1,
  sessionDuration: '15-30 minutes',
  id: 'minimal-user-id',
  email: 'minimal@test.com',
}

/**
 * User with maximum training frequency
 */
export const mockMaximalTrainingUser: UserData = {
  ...mockAdvancedUser,
  trainingFrequencyDays: 7,
  sessionDuration: '75+ minutes',
  id: 'maximal-user-id',
  email: 'maximal@test.com',
}

// ══════════════════════════════════════════════════════════════════════════════
//                           TEST SCENARIO COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Collection of all user profiles for comprehensive testing
 */
export const allUserProfiles = [
  mockBeginnerUser,
  mockIntermediateUser,
  mockAdvancedUser,
  mockHighStressUser,
  mockMinimalTrainingUser,
  mockMaximalTrainingUser,
]

/**
 * Collection of all volume parameters for testing
 */
export const allVolumeParameters = [
  mockBeginnerVolumeParams,
  mockIntermediateVolumeParams,
  mockAdvancedVolumeParams,
  mockHighStressVolumeParams,
  mockVeteranVolumeParams,
]

/**
 * Collection of all strength profiles for weak point testing
 */
export const allStrengthProfiles = [
  mockBalancedStrengthProfile,
  mockWeakPosteriorChain,
  mockWeakHorizontalPress,
  mockWeakVerticalPress,
  mockZeroStrengthProfile,
]

/**
 * Collection of all recovery profiles for autoregulation testing
 */
export const allRecoveryProfiles = [
  mockPoorRecoveryProfile,
  mockAverageRecoveryProfile,
  mockExcellentRecoveryProfile,
]

/**
 * Collection of all session feedback scenarios
 */
export const allSessionFeedback = [
  mockLowRPEFeedback,
  mockTargetRPEFeedback,
  mockHighRPEFeedback,
  mockFatigueRPEFeedback,
]

/**
 * Collection of all periodization phases
 */
export const allPeriodizationPhases = [
  mockHypertrophyPhase,
  mockStrengthPhase,
  mockPeakingPhase,
]

/**
 * Collection of RPE history patterns
 */
export const allRPEHistories = {
  stable: mockStableRPEHistory,
  increasing: mockIncreasingRPEHistory,
  decreasing: mockDecreasingRPEHistory,
  fluctuating: mockFluctuatingRPEHistory,
}

// ══════════════════════════════════════════════════════════════════════════════
//                           FACTORY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a user profile with specific overrides for testing
 */
export const createTestUserProfile = (
  base: UserData = mockIntermediateUser,
  overrides: Partial<UserData> = {}
): UserData => ({
  ...base,
  ...overrides,
})

/**
 * Creates volume parameters with specific overrides for testing
 */
export const createTestVolumeParams = (
  base: VolumeParameters = mockIntermediateVolumeParams,
  overrides: Partial<VolumeParameters> = {}
): VolumeParameters => ({
  ...base,
  ...overrides,
})

/**
 * Creates strength profile with specific overrides for testing
 */
export const createTestStrengthProfile = (
  base: StrengthProfile = mockBalancedStrengthProfile,
  overrides: Partial<StrengthProfile> = {}
): StrengthProfile => ({
  ...base,
  ...overrides,
})

/**
 * Creates recovery profile with specific overrides for testing
 */
export const createTestRecoveryProfile = (
  base: RecoveryProfile = mockAverageRecoveryProfile,
  overrides: Partial<RecoveryProfile> = {}
): RecoveryProfile => ({
  ...base,
  ...overrides,
})

/**
 * Creates session feedback with specific overrides for testing
 */
export const createTestSessionFeedback = (
  base: SessionFeedback = mockTargetRPEFeedback,
  overrides: Partial<SessionFeedback> = {}
): SessionFeedback => ({
  ...base,
  ...overrides,
})

// Simple test to prevent Jest from complaining about no tests
describe('Mock Data Utilities', () => {
  it('should export mock data', () => {
    expect(mockBeginnerUser).toBeDefined()
    expect(mockIntermediateUser).toBeDefined()
    expect(mockAdvancedUser).toBeDefined()
  })
}) 