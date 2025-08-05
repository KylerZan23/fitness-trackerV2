/**
 * Enhanced Program Validation Schema (2025/01)
 * 
 * Comprehensive Zod validation for scientifically-grounded training programs.
 * This module ensures that all generated programs adhere to evidence-based
 * exercise science principles, volume landmarks, autoregulation protocols,
 * and weak point intervention strategies.
 */

import { z } from 'zod'
import { DayOfWeekEnum, type WorkoutFocus, type VolumeLandmarks } from '@/lib/types/program'
import { MUSCLE_GROUP_BASE_VOLUMES } from '@/lib/volumeCalculations'
import { STRENGTH_RATIO_STANDARDS } from '@/lib/weakPointAnalysis'

// ═══════════════════════════════════════════════════════════════════════════════
//                                CORE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scientific rationale providing evidence-based justification for program decisions
 */
const ScientificRationaleSchema = z.object({
  principle: z.string().min(1, "Scientific principle must be specified"),
  evidence: z.string().min(1, "Supporting evidence must be provided"),
  application: z.string().min(1, "Practical application must be explained"),
  citations: z.array(z.string()).optional(),
})

/**
 * Volume distribution tracking for each muscle group
 */
export const VolumeDistributionSchema = z.object({
  chest: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  back: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  shoulders: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  arms: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  quads: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  hamstrings: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  glutes: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  calves: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
  abs: z.object({
    weeklyVolume: z.number().min(0, "Volume cannot be negative"),
    percentageOfMAV: z.number().min(0).max(120, "Cannot exceed 120% of MAV"),
    exerciseBreakdown: z.record(z.string(), z.number()).optional(),
  }),
})

/**
 * Autoregulation protocol with RPE targets and adjustment guidelines
 */
export const AutoregulationProtocolSchema = z.object({
  phaseRPETargets: z.object({
    accumulation: z.object({
      min: z.number().min(1).max(10, "RPE must be between 1-10"),
      max: z.number().min(1).max(10, "RPE must be between 1-10"),
      target: z.number().min(1).max(10, "RPE must be between 1-10"),
    }),
    intensification: z.object({
      min: z.number().min(1).max(10, "RPE must be between 1-10"),
      max: z.number().min(1).max(10, "RPE must be between 1-10"),
      target: z.number().min(1).max(10, "RPE must be between 1-10"),
    }),
    realization: z.object({
      min: z.number().min(1).max(10, "RPE must be between 1-10"),
      max: z.number().min(1).max(10, "RPE must be between 1-10"),
      target: z.number().min(1).max(10, "RPE must be between 1-10"),
    }),
    deload: z.object({
      min: z.number().min(1).max(10, "RPE must be between 1-10"),
      max: z.number().min(1).max(10, "RPE must be between 1-10"),
      target: z.number().min(1).max(10, "RPE must be between 1-10"),
    }),
  }),
  adjustmentGuidelines: z.object({
    highReadiness: z.string().min(1, "High readiness protocol required"),
    normalReadiness: z.string().min(1, "Normal readiness protocol required"),
    lowReadiness: z.string().min(1, "Low readiness protocol required"),
    veryLowReadiness: z.string().min(1, "Very low readiness protocol required"),
  }),
  recoveryMarkers: z.array(z.string()).min(1, "At least one recovery marker must be specified"),
  fatigueIndicators: z.array(z.string()).min(1, "At least one fatigue indicator must be specified"),
}).refine(
  (data) => {
    // Validate RPE progression makes sense
    const accum = data.phaseRPETargets.accumulation
    const intens = data.phaseRPETargets.intensification
    const real = data.phaseRPETargets.realization
    
    return accum.target <= intens.target && intens.target <= real.target
  },
  {
    message: "RPE targets must progress logically: accumulation ≤ intensification ≤ realization",
    path: ["phaseRPETargets"]
  }
)

/**
 * Weak point intervention protocol
 */
export const WeakPointInterventionSchema = z.object({
  targetArea: z.enum([
    'WEAK_POSTERIOR_CHAIN',
    'WEAK_HORIZONTAL_PRESS',
    'WEAK_VERTICAL_PRESS',
    'WEAK_CORE_STABILITY',
    'WEAK_SHOULDER_STABILITY',
    'MOVEMENT_QUALITY'
  ]),
  identifiedRatio: z.string().min(1, "Identified strength ratio must be specified"),
  currentRatio: z.number().min(0, "Current ratio must be positive"),
  targetRatio: z.number().min(0, "Target ratio must be positive"),
  priority: z.enum(['High', 'Moderate', 'Low']),
  interventionExercises: z.array(z.string()).min(1, "At least one intervention exercise required"),
  weeklyVolume: z.number().min(1, "Weekly intervention volume must be specified"),
  progressionProtocol: z.string().min(1, "Progression protocol must be defined"),
  reassessmentPeriodWeeks: z.number().min(2).max(12, "Reassessment period must be 2-12 weeks"),
  expectedOutcome: z.string().min(1, "Expected outcome must be defined"),
}).refine(
  (data) => data.currentRatio < data.targetRatio,
  {
    message: "Target ratio must be higher than current ratio",
    path: ["targetRatio"]
  }
)

/**
 * Phase progression strategy with scientific periodization
 */
export const PhaseProgressionSchema = z.object({
  periodizationModel: z.enum([
    'Linear Progression',
    'Daily Undulating Periodization',
    'Block Periodization',
    'Conjugate Method',
    'Autoregulated Progression'
  ]),
  primaryAdaptation: z.enum([
    'hypertrophy',
    'strength',
    'power',
    'endurance',
    'skill_acquisition',
    'recovery',
    'peaking'
  ]),
  progressionType: z.enum([
    'volume_progression',
    'intensity_progression',
    'density_progression',
    'frequency_progression',
    'complexity_progression'
  ]),
  adaptationFocus: z.array(z.string()).min(1, "At least one adaptation focus required"),
  volumeProgression: z.object({
    startingPercentageMAV: z.number().min(30).max(80, "Starting volume must be 30-80% of MAV"),
    endingPercentageMAV: z.number().min(60).max(110, "Ending volume must be 60-110% of MAV"),
    progressionRate: z.enum(['conservative', 'moderate', 'aggressive']),
  }),
  intensityProgression: z.object({
    startingIntensity: z.number().min(50).max(95, "Starting intensity must be 50-95% 1RM"),
    endingIntensity: z.number().min(60).max(105, "Ending intensity must be 60-105% 1RM"),
    progressionPattern: z.enum(['linear', 'step', 'wave', 'autoregulated']),
  }),
  deloadProtocol: z.object({
    trigger: z.enum(['scheduled', 'performance_based', 'fatigue_based']),
    volumeReduction: z.number().min(20).max(70, "Volume reduction must be 20-70%"),
    intensityReduction: z.number().min(0).max(30, "Intensity reduction must be 0-30%"),
    durationDays: z.number().min(3).max(14, "Deload duration must be 3-14 days"),
  }),
}).refine(
  (data) => data.volumeProgression.startingPercentageMAV <= data.volumeProgression.endingPercentageMAV,
  {
    message: "Ending volume must be greater than or equal to starting volume",
    path: ["volumeProgression"]
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
//                           ENHANCED CORE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const EnhancedExerciseDetailSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  sets: z.number().min(1, "At least 1 set required"),
  reps: z.union([z.string(), z.number()]),
  rest: z.string().min(1, "Rest period must be specified"),
  tempo: z.string().optional(),
  rpe: z.number().min(1).max(10, "RPE must be between 1-10").optional(),
  notes: z.string().optional(),
  weight: z.string().optional(),
  category: z.enum([
    'Anchor_Lift',
    'Compound',
    'Isolation',
    'Cardio',
    'Mobility',
    'Core',
    'Warm-up',
    'Cool-down',
    'Power',
    'Corrective'
  ]).optional(),
  tier: z.enum(['Tier_1', 'Tier_2', 'Tier_3']).optional(),
  muscleGroups: z.array(z.string()).optional(),
  weakPointTarget: z.string().optional(),
  stimulusToFatigueRatio: z.enum(['High', 'Moderate', 'Low']).optional(),
  scientificRationale: z.string().optional(),
})

const EnhancedWorkoutDaySchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  focus: z.string().optional(),
  exercises: z.array(EnhancedExerciseDetailSchema),
  warmUp: z.array(EnhancedExerciseDetailSchema).optional(),
  coolDown: z.array(EnhancedExerciseDetailSchema).optional(),
  notes: z.string().optional(),
  estimatedDurationMinutes: z.number().min(15).max(180, "Duration must be 15-180 minutes").optional(),
  isRestDay: z.boolean().optional(),
  anchorLift: z.string().optional(),
  sessionRPETarget: z.number().min(1).max(10, "Session RPE must be 1-10").optional(),
  volumeLoad: z.number().min(0, "Volume load cannot be negative").optional(),
}).refine(
  (data) => {
    // Validate that non-rest days have exercises
    if (!data.isRestDay && data.exercises.length === 0) {
      return false
    }
    return true
  },
  {
    message: "Non-rest days must have at least one exercise",
    path: ["exercises"]
  }
).refine(
  (data) => {
    // Validate that anchor lift is present on non-rest days
    if (!data.isRestDay && data.exercises.length > 0) {
      const hasAnchorLift = data.exercises.some(ex => ex.category === 'Anchor_Lift')
      if (!hasAnchorLift) {
        return false
      }
    }
    return true
  },
  {
    message: "Non-rest days must have a designated anchor lift as the first exercise",
    path: ["exercises"]
  }
)

const EnhancedTrainingWeekSchema = z.object({
  weekNumber: z.number().min(1, "Week number must be positive"),
  days: z.array(EnhancedWorkoutDaySchema),
  notes: z.string().optional(),
  weekInPhase: z.number().min(1, "Week in phase must be positive").optional(),
  weeklyGoals: z.array(z.string()).optional(),
  progressionStrategy: z.string().optional(),
  coachTip: z.string().min(1, "Coach tip is required for enhanced programs").optional(),
  weeklyVolumeDistribution: VolumeDistributionSchema.optional(),
  averageRPE: z.number().min(1).max(10, "Average RPE must be 1-10").optional(),
  totalVolumeLoad: z.number().min(0, "Total volume load cannot be negative").optional(),
})

const EnhancedTrainingPhaseSchema = z.object({
  phaseName: z.string().min(1, "Phase name is required"),
  durationWeeks: z.number().min(1).max(12, "Phase duration must be 1-12 weeks"),
  weeks: z.array(EnhancedTrainingWeekSchema),
  notes: z.string().optional(),
  objectives: z.array(z.string()).min(1, "At least one objective required").optional(),
  phaseNumber: z.number().min(1, "Phase number must be positive").optional(),
  progressionStrategy: z.string().optional(),
  primaryAdaptation: z.enum([
    'hypertrophy',
    'strength',
    'power',
    'endurance',
    'skill_acquisition',
    'recovery',
    'peaking'
  ]),
  progressionType: z.enum([
    'volume_progression',
    'intensity_progression',
    'density_progression',
    'frequency_progression',
    'complexity_progression'
  ]),
  phaseProgression: PhaseProgressionSchema,
  scientificRationale: ScientificRationaleSchema,
}).refine(
  (data) => data.weeks.length === data.durationWeeks,
  {
    message: "Number of weeks must match duration weeks",
    path: ["weeks"]
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
//                          MAIN ENHANCED PROGRAM SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const ENHANCED_PROGRAM_VALIDATION = z.object({
  // Core program structure
  programName: z.string().min(1, "Program name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  durationWeeksTotal: z.number().min(1).max(16, "Program duration must be 1-16 weeks"),
  phases: z.array(EnhancedTrainingPhaseSchema).min(1, "At least one phase required"),
  generalAdvice: z.string().min(1, "General advice is required").optional(),
  coachIntro: z.string().min(1, "Coach introduction is required").optional(),
  generatedAt: z.union([z.date(), z.string()]),
  aiModelUsed: z.string().optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  trainingFrequency: z.number().min(1).max(7, "Training frequency must be 1-7 days").optional(),
  requiredEquipment: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),

  // Enhanced scientific structure
  programOverview: z.object({
    scientificRationale: ScientificRationaleSchema,
    periodizationModel: z.enum([
      'Linear Progression',
      'Daily Undulating Periodization', 
      'Block Periodization',
      'Conjugate Method',
      'Autoregulated Progression'
    ]),
    volumeDistribution: VolumeDistributionSchema,
    autoregulationProtocol: AutoregulationProtocolSchema,
    targetPopulation: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    primaryGoal: z.string().min(1, "Primary goal must be specified"),
    secondaryGoals: z.array(z.string()).optional(),
  }),

  // Exercise rationale mapping
  exerciseRationale: z.record(
    z.string(), // exercise name
    z.object({
      scientificJustification: z.string().min(1, "Scientific justification required"),
      muscleTargets: z.array(z.string()).min(1, "At least one muscle target required"),
      stimulusToFatigueRatio: z.enum(['High', 'Moderate', 'Low']),
      tier: z.enum(['Tier_1', 'Tier_2', 'Tier_3']),
      progressionProtocol: z.string().min(1, "Progression protocol required"),
    })
  ).optional(),

  // Weak point interventions
  weakPointInterventions: z.array(WeakPointInterventionSchema).optional(),

  // Volume compliance tracking
  volumeCompliance: z.object({
    individualVolumeLandmarks: z.record(z.string(), z.object({
      MEV: z.number().min(0, "MEV cannot be negative"),
      MAV: z.number().min(0, "MAV cannot be negative"),
      MRV: z.number().min(0, "MRV cannot be negative"),
    })),
    weeklyVolumeTracking: z.array(VolumeDistributionSchema),
    complianceNotes: z.array(z.string()).optional(),
  }),
}).refine(
  (data) => {
    // Validate total duration matches sum of phase durations
    const totalPhaseDuration = data.phases.reduce((sum, phase) => sum + phase.durationWeeks, 0)
    return totalPhaseDuration === data.durationWeeksTotal
  },
  {
    message: "Total program duration must equal sum of phase durations",
    path: ["durationWeeksTotal"]
  }
).refine(
  (data) => {
    // Validate that each phase has unique phase numbers
    const phaseNumbers = data.phases.map(p => p.phaseNumber).filter(Boolean)
    const uniquePhaseNumbers = new Set(phaseNumbers)
    return phaseNumbers.length === uniquePhaseNumbers.size
  },
  {
    message: "Phase numbers must be unique",
    path: ["phases"]
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
//                           CUSTOM VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates that program respects individual volume landmarks
 */
export function validateVolumeCompliance(
  program: any,
  individualLandmarks: Record<string, VolumeLandmarks>
): { isValid: boolean; violations: string[] } {
  const violations: string[] = []

  if (!program.volumeCompliance) {
    violations.push("Volume compliance data missing from program")
    return { isValid: false, violations }
  }

  // Check each muscle group against individual landmarks
  Object.entries(individualLandmarks).forEach(([muscle, landmarks]) => {
    const programVolume = program.programOverview?.volumeDistribution?.[muscle]
    
    if (!programVolume) {
      violations.push(`Missing volume data for ${muscle}`)
      return
    }

    const weeklyVolume = programVolume.weeklyVolume
    
    // Check if volume exceeds MRV
    if (weeklyVolume > landmarks.MRV) {
      violations.push(
        `${muscle} volume (${weeklyVolume} sets) exceeds MRV (${landmarks.MRV} sets). ` +
        `This violates recovery capacity and may lead to overreaching.`
      )
    }

    // Check if volume is below MEV for primary muscle groups
    if (weeklyVolume < landmarks.MEV && ['chest', 'back', 'quads'].includes(muscle)) {
      violations.push(
        `${muscle} volume (${weeklyVolume} sets) below MEV (${landmarks.MEV} sets). ` +
        `This may result in insufficient stimulus for adaptation.`
      )
    }

    // Check percentage of MAV is reasonable
    const percentageMAV = programVolume.percentageOfMAV
    if (percentageMAV > 110) {
      violations.push(
        `${muscle} programmed at ${percentageMAV}% of MAV, which exceeds safe training capacity`
      )
    }
  })

  return { isValid: violations.length === 0, violations }
}

/**
 * Validates that RPE targets are realistic and progressive
 */
export function validateRPETargets(program: any): { isValid: boolean; violations: string[] } {
  const violations: string[] = []

  const autoregulation = program.programOverview?.autoregulationProtocol
  if (!autoregulation) {
    violations.push("Autoregulation protocol missing from program")
    return { isValid: false, violations }
  }

  const { phaseRPETargets } = autoregulation

  // Validate RPE progression across phases
  const accumTarget = phaseRPETargets.accumulation.target
  const intensTarget = phaseRPETargets.intensification.target
  const realTarget = phaseRPETargets.realization.target
  const deloadTarget = phaseRPETargets.deload.target

  if (accumTarget > intensTarget) {
    violations.push(
      "Accumulation RPE target cannot be higher than intensification phase. " +
      "This violates progressive overload principles."
    )
  }

  if (intensTarget > realTarget) {
    violations.push(
      "Intensification RPE target cannot be higher than realization phase. " +
      "This violates periodization logic."
    )
  }

  if (deloadTarget >= accumTarget) {
    violations.push(
      "Deload RPE target must be significantly lower than accumulation phase. " +
      "Current targets do not provide adequate recovery stimulus."
    )
  }

  // Validate RPE ranges make sense
  Object.entries(phaseRPETargets).forEach(([phase, targets]: [string, any]) => {
    if (targets.min >= targets.max) {
      violations.push(`${phase} phase: minimum RPE must be less than maximum RPE`)
    }
    
    if (targets.target < targets.min || targets.target > targets.max) {
      violations.push(`${phase} phase: target RPE must be within min-max range`)
    }

    // Validate realistic RPE ranges
    if (targets.max - targets.min > 3) {
      violations.push(
        `${phase} phase: RPE range too wide (${targets.max - targets.min} points). ` +
        "Effective autoregulation requires ranges ≤3 RPE points."
      )
    }
  })

  return { isValid: violations.length === 0, violations }
}

/**
 * Validates that identified weak points have appropriate interventions
 */
export function validateWeakPointAddressing(
  program: any,
  identifiedWeakPoints: string[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = []

  if (identifiedWeakPoints.length === 0) {
    return { isValid: true, violations: [] } // No weak points to address
  }

  const interventions = program.weakPointInterventions || []
  
  if (interventions.length === 0) {
    violations.push(
      `Weak points identified (${identifiedWeakPoints.join(', ')}) but no interventions programmed. ` +
      "All identified imbalances must have specific intervention protocols."
    )
    return { isValid: false, violations }
  }

  // Check that each weak point has an intervention
  identifiedWeakPoints.forEach(weakPoint => {
    const hasIntervention = interventions.some((intervention: any) => 
      intervention.targetArea === weakPoint
    )
    
    if (!hasIntervention) {
      violations.push(
        `No intervention found for identified weak point: ${weakPoint}. ` +
        "Each identified imbalance requires a specific corrective protocol."
      )
    }
  })

  // Validate intervention protocols
  interventions.forEach((intervention: any, index: number) => {
    if (intervention.weeklyVolume < 2) {
      violations.push(
        `Intervention ${index + 1}: Weekly volume (${intervention.weeklyVolume} sets) insufficient. ` +
        "Weak point correction requires minimum 2 sets per week."
      )
    }

    if (intervention.reassessmentPeriodWeeks > 8) {
      violations.push(
        `Intervention ${index + 1}: Reassessment period (${intervention.reassessmentPeriodWeeks} weeks) too long. ` +
        "Progress should be evaluated every 4-8 weeks maximum."
      )
    }

    if (intervention.priority === 'High' && intervention.weeklyVolume < 4) {
      violations.push(
        `Intervention ${index + 1}: High priority weak point needs ≥4 sets/week, ` +
        `currently programmed at ${intervention.weeklyVolume} sets.`
      )
    }
  })

  return { isValid: violations.length === 0, violations }
}

/**
 * Comprehensive program validation function
 */
export function validateEnhancedProgram(
  program: any,
  individualLandmarks: Record<string, VolumeLandmarks>,
  identifiedWeakPoints: string[] = []
): { isValid: boolean; violations: string[]; errors: string[] } {
  const violations: string[] = []
  const errors: string[] = []

  // Schema validation
  const schemaResult = ENHANCED_PROGRAM_VALIDATION.safeParse(program)
  if (!schemaResult.success) {
    errors.push(...schemaResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`))
  }

  // Custom validations
  const volumeValidation = validateVolumeCompliance(program, individualLandmarks)
  if (!volumeValidation.isValid) {
    violations.push(...volumeValidation.violations)
  }

  const rpeValidation = validateRPETargets(program)
  if (!rpeValidation.isValid) {
    violations.push(...rpeValidation.violations)
  }

  const weakPointValidation = validateWeakPointAddressing(program, identifiedWeakPoints)
  if (!weakPointValidation.isValid) {
    violations.push(...weakPointValidation.violations)
  }

  return {
    isValid: errors.length === 0 && violations.length === 0,
    violations,
    errors
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                                TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type EnhancedTrainingProgram = z.infer<typeof ENHANCED_PROGRAM_VALIDATION>
export type VolumeDistribution = z.infer<typeof VolumeDistributionSchema>
export type AutoregulationProtocol = z.infer<typeof AutoregulationProtocolSchema>
export type WeakPointIntervention = z.infer<typeof WeakPointInterventionSchema>
export type PhaseProgression = z.infer<typeof PhaseProgressionSchema>
export type ScientificRationale = z.infer<typeof ScientificRationaleSchema>

/**
 * Validation error types for enhanced error handling
 */
export interface ValidationResult {
  isValid: boolean
  violations: string[]
  errors: string[]
  suggestions?: string[]
}

/**
 * Enhanced validation context for more specific validation
 */
export interface ValidationContext {
  userExperienceLevel: 'Beginner' | 'Intermediate' | 'Advanced'
  primaryGoal: string
  individualVolumeLandmarks: Record<string, VolumeLandmarks>
  identifiedWeakPoints: string[]
  availableEquipment: string[]
  timeConstraints: {
    sessionDuration: number
    frequencyPerWeek: number
  }
} 