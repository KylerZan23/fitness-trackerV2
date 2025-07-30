'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { type OnboardingData } from '@/lib/types/onboarding'
import { type FullOnboardingAnswers } from './onboardingActions'
import { callLLM } from '@/lib/llmService'
import { mapGoalToTrainingFocus } from '@/lib/utils/goalToFocusMapping'
import {
  type TrainingProgram,
  type TrainingPhase,
  type TrainingWeek,
  type WorkoutDay,
  type ExerciseDetail,
  DayOfWeek,
  type WorkoutFocus,
} from '@/lib/types/program'
import {
  // Enhanced Science-Based Guidelines
  VOLUME_FRAMEWORK_GUIDELINES,
  AUTOREGULATION_GUIDELINES,
  PERIODIZATION_GUIDELINES,
  WEAK_POINT_INTERVENTION_GUIDELINES,
  FATIGUE_MANAGEMENT_GUIDELINES,
  EXERCISE_SELECTION_GUIDELINES,
  // Legacy Guidelines (maintained for compatibility)
  MUSCLE_GAIN_BEGINNER_GUIDELINES,
  MUSCLE_GAIN_INTERMEDIATE_GUIDELINES,
  MUSCLE_GAIN_ADVANCED_GUIDELINES,
  MUSCLE_GAIN_HYPERTROPHY_FOCUS_BEGINNER_GUIDELINES,
  MUSCLE_GAIN_HYPERTROPHY_FOCUS_INTERMEDIATE_GUIDELINES,
  MUSCLE_GAIN_HYPERTROPHY_FOCUS_ADVANCED_GUIDELINES,
  STRENGTH_GAIN_BEGINNER_GUIDELINES,
  STRENGTH_GAIN_INTERMEDIATE_GUIDELINES,
  STRENGTH_GAIN_ADVANCED_GUIDELINES,
  STRENGTH_GAIN_POWERLIFTING_PEAK_BEGINNER_GUIDELINES,
  STRENGTH_GAIN_POWERLIFTING_PEAK_INTERMEDIATE_GUIDELINES,
  STRENGTH_GAIN_POWERLIFTING_PEAK_ADVANCED_GUIDELINES,
  ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES,
  ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES,
  ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES,
  ENDURANCE_IMPROVEMENT_GYM_CARDIO_BEGINNER_GUIDELINES,
  ENDURANCE_IMPROVEMENT_GYM_CARDIO_INTERMEDIATE_GUIDELINES,
  ENDURANCE_IMPROVEMENT_GYM_CARDIO_ADVANCED_GUIDELINES,
  SPORT_PERFORMANCE_BEGINNER_GUIDELINES,
  SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES,
  SPORT_PERFORMANCE_ADVANCED_GUIDELINES,
  SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_BEGINNER_GUIDELINES,
  SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_INTERMEDIATE_GUIDELINES,
  SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_ADVANCED_GUIDELINES,
  GENERAL_FITNESS_BEGINNER_GUIDELINES,
  GENERAL_FITNESS_INTERMEDIATE_GUIDELINES,
  GENERAL_FITNESS_ADVANCED_GUIDELINES,
  GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_BEGINNER_GUIDELINES,
  GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_INTERMEDIATE_GUIDELINES,
  GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_ADVANCED_GUIDELINES,
  WEIGHT_LOSS_GYM_BASED_BEGINNER_GUIDELINES,
  WEIGHT_LOSS_GYM_BASED_INTERMEDIATE_GUIDELINES,
  WEIGHT_LOSS_GYM_BASED_ADVANCED_GUIDELINES,
  BODYWEIGHT_MASTERY_BEGINNER_GUIDELINES,
  BODYWEIGHT_MASTERY_INTERMEDIATE_GUIDELINES,
  BODYWEIGHT_MASTERY_ADVANCED_GUIDELINES,
  RECOMPOSITION_LEAN_MASS_FAT_LOSS_BEGINNER_GUIDELINES,
  RECOMPOSITION_LEAN_MASS_FAT_LOSS_INTERMEDIATE_GUIDELINES,
  RECOMPOSITION_LEAN_MASS_FAT_LOSS_ADVANCED_GUIDELINES,
  NEURAL_COACHING_CUES,
} from '@/lib/llmProgramContent'

// Enhanced Data Analysis Modules
import { generateEnhancedUserProfile } from '@/lib/dataInference'
import { calculateAllMuscleLandmarks, calculateIndividualVolumeLandmarks } from '@/lib/volumeCalculations'
import { calculateAdaptiveLoad, determineDeloadNeed, analyzeRPETrend } from '@/lib/autoregulation'
import { enhancedWeakPointAnalysis, type StrengthProfile } from '@/lib/weakPointAnalysis'
import { ENHANCED_PERIODIZATION_MODELS, generatePhaseProgression } from '@/lib/periodization'
import { type EnhancedUserData, type UserData } from '@/lib/types/program'
import { 
  ENHANCED_PROGRAM_VALIDATION,
  validateEnhancedProgram,
  validateVolumeCompliance,
  validateRPETargets,
  validateWeakPointAddressing,
  type EnhancedTrainingProgram,
  type ValidationResult
} from '@/lib/validation/enhancedProgramSchema'

/**
 * Zod schemas for validating LLM-generated training program data
 */

const WorkoutFocusEnum = z.enum([
  'Upper Body',
  'Lower Body',
  'Push',
  'Pull',
  'Legs',
  'Full Body',
  'Cardio',
  'Core',
  'Arms',
  'Back',
  'Chest',
  'Shoulders',
  'Glutes',
  'Recovery/Mobility',
  'Sport-Specific',
  'Rest Day',
  'Lower Body Endurance',
  // Lift-specific focuses commonly returned by LLM
  'Squat',
  'Bench',
  'Deadlift',
  'Overhead Press',
])

const ExerciseDetailSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.union([z.string(), z.number()]),
  rest: z.string(),
  tempo: z.string().optional(),
  rpe: z.number().optional(),
  notes: z.string().optional(),
  weight: z.string().optional(),
  category: z
    .enum(['Compound', 'Isolation', 'Cardio', 'Mobility', 'Core', 'Warm-up', 'Cool-down', 'Power'])
    .optional(),
})

const WorkoutDaySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  focus: WorkoutFocusEnum.optional(),
  exercises: z.array(ExerciseDetailSchema),
  warmUp: z.array(ExerciseDetailSchema).optional(),
  coolDown: z.array(ExerciseDetailSchema).optional(),
  notes: z.string().optional(),
  estimatedDurationMinutes: z.number().optional(),
  isRestDay: z.boolean().optional(),
})

const TrainingWeekSchema = z.object({
  weekNumber: z.number(),
  days: z.array(WorkoutDaySchema),
  notes: z.string().optional(),
  weekInPhase: z.number().optional(),
  weeklyGoals: z.array(z.string()).optional(),
  progressionStrategy: z.string().optional(),
  coachTip: z.string().optional(),
})

const TrainingPhaseSchema = z.object({
  phaseName: z.string(),
  durationWeeks: z.number(),
  weeks: z.array(TrainingWeekSchema),
  notes: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  phaseNumber: z.number().optional(),
  progressionStrategy: z.string().optional(),
})

const TrainingProgramSchema = z.object({
  programName: z.string(),
  description: z.string(),
  durationWeeksTotal: z.number(),
  phases: z.array(TrainingPhaseSchema),
  generalAdvice: z.string().optional(),
  coachIntro: z.string().optional(),
  generatedAt: z.union([z.date(), z.string()]),
  aiModelUsed: z.string().optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  trainingFrequency: z.number().optional(),
  requiredEquipment: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
})

/**
 * Server action response type for program generation
 */
type ProgramGenerationResponse =
  | { program: TrainingProgram; success: true }
  | { error: string; success: false }

/**
 * User profile interface for program generation
 */
interface UserProfileForGeneration {
  id: string
  name: string
  age: number
  weight_unit?: string
  primary_training_focus: string | null
  experience_level: string | null
  onboarding_responses: OnboardingData | null
}

interface User {
  id: string;
  user_metadata: {
    name?: string;
  };
  // Add other user properties as needed
}

/**
 * Generate the TypeScript interface definitions as text for the LLM prompt
 */
function getTypeScriptInterfaceDefinitions(): string {
  return `
// TrainingProgram interface - output must be valid JSON matching this structure:

interface TrainingProgram {
  programName: string;
  description: string;
  durationWeeksTotal: number;
  phases: TrainingPhase[];
  generalAdvice?: string;
  coachIntro?: string;
  generatedAt: string; // ISO date string
  aiModelUsed?: string;
  difficultyLevel?: "Beginner" | "Intermediate" | "Advanced";
  trainingFrequency?: number;
  requiredEquipment?: string[];
  tags?: string[];
  version?: string;
}

interface TrainingPhase {
  phaseName: string;
  durationWeeks: number;
  weeks: TrainingWeek[];
  notes?: string;
  objectives?: string[];
  phaseNumber?: number;
  progressionStrategy?: string;
}

interface TrainingWeek {
  weekNumber: number;
  days: WorkoutDay[];
  notes?: string;
  weekInPhase?: number;
  weeklyGoals?: string[];
  progressionStrategy?: string;
  coachTip?: string;
}

interface WorkoutDay {
  dayOfWeek: number; // 1-7 (Monday=1)
  focus?: "Upper Body" | "Lower Body" | "Push" | "Pull" | "Legs" | "Full Body" | "Cardio" | "Core" | "Arms" | "Back" | "Chest" | "Shoulders" | "Glutes" | "Recovery/Mobility" | "Sport-Specific" | "Rest Day" | "Lower Body Endurance" | "Squat" | "Bench" | "Deadlift" | "Overhead Press";
  exercises: ExerciseDetail[];
  warmUp?: ExerciseDetail[];
  coolDown?: ExerciseDetail[];
  notes?: string;
  estimatedDurationMinutes?: number;
  isRestDay?: boolean;
}

interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
  tempo?: string;
  rpe?: number;
  notes?: string;
  weight?: string;
  category?: "Compound" | "Isolation" | "Cardio" | "Mobility" | "Core" | "Warm-up" | "Cool-down" | "Power";
}
`
}

/**
 * Helper function to select guidelines based on user's training focus and experience level
 */
function getExpertGuidelines(
  trainingFocus: string | null,
  experienceLevel: string | null
): string {
  const focus = trainingFocus || 'General Fitness: Foundational Strength'; // Default if null
  const level = experienceLevel?.toLowerCase() || 'beginner'; // Default if null

  // Normalize experience level string to match constant suffixes
  let normalizedLevelKey: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER';
  if (level.includes('intermediate')) {
    normalizedLevelKey = 'INTERMEDIATE';
  } else if (level.includes('advanced')) {
    normalizedLevelKey = 'ADVANCED';
  }

  // Map specific FitnessGoal types to their corresponding guidelines
  if (focus === 'Muscle Gain: General') {
    if (normalizedLevelKey === 'BEGINNER') return MUSCLE_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return MUSCLE_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return MUSCLE_GAIN_ADVANCED_GUIDELINES;
  } else if (focus === 'Muscle Gain: Hypertrophy Focus') {
    if (normalizedLevelKey === 'BEGINNER') return MUSCLE_GAIN_HYPERTROPHY_FOCUS_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return MUSCLE_GAIN_HYPERTROPHY_FOCUS_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return MUSCLE_GAIN_HYPERTROPHY_FOCUS_ADVANCED_GUIDELINES;
  } else if (focus === 'Strength Gain: General') {
    if (normalizedLevelKey === 'BEGINNER') return STRENGTH_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return STRENGTH_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return STRENGTH_GAIN_ADVANCED_GUIDELINES;
  } else if (focus === 'Strength Gain: Powerlifting Peak') {
    if (normalizedLevelKey === 'BEGINNER') return STRENGTH_GAIN_POWERLIFTING_PEAK_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return STRENGTH_GAIN_POWERLIFTING_PEAK_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return STRENGTH_GAIN_POWERLIFTING_PEAK_ADVANCED_GUIDELINES;
  } else if (focus === 'Endurance Improvement: Gym Cardio') {
    if (normalizedLevelKey === 'BEGINNER') return ENDURANCE_IMPROVEMENT_GYM_CARDIO_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return ENDURANCE_IMPROVEMENT_GYM_CARDIO_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return ENDURANCE_IMPROVEMENT_GYM_CARDIO_ADVANCED_GUIDELINES;
  } else if (focus === 'Sport-Specific S&C: Explosive Power') {
    if (normalizedLevelKey === 'BEGINNER') return SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return SPORT_SPECIFIC_SC_EXPLOSIVE_POWER_ADVANCED_GUIDELINES;
  } else if (focus === 'General Fitness: Foundational Strength') {
    if (normalizedLevelKey === 'BEGINNER') return GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_ADVANCED_GUIDELINES;
  } else if (focus === 'Weight Loss: Gym Based') {
    if (normalizedLevelKey === 'BEGINNER') return WEIGHT_LOSS_GYM_BASED_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return WEIGHT_LOSS_GYM_BASED_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return WEIGHT_LOSS_GYM_BASED_ADVANCED_GUIDELINES;
  } else if (focus === 'Bodyweight Mastery') {
    if (normalizedLevelKey === 'BEGINNER') return BODYWEIGHT_MASTERY_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return BODYWEIGHT_MASTERY_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return BODYWEIGHT_MASTERY_ADVANCED_GUIDELINES;
  } else if (focus === 'Recomposition: Lean Mass & Fat Loss') {
    if (normalizedLevelKey === 'BEGINNER') return RECOMPOSITION_LEAN_MASS_FAT_LOSS_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return RECOMPOSITION_LEAN_MASS_FAT_LOSS_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return RECOMPOSITION_LEAN_MASS_FAT_LOSS_ADVANCED_GUIDELINES;
  }

  // Legacy support for old string-based matching (for backward compatibility)
  const focusLower = focus.toLowerCase();
  if (focusLower.includes('muscle gain') || focusLower.includes('bodybuilding')) {
    if (normalizedLevelKey === 'BEGINNER') return MUSCLE_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return MUSCLE_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return MUSCLE_GAIN_ADVANCED_GUIDELINES;
  } else if (focusLower.includes('strength gain') || focusLower.includes('powerlifting') || focusLower.includes('beginner strength')) {
    if (normalizedLevelKey === 'BEGINNER') return STRENGTH_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return STRENGTH_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return STRENGTH_GAIN_ADVANCED_GUIDELINES;
  } else if (focusLower.includes('endurance')) {
    if (normalizedLevelKey === 'BEGINNER') return ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES;
  } else if (focusLower.includes('sport performance') || focusLower.includes('athletic performance')) {
    if (normalizedLevelKey === 'BEGINNER') return SPORT_PERFORMANCE_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return SPORT_PERFORMANCE_ADVANCED_GUIDELINES;
  } else if (focusLower.includes('general fitness') || focusLower.includes('weight loss')) {
    if (normalizedLevelKey === 'BEGINNER') return GENERAL_FITNESS_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return GENERAL_FITNESS_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return GENERAL_FITNESS_ADVANCED_GUIDELINES;
  }

  // Fallback if no specific match is found
  console.warn(
    `No specific guidelines found for focus "${focus}" and level "${level}". Falling back to General Fitness Foundational Strength Beginner.`
  );
  return GENERAL_FITNESS_FOUNDATIONAL_STRENGTH_BEGINNER_GUIDELINES;
}

/**
 * Interface for weak point analysis input
 */
interface WeakPointAnalysisInput {
  squat?: number
  bench?: number
  deadlift?: number
  ohp?: number
  experienceLevel?: string
  primaryGoal?: string
  injuriesLimitations?: string
  strengthAssessmentType?: string
}

/**
 * Interface for weak point analysis result
 */
interface WeakPointAnalysisResult {
  primaryWeakPoint: string
  secondaryWeakPoint?: string
  weakPointDescription: string
  recommendedAccessories: string[]
  rationale: string
}

/**
 * Analyze user's weak points based on strength ratios and profile data
 */
function analyzeWeakPoints(input: WeakPointAnalysisInput): WeakPointAnalysisResult {
  const { squat, bench, deadlift, ohp, experienceLevel, primaryGoal, injuriesLimitations } = input
  
  // Default fallback for insufficient data
  const defaultResult: WeakPointAnalysisResult = {
    primaryWeakPoint: 'General Muscle Balance',
    weakPointDescription: 'Focus on balanced muscle development',
    recommendedAccessories: ['Face Pulls', 'Band Pull-Aparts', 'Plank variations'],
    rationale: 'Without sufficient strength data, prioritizing general muscle balance and postural health'
  }

  // If we don't have at least 2 lift estimates, return general balance focus
  const availableLifts = [squat, bench, deadlift, ohp].filter(lift => lift && lift > 0)
  if (availableLifts.length < 2) {
    return defaultResult
  }

  const weakPoints: Array<{ priority: number; result: WeakPointAnalysisResult }> = []

  // Posterior Chain Analysis (Deadlift vs Squat)
  if (deadlift && squat && deadlift > 0 && squat > 0) {
    const deadliftToSquatRatio = deadlift / squat
    // Typical ratio should be 1.2-1.3 for most lifters
    if (deadliftToSquatRatio < 1.1) {
      weakPoints.push({
        priority: 1,
        result: {
          primaryWeakPoint: 'Posterior Chain Weakness',
          weakPointDescription: 'Deadlift strength significantly lower than squat strength',
          recommendedAccessories: [
            'Romanian Deadlifts',
            'Good Mornings', 
            'Glute Ham Raises',
            'Hip Thrusts',
            'Single-leg Romanian Deadlifts'
          ],
          rationale: `Deadlift to squat ratio of ${deadliftToSquatRatio.toFixed(2)} indicates posterior chain weakness (target: 1.2-1.3)`
        }
      })
    }
  }

  // Upper Body Pressing Analysis (Bench vs Overall)
  if (bench && squat && bench > 0 && squat > 0) {
    const benchToSquatRatio = bench / squat
    // Typical ratio should be 0.6-0.8 for most lifters
    if (benchToSquatRatio < 0.5) {
      weakPoints.push({
        priority: 2,
        result: {
          primaryWeakPoint: 'Upper Body Pressing Weakness',
          weakPointDescription: 'Bench press strength disproportionately low compared to squat',
          recommendedAccessories: [
            'Close-Grip Bench Press',
            'Incline Dumbbell Press',
            'Tricep Dips',
            'Push-up variations',
            'Tricep-focused work'
          ],
          rationale: `Bench to squat ratio of ${benchToSquatRatio.toFixed(2)} indicates upper body pressing weakness (target: 0.6-0.8)`
        }
      })
    }
  }

  // Overhead Strength Analysis (OHP vs Bench)
  if (ohp && bench && ohp > 0 && bench > 0) {
    const ohpToBenchRatio = ohp / bench
    // Typical ratio should be 0.6-0.7 for most lifters
    if (ohpToBenchRatio < 0.5) {
      weakPoints.push({
        priority: 3,
        result: {
          primaryWeakPoint: 'Overhead Pressing Weakness',
          weakPointDescription: 'Overhead press strength significantly lower than bench press',
          recommendedAccessories: [
            'Seated Dumbbell Press',
            'Pike Push-ups',
            'Lateral Raises',
            'Face Pulls',
            'Band Pull-Aparts',
            'Shoulder stability work'
          ],
          rationale: `OHP to bench ratio of ${ohpToBenchRatio.toFixed(2)} indicates overhead pressing and shoulder stability weakness (target: 0.6-0.7)`
        }
      })
    }
  }

  // Push/Pull Imbalance Analysis
  if (bench && !injuriesLimitations?.toLowerCase().includes('shoulder')) {
    weakPoints.push({
      priority: 4,
      result: {
        primaryWeakPoint: 'Push/Pull Imbalance',
        weakPointDescription: 'Modern lifestyle and gym training often create anterior dominance',
        recommendedAccessories: [
          'Face Pulls',
          'Band Pull-Aparts',
          'Rear Delt Flyes',
          'Wall Angels',
          'Thoracic spine mobility work'
        ],
        rationale: 'Proactive approach to prevent rounded shoulders and improve posture from excessive pressing'
      }
    })
  }

  // Core Stability for Advanced Lifters
  if (experienceLevel === 'Advanced' && squat && squat > 150) { // Assuming kg
    weakPoints.push({
      priority: 5,
      result: {
        primaryWeakPoint: 'Core Stability Enhancement',
        weakPointDescription: 'Advanced lifters benefit from targeted core stability work',
        recommendedAccessories: [
          'Pallof Press',
          'Dead Bug variations',
          'Bird Dog',
          'Single-arm/single-leg carries',
          'Anti-extension planks'
        ],
        rationale: 'High strength levels require proportional core stability for continued progress and injury prevention'
      }
    })
  }

  // Goal-Specific Weak Points
  if (primaryGoal?.includes('Hypertrophy') || primaryGoal?.includes('Muscle Gain')) {
    weakPoints.push({
      priority: 6,
      result: {
        primaryWeakPoint: 'Muscle Group Specialization',
        weakPointDescription: 'Hypertrophy goals benefit from targeted weak muscle group development',
        recommendedAccessories: [
          'Bicep Curls',
          'Lateral Raises',
          'Calf Raises',
          'Rear Delt work',
          'Tricep isolation'
        ],
        rationale: 'Hypertrophy focus requires attention to smaller muscle groups often undertrained in compound movements'
      }
    })
  }

  // Injury-Specific Considerations
  if (injuriesLimitations) {
    const injuryLower = injuriesLimitations.toLowerCase()
    if (injuryLower.includes('knee')) {
      weakPoints.push({
        priority: 2,
        result: {
          primaryWeakPoint: 'Knee Stability & Hip Mobility',
          weakPointDescription: 'Previous knee issues require focused stability and mobility work',
          recommendedAccessories: [
            'Clamshells',
            'Glute Bridges',
            'Hip Flexor Stretches',
            'Terminal Knee Extensions',
            'Single-leg stability work'
          ],
          rationale: 'Knee injury history requires proactive hip stability and mobility maintenance'
        }
      })
    } else if (injuryLower.includes('back') || injuryLower.includes('spine')) {
      weakPoints.push({
        priority: 1,
        result: {
          primaryWeakPoint: 'Spinal Stability & Core',
          weakPointDescription: 'Back injury history requires careful core and spinal stability work',
          recommendedAccessories: [
            'Dead Bug',
            'Bird Dog',
            'McGill Big 3',
            'Cat-Cow stretches',
            'Hip flexor stretches'
          ],
          rationale: 'Back injury history requires conservative approach with evidence-based spinal stability exercises'
        }
      })
    } else if (injuryLower.includes('shoulder')) {
      weakPoints.push({
        priority: 2,
        result: {
          primaryWeakPoint: 'Shoulder Health & Stability',
          weakPointDescription: 'Shoulder injury history requires targeted stability and mobility work',
          recommendedAccessories: [
            'Band Pull-Aparts',
            'Wall Slides',
            'Shoulder Dislocations with Band',
            'External Rotations',
            'Face Pulls'
          ],
          rationale: 'Shoulder injury history requires proactive stability and mobility maintenance'
        }
      })
    }
  }

  // Return highest priority weak point, or default if none identified
  if (weakPoints.length > 0) {
    const prioritizedWeakPoint = weakPoints.sort((a, b) => a.priority - b.priority)[0]
    return prioritizedWeakPoint.result
  }

  return defaultResult
}

/**
 * Helper function to select appropriate periodization model based on experience and goals
 */
function selectPeriodizationModel(experienceLevel: string, primaryGoal: string): string {
  // Strength-focused goals benefit from strength-focused periodization
  if (primaryGoal.includes('Strength Gain') || primaryGoal.includes('Powerlifting')) {
    return 'Strength-Focused Block Periodization'
  }
  
  // Hypertrophy goals benefit from hypertrophy-focused models
  if (primaryGoal.includes('Muscle Gain') || primaryGoal.includes('Hypertrophy')) {
    return 'Hypertrophy-Focused Block Periodization'
  }
  
  // General fitness uses simpler linear models
  if (primaryGoal.includes('General Fitness') || experienceLevel === 'Beginner') {
    return 'Linear Progression Model'
  }
  
  // Default to balanced approach
  return 'Balanced Block Periodization'
}

/**
 * Helper function to generate autoregulation notes based on user profile
 */
function generateAutoregulationNotes(rpeProfile: any, recoveryProfile: any): string {
  return `RPE Target Ranges:
- Accumulation Phase: 6-8 RPE (emphasizing volume)
- Intensification Phase: 7-9 RPE (emphasizing load)
- Realization Phase: 8-10 RPE (peaking activities)
- Deload Phase: 4-6 RPE (restoration focus)

Daily Adjustments:
- High readiness days: Add 2-5% load or 1-2 sets
- Normal readiness: Execute planned session
- Low readiness: Reduce intensity 10-20% or volume 20-30%
- Very low readiness: Active recovery or complete rest

Recovery Capacity: ${recoveryProfile.recoveryRate}/2.0 (1.0 = average)
Fatigue Threshold: ${recoveryProfile.fatigueThreshold}/10`
}

/**
 * Enhanced User Data Processing Pipeline
 * Processes onboarding data through scientific analysis modules to generate
 * comprehensive user profiling with volume landmarks, weak point analysis,
 * and autoregulation protocols.
 */
interface EnhancedProcessingResult {
  enhancedProfile: EnhancedUserData
  volumeLandmarks: Record<string, any>
  weakPointAnalysis: any | null
  periodizationModel: string
  autoregulationNotes: string
  identifiedWeakPoints: string[]
}

async function processEnhancedUserData(
  profile: UserProfileForGeneration
): Promise<EnhancedProcessingResult> {
  const onboarding = profile.onboarding_responses
  
  if (!onboarding) {
    throw new Error('User has not completed onboarding')
  }

  console.log('🔬 Starting enhanced user data processing...')

  // ═══════════════════════════════════════════════════════════════════════════════
  //                            ENHANCED USER DATA GENERATION
  // ═══════════════════════════════════════════════════════════════════════════════

  // Convert profile to UserData format for enhanced analysis
  const baseUserData: UserData = {
    id: 'temp-id',
    name: profile.name || 'User',
    email: 'user@example.com',
    age: profile.age,
    height_cm: 175, // Default - consider enhancing with actual data
    weight_kg: 75, // Default - consider enhancing with actual data
    experience_level: profile.experience_level || 'Beginner',
    weight_unit: (profile.weight_unit as 'kg' | 'lbs') || 'kg',
    fitness_goals: onboarding.primaryGoal,
    trainingFrequencyDays: onboarding.trainingFrequencyDays,
    sessionDuration: onboarding.sessionDuration,
    equipment: onboarding.equipment,
    injuriesLimitations: onboarding.injuriesLimitations,
    squat1RMEstimate: onboarding.squat1RMEstimate,
    benchPress1RMEstimate: onboarding.benchPress1RMEstimate,
    deadlift1RMEstimate: onboarding.deadlift1RMEstimate,
    overheadPress1RMEstimate: onboarding.overheadPress1RMEstimate
  }

  // Generate comprehensive enhanced user profile
  console.log('📊 Generating enhanced user profile with scientific analysis...')
  const enhancedProfile: EnhancedUserData = generateEnhancedUserProfile(baseUserData)

  // ═══════════════════════════════════════════════════════════════════════════════
  //                            SCIENTIFIC ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════════

  // Calculate individualized volume landmarks
  console.log('📏 Calculating individualized volume landmarks...')
  const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)
  console.log('✅ Volume landmarks calculated:', Object.keys(volumeLandmarks))

  // Perform weak point analysis if strength data is available
  let weakPointAnalysis = null
  let identifiedWeakPoints: string[] = []
  
  if (onboarding.squat1RMEstimate && onboarding.benchPress1RMEstimate && 
      onboarding.deadlift1RMEstimate && onboarding.overheadPress1RMEstimate) {
    console.log('💪 Performing strength ratio analysis...')
    const strengthProfile: StrengthProfile = {
      squat1RM: onboarding.squat1RMEstimate,
      bench1RM: onboarding.benchPress1RMEstimate,
      deadlift1RM: onboarding.deadlift1RMEstimate,
      overheadPress1RM: onboarding.overheadPress1RMEstimate
    }
    weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
    identifiedWeakPoints = weakPointAnalysis.primaryWeakPoints || []
    console.log('✅ Weak point analysis completed:', identifiedWeakPoints)
  } else {
    console.log('⚠️ Insufficient strength data for weak point analysis')
  }

  // Select appropriate periodization model based on experience and goals
  console.log('🎯 Selecting optimal periodization model...')
  const periodizationModel = selectPeriodizationModel(
    enhancedProfile.experience_level || 'Beginner', 
    onboarding.primaryGoal
  )
  console.log('✅ Periodization model selected:', periodizationModel)

  // Generate autoregulation recommendations
  console.log('⚙️ Generating autoregulation protocols...')
  const autoregulationNotes = generateAutoregulationNotes(
    enhancedProfile.rpeProfile, 
    enhancedProfile.recoveryProfile
  )

  console.log('🎉 Enhanced user data processing completed successfully!')

  return {
    enhancedProfile,
    volumeLandmarks,
    weakPointAnalysis,
    periodizationModel,
    autoregulationNotes,
    identifiedWeakPoints
  }
}

/**
 * ENHANCED SCIENCE-BASED PROMPT CONSTRUCTION (2025/01)
 * Construct the detailed LLM prompt for program generation
 */
async function constructEnhancedLLMPrompt(
  profile: UserProfileForGeneration,
  processingResult: EnhancedProcessingResult,
  complexity: 'full' | 'simplified' | 'basic' = 'full'
): Promise<string> {
  const { 
    enhancedProfile, 
    volumeLandmarks, 
    weakPointAnalysis, 
    periodizationModel, 
    autoregulationNotes 
  } = processingResult
  
  const onboarding = profile.onboarding_responses
  if (!onboarding) {
    throw new Error('User has not completed onboarding')
  }

  console.log(`🔨 Constructing ${complexity} complexity LLM prompt...`)

  // ═══════════════════════════════════════════════════════════════════════════════
  //                            PROMPT CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════════

  const typeDefinitions = getTypeScriptInterfaceDefinitions()
  const weightUnit = profile.weight_unit || 'kg'

  // Adjust prompt complexity based on retry attempts
  let scientificFramework = ''
  let userAnalysisDepth = ''
  let requirementsDetail = ''

  if (complexity === 'full') {
    scientificFramework = `
═══════════════════════════════════════════════════════════════════════════════
                                SCIENTIFIC FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

VOLUME FRAMEWORK GUIDELINES:
${VOLUME_FRAMEWORK_GUIDELINES}

AUTOREGULATION GUIDELINES:
${AUTOREGULATION_GUIDELINES}

PERIODIZATION GUIDELINES:
${PERIODIZATION_GUIDELINES}

WEAK POINT INTERVENTION GUIDELINES:
${WEAK_POINT_INTERVENTION_GUIDELINES}

FATIGUE MANAGEMENT GUIDELINES:
${FATIGUE_MANAGEMENT_GUIDELINES}

EXERCISE SELECTION GUIDELINES:
${EXERCISE_SELECTION_GUIDELINES}`

    userAnalysisDepth = `
═══════════════════════════════════════════════════════════════════════════════
                                USER ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

ENHANCED USER PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Experience Level: ${profile.experience_level || 'Beginner'}
- Training Age (Inferred): ${enhancedProfile.volumeParameters.trainingAge} years
- Recovery Capacity (Inferred): ${enhancedProfile.volumeParameters.recoveryCapacity}/10
- Stress Level (Inferred): ${enhancedProfile.volumeParameters.stressLevel}/10
- Volume Tolerance: ${enhancedProfile.volumeParameters.volumeTolerance}x

TRAINING PARAMETERS:
- Primary Goal: ${onboarding.primaryGoal}
- Training Frequency: ${onboarding.trainingFrequencyDays} days/week
- Session Duration: ${onboarding.sessionDuration}
- Equipment: ${onboarding.equipment.join(', ')}
- Injuries/Limitations: ${onboarding.injuriesLimitations || 'None'}

INDIVIDUALIZED VOLUME LANDMARKS (weekly sets):
${Object.entries(volumeLandmarks).map(([muscle, landmarks]) => 
  `- ${muscle.charAt(0).toUpperCase() + muscle.slice(1)}: MEV ${landmarks.MEV}, MAV ${landmarks.MAV}, MRV ${landmarks.MRV}`
).join('\n')}

STRENGTH PROFILE (${weightUnit}):
- Squat 1RM: ${onboarding.squat1RMEstimate || 'Not provided'}
- Bench Press 1RM: ${onboarding.benchPress1RMEstimate || 'Not provided'}
- Deadlift 1RM: ${onboarding.deadlift1RMEstimate || 'Not provided'}
- Overhead Press 1RM: ${onboarding.overheadPress1RMEstimate || 'Not provided'}

${weakPointAnalysis ? `
WEAK POINT ANALYSIS:
${weakPointAnalysis.issues.length > 0 ? 
  `Identified Issues:\n${weakPointAnalysis.issues.map((issue: any) => 
    `- ${issue.ratioName}: ${issue.yourRatio.toFixed(2)} (minimum: ${issue.standardMinimum}) - ${issue.severity} priority`
  ).join('\n')}\n\nPrimary Weak Points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}\n\nRecommended Corrective Exercises: ${weakPointAnalysis.correctionExercises.join(', ')}`
  : 'No significant strength imbalances detected - excellent balanced development!'
}` : 'Weak point analysis unavailable - insufficient strength data provided'}

SELECTED PERIODIZATION MODEL: ${periodizationModel}

AUTOREGULATION PROTOCOLS:
${autoregulationNotes}`

    requirementsDetail = `
═══════════════════════════════════════════════════════════════════════════════
                              PROGRAM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

MANDATORY EVIDENCE-BASED CONSTRAINTS:

1. **Volume Landmark Compliance**: STRICTLY respect the user's individualized volume landmarks. Start programs at MEV and progress toward MAV. NEVER exceed MRV without explicit deload planning.

2. **Periodization Integration**: Apply the selected periodization model (${periodizationModel}) with appropriate phase progression and fatigue management.

3. **Weak Point Prioritization**: ${weakPointAnalysis && weakPointAnalysis.issues && weakPointAnalysis.issues.length > 0 ? 
  `Address identified weak points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}. Include corrective exercises: ${weakPointAnalysis.correctionExercises.slice(0, 3).join(', ')}` : 
  'Maintain balanced development across all movement patterns'}

4. **Autoregulation Implementation**: Include RPE targets aligned with training phases. Provide load adjustment guidance based on readiness markers.

5. **Exercise Selection Hierarchy**: Follow three-tier system (Primary Compounds → Secondary Compounds → Isolation) with appropriate stimulus-to-fatigue ratios.

6. **Mandatory Anchor Lifts**: Every non-rest day MUST have a designated anchor lift as the first exercise - a major compound movement receiving primary progression focus.`
  } else if (complexity === 'simplified') {
    scientificFramework = `
SCIENTIFIC PRINCIPLES:
- Respect individual volume landmarks: MEV/MAV/MRV
- Apply autoregulation with RPE 6-9 targets
- Use evidence-based periodization
- Address identified weak points
- Follow three-tier exercise selection`

    userAnalysisDepth = `
USER PROFILE:
- Name: ${profile.name}, Age: ${profile.age}, Experience: ${profile.experience_level || 'Beginner'}
- Goal: ${onboarding.primaryGoal}
- Training: ${onboarding.trainingFrequencyDays} days/week, ${onboarding.sessionDuration}
- Equipment: ${onboarding.equipment.join(', ')}
- Periodization: ${periodizationModel}
${weakPointAnalysis && weakPointAnalysis.primaryWeakPoints.length > 0 ? 
  `- Weak Points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}` : ''}

VOLUME GUIDELINES (weekly sets):
${Object.entries(volumeLandmarks).map(([muscle, landmarks]) => 
  `${muscle}: MEV ${landmarks.MEV}, MAV ${landmarks.MAV}, MRV ${landmarks.MRV}`
).join(' | ')}`

    requirementsDetail = `
REQUIREMENTS:
1. Respect volume landmarks (start at MEV, progress to MAV, never exceed MRV)
2. Include anchor lifts as first exercise on training days
3. Use appropriate RPE targets (6-8 RPE typically)
${weakPointAnalysis && weakPointAnalysis.primaryWeakPoints.length > 0 ? 
  `4. Address weak points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}` : ''}`
  } else { // basic
    scientificFramework = ''
    userAnalysisDepth = `
USER: ${profile.name}, ${profile.experience_level || 'Beginner'}, Goal: ${onboarding.primaryGoal}
Training: ${onboarding.trainingFrequencyDays} days/week, Equipment: ${onboarding.equipment.join(', ')}`

    requirementsDetail = `
REQUIREMENTS:
1. Create balanced program for ${onboarding.primaryGoal}
2. Use available equipment: ${onboarding.equipment.join(', ')}
3. Include compound movements first`
  }

  const prompt = `You are Neural, an elite exercise scientist and evidence-based coach AI. Your expertise rivals that of Dr. Mike Israetel, Dr. Eric Helms, Jeff Nippard, and the world's leading exercise science researchers. You are meticulous, scientifically-grounded, and obsessed with optimizing training for each individual. Your entire output MUST be a single, valid JSON object that adheres to the TrainingProgram TypeScript interface provided below.

You will craft a world-class, hyper-personalized training program based on comprehensive scientific analysis of the user's profile. Your program generation is guided by cutting-edge exercise science research and evidence-based methodologies.

${typeDefinitions}

${scientificFramework}
${userAnalysisDepth}
${requirementsDetail}

AUTOREGULATION GUIDELINES:
${AUTOREGULATION_GUIDELINES}

PERIODIZATION GUIDELINES:
${PERIODIZATION_GUIDELINES}

WEAK POINT INTERVENTION GUIDELINES:
${WEAK_POINT_INTERVENTION_GUIDELINES}

FATIGUE MANAGEMENT GUIDELINES:
${FATIGUE_MANAGEMENT_GUIDELINES}

EXERCISE SELECTION GUIDELINES:
${EXERCISE_SELECTION_GUIDELINES}

═══════════════════════════════════════════════════════════════════════════════
                                USER ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

ENHANCED USER PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Experience Level: ${profile.experience_level || 'Beginner'}
- Training Age (Inferred): ${enhancedProfile.volumeParameters.trainingAge} years
- Recovery Capacity (Inferred): ${enhancedProfile.volumeParameters.recoveryCapacity}/10
- Stress Level (Inferred): ${enhancedProfile.volumeParameters.stressLevel}/10
- Volume Tolerance: ${enhancedProfile.volumeParameters.volumeTolerance}x

TRAINING PARAMETERS:
- Primary Goal: ${onboarding.primaryGoal}
- Training Frequency: ${onboarding.trainingFrequencyDays} days/week
- Session Duration: ${onboarding.sessionDuration}
- Equipment: ${onboarding.equipment.join(', ')}
- Injuries/Limitations: ${onboarding.injuriesLimitations || 'None'}

INDIVIDUALIZED VOLUME LANDMARKS (weekly sets):
${Object.entries(volumeLandmarks).map(([muscle, landmarks]) => 
  `- ${muscle.charAt(0).toUpperCase() + muscle.slice(1)}: MEV ${landmarks.MEV}, MAV ${landmarks.MAV}, MRV ${landmarks.MRV}`
).join('\n')}

STRENGTH PROFILE (${weightUnit}):
- Squat 1RM: ${onboarding.squat1RMEstimate || 'Not provided'}
- Bench Press 1RM: ${onboarding.benchPress1RMEstimate || 'Not provided'}
- Deadlift 1RM: ${onboarding.deadlift1RMEstimate || 'Not provided'}
- Overhead Press 1RM: ${onboarding.overheadPress1RMEstimate || 'Not provided'}

${weakPointAnalysis ? `
WEAK POINT ANALYSIS:
${weakPointAnalysis.issues.length > 0 ? 
  `Identified Issues:\n${weakPointAnalysis.issues.map((issue: any) => 
    `- ${issue.ratioName}: ${issue.yourRatio.toFixed(2)} (minimum: ${issue.standardMinimum}) - ${issue.severity} priority`
  ).join('\n')}\n\nPrimary Weak Points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}\n\nRecommended Corrective Exercises: ${weakPointAnalysis.correctionExercises.join(', ')}`
  : 'No significant strength imbalances detected - excellent balanced development!'
}` : 'Weak point analysis unavailable - insufficient strength data provided'}

SELECTED PERIODIZATION MODEL: ${periodizationModel}

AUTOREGULATION PROTOCOLS:
${autoregulationNotes}

═══════════════════════════════════════════════════════════════════════════════
                              PROGRAM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

MANDATORY EVIDENCE-BASED CONSTRAINTS:

1. **Volume Landmark Compliance**: STRICTLY respect the user's individualized volume landmarks. Start programs at MEV and progress toward MAV. NEVER exceed MRV without explicit deload planning.

2. **Periodization Integration**: Apply the selected periodization model (${periodizationModel}) with appropriate phase progression and fatigue management.

3. **Weak Point Prioritization**: ${weakPointAnalysis && weakPointAnalysis.issues && weakPointAnalysis.issues.length > 0 ? 
  `Address identified weak points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}. Include corrective exercises: ${weakPointAnalysis.correctionExercises.slice(0, 3).join(', ')}` : 
  'Maintain balanced development across all movement patterns'}

4. **Autoregulation Implementation**: Include RPE targets aligned with training phases. Provide load adjustment guidance based on readiness markers.

5. **Exercise Selection Hierarchy**: Follow three-tier system (Primary Compounds → Secondary Compounds → Isolation) with appropriate stimulus-to-fatigue ratios.

6. **Mandatory Anchor Lifts**: Every non-rest day MUST have a designated anchor lift as the first exercise - a major compound movement receiving primary progression focus.

TECHNICAL REQUIREMENTS:
- Create a ${getDurationBasedOnGoals(onboarding)}-week program with appropriate phases
- Each workout should have 6-10 exercises (including warm-up/cool-down)
- Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.)
- For rest days: set isRestDay: true, empty exercises array
- Set estimatedDurationMinutes to match user's session length preference
- Provide weight guidance using percentages of 1RM, RPE, or load progression when possible
- Adapt all exercises for available equipment and injury considerations

═══════════════════════════════════════════════════════════════════════════════
                                OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

${typeDefinitions}

NEURAL'S COACHING VOICE REQUIREMENTS:
- **coachIntro**: Write a personalized, motivational introduction directly to ${profile.name}. Reference their specific goal (${onboarding.primaryGoal}) and the science-based approach you've designed for them.
- **description**: Provide a compelling 1-2 sentence summary highlighting the evidence-based nature of the program.
- **generalAdvice**: Start with "Here's the game plan..." and explain the scientific rationale behind your program structure, referencing volume landmarks, periodization, and weak point strategies.
- **TrainingWeek.coachTip**: For each week, provide specific guidance related to that week's training focus (volume accumulation, intensification, deload, etc.).
- **ExerciseDetail.notes**: For anchor lifts and key exercises, provide concise form cues or scientific rationale. Mark anchor lifts clearly.

NEURAL'S COACHING CUES (integrate appropriately):
${NEURAL_COACHING_CUES}

TECHNICAL REQUIREMENTS:
- Create a ${getDurationBasedOnGoals(onboarding)}-week program with appropriate phases
- Each workout should have 6-10 exercises (including warm-up/cool-down)
- Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.)
- For rest days: set isRestDay: true, empty exercises array
- Set estimatedDurationMinutes to match user's session length preference
- Provide weight guidance using percentages of 1RM, RPE, or load progression when possible
- Adapt all exercises for available equipment and injury considerations

═══════════════════════════════════════════════════════════════════════════════
                                OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

${typeDefinitions}

NEURAL'S COACHING VOICE REQUIREMENTS:
- **coachIntro**: Write a personalized, motivational introduction directly to ${profile.name}. Reference their specific goal (${onboarding.primaryGoal}) and the science-based approach you've designed for them.
- **description**: Provide a compelling 1-2 sentence summary highlighting the evidence-based nature of the program.
- **generalAdvice**: Start with "Here's the game plan..." and explain the scientific rationale behind your program structure, referencing volume landmarks, periodization, and weak point strategies.
- **TrainingWeek.coachTip**: For each week, provide specific guidance related to that week's training focus (volume accumulation, intensification, deload, etc.).
- **ExerciseDetail.notes**: For anchor lifts and key exercises, provide concise form cues or scientific rationale. Mark anchor lifts clearly.

NEURAL'S COACHING CUES (integrate appropriately):
${NEURAL_COACHING_CUES}

Return ONLY valid JSON matching the TrainingProgram interface. No additional text.`

  console.log(`✅ ${complexity} complexity LLM prompt constructed (${prompt.length} characters)`)
  return prompt
}

/**
 * Enhanced LLM API call with retry logic and progressive simplification
 */
async function callEnhancedLLMAPI(
  profile: UserProfileForGeneration,
  processingResult: EnhancedProcessingResult
): Promise<{ program?: any; error?: string; attempts?: number; finalComplexity?: string }> {
  const complexityLevels: Array<'full' | 'simplified' | 'basic'> = ['full', 'simplified', 'basic']
  let attempts = 0
  let lastError = ''

  console.log('🚀 Starting enhanced LLM API call with retry logic...')

  for (const complexity of complexityLevels) {
    attempts++
    console.log(`📝 Attempt ${attempts}: Using ${complexity} complexity prompt`)

    try {
      // Construct prompt with current complexity level
      const prompt = await constructEnhancedLLMPrompt(profile, processingResult, complexity)
      
      // Log prompt effectiveness metrics
      console.log(`📊 Prompt metrics - Length: ${prompt.length} chars, Complexity: ${complexity}`)

      // Call LLM API
      const result = await callLLMAPI(prompt)
      
      if (result.error) {
        lastError = result.error
        console.log(`❌ Attempt ${attempts} failed: ${result.error}`)
        continue
      }

      if (result.program) {
        console.log(`✅ Success on attempt ${attempts} with ${complexity} complexity!`)
        return { 
          program: result.program, 
          attempts, 
          finalComplexity: complexity 
        }
      }
    } catch (error: any) {
      lastError = error.message || 'Unknown error'
      console.log(`❌ Attempt ${attempts} threw error: ${lastError}`)
    }
  }

  console.log(`🚫 All ${attempts} attempts failed. Final error: ${lastError}`)
  return { 
    error: `Failed to generate program after ${attempts} attempts. Last error: ${lastError}`,
    attempts,
    finalComplexity: 'basic'
  }
}

/**
 * Determine program duration based on user goals
 */
function getDurationBasedOnGoals(onboarding: OnboardingData): number {
  const { primaryGoal } = onboarding

  // Adjust duration based on goals (shortened to 4-6 weeks to manage token limits)
  if (primaryGoal === 'General Fitness: Foundational Strength') return 4
  if (primaryGoal === 'Muscle Gain: General' || primaryGoal === 'Muscle Gain: Hypertrophy Focus') return 6
  if (primaryGoal === 'Strength Gain: General' || primaryGoal === 'Strength Gain: Powerlifting Peak') return 6
  if (primaryGoal === 'Endurance Improvement: Gym Cardio') return 5
  if (primaryGoal === 'Sport-Specific S&C: Explosive Power') return 6
  if (primaryGoal === 'Weight Loss: Gym Based') return 5
  if (primaryGoal === 'Bodyweight Mastery') return 6
  if (primaryGoal === 'Recomposition: Lean Mass & Fat Loss') return 6

  return 6 // Default
}

/**
 * Call the LLM API to generate the training program
 */
async function callLLMAPI(prompt: string): Promise<{ program?: any; error?: string }> {
  try {
    console.log('Calling shared LLM service for program generation...')
    console.log(`Prompt length: ${prompt.length} characters`)

    const parsedProgram = await callLLM(prompt, 'user', {
      response_format: { type: 'json_object' },
      max_tokens: 8192, // Increased for complex program generation
      model: 'gpt-4o', // Upgraded to more capable model for complex program generation
    })

    // Write full response to temporary file for debugging
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filePath = path.join(process.cwd(), `.tmp/llm_response_${timestamp}.json`)
      // Ensure .tmp directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(parsedProgram, null, 2), 'utf8')
      console.log(`Full LLM response saved to: ${filePath}`)
    } catch (fileError) {
      console.error('Failed to save LLM response to file:', fileError)
    }

    return { program: parsedProgram }
  } catch (error: any) {
    console.error('Error calling shared LLM service for program generation:', error)
    // Ensure the error message is propagated in the expected format
    return {
      error: error.message || 'Failed to communicate with AI service for program generation',
    }
  }
}

/**
 * Main server action to generate a new training program for a user.
 * Supports two signatures:
 * 1. generateTrainingProgram(user, onboardingData) - for new onboarding flow
 * 2. generateTrainingProgram(userId) - for regenerating existing programs
 */
export async function generateTrainingProgram(
  user: User,
  onboardingData: FullOnboardingAnswers
): Promise<ProgramGenerationResponse>
export async function generateTrainingProgram(
  userIdToGenerateFor: string
): Promise<ProgramGenerationResponse>
export async function generateTrainingProgram(
  userOrUserId: User | string,
  onboardingData?: FullOnboardingAnswers
): Promise<ProgramGenerationResponse> {
  try {
    const supabase = await createClient()

    // Handle the two different call signatures
    if (typeof userOrUserId === 'string') {
      // Legacy signature: generateTrainingProgram(userId)
      const userId = userOrUserId
      console.log('Generating training program for user:', userId)

      // Fetch user profile and onboarding data from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, age, weight_unit, primary_training_focus, experience_level, onboarding_responses')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return { error: 'Failed to load your profile. Please try again.', success: false }
      }

      if (!profile) {
        console.error('Profile is null for user:', userId)
        return { error: 'Your profile was not found. Please complete the signup process again.', success: false }
      }

      if (!profile.onboarding_responses) {
        console.error('User has not completed onboarding:', userId)
        return { error: 'Please complete your onboarding first.', success: false }
      }

      // Validate that profile has required fields
      if (!profile.name || !profile.age) {
        console.error('Profile missing required fields for user:', userId, profile)
        return { error: 'Your profile is incomplete. Please contact support.', success: false }
      }

      // Use the profile data as the user profile for generation
      const userProfileForGeneration: UserProfileForGeneration = {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        weight_unit: profile.weight_unit,
        primary_training_focus: profile.primary_training_focus,
        experience_level: profile.experience_level,
        onboarding_responses: profile.onboarding_responses,
      }

      // Continue with enhanced program generation
      console.log('🎯 Starting enhanced program generation pipeline...')
      const processingResult = await processEnhancedUserData(userProfileForGeneration)
      
      // Use enhanced LLM call with retry logic
      const { program: llmResponse, error: llmError, attempts, finalComplexity } = await callEnhancedLLMAPI(
        userProfileForGeneration, 
        processingResult
      )

      if (llmError) {
        console.error(`LLM API error after ${attempts} attempts:`, llmError)
        return { error: 'Unable to generate your training program at this time. Please try again later.', success: false }
      }

      console.log(`🎉 Program generated successfully using ${finalComplexity} complexity in ${attempts} attempts`)

      // Add generatedAt and aiModelUsed if not provided by LLM
      const programData = {
        ...llmResponse,
        generatedAt: llmResponse.generatedAt || new Date().toISOString(),
        aiModelUsed: llmResponse.aiModelUsed || 'gpt-4o',
      }

      // Enhanced validation process
      console.log('🔍 Starting enhanced validation process...')
      
      // First try enhanced validation, fallback to basic if needed
      let validatedProgram: TrainingProgram
      let validationNotes: string[] = []
      
      try {
        const enhancedValidation = validateEnhancedProgram(
          programData,
          processingResult.volumeLandmarks,
          processingResult.identifiedWeakPoints
        )
        
        if (enhancedValidation.isValid) {
          console.log('✅ Enhanced validation passed!')
          // Parse with enhanced schema
          const enhancedResult = ENHANCED_PROGRAM_VALIDATION.safeParse(programData)
          if (enhancedResult.success) {
            validatedProgram = enhancedResult.data as unknown as TrainingProgram
            validationNotes.push('Enhanced scientific validation passed')
          } else {
            throw new Error('Enhanced schema parse failed')
          }
        } else {
          console.log('⚠️ Enhanced validation failed, trying basic validation...')
          validationNotes.push(`Enhanced validation failed: ${enhancedValidation.violations.join(', ')}`)
          throw new Error('Enhanced validation failed')
        }
      } catch (enhancedError) {
        console.log('📋 Falling back to basic validation...')
        // Fallback to basic validation
        const basicValidation = TrainingProgramSchema.safeParse(programData)
        if (!basicValidation.success) {
          console.error('Both enhanced and basic validation failed:', basicValidation.error)
          return { error: 'The generated program has validation errors. Please try again.', success: false }
        }
        validatedProgram = basicValidation.data as unknown as TrainingProgram
        validationNotes.push('Used basic validation due to enhanced validation failure')
      }

      // Enhanced database storage with scientific analysis
      console.log('💾 Saving enhanced program data to database...')
      
      // Prepare data with fallback for schema compatibility
      const insertData: any = {
        user_id: userId,
        program_details: validatedProgram,
        ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
        onboarding_data_snapshot: profile.onboarding_responses,
        // Enhanced scientific data with fallback handling
        weak_point_analysis: processingResult.weakPointAnalysis,
        periodization_model: processingResult.periodizationModel,
        generation_metadata: {
          attempts: attempts,
          finalComplexity: finalComplexity,
          validationNotes: validationNotes,
          processingTimestamp: new Date().toISOString(),
          enhancedUserProfile: {
            trainingAge: processingResult.enhancedProfile.volumeParameters.trainingAge,
            recoveryCapacity: processingResult.enhancedProfile.volumeParameters.recoveryCapacity,
            stressLevel: processingResult.enhancedProfile.volumeParameters.stressLevel,
            volumeTolerance: processingResult.enhancedProfile.volumeParameters.volumeTolerance,
          }
        }
      }

      // Handle volume_landmarks with schema compatibility
      if (processingResult.volumeLandmarks) {
        // Try JSONB format first (new schema), fallback to array format (old schema)
        try {
          insertData.volume_landmarks = processingResult.volumeLandmarks
        } catch (e) {
          // Fallback: convert to array format for old schema
          insertData.volume_landmarks = Object.keys(processingResult.volumeLandmarks)
        }
      }

      // TEMPORARY: If migration hasn't been run, omit problematic columns
      // Remove this section once the migration is applied
      const { data: savedProgram, error: saveError } = await supabase
        .from('training_programs')
        .insert(insertData)
        .select()
        .single()

      if (saveError) {
        console.error('Error saving training program:', saveError)
        
        // If it's a schema error, try without the new columns
        if (saveError.code === '22P02' || saveError.message?.includes('volume_landmarks')) {
          console.log('🔄 Retrying without enhanced columns (migration may not be applied)...')
          const fallbackData = {
            user_id: user.id,
            program_details: validatedProgram,
            ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
            onboarding_data_snapshot: onboardingData,
          }
          
          const { data: fallbackProgram, error: fallbackError } = await supabase
            .from('training_programs')
            .insert(fallbackData)
            .select()
            .single()
            
          if (fallbackError) {
            console.error('Fallback save also failed:', fallbackError)
            return { error: 'Failed to save your training program. Please try again.', success: false }
          }
          
          console.log('✅ Program saved successfully with fallback schema!')
          return { program: validatedProgram, success: true }
        }
        
        return { error: 'Failed to save your training program. Please try again.', success: false }
      }

      console.log('🎊 Enhanced training program generated and saved successfully!')
      console.log(`📈 Generation summary: ${attempts} attempts, ${finalComplexity} complexity, ${validationNotes.length} validation notes`)
      return { program: validatedProgram, success: true }
    } else {
      // New signature: generateTrainingProgram(user, onboardingData)
      const user = userOrUserId
      if (!onboardingData) {
        return { error: 'Onboarding data is required for new program generation.', success: false }
      }

      console.log('Generating training program for user:', user.id)

      // Step 1: Combine user and onboarding data into the profile structure for the LLM
      const userProfileForGeneration: UserProfileForGeneration = {
        id: user.id,
        name: user.user_metadata.name || 'User',
        age: 25, // Default age, user can update later
        weight_unit: onboardingData.weightUnit,
        primary_training_focus: mapGoalToTrainingFocus(onboardingData.primaryGoal),
        experience_level: onboardingData.experienceLevel,
        onboarding_responses: onboardingData,
      }

      // Step 2: Enhanced processing and program generation
      console.log('🎯 Starting enhanced program generation pipeline for new user...')
      const processingResult = await processEnhancedUserData(userProfileForGeneration)
      
      // Step 3: Use enhanced LLM call with retry logic
      const { program: llmResponse, error: llmError, attempts, finalComplexity } = await callEnhancedLLMAPI(
        userProfileForGeneration, 
        processingResult
      )

      if (llmError) {
        console.error(`LLM API error after ${attempts} attempts:`, llmError)
        return { error: 'Unable to generate your training program at this time. Please try again later.', success: false }
      }

      console.log(`🎉 Program generated successfully using ${finalComplexity} complexity in ${attempts} attempts`)

      // Add generatedAt and aiModelUsed if not provided by LLM
      const programData = {
        ...llmResponse,
        generatedAt: llmResponse.generatedAt || new Date().toISOString(),
        aiModelUsed: llmResponse.aiModelUsed || 'gpt-4o',
      }

      // Enhanced validation process
      console.log('🔍 Starting enhanced validation process...')
      
      let validatedProgram: TrainingProgram
      let validationNotes: string[] = []
      
      try {
        const enhancedValidation = validateEnhancedProgram(
          programData,
          processingResult.volumeLandmarks,
          processingResult.identifiedWeakPoints
        )
        
        if (enhancedValidation.isValid) {
          console.log('✅ Enhanced validation passed!')
          const enhancedResult = ENHANCED_PROGRAM_VALIDATION.safeParse(programData)
          if (enhancedResult.success) {
            validatedProgram = enhancedResult.data as unknown as TrainingProgram
            validationNotes.push('Enhanced scientific validation passed')
          } else {
            throw new Error('Enhanced schema parse failed')
          }
        } else {
          console.log('⚠️ Enhanced validation failed, trying basic validation...')
          validationNotes.push(`Enhanced validation failed: ${enhancedValidation.violations.join(', ')}`)
          throw new Error('Enhanced validation failed')
        }
      } catch (enhancedError) {
        console.log('📋 Falling back to basic validation...')
        const basicValidation = TrainingProgramSchema.safeParse(programData)
        if (!basicValidation.success) {
          console.error('Both enhanced and basic validation failed:', basicValidation.error)
          return { error: 'The generated program has validation errors. Please try again.', success: false }
        }
        validatedProgram = basicValidation.data as unknown as TrainingProgram
        validationNotes.push('Used basic validation due to enhanced validation failure')
      }

      // Enhanced database storage
      console.log('💾 Saving enhanced program data to database...')
      
      // Prepare data with fallback for schema compatibility
      const insertData: any = {
        user_id: user.id,
        program_details: validatedProgram,
        ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
        onboarding_data_snapshot: onboardingData,
        // Enhanced scientific data with fallback handling
        weak_point_analysis: processingResult.weakPointAnalysis,
        periodization_model: processingResult.periodizationModel,
        generation_metadata: {
          attempts: attempts,
          finalComplexity: finalComplexity,
          validationNotes: validationNotes,
          processingTimestamp: new Date().toISOString(),
          enhancedUserProfile: {
            trainingAge: processingResult.enhancedProfile.volumeParameters.trainingAge,
            recoveryCapacity: processingResult.enhancedProfile.volumeParameters.recoveryCapacity,
            stressLevel: processingResult.enhancedProfile.volumeParameters.stressLevel,
            volumeTolerance: processingResult.enhancedProfile.volumeParameters.volumeTolerance,
          }
        }
      }

      // Handle volume_landmarks with schema compatibility
      if (processingResult.volumeLandmarks) {
        // Try JSONB format first (new schema), fallback to array format (old schema)
        try {
          insertData.volume_landmarks = processingResult.volumeLandmarks
        } catch (e) {
          // Fallback: convert to array format for old schema
          insertData.volume_landmarks = Object.keys(processingResult.volumeLandmarks)
        }
      }

      // TEMPORARY: If migration hasn't been run, omit problematic columns
      // Remove this section once the migration is applied
      const { data: savedProgram, error: saveError } = await supabase
        .from('training_programs')
        .insert(insertData)
        .select()
        .single()

      if (saveError) {
        console.error('Error saving training program:', saveError)
        
        // If it's a schema error, try without the new columns
        if (saveError.code === '22P02' || saveError.message?.includes('volume_landmarks')) {
          console.log('🔄 Retrying without enhanced columns (migration may not be applied)...')
          const fallbackData = {
            user_id: user.id,
            program_details: validatedProgram,
            ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
            onboarding_data_snapshot: onboardingData,
          }
          
          const { data: fallbackProgram, error: fallbackError } = await supabase
            .from('training_programs')
            .insert(fallbackData)
            .select()
            .single()
            
          if (fallbackError) {
            console.error('Fallback save also failed:', fallbackError)
            return { error: 'Failed to save your training program. Please try again.', success: false }
          }
          
          console.log('✅ Program saved successfully with fallback schema!')
          return { program: validatedProgram, success: true }
        }
        
        return { error: 'Failed to save your training program. Please try again.', success: false }
      }

      console.log('🎊 Enhanced training program generated and saved successfully!')
      console.log(`📈 Generation summary: ${attempts} attempts, ${finalComplexity} complexity, ${validationNotes.length} validation notes`)
      return { program: validatedProgram, success: true }
    }
  } catch (error) {
    console.error('Unexpected error in generateTrainingProgram:', error)
    return { success: false, error: 'An unexpected error occurred while generating your program. Please try again.' }
  }
}

/**
 * Get a user's current active training program
 */
export async function getCurrentTrainingProgram(
  userId?: string
): Promise<{ program?: any; error?: string }> {
  try {
    const supabase = await createClient()

    let targetUserId: string
    if (userId) {
      targetUserId = userId
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error in getCurrentTrainingProgram:', authError)
        return { error: 'Authentication required. Please log in again.' }
      }
      targetUserId = user.id
    }

    const { data: program, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching current training program:', error)
      return { error: 'Failed to load your training program. Please try again.' }
    }

    if (!program) {
      return { error: 'No active training program found. Please generate a new program.' }
    }

    return { program }
  } catch (error) {
    console.error('Unexpected error in getCurrentTrainingProgram:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Update/regenerate a user's training program
 */
export async function updateTrainingProgram(userId: string, updates: any) {
  console.log('TODO: updateTrainingProgram called for user:', userId, updates)
  return { error: 'Not yet implemented' }
}

/**
 * Server action to fetch the active training program for client components
 * @returns Promise<{ program: TrainingProgramWithId | null; completedDays: CompletedDayIdentifier[]; error?: string }>
 */
export async function fetchActiveProgramAction(): Promise<{
  program: any | null
  completedDays: CompletedDayIdentifier[]
  error?: string
}> {
  try {
    // Import here to avoid circular dependencies
    const { getActiveTrainingProgram } = await import('@/lib/db/program')

    const program = await getActiveTrainingProgram()

    if (!program) {
      return { program: null, completedDays: [] }
    }

    // Fetch completed workout days for this program
    const supabase = await createClient()

    const { data: completedWorkouts, error: completedError } = await supabase
      .from('workout_groups')
      .select('linked_program_phase_index, linked_program_week_index, linked_program_day_of_week')
      .eq('linked_program_id', program.id)
      .not('linked_program_phase_index', 'is', null)
      .not('linked_program_week_index', 'is', null)
      .not('linked_program_day_of_week', 'is', null)

    if (completedError) {
      console.error('Error fetching completed workouts:', completedError)
      // Don't fail the entire request if completion data fetch fails
      return { program, completedDays: [] }
    }

    // Map the database results to our CompletedDayIdentifier interface
    const completedDays: CompletedDayIdentifier[] = (completedWorkouts || []).map(workout => ({
      phaseIndex: workout.linked_program_phase_index,
      weekIndex: workout.linked_program_week_index,
      dayOfWeek: workout.linked_program_day_of_week,
    }))

    console.log(`Found ${completedDays.length} completed workout days for program ${program.id}`)

    return { program, completedDays }
  } catch (error) {
    console.error('Error in fetchActiveProgramAction:', error)
    return {
      program: null,
      completedDays: [],
      error: 'Failed to fetch your training program. Please try again.',
    }
  }
}

/**
 * Interface for tracking completed workout days
 */
export interface CompletedDayIdentifier {
  phaseIndex: number
  weekIndex: number // Index of the week within that phase (0-based)
  dayOfWeek: number // 1-7, matching DayOfWeek enum
}

/**
 * Adapt the next week's training program based on user feedback
 * This creates a dynamic, responsive coaching experience
 */
export async function adaptNextWeek(
  feedback: 'easy' | 'good' | 'hard'
): Promise<{ success: boolean; error?: string; adaptedWeek?: TrainingWeek }> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    const userId = session.user.id

    // Fetch user's active training program
    const { data: programData, error: programError } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (programError || !programData) {
      return { success: false, error: 'No active training program found' }
    }

    // Parse the program details
    const program: TrainingProgram = programData.program_details as TrainingProgram

    // Get current week number from the database
    const currentWeekNumber = programData.current_week || 1
    
    // Find the current phase and week index based on current week number
    let currentPhaseIndex = 0
    let currentWeekIndex = 0
    let totalWeeksProcessed = 0
    
    for (let phaseIdx = 0; phaseIdx < program.phases.length; phaseIdx++) {
      const phase = program.phases[phaseIdx]
      if (totalWeeksProcessed + phase.durationWeeks >= currentWeekNumber) {
        currentPhaseIndex = phaseIdx
        currentWeekIndex = currentWeekNumber - totalWeeksProcessed - 1
        break
      }
      totalWeeksProcessed += phase.durationWeeks
    }

    const currentPhase = program.phases[currentPhaseIndex]
    if (!currentPhase) {
      return { success: false, error: 'Invalid program structure - no phases found' }
    }
    
    // Calculate next week indices
    const nextWeekIndex = currentWeekIndex + 1
    let nextPhaseIndex = currentPhaseIndex
    
    // Check if we need to move to the next phase
    if (nextWeekIndex >= currentPhase.weeks.length) {
      nextPhaseIndex = currentPhaseIndex + 1
      if (nextPhaseIndex >= program.phases.length) {
        return { success: false, error: 'Program completed - no next week to adapt' }
      }
    }
    
    // Get the next week to adapt
    const nextWeek = nextWeekIndex < currentPhase.weeks.length 
      ? currentPhase.weeks[nextWeekIndex]
      : program.phases[nextPhaseIndex].weeks[0]
      
    if (!nextWeek) {
      return { success: false, error: 'No next week found to adapt' }
    }

    // Fetch logged workouts from the last 7 days for context
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentWorkouts, error: workoutError } = await supabase
      .from('workout_groups')
      .select(`
        created_at,
        linked_program_day_of_week,
        workouts (
          exercise_name,
          sets,
          reps,
          weight
        )
      `)
      .eq('user_id', userId)
      .eq('linked_program_id', programData.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (workoutError) {
      console.error('Error fetching recent workouts:', workoutError)
      // Continue without workout data - adaptation can still work with just feedback
    }

    // Construct LLM prompt for program adaptation
    const adaptationPrompt = constructAdaptationPrompt(feedback, nextWeek, recentWorkouts || [])

    // Call LLM to adapt the program
    const adaptedWeekResponse = await callLLM(adaptationPrompt, 'user', {
      model: 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' }
    })

    // Validate the adapted week
    let adaptedWeek: TrainingWeek
    try {
      adaptedWeek = TrainingWeekSchema.parse(adaptedWeekResponse) as unknown as TrainingWeek
    } catch (validationError) {
      console.error('LLM returned invalid TrainingWeek structure:', validationError)
      return { success: false, error: 'Failed to generate valid program adaptation' }
    }

    // Update the program in the database
    const updatedProgram = { ...program }
    
    // Update the correct week in the correct phase
    if (nextWeekIndex < currentPhase.weeks.length) {
      // Update within current phase
      updatedProgram.phases[currentPhaseIndex].weeks[nextWeekIndex] = adaptedWeek
    } else {
      // Update first week of next phase
      updatedProgram.phases[nextPhaseIndex].weeks[0] = adaptedWeek
    }

    const { error: updateError } = await supabase
      .from('training_programs')
      .update({
        program_details: updatedProgram,
        updated_at: new Date().toISOString()
      })
      .eq('id', programData.id)

    if (updateError) {
      console.error('Error updating program:', updateError)
      return { success: false, error: 'Failed to save program adaptation' }
    }

    console.log(`Successfully adapted week ${nextWeek.weekNumber} based on '${feedback}' feedback`)

    return {
      success: true,
      adaptedWeek: adaptedWeek
    }

  } catch (error) {
    console.error('Error in adaptNextWeek:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while adapting your program'
    }
  }
}

/**
 * Construct the LLM prompt for program adaptation
 */
/**
 * Creates a community feed event for the authenticated user (server-side version)
 * @param eventType - Type of event (WORKOUT_COMPLETED, NEW_PB, STREAK_MILESTONE)
 * @param metadata - Event-specific data
 * @param supabase - Supabase client instance
 * @returns Success status
 */
async function createCommunityFeedEventServer(
  eventType: 'WORKOUT_COMPLETED' | 'NEW_PB' | 'STREAK_MILESTONE' | 'NEW_POST',
  metadata: Record<string, any>,
  supabase: any
): Promise<boolean> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('No active user found when creating community feed event')
      return false
    }

    console.log(`Creating community feed event: ${eventType}`, metadata)

    const { error } = await supabase
      .from('community_feed_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        metadata: metadata,
      })

    if (error) {
      console.error('Error creating community feed event:', error)
      return false
    }

    console.log(`Community feed event created successfully: ${eventType}`)
    return true
  } catch (error) {
    console.error('Error in createCommunityFeedEventServer:', error)
    return false
  }
}

/**
 * Checks if a logged set is a personal record and registers it
 * @param exerciseName - Name of the exercise
 * @param weight - Weight lifted
 * @param reps - Number of reps performed
 * @returns Object indicating if it's a PR and details
 */
export async function checkAndRegisterPB(
  exerciseName: string,
  weight: number,
  reps: number
): Promise<{ isPB: boolean; pbType?: string; previousBest?: { weight: number; reps: number } }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user for PR check:', userError)
      return { isPB: false }
    }

    // Query user's workout history for this exercise
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('weight, reps')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false })

    if (workoutsError) {
      console.error('Error fetching workout history for PR check:', workoutsError)
      return { isPB: false }
    }

    if (!workouts || workouts.length === 0) {
      // First time doing this exercise - no PR since there's no previous record to beat
      console.log(`First time performing ${exerciseName} - no PR since no previous records exist`)
      return { isPB: false }
    }

    // Find the best previous performance
    let bestWeight = 0
    let bestRepsAtWeight = 0
    let bestWeightAtReps = 0
    let bestReps = 0
    let previousBest = { weight: 0, reps: 0 }

    workouts.forEach(workout => {
      const workoutWeight = parseFloat(workout.weight.toString())
      const workoutReps = parseInt(workout.reps.toString())

      // Track absolute best weight
      if (workoutWeight > bestWeight) {
        bestWeight = workoutWeight
        bestRepsAtWeight = workoutReps
        previousBest = { weight: workoutWeight, reps: workoutReps }
      }

      // Track best reps
      if (workoutReps > bestReps) {
        bestReps = workoutReps
        bestWeightAtReps = workoutWeight
      }

      // Track best weight at current rep count
      if (workoutReps === reps && workoutWeight > bestWeightAtReps) {
        bestWeightAtReps = workoutWeight
      }
    })

    // Check for different types of PRs
    const currentWeight = parseFloat(weight.toString())
    const currentReps = parseInt(reps.toString())

    // Type 1: Heaviest weight ever (regardless of reps)
    if (currentWeight > bestWeight) {
      console.log(`New weight PR for ${exerciseName}: ${currentWeight} (previous: ${bestWeight})`)
      
      // Create community feed event for weight PR
      await createCommunityFeedEventServer('NEW_PB', {
        exerciseName,
        weight: currentWeight,
        reps: currentReps,
        pbType: 'heaviest-weight',
        previousBest: { weight: bestWeight, reps: bestRepsAtWeight },
      }, supabase)
      
      return { 
        isPB: true, 
        pbType: 'heaviest-weight',
        previousBest: { weight: bestWeight, reps: bestRepsAtWeight }
      }
    }

    // Type 2: Most reps ever (regardless of weight)
    if (currentReps > bestReps) {
      console.log(`New reps PR for ${exerciseName}: ${currentReps} (previous: ${bestReps})`)
      
      // Create community feed event for reps PR
      await createCommunityFeedEventServer('NEW_PB', {
        exerciseName,
        weight: currentWeight,
        reps: currentReps,
        pbType: 'most-reps',
        previousBest: { weight: bestWeightAtReps, reps: bestReps },
      }, supabase)
      
      return { 
        isPB: true, 
        pbType: 'most-reps',
        previousBest: { weight: bestWeightAtReps, reps: bestReps }
      }
    }

    // Type 3: Heaviest weight at this rep count
    if (currentWeight > bestWeightAtReps) {
      console.log(`New weight PR for ${exerciseName} at ${currentReps} reps: ${currentWeight} (previous: ${bestWeightAtReps})`)
      
      // Create community feed event for weight-at-reps PR
      await createCommunityFeedEventServer('NEW_PB', {
        exerciseName,
        weight: currentWeight,
        reps: currentReps,
        pbType: 'weight-at-reps',
        previousBest: { weight: bestWeightAtReps, reps: currentReps },
      }, supabase)
      
      return { 
        isPB: true, 
        pbType: 'weight-at-reps',
        previousBest: { weight: bestWeightAtReps, reps: currentReps }
      }
    }

    // No PR achieved
    return { isPB: false }

  } catch (error) {
    console.error('Error checking for personal best:', error)
    return { isPB: false }
  }
}

function constructAdaptationPrompt(
  feedback: 'easy' | 'good' | 'hard',
  nextWeek: TrainingWeek,
  recentWorkouts: any[]
): string {
  const currentWeekNumber = nextWeek.weekNumber - 1
  const nextWeekNumber = nextWeek.weekNumber
  
  // Map feedback to user-friendly terms
  const feedbackMap = {
    easy: 'Too Easy',
    good: 'Just Right', 
    hard: 'Too Hard'
  }

  const adaptationInstructions = {
    easy: 'If "Too Easy", increase weights by 2.5-5% or add one accessory set.',
    good: 'If "Just Right", apply standard linear progression by increasing the weight on the primary compound lift by 2.5%.',
    hard: 'If "Too Hard", decrease weights by 5-10% or remove one set from the final accessory exercise.'
  }

  const workoutContext = recentWorkouts.length > 0 
    ? `\n\nRecent workout performance data: ${JSON.stringify(recentWorkouts.slice(0, 3), null, 2)}`
    : ''

  return `You are an AI Strength Coach. A user has just completed Week ${currentWeekNumber} of their program and said it was '${feedbackMap[feedback]}'. Here is the plan for Week ${nextWeekNumber}. Your task is to modify this plan based on their feedback and return the updated JSON for the week. ${adaptationInstructions[feedback]}

Week ${nextWeekNumber} Plan:
${JSON.stringify(nextWeek, null, 2)}${workoutContext}

${getTypeScriptInterfaceDefinitions()}

Return the adapted TrainingWeek as a valid JSON object:`
}

/**
 * Adapt a planned workout based on user's daily readiness (sleep quality and energy levels)
 * This creates a real-time adaptive training experience
 * @param plannedWorkout - The original planned workout for today
 * @param readiness - User's sleep quality and energy level data
 * @returns Adapted workout or error
 */
export async function getDailyAdaptedWorkout(
  plannedWorkout: WorkoutDay,
  readiness: { sleep: 'Poor' | 'Average' | 'Great'; energy: 'Sore/Tired' | 'Feeling Good' | 'Ready to Go' }
): Promise<{ success: boolean; error?: string; adaptedWorkout?: WorkoutDay }> {
  try {
    console.log('Adapting workout based on readiness:', readiness)
    console.log('Original planned workout:', plannedWorkout)

    // Construct LLM prompt for daily workout adaptation
    const adaptationPrompt = constructDailyAdaptationPrompt(
      plannedWorkout,
      readiness
    )

    // Call LLM to adapt the workout
    const adaptedWorkoutResponse = await callLLM(adaptationPrompt, 'user', {
      model: 'gpt-4o-mini',
      temperature: 0.2, // Lower temperature for more consistent, conservative adaptations
      response_format: { type: 'json_object' },
      max_tokens: 2000, // Increase token limit for complex workouts
    })

    // Validate the adapted workout using safeParse
    const validationResult = WorkoutDaySchema.safeParse(adaptedWorkoutResponse)

    if (!validationResult.success) {
      console.error(
        'LLM returned invalid WorkoutDay structure:',
        validationResult.error.flatten()
      )
      // Safely log the raw response
      try {
        console.error(
          'Raw LLM response:',
          JSON.stringify(adaptedWorkoutResponse, null, 2)
        )
      } catch {
        console.error(
          'Raw LLM response could not be stringified:',
          adaptedWorkoutResponse
        )
      }
      return {
        success: false,
        error: 'Failed to generate valid workout adaptation from LLM response.',
      }
    }

    const adaptedWorkout: WorkoutDay = validationResult.data

    console.log('Successfully adapted workout:', adaptedWorkout)

    return {
      success: true,
      adaptedWorkout: adaptedWorkout,
    }
  } catch (error) {
    console.error(
      'Error in getDailyAdaptedWorkout:',
      error instanceof Error ? error.message : String(error)
    )
    return {
      success: false,
      error: 'An unexpected error occurred while adapting your workout.',
    }
  }
}

/**
 * Construct the LLM prompt for daily workout adaptation based on readiness
 */
function constructDailyAdaptationPrompt(
  plannedWorkout: WorkoutDay,
  readiness: { sleep: 'Poor' | 'Average' | 'Great'; energy: 'Sore/Tired' | 'Feeling Good' | 'Ready to Go' }
): string {
  // Define adaptation guidelines based on readiness levels
  const adaptationGuidelines = {
    sleep: {
      'Poor': 'User had poor sleep (restless, less than 6 hours). Reduce intensity and volume.',
      'Average': 'User had average sleep (6-7 hours with some interruptions). Make minor adjustments.',
      'Great': 'User had great sleep (7+ hours, restful). Can maintain or slightly increase intensity.'
    },
    energy: {
      'Sore/Tired': 'User is feeling sore or tired. Significantly reduce intensity and focus on recovery.',
      'Feeling Good': 'User has normal energy levels. Maintain planned intensity.',
      'Ready to Go': 'User has high energy and feels strong. Can increase intensity slightly.'
    }
  }

  // Determine overall adaptation strategy
  const sleepImpact = readiness.sleep === 'Poor' ? 'reduce' : readiness.sleep === 'Great' ? 'maintain' : 'slight_reduce'
  const energyImpact = readiness.energy === 'Sore/Tired' ? 'reduce' : readiness.energy === 'Ready to Go' ? 'increase' : 'maintain'

  let adaptationStrategy: 'REDUCE_INTENSITY' | 'SLIGHT_INCREASE' | 'MAINTAIN_WITH_MINOR_ADJUSTMENTS'
  if (sleepImpact === 'reduce' || energyImpact === 'reduce') {
    adaptationStrategy = 'REDUCE_INTENSITY'
  } else if (sleepImpact === 'maintain' && energyImpact === 'increase') {
    adaptationStrategy = 'SLIGHT_INCREASE'
  } else {
    adaptationStrategy = 'MAINTAIN_WITH_MINOR_ADJUSTMENTS'
  }

  const strategyInstructions = {
    'REDUCE_INTENSITY': `
- Reduce sets by 1 on main compound exercises (minimum 2 sets)
- Lower RPE targets by 1-2 points (minimum RPE 5)
- Reduce weight recommendations by 5-10%
- Add extra rest time between sets
- Consider replacing high-intensity exercises with lower-intensity alternatives
- Focus on form and mind-muscle connection rather than heavy loads`,
    
    'SLIGHT_INCREASE': `
- Maintain current set/rep schemes
- Increase RPE targets by 0.5-1 point (maximum RPE 9)
- Consider adding 1 optional extra set to main exercises
- Suggest slightly heavier weights where appropriate
- Maintain current exercise selection`,
    
    'MAINTAIN_WITH_MINOR_ADJUSTMENTS': `
- Keep the same exercise selection and structure
- Make minimal adjustments to sets/reps (±1 set maximum)
- Adjust RPE targets by ±0.5 points
- Keep weight recommendations similar
- Focus on maintaining the planned intensity`
  }

  return `You are an AI fitness coach adapting today's workout based on the user's daily readiness check.

USER READINESS:
- Sleep Quality: ${readiness.sleep}
- Energy/Soreness: ${readiness.energy}

READINESS ANALYSIS:
- Sleep Impact: ${adaptationGuidelines.sleep[readiness.sleep]}
- Energy Impact: ${adaptationGuidelines.energy[readiness.energy]}

ADAPTATION STRATEGY: ${adaptationStrategy}
${strategyInstructions[adaptationStrategy]}

ORIGINAL PLANNED WORKOUT:
${JSON.stringify(plannedWorkout, null, 2)}

REQUIREMENTS:
1. Return ONLY a valid WorkoutDay JSON object
2. Maintain the same dayOfWeek and basic structure
3. Keep the same exercise selections unless substitution is necessary for recovery
4. Adjust sets, reps, weights, RPE, and rest periods based on readiness
5. Update notes to explain the adaptations made
6. Preserve warmUp and coolDown exercises (these are crucial for recovery)
7. All changes must be realistic, safe, and appropriate for the user's current state
8. If reducing intensity significantly, focus on movement quality and recovery

ADAPTATION PRINCIPLES:
- Safety first: Never compromise form or safety for intensity
- Progressive overload: Maintain some challenge even when reducing intensity
- Recovery focus: When in doubt, err on the side of caution
- Personalization: Adapt to the individual's current state

${getTypeScriptInterfaceDefinitions()}

Return the adapted WorkoutDay as a JSON object:`
}

/**
 * Interface for phasic exercise variation analysis
 */
interface PhasicVariationAnalysis {
  previousExercises: string[]
  suggestedVariations: ExerciseVariation[]
  rationale: string
}

/**
 * Interface for exercise variations with muscle group targeting
 */
interface ExerciseVariation {
  originalExercise: string
  variationExercise: string
  muscleGroupsTargeted: string[]
  rationale: string
}

/**
 * Classification of exercises as primary compounds vs accessories
 */
const PRIMARY_COMPOUND_EXERCISES = [
  'Squat', 'Back Squat', 'Front Squat', 'Goblet Squat',
  'Bench Press', 'Incline Bench Press', 'Dumbbell Bench Press',
  'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift',
  'Overhead Press', 'Military Press', 'Push Press', 'Seated Overhead Press',
  'Pull-up', 'Chin-up', 'Bent-over Row', 'Barbell Row',
  'Dip', 'Close-grip Bench Press'
];

/**
 * Comprehensive exercise substitution database for phasic variations
 * Each entry maps an exercise to similar alternatives that target the same muscle groups
 */
const EXERCISE_SUBSTITUTION_DATABASE: Record<string, string[]> = {
  // Chest Accessories
  'Dumbbell Flyes': ['Cable Flyes', 'Pec Deck', 'Incline Dumbbell Flyes', 'Cable Crossover'],
  'Cable Flyes': ['Dumbbell Flyes', 'Pec Deck', 'Machine Chest Flyes', 'Resistance Band Flyes'],
  'Incline Dumbbell Press': ['Incline Barbell Press', 'Incline Cable Press', 'Incline Machine Press'],
  'Dips': ['Assisted Dips', 'Ring Dips', 'Parallel Bar Dips', 'Machine Dips'],

  // Back Accessories  
  'Lat Pulldown': ['Cable Row', 'T-Bar Row', 'Machine Row', 'Wide-Grip Pulldown'],
  'Cable Row': ['Seated Cable Row', 'One-Arm Dumbbell Row', 'T-Bar Row', 'Machine Row'],
  'Face Pulls': ['Rear Delt Flyes', 'Band Pull-Aparts', 'Reverse Pec Deck', 'Cable Reverse Flyes'],
  'Shrugs': ['Dumbbell Shrugs', 'Cable Shrugs', 'Barbell Shrugs', 'Trap Bar Shrugs'],

  // Shoulder Accessories
  'Lateral Raises': ['Cable Lateral Raises', 'Machine Lateral Raises', 'Dumbbell Lateral Raises', 'Resistance Band Laterals'],
  'Rear Delt Flyes': ['Face Pulls', 'Cable Reverse Flyes', 'Reverse Pec Deck', 'Bent-over Reverse Flyes'],
  'Front Raises': ['Cable Front Raises', 'Plate Raises', 'Barbell Front Raises', 'Resistance Band Front Raises'],
  'Upright Rows': ['Cable Upright Rows', 'Dumbbell Upright Rows', 'Wide-Grip Upright Rows'],

  // Arm Accessories
  'Bicep Curls': ['Cable Curls', 'Preacher Curls', 'Hammer Curls', 'Concentration Curls'],
  'Cable Curls': ['Dumbbell Bicep Curls', 'Barbell Curls', 'Preacher Curls', 'Cable Hammer Curls'],
  'Preacher Curls': ['Concentration Curls', 'Cable Curls', 'Incline Dumbbell Curls', 'Machine Preacher Curls'],
  'Hammer Curls': ['Cable Hammer Curls', 'Rope Hammer Curls', 'Cross-Body Hammer Curls', 'Neutral Grip Curls'],
  'Tricep Extensions': ['Cable Tricep Extensions', 'Overhead Tricep Extensions', 'Skull Crushers', 'Diamond Push-ups'],
  'Cable Tricep Extensions': ['Overhead Tricep Extensions', 'Tricep Dips', 'Close-Grip Push-ups', 'Machine Tricep Extensions'],

  // Leg Accessories
  'Leg Press': ['Hack Squats', 'Bulgarian Split Squats', 'Leg Press Machine', 'Smith Machine Squats'],
  'Leg Curls': ['Romanian Deadlifts', 'Good Mornings', 'Cable Pull-Throughs', 'Swiss Ball Leg Curls'],
  'Leg Extensions': ['Bulgarian Split Squats', 'Lunges', 'Step-ups', 'Single-Leg Press'],
  'Calf Raises': ['Seated Calf Raises', 'Donkey Calf Raises', 'Single-Leg Calf Raises', 'Smith Machine Calf Raises'],
  'Hip Thrusts': ['Glute Bridges', 'Single-Leg Hip Thrusts', 'Cable Pull-Throughs', 'Romanian Deadlifts'],

  // Core Accessories
  'Planks': ['Side Planks', 'Plank Variations', 'Dead Bugs', 'Bird Dogs'],
  'Russian Twists': ['Cable Wood Chops', 'Medicine Ball Slams', 'Bicycle Crunches', 'Oblique Crunches'],
  'Mountain Climbers': ['High Knees', 'Burpees', 'Bear Crawls', 'Plank Jacks'],
  'Hanging Leg Raises': ['Knee Raises', 'V-Ups', 'Leg Raises', 'Captain\'s Chair Leg Raises'],

  // Cardio/Conditioning Accessories
  'Treadmill': ['Stationary Bike', 'Elliptical', 'Rowing Machine', 'StairMaster'],
  'Burpees': ['Mountain Climbers', 'Jump Squats', 'High Knees', 'Jumping Jacks'],
  'Jump Squats': ['Box Jumps', 'Squat Jumps', 'Broad Jumps', 'Jump Lunges']
};

/**
 * Muscle group mappings for exercise variations
 */
const EXERCISE_MUSCLE_GROUPS: Record<string, string[]> = {
  'Dumbbell Flyes': ['Chest', 'Front Deltoids'],
  'Cable Flyes': ['Chest', 'Front Deltoids'], 
  'Lat Pulldown': ['Lats', 'Rhomboids', 'Rear Deltoids', 'Biceps'],
  'Cable Row': ['Lats', 'Rhomboids', 'Middle Traps', 'Rear Deltoids', 'Biceps'],
  'Lateral Raises': ['Side Deltoids', 'Upper Traps'],
  'Bicep Curls': ['Biceps', 'Forearms'],
  'Cable Curls': ['Biceps', 'Forearms'],
  'Preacher Curls': ['Biceps', 'Forearms'],
  'Hammer Curls': ['Biceps', 'Brachialis', 'Forearms'],
  'Tricep Extensions': ['Triceps'],
  'Cable Tricep Extensions': ['Triceps'],
  'Leg Press': ['Quadriceps', 'Glutes'],
  'Leg Curls': ['Hamstrings'],
  'Hip Thrusts': ['Glutes', 'Hamstrings'],
  'Face Pulls': ['Rear Deltoids', 'Rhomboids', 'Middle Traps'],
  'Planks': ['Core', 'Transverse Abdominis'],
  'Calf Raises': ['Calves', 'Soleus']
};

/**
 * Fetch user's previous training programs for exercise pattern analysis
 */
async function getPreviousTrainingPrograms(userId: string, limit: number = 3): Promise<TrainingProgram[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('training_programs')
    .select('program_details, generated_at')
    .eq('user_id', userId)
    .eq('is_active', false) // Only look at previous/inactive programs
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching previous training programs:', error);
    return [];
  }

  return (data || []).map(item => item.program_details as TrainingProgram);
}

/**
 * Extract all exercises from a training program
 */
function extractExercisesFromProgram(program: TrainingProgram): string[] {
  const exercises: string[] = [];
  
  program.phases.forEach(phase => {
    phase.weeks.forEach(week => {
      if (week.days) {
        week.days.forEach((workout: WorkoutDay) => {
          if (!workout.isRestDay && workout.exercises) {
            workout.exercises.forEach((exercise: ExerciseDetail) => {
              exercises.push(exercise.name);
            });
          }
        });
      }
    });
  });
  
  return exercises;
}

/**
 * Classify exercises as primary compounds or accessories
 */
function classifyExercises(exercises: string[]): { compounds: string[], accessories: string[] } {
  const compounds: string[] = [];
  const accessories: string[] = [];
  
  exercises.forEach(exercise => {
    const isCompound = PRIMARY_COMPOUND_EXERCISES.some(compound => 
      exercise.toLowerCase().includes(compound.toLowerCase()) ||
      compound.toLowerCase().includes(exercise.toLowerCase())
    );
    
    if (isCompound) {
      compounds.push(exercise);
    } else {
      accessories.push(exercise);
    }
  });
  
  return { compounds, accessories };
}

/**
 * Generate exercise variations for accessories based on previous program analysis
 */
function generateExerciseVariations(
  previousAccessories: string[], 
  targetMuscleGroups: string[]
): ExerciseVariation[] {
  const variations: ExerciseVariation[] = [];
  const usedVariations = new Set<string>();
  
  // For each muscle group, find variations that haven't been used recently
  targetMuscleGroups.forEach(muscleGroup => {
    const relevantPreviousExercises = previousAccessories.filter(exercise => {
      const exerciseMuscles = EXERCISE_MUSCLE_GROUPS[exercise] || [];
      return exerciseMuscles.includes(muscleGroup);
    });
    
    relevantPreviousExercises.forEach(previousExercise => {
      const availableVariations = EXERCISE_SUBSTITUTION_DATABASE[previousExercise] || [];
      
      // Find a variation that hasn't been used recently and isn't already selected
      const unusedVariation = availableVariations.find(variation => 
        !previousAccessories.includes(variation) && !Array.from(usedVariations).includes(variation)
      );
      
      if (unusedVariation) {
        const muscleGroupsTargeted = EXERCISE_MUSCLE_GROUPS[unusedVariation] || 
                                   EXERCISE_MUSCLE_GROUPS[previousExercise] || 
                                   [muscleGroup];
        
        variations.push({
          originalExercise: previousExercise,
          variationExercise: unusedVariation,
          muscleGroupsTargeted,
          rationale: `Novel stimulus variation targeting ${muscleGroupsTargeted.join(', ')} to prevent adaptive resistance`
        });
        
        usedVariations.add(unusedVariation);
      }
    });
  });
  
  return variations;
}

/**
 * Analyze previous programs for phasic exercise variation
 */
async function analyzePhasicVariationOpportunities(
  userId: string,
  targetMuscleGroups: string[] = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']
): Promise<PhasicVariationAnalysis> {
  try {
    const previousPrograms = await getPreviousTrainingPrograms(userId, 2);
    
    if (previousPrograms.length === 0) {
      return {
        previousExercises: [],
        suggestedVariations: [],
        rationale: 'No previous programs found - will use standard exercise selection for this initial program'
      };
    }
    
    // Extract all exercises from previous programs
    let allPreviousExercises: string[] = [];
    previousPrograms.forEach(program => {
      const exercises = extractExercisesFromProgram(program);
      allPreviousExercises = allPreviousExercises.concat(exercises);
    });
    
    // Remove duplicates and classify
    const uniquePreviousExercises = Array.from(new Set(allPreviousExercises));
    const { compounds, accessories } = classifyExercises(uniquePreviousExercises);
    
    // Generate variations for accessories only (maintaining compounds for specificity)
    const suggestedVariations = generateExerciseVariations(accessories, targetMuscleGroups);
    
    const rationale = previousPrograms.length > 0 
      ? `Based on analysis of ${previousPrograms.length} previous program(s), introducing ${suggestedVariations.length} exercise variations for accessory movements to provide novel stimulus and prevent adaptive resistance while maintaining primary compound lifts for specificity.`
      : 'No previous programs available for variation analysis - using standard exercise selection.';
    
    return {
      previousExercises: uniquePreviousExercises,
      suggestedVariations,
      rationale
    };
    
  } catch (error) {
    console.error('Error analyzing phasic variation opportunities:', error);
    return {
      previousExercises: [],
      suggestedVariations: [],
      rationale: 'Unable to analyze previous programs - using standard exercise selection'
    };
  }
}

/**
 * Interface for weak point analysis input
 */
interface WeakPointAnalysisInput {
  squat?: number
  bench?: number
  deadlift?: number
  ohp?: number
  experienceLevel?: string
  primaryGoal?: string
  injuriesLimitations?: string
  strengthAssessmentType?: string
}
