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
} from '@/lib/llmProgramContent'

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
// TypeScript interfaces for the training program structure:

enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string | number; // Can be "8-12" or just 10
  rest: string; // e.g., "60-90 seconds"
  tempo?: string; // e.g., "3-1-2-1"
  rpe?: number; // 1-10 scale
  notes?: string;
  weight?: string;
  category?: "Compound" | "Isolation" | "Cardio" | "Mobility" | "Core" | "Warm-up" | "Cool-down" | "Power";
}

interface WorkoutDay {
  dayOfWeek: DayOfWeek; // 1-7 (Monday=1)
  focus?: "Upper Body" | "Lower Body" | "Push" | "Pull" | "Legs" | "Full Body" | "Cardio" | "Core" | "Arms" | "Back" | "Chest" | "Shoulders" | "Glutes" | "Recovery/Mobility" | "Sport-Specific" | "Rest Day" | "Lower Body Endurance"; // MUST use one of these exact values
  exercises: ExerciseDetail[];
  warmUp?: ExerciseDetail[];
  coolDown?: ExerciseDetail[];
  notes?: string;
  estimatedDurationMinutes?: number;
  isRestDay?: boolean;
}

interface TrainingWeek {
  weekNumber: number;
  days: WorkoutDay[];
  notes?: string;
  weekInPhase?: number;
  weeklyGoals?: string[];
  progressionStrategy?: string; // How to progress from previous week. e.g., 'Add 2.5kg to all compound lifts', 'Add 1 set to all accessory exercises', 'Maintain weights but increase RPE to 8-9'
}

interface TrainingPhase {
  phaseName: string;
  durationWeeks: number;
  weeks: TrainingWeek[];
  notes?: string;
  objectives?: string[];
  phaseNumber?: number;
  progressionStrategy?: string; // Overall progression approach for this phase. e.g., 'Linear weight increases each week', 'Volume accumulation then intensification', 'Autoregulated RPE progression'
}

interface TrainingProgram {
  programName: string;
  description: string;
  durationWeeksTotal: number;
  phases: TrainingPhase[];
  generalAdvice?: string;
  generatedAt: string; // ISO date string
  aiModelUsed?: string;
  difficultyLevel?: "Beginner" | "Intermediate" | "Advanced";
  trainingFrequency?: number;
  requiredEquipment?: string[];
  tags?: string[];
  version?: string;
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
 * Construct the detailed LLM prompt for program generation
 */
async function constructLLMPrompt(profile: UserProfileForGeneration): Promise<string> {
  const onboarding = profile.onboarding_responses

  if (!onboarding) {
    throw new Error('User has not completed onboarding')
  }

  // Extract strength data
  const squat1RMEstimate = onboarding.squat1RMEstimate
  const benchPress1RMEstimate = onboarding.benchPress1RMEstimate
  const deadlift1RMEstimate = onboarding.deadlift1RMEstimate
  const overheadPress1RMEstimate = onboarding.overheadPress1RMEstimate
  const strengthAssessmentType = onboarding.strengthAssessmentType
  const weightUnit = profile.weight_unit || 'kg' // Get weight unit from profile

  // Analyze weak points based on strength ratios and user data
  const weakPointAnalysis = analyzeWeakPoints({
    squat: squat1RMEstimate,
    bench: benchPress1RMEstimate,
    deadlift: deadlift1RMEstimate,
    ohp: overheadPress1RMEstimate,
    experienceLevel: profile.experience_level || undefined,
    primaryGoal: onboarding.primaryGoal,
    injuriesLimitations: onboarding.injuriesLimitations || undefined,
    strengthAssessmentType: strengthAssessmentType
  })

  // Analyze previous programs for phasic exercise variation opportunities
  const phasicVariationAnalysis = await analyzePhasicVariationOpportunities(profile.id)

  const typeDefinitions = getTypeScriptInterfaceDefinitions()
  
  // Get expert guidelines based on user's training focus and experience level
  const expertGuidelines = getExpertGuidelines(profile.primary_training_focus, profile.experience_level)

  const userDataSection = `
USER PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Experience Level: ${profile.experience_level || 'Not specified'}
- Primary Training Focus: ${profile.primary_training_focus || 'Not specified'}

USER GOALS & PREFERENCES:
- Primary Goal: ${onboarding.primaryGoal}

- Sport-Specific Details: ${onboarding.sportSpecificDetails || 'None'}
- Training Frequency: ${onboarding.trainingFrequencyDays} days per week
- Session Duration: ${onboarding.sessionDuration}
- Available Equipment: ${onboarding.equipment.join(', ')}
- Exercise Preferences: ${onboarding.exercisePreferences || 'None specified'}
- Injuries/Limitations: ${onboarding.injuriesLimitations || 'None specified'}
`

  const strengthDataSection = `
USER STRENGTH ESTIMATES (in ${weightUnit}):
- Squat 1RM / Estimate: ${squat1RMEstimate || 'Not provided'}
- Bench Press 1RM / Estimate: ${benchPress1RMEstimate || 'Not provided'}
- Deadlift 1RM / Estimate: ${deadlift1RMEstimate || 'Not provided'}
- Overhead Press 1RM / Estimate: ${overheadPress1RMEstimate || 'Not provided'}
- Values Determined By: ${strengthAssessmentType || 'Not provided'}
`

  const instructions = `
PROGRAM GENERATION INSTRUCTIONS:

**MANDATORY SESSION REQUIREMENTS (NON-NEGOTIABLE)**:
Based on the user's selected session duration (${onboarding.sessionDuration}), you MUST include the following MINIMUM number of exercises per workout:
- **30-45 minutes**: Minimum 6-8 total exercises (2-3 warm-up, 3-4 main workout, 1-2 cool-down)
- **45-60 minutes**: Minimum 8-10 total exercises (3-4 warm-up, 4-5 main workout, 1-2 cool-down)  
- **60-75 minutes**: Minimum 10-14 total exercises (3-4 warm-up, 6-8 main workout, 2-3 cool-down)
- **75+ minutes**: Minimum 12-16 total exercises (4-5 warm-up, 7-9 main workout, 2-3 cool-down)

**CRITICAL**: These exercise counts are ABSOLUTE MINIMUMS. If the expert guidelines below suggest fewer exercises, you MUST supplement them with appropriate additional exercises (accessory work, variations, isolation movements) to meet these requirements while maintaining the core principles of the expert guidelines.

For ADVANCED users doing ATHLETIC PERFORMANCE training with 60+ minute sessions, you MUST include:
- Complex multi-joint movements (squats, deadlifts, presses)
- Power/explosive exercises (cleans, jumps, throws)
- Speed/agility components
- Sport-specific conditioning
- Adequate volume to justify the time commitment

**DURATION VALIDATION**: The total estimated time for all exercises (including rest periods) MUST reasonably fill the user's selected session duration. Calculate: (sets × reps × tempo) + (sets × rest time) + transition time between exercises.

1.  **Expert Guidelines Integration**: Use the "EXPERT GUIDELINES FOR ${profile.primary_training_focus?.toUpperCase() || 'USER\'S GOAL'} - ${profile.experience_level?.toUpperCase() || 'USER\'S LEVEL'}" provided below as your FOUNDATION, but EXPAND upon them to meet the mandatory session requirements above. If the guidelines suggest only 3 exercises but the user needs 8-10 exercises for their session duration, ADD appropriate supplementary exercises that align with the same training principles.

2.  **Adapt to User Specifics**: You MUST adapt the expert guidelines and any example plans within them to the user's specific "Available Equipment" (${onboarding.equipment.join(', ')}), "Training Frequency" (${onboarding.trainingFrequencyDays} days/week), and "Session Duration" (${onboarding.sessionDuration}). If the user's available equipment or preferred schedule differs significantly from an example in the guidelines, modify the exercises and structure to be appropriate and safe while still adhering to the core principles (e.g., target muscle groups, progression type) from the guidelines. For instance, if guidelines suggest barbell squats but user only has dumbbells, suggest dumbbell squats or goblet squats. If guidelines suggest 5 days but user selected 3, condense the plan logically.

**Mandatory Injury/Limitation & Preference Handling**:
Based on the \`USER GOALS & PREFERENCES -> Injuries/Limitations\` field (verbatim: '${onboarding.injuriesLimitations || 'None specified'}') and \`USER GOALS & PREFERENCES -> Exercise Preferences\` field (verbatim: '${onboarding.exercisePreferences || 'None specified'}'):
- You MUST adapt exercise selection. IF specific injuries are mentioned (e.g., 'knee pain', 'shoulder impingement', 'lower back sensitivity'), AVOID exercises that typically aggravate these conditions.
- SUGGEST suitable, safer alternatives for the target muscle group. For example, if 'knee pain' is mentioned, prefer Leg Press or Glute Bridges over Deep Barbell Squats or high-impact Plyometrics. If 'shoulder impingement' is mentioned, avoid direct Overhead Press and suggest Landmine Press or incline dumbbell press with neutral grip.
- If specific exercises are listed as 'disliked' in \`exercisePreferences\`, DO NOT include them. Find appropriate substitutes.
- If specific exercises are listed as 'liked' or 'preferred', PRIORITIZE their inclusion if they align with the user's goals and overall program structure.

**Anchor Lift Requirement - MANDATORY:**
For each non-rest day, you MUST designate the first exercise as the "Anchor Lift". This is the primary focus of the entire workout and the exercise that drives overall program progression.

**Anchor Lift Specifications:**
- **Position**: MUST be the first exercise after warm-up (Tier 1, Position 1)
- **Exercise Type**: MUST be a major compound movement (Squat, Bench Press, Deadlift, Overhead Press, or close variations like Paused Squat, Incline Bench Press, Sumo Deadlift, etc.)
- **Progression Priority**: The weekly progressionStrategy should be most clearly applied to this Anchor Lift
- **Primary Goal**: The user's main objective is to progress on this lift over the course of the training program
- **Equipment Priority**: Barbell > Dumbbell > Machine (maximum neural demand and skill development)
- **Programming Focus**: All other exercises in the workout support and complement the Anchor Lift

**Workout Structure and Tiered Exercise Selection:**
Each workout MUST be structured logically using a three-tier hierarchy that optimizes neurological demands and training stimulus, with the Anchor Lift leading the session. Prioritize exercises as follows:

1.  **Primary Compound Movements (1-2 exercises):** The FIRST exercise must be the designated Anchor Lift (see above). If a second Tier 1 exercise is included, it should complement the Anchor Lift. These are the most neurologically demanding and form the foundation of each workout. Use free weights (Barbell, Dumbbell) for these unless the user has specific injuries. Target lower rep ranges (5-10 reps) and a moderate RPE (RPE 7-8). Place these FIRST in each workout when nervous system freshness is highest.
    - **Equipment Priority**: Barbell > Dumbbell > Machine (for maximum neural demand and movement skill development)
    - **Examples**: Back squat, deadlift, bench press, overhead press, bent-over row
    - **Rationale**: Builds foundational strength, movement patterns, and coordination while nervous system is fresh

2.  **Secondary Movements (2-3 exercises):** These are the main hypertrophy work and should apply SFR principles for optimal muscle building. Prioritize stable variations (Machines, Cables, supported Dumbbell movements) that allow for high muscular tension with reduced stabilizer fatigue. Target moderate rep ranges (8-15 reps) and a higher RPE (RPE 8-9).
    - **Equipment Priority**: Machine > Cable > Supported Dumbbell > Unsupported movements
    - **Examples**: Leg press, machine chest press, cable rows, dumbbell shoulder press (seated), lat pulldown
    - **Rationale**: Maximizes muscle tension and hypertrophy stimulus with optimal stability for muscle isolation

3.  **Isolation/Finishing Movements (2-3 exercises):** These target smaller muscle groups and induce metabolic stress for complete muscle development. Use single-joint movements (Curls, Raises, Pushdowns) with high stability equipment. Target high rep ranges (12-25 reps) and push very close to failure (RPE 9-10).
    - **Equipment Priority**: Cable > Machine > Dumbbell (for consistent tension and fatigue accumulation)
    - **Examples**: Bicep curls, tricep pushdowns, lateral raises, leg curls, calf raises
    - **Rationale**: Targets smaller muscle groups with metabolic stress, enhances muscle definition and addresses weak points

**Exercise Selection Principles - Optimize Stimulus-to-Fatigue Ratio (SFR)**:
- **For Hypertrophy/Muscle Gain Goals**: Apply the tiered structure above with emphasis on maximizing muscle tension and metabolic stress. Focus on the secondary and isolation tiers for primary hypertrophy stimulus.
    - **Tier 1 (Primary Compound)**: Use as strength base but limit to 1-2 exercises to preserve energy for hypertrophy work
    - **Tier 2 (Secondary)**: This is the PRIMARY hypertrophy driver - prioritize machine-based movements for optimal muscle isolation
    - **Tier 3 (Isolation)**: Essential for complete muscle development and addressing smaller muscle groups
    - **Examples**: Deadlift + Leg press + Leg curls + Calf raises for complete leg development
- **For Strength/Powerlifting Goals**: Prioritize specificity to competition lifts in Tier 1, with supportive accessories in Tiers 2-3.
    - **Tier 1 (Primary Compound)**: Competition lifts (squat, bench press, deadlift, overhead press) take priority
    - **Tier 2 (Secondary)**: Competition variations and primary accessories that directly support main lifts
    - **Tier 3 (Isolation)**: Targeted weak point training and injury prevention exercises
    - **Examples**: Competition bench press + Close-grip bench press + Tricep pushdowns + Face pulls
- **For General Fitness Goals**: Use all three tiers to create balanced movement pattern coverage and functional strength.
    - **Tier 1 (Primary Compound)**: Cover all major movement patterns (squat, hinge, push, pull)
    - **Tier 2 (Secondary)**: Reinforce movement patterns with variations and additional muscle group training
    - **Tier 3 (Isolation)**: Address smaller muscle groups and imbalances for complete fitness
    - **Examples**: Goblet squat + Dumbbell bench press + Bicep curls + Planks

**Enhanced Substitution Logic**:
- **Equipment Limitations**: When substituting due to equipment constraints, find alternatives that target the same muscle group with similar movement pattern and loading characteristics.
    - **Barbell → Dumbbell**: Barbell squat → Dumbbell goblet squat or Bulgarian split squat
    - **Barbell → Bodyweight**: Barbell row → Inverted row or pull-ups
    - **Machine → Free Weight**: Leg press → Goblet squat or dumbbell lunges
    - **Cable → Dumbbell**: Cable row → Dumbbell row or bent-over row
- **Injury/Limitation Modifications**: When modifying for injuries, select exercises that avoid the problematic movement or joint position while maintaining muscle group training.
    - **Knee Pain**: Barbell squat → Box squat (reduced range), leg press (supported), or hip thrust (knee-sparing)
    - **Lower Back Issues**: Conventional deadlift → Trap bar deadlift, Romanian deadlift, or hip thrust
    - **Shoulder Impingement**: Overhead press → Landmine press, incline dumbbell press with neutral grip, or seated dumbbell press
    - **Wrist Pain**: Barbell exercises → Dumbbell alternatives with neutral grip or cable exercises
- **Experience Level Modifications**: Adjust exercise complexity based on user experience and movement competency.
    - **Beginner**: Machine versions → Dumbbell versions → Barbell versions as progression pathway
    - **Intermediate/Advanced**: Include unilateral work, tempo variations, and advanced movement patterns
    - **Movement Quality**: Always prioritize proper form and range of motion over load progression

3.  **Structure & Content**:
    *   Structure the program with 1-2 phases as appropriate for a 4-6 week duration and the user's goals, based on the expert guidelines.
    *   **Implement Dynamic, Autoregulated Periodization based on Experience Level**:
        *   **For Intermediate/Advanced Users (6+ months experience) - Implement a 4-Week Volume-Focused Mesocycle Model**:
            *   **Week 1 (Volume Accumulation - MEV Start):** Start at Minimum Effective Volume (MEV) as specified in expert guidelines. Focus on adding reps within target rep ranges. Weight increases should be minimal. Target RPE 7-8 (2-3 Reps in Reserve) with emphasis on movement quality.
            *   **Week 2 (Volume Accumulation - Set Addition):** For exercises where top of rep range was achieved in Week 1, ADD ONE SET. Continue progressing reps within target ranges for other exercises. Maintain RPE 7-8 with minimal weight increases.
            *   **Week 3 (Final Volume Week - Reach MAV):** Complete the volume progression to Maximum Adaptive Volume (MAV). Add remaining sets needed to reach MAV but do not exceed Maximum Recoverable Volume (MRV). Focus on completing maximum productive volume before deload.
            *   **Week 4 (Deload - Return to MEV):** Reduce total sets to approximately MEV levels (50-60% volume reduction from Week 3) and intensity to RPE 5-6 (4-5 Reps in Reserve) across ALL exercises. Prepare for next mesocycle with potential weight increases.
        *   **For Beginner Users (<6 months experience) - Implement Volume-Focused Progression Model with Conservative Targets**:
            *   **Primary Progression Method**: Add reps within target rep ranges first, then add sets when top of range is achieved consistently. Weight increases should be minimal during accumulation weeks.
            *   **Rep Range Progression**: Focus on mastering rep ranges (e.g., 8-12 reps) before adding sets. Only increase weight when form quality remains excellent throughout entire rep range.
            *   Target RPE 6-7 (3-4 Reps in Reserve) to prioritize technique development and movement pattern learning. Focus on movement quality and gradual volume adaptation over intensity.
            *   Include technique-focused notes and form cues in every compound exercise. Build confidence and competency with volume before pursuing higher intensities.
    *   **Volume Progression Framework**: Based on the volume landmarks (MEV/MAV/MRV) specified in the EXPERT GUIDELINES, structure the weekly sets per muscle group progression following the mesocycle progression strategy:
        *   **Week 1**: Start at MEV (Minimum Effective Volume). Focus on adding reps within target rep ranges for all exercises. Minimal weight adjustments.
        *   **Week 2**: For exercises where top rep range was achieved, ADD ONE SET per exercise. Continue rep progression for exercises not yet at top range. Progress towards MAV through set addition.
        *   **Week 3**: Complete volume progression to MAV (Maximum Adaptive Volume). Add remaining sets needed to reach MAV but never exceed MRV. This is the final volume increase week.
        *   **Week 4**: Return to MEV levels for deload (approximately 50-60% of Week 3 volume) and reduced intensity (RPE 5-6). Prepare for next mesocycle.
        *   **CRITICAL**: Count sets per muscle group carefully. Each exercise contributes sets to its primary muscle groups. Progression is primarily through SET ADDITION, not weight increases during the accumulation phase. Ensure total weekly sets per muscle align with the specified MEV/MAV/MRV ranges from the expert guidelines.
    *   **Mesocycle Progression Strategy (Overrides General Advice) - MANDATORY**: For each \`TrainingWeek\` and \`TrainingPhase\`, you MUST populate the \`progressionStrategy\` field with clear, actionable progression instructions following this specific mesocycle progression model, with PRIMARY focus on the Anchor Lift:
        *   **Anchor Lift Progression Priority**: The progression strategy should ALWAYS emphasize the Anchor Lift as the primary focus. All progression guidance should be most clearly applied to this lift, with other exercises following secondary importance.
        *   **For Weeks 1-3 (Accumulation Phase)**: The PRIMARY method of progression should be adding SETS, not weight. Follow this progression hierarchy, especially for the Anchor Lift:
            *   **Step 1**: Add reps within the target rep range until the TOP of the range is achieved for all sets (prioritize Anchor Lift)
            *   **Step 2**: Once top rep range is achieved for all sets, ADD ONE SET to that exercise the following week (Anchor Lift gets first priority)
            *   **Step 3**: Weight increases should be MINIMAL during this phase (only when form breakdown occurs at target reps, especially for Anchor Lift)
        *   **For Week 3 (Intensification/Final Volume Week)**: This is the final week to add volume with the goal to reach the user's MAV (Maximum Adaptive Volume)
            *   Focus on completing the volume progression to MAV levels
            *   Maintain RPE targets while achieving maximum productive volume
            *   Prepare for deload by pushing volume to sustainable limits
        *   **After Mesocycle Completion**: For the next training block, the primary progression method shifts to WEIGHT increases
            *   Use the same set and rep scheme from the previous block's Week 1
            *   Increase weight for the same volume structure established in the previous mesocycle
            *   Return to rep/set progression within the new weight ranges
        *   **TrainingWeek.progressionStrategy Examples (Anchor Lift Focus)**:
            *   **Week 1**: "Anchor Lift baseline: add reps within range, minimal weight changes"
            *   **Week 2**: "Add 1 set to Anchor Lift if top range achieved, continue rep progression"  
            *   **Week 3**: "Complete Anchor Lift MAV progression, final volume increases"
            *   **Week 4**: "Deload: Week 1 volume, RPE 5-6, prepare for next mesocycle"
        *   **TrainingPhase.progressionStrategy**: Overall approach.
            *   **Volume Phase**: "Set addition progression (MEV→MAV), minimal weight increases"
            *   **Next Block**: "Same structure, increased weights from previous Week 1"
            *   **Long-term**: "Alternating volume/weight focus for optimal development"
    *   Implement progressive overload principles as described in the expert guidelines, but now systematically structured within the periodization and volume progression models above.
    *   **Individualized Weak Point Targeting - MANDATORY**: Based on the user's strength ratios and profile analysis, you MUST incorporate targeted weak point training:
        *   **Primary Weak Point Identified**: ${weakPointAnalysis.primaryWeakPoint}
        *   **Weak Point Description**: ${weakPointAnalysis.weakPointDescription}
        *   **Scientific Rationale**: ${weakPointAnalysis.rationale}
        *   **IMPLEMENTATION REQUIREMENTS**:
            *   **Dedicate 1-2 accessory exercise slots per relevant workout** to address this specific weak point
            *   **Recommended Exercises**: Prioritize these specific exercises: ${weakPointAnalysis.recommendedAccessories.join(', ')}
            *   **Training Integration**: Incorporate weak point exercises as targeted accessories, not as replacements for main compound lifts
            *   **Progressive Emphasis**: Give weak point exercises higher priority than general accessory work
            *   **Volume Considerations**: Weak point exercises should receive 2-4 sets per workout when included, prioritizing consistency over volume
            *   **Educational Notes**: Include brief explanations in exercise notes about why these exercises address the identified weak point
        *   **Example Implementation**: If posterior chain weakness is identified, include Romanian Deadlifts, Hip Thrusts, or Good Mornings as priority accessories on lower body and/or pull days
    *   **Phasic Exercise Variation for Novel Stimulus - MANDATORY**: To prevent adaptive resistance and reduce overuse injury risk, you MUST introduce subtle exercise variations for accessory movements based on the user's training history:
        *   **Previous Program Analysis**: ${phasicVariationAnalysis.rationale}
        *   **Previously Used Exercises**: ${phasicVariationAnalysis.previousExercises.length > 0 ? phasicVariationAnalysis.previousExercises.join(', ') : 'None (first program)'}
        *   **Suggested Exercise Variations**: ${phasicVariationAnalysis.suggestedVariations.length > 0 ? 
            phasicVariationAnalysis.suggestedVariations.map(v => `${v.originalExercise} → ${v.variationExercise} (${v.rationale})`).join('; ') : 
            'No specific variations required for first program'}
        *   **IMPLEMENTATION REQUIREMENTS**:
            *   **MAINTAIN Primary Compound Lifts**: Never vary the main compound movements (Squat, Bench Press, Deadlift, Overhead Press) as these provide movement specificity essential for strength development
            *   **VARY Accessory Exercises Only**: Introduce variations for 1-2 accessory exercises per major muscle group (chest, back, shoulders, arms, legs) compared to previous programs
            *   **Equivalent Muscle Group Targeting**: Ensure all variations target the same primary and secondary muscle groups as the original exercise to maintain program effectiveness
            *   **Equipment Compatibility**: Only suggest variations that are compatible with the user's available equipment: ${onboarding.equipment.join(', ')}
            *   **Novel Stimulus Explanation**: In the \`generalAdvice\` section, include 1-2 sentences explaining the benefits of exercise variation: "This program introduces strategic exercise variations for accessory movements to provide novel stimulus and prevent adaptive resistance while maintaining primary compound lifts for movement specificity."
        *   **Variation Examples (if applicable)**:
            *   Instead of "Dumbbell Bicep Curls" → use "Cable Curls" or "Preacher Curls"
            *   Instead of "Leg Press" → use "Hack Squats" or "Bulgarian Split Squats"  
            *   Instead of "Lat Pulldown" → use "Cable Row" or "T-Bar Row"
            *   Instead of "Dumbbell Flyes" → use "Cable Flyes" or "Pec Deck"
    *   **Exercise Ordering & Tiered Structure with Anchor Lift - MANDATORY**:
        *   **CRITICAL**: Every workout MUST follow the three-tier structure defined above, with the Anchor Lift leading the session. Order exercises within each workout as follows:
            *   **FIRST Position (Anchor Lift)**: The designated Anchor Lift MUST be the very first exercise after warm-up (Tier 1, Position 1) - this is the primary focus and progression driver
            *   **Remaining Tier 1 Positions**: If a second Tier 1 exercise is included, it should complement the Anchor Lift - placed when nervous system is still fresh
            *   **Middle Positions (Tier 2)**: 2-3 Secondary Movements - main hypertrophy work with optimal SFR, after compound movements but before isolation
            *   **Final Positions (Tier 3)**: 2-3 Isolation/Finishing Movements - smaller muscle groups and metabolic stress, when fatigue is acceptable
        *   **Exercise Ordering Rationale**: This Anchor Lift-focused tiered approach ensures optimal performance on the PRIMARY exercise that drives program progression, while maximizing training stimulus across all movement types.
        *   **Warm-up Placement**: Place warm-up exercises BEFORE the Anchor Lift to prepare the nervous system and movement patterns specifically for the primary lift
        *   **Cool-down Placement**: Place cool-down exercises AFTER Tier 3 exercises for recovery and flexibility
        *   **Example Workout Structure**: Warm-up → Back Squat (Anchor Lift) → Romanian Deadlift (Tier 1) → Leg Press (Tier 2) → Walking Lunges (Tier 2) → Leg Curls (Tier 3) → Calf Raises (Tier 3) → Cool-down
    *   **Exercise Selection & Naming Standards**:
        *   Ensure exercise names are standard and recognizable. If an exercise from the guidelines is not in the provided TypeScript \`ExerciseDetail.name\` list, use a very common, standard alternative or break it down if it's a complex movement.
        *   **CRITICAL**: Apply both the Tiered Structure AND Exercise Selection Principles above when choosing exercises. The tier determines ordering priority, while SFR principles determine the specific exercise selection within each tier.
        *   When multiple exercise options exist for the same muscle group and tier, prioritize based on SFR hierarchy:
            *   **Tier 1 (Primary Compound)**: Barbell > Dumbbell > Machine (neural demand priority)
            *   **Tier 2 (Secondary)**: Machine > Cable > Supported Dumbbell (stability priority for hypertrophy)
            *   **Tier 3 (Isolation)**: Cable > Machine > Dumbbell (consistent tension priority)
        *   Include exercise variations that match the user's equipment availability and experience level while maintaining optimal SFR for each tier.
    *   Include warm-up and cool-down for each training day. If guidelines are sparse on this, apply general best practices (e.g., 5-10 min light cardio and dynamic stretches for warm-up; 5-10 min static stretches for cool-down).
    *   Set \`estimatedDurationMinutes\` for each WorkoutDay to align with the user's preferred session duration, adapting the number of exercises or sets from the guidelines if necessary.
    *   For the \`notes\` field in each \`ExerciseDetail\`:
        *   **Tier-Specific Guidance with Anchor Lift Priority - MANDATORY**: Include tier identification and rationale in exercise notes:
            *   **Anchor Lift (First Exercise)**: ALWAYS identify as the primary focus. Examples: 'ANCHOR LIFT: Primary progression focus - perfect form and progressive overload priority' or 'Anchor Lift: Foundation of today\'s workout - maximize performance when fresh'
            *   **Tier 1 (Primary Compound)**: Include form cues and emphasize neural demand. Examples: 'Tier 1: Foundation movement - focus on perfect form and controlled tempo' or 'Primary compound - perform when fresh for maximum strength gains'
            *   **Tier 2 (Secondary)**: Emphasize muscle-building focus and stability benefits. Examples: 'Tier 2: Main hypertrophy driver - focus on muscle tension and stretch' or 'Secondary movement - prioritize muscle isolation over load'
            *   **Tier 3 (Isolation)**: Emphasize metabolic stress and finishing effect. Examples: 'Tier 3: Metabolic finisher - push close to failure for muscle definition' or 'Isolation movement - focus on pump and muscle fatigue'
        *   If the exercise is a major compound lift (e.g., Squat, Bench Press, Deadlift, Overhead Press), ALWAYS include 1-2 concise, critical form cues. Examples: For Squat: 'Keep chest up, drive knees out, descend to at least parallel.' For Deadlift: 'Maintain neutral spine, engage lats, push through the floor.'
        *   If the user's \`Experience Level\` is 'Beginner (<6 months)', provide more detailed form cues or safety reminders for most exercises.
        *   **SFR Optimization Notes**: Include brief explanations when exercise selection prioritizes stimulus-to-fatigue ratio:
            *   For hypertrophy-focused exercises: 'Chosen for optimal muscle isolation and stretch' or 'Machine version for better stability and muscle focus'
            *   For strength-focused exercises: 'Competition movement for maximum specificity' or 'Close variation to improve competition lift'
            *   For general fitness exercises: 'Functional movement pattern training multiple muscle groups'
        *   If an exercise was modified due to an injury/limitation, briefly note this and explain the SFR benefit (e.g., 'Modified for knee comfort while maintaining quad training')
        *   If an exercise was substituted due to equipment limitations, note the substitution reason and maintained training effect (e.g., 'Dumbbell alternative maintaining same movement pattern').
4.  **Output Format**:
    *   Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.).
    *   For rest days, set \`isRestDay: true\` and provide a minimal or empty exercises array.
    *   Ensure ${onboarding.trainingFrequencyDays} training days and ${7 - onboarding.trainingFrequencyDays} rest days per week, distributing them reasonably (e.g., not all training days consecutively if possible, unless specified in guidelines).
    *   Set \`generatedAt\` to the current ISO date string.
    *   Include appropriate tags based on goals and focus.
    *   For the \`generalAdvice\` field: Provide a brief (3-4 sentences) explanation of the program's overall structure, periodization approach, and how it aligns with the user's \`Primary Goal\`, \`Experience Level\`, and \`Available Equipment\`. **MUST include explanation of both the periodization model AND tiered exercise structure**:
        *   **Anchor Lift and Tiered Structure Explanation**: ALWAYS include: "Each workout centers on an Anchor Lift (primary compound) with 3-tier structure: Tier 1 compounds when fresh, Tier 2 hypertrophy work, Tier 3 isolation finishers."
        *   For Intermediate/Advanced: Explain the 4-week undulating periodization (MEV → MAV progression → intensification → deload) and RPE-based autoregulation with volume landmarks, PLUS tiered structure
        *   For Beginners: Explain the linear progression approach and emphasis on technique development with conservative RPE targets, PLUS tiered structure
        *   Example for Intermediate: 'Volume-focused 4-week mesocycle: Weeks 1-3 progress through set addition (MEV→MAV), Week 4 deloads. Each workout centers on Anchor Lift with tiered structure. Rep progression first, then set addition when range mastered.'
        *   Example for Beginner: 'Conservative volume progression with Anchor Lift focus. RPE 6-7 targets, rep mastery before set addition, minimal weight increases during accumulation weeks.'
5.  **Focus Field**: For the \`focus\` field in WorkoutDay objects, you MUST strictly use ONLY one of these exact predefined values from the TypeScript interface:
    - "Upper Body" (for bench press, overhead press, upper body days)
    - "Lower Body" (for squat, deadlift, leg-focused days)  
    - "Push" (for pressing movements)
    - "Pull" (for pulling movements)
    - "Legs" (alternative to Lower Body)
    - "Full Body" (for full body workouts)
    - "Cardio"
    - "Core"
    - "Arms"
    - "Back"
    - "Chest"
    - "Shoulders"
    - "Glutes"
    - "Recovery/Mobility"
    - "Sport-Specific"
    - "Rest Day"
    - "Lower Body Endurance"
    
    **CRITICAL**: Do NOT use exercise names like "Squat", "Bench", "Deadlift" or "Overhead Press" as focus values. These are exercise names, not focus categories. For powerlifting programs:
    - Squat day = "Lower Body"
    - Bench day = "Upper Body" or "Push"
    - Deadlift day = "Lower Body" or "Pull"
    - Overhead Press day = "Upper Body" or "Push"
    
    If more specificity is needed, use the notes field of the WorkoutDay.
6.  **Weight Prescription & Autoregulation**:
    *   Utilize the "USER STRENGTH ESTIMATES" provided. The unit for these estimates is ${weightUnit}.
    *   For core compound exercises (Squat, Bench Press, Deadlift, Overhead Press if applicable) where a 1RM/e1RM is provided by the user:
        *   For sets in the 1-5 rep range (strength focus), suggest working weights typically between 80-95% of the user's 1RM/e1RM.
        *   For sets in the 6-12 rep range (hypertrophy focus), suggest working weights typically between 65-80% of 1RM/e1RM.
        *   For sets in the 12-15+ rep range (endurance focus), suggest working weights typically between 50-65% of 1RM/e1RM.
        *   **CRITICAL**: Always include the target RPE in the \`rpe\` field and provide RPE/RIR guidance in the \`notes\` or \`weight\` field to enable autoregulation.
    *   If the user's \`Experience Level\` is 'Beginner' or \`Values Determined By\` is 'Unsure / Just a guess', instruct the AI to be conservative. It should prioritize form and suggest starting at the lower end of percentage ranges or even with 'just the bar' for complex movements. Emphasize gradual weight increase.
    *   **For exercises where a direct 1RM is not applicable or not provided by the user, you MUST provide RPE or RIR guidance for autoregulation**. This is CRUCIAL for intermediate/advanced users. Examples:
        *   "Select a weight for 10 reps at RPE 8 (leaving 2 reps in the tank)"
        *   "Challenging weight for 12 reps (RIR 1-2)"
        *   "Moderate weight for 15 reps at RPE 7 (could do 3 more reps)"
        *   "Heavy weight for 6 reps at RPE 9 (1 rep in reserve)"
        *   For beginners: "Light-moderate weight for 10 reps at RPE 6-7 (focus on form)"
    *   **RPE/RIR Education in Program Notes**: For users unfamiliar with RPE, include brief explanations:
        *   "RPE 6-7: Moderate effort, could do 3-4 more reps"
        *   "RPE 8: Hard effort, could do 2 more reps" 
        *   "RPE 9: Very hard, could do 1 more rep"
        *   "RIR = Reps in Reserve (how many more reps you could do)"
    *   The output for the \`weight\` field in the \`ExerciseDetail\` JSON object should be a string. Examples: "100 ${weightUnit}", "45 ${weightUnit}", "Bodyweight", "Select weight for RPE 8 (2 RIR)", "Moderate weight for 12 reps at RPE 7". If a specific weight is given, ALWAYS include the unit (${weightUnit}).

IMPORTANT: Return ONLY valid JSON matching the TrainingProgram interface. No additional text or markdown.
`

  return `You are an expert strength and conditioning coach tasked with creating a personalized training program. Generate a JSON object matching the following TypeScript interface structure:

${typeDefinitions}

---
USER DATA:
${userDataSection}
${strengthDataSection}
---
EXPERT GUIDELINES FOR ${profile.primary_training_focus?.toUpperCase() || 'USER\'S GOAL'} - ${profile.experience_level?.toUpperCase() || 'USER\'S LEVEL'}:
${expertGuidelines}
---
PROGRAM GENERATION INSTRUCTIONS:
${instructions}
`
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
      max_tokens: 16384, // Adjusted to model's maximum supported completion tokens
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

      // Continue with program generation using the fetched data
      const prompt = await constructLLMPrompt(userProfileForGeneration)
      const { program: llmResponse, error: llmError } = await callLLMAPI(prompt)

      if (llmError) {
        console.error('LLM API error:', llmError)
        return { error: 'Unable to generate your training program at this time. Please try again later.', success: false }
      }

      // Add generatedAt and aiModelUsed if not provided by LLM
      const programData = {
        ...llmResponse,
        generatedAt: llmResponse.generatedAt || new Date().toISOString(),
        aiModelUsed: llmResponse.aiModelUsed || 'gpt-4o',
      }

      // Validate the LLM response
      const validationResult = TrainingProgramSchema.safeParse(programData)
      if (!validationResult.success) {
        console.error('LLM response validation failed:', validationResult.error)
        return { error: 'The generated program has validation errors. Please try again.', success: false }
      }

      const validatedProgram = validationResult.data as unknown as TrainingProgram

      // Save to database
      const { data: savedProgram, error: saveError } = await supabase
        .from('training_programs')
        .insert({
          user_id: userId,
          program_details: validatedProgram,
          ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
          onboarding_data_snapshot: profile.onboarding_responses,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving training program:', saveError)
        return { error: 'Failed to save your training program. Please try again.', success: false }
      }

      console.log('Training program generated and saved successfully')
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

      // Step 2: Construct the LLM prompt
      const prompt = await constructLLMPrompt(userProfileForGeneration)

      // Step 3: Call the LLM API
      const { program: llmResponse, error: llmError } = await callLLMAPI(prompt)

      if (llmError) {
        console.error('LLM API error:', llmError)
        return { error: 'Unable to generate your training program at this time. Please try again later.', success: false }
      }

      // Add generatedAt and aiModelUsed if not provided by LLM
      const programData = {
        ...llmResponse,
        generatedAt: llmResponse.generatedAt || new Date().toISOString(),
        aiModelUsed: llmResponse.aiModelUsed || 'gpt-4o',
      }

      // Validate the LLM response
      const validationResult = TrainingProgramSchema.safeParse(programData)
      if (!validationResult.success) {
        console.error('LLM response validation failed:', validationResult.error)
        return { error: 'The generated program has validation errors. Please try again.', success: false }
      }

      const validatedProgram = validationResult.data as unknown as TrainingProgram

      // Save to database
      const { data: savedProgram, error: saveError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          program_details: validatedProgram,
          ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
          onboarding_data_snapshot: onboardingData,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving training program:', saveError)
        return { error: 'Failed to save your training program. Please try again.', success: false }
      }

      console.log('Training program generated and saved successfully')
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
