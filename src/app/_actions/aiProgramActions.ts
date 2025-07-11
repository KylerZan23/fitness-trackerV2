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
})

const TrainingPhaseSchema = z.object({
  phaseName: z.string(),
  durationWeeks: z.number(),
  weeks: z.array(TrainingWeekSchema),
  notes: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  phaseNumber: z.number().optional(),
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
}

interface TrainingPhase {
  phaseName: string;
  durationWeeks: number;
  weeks: TrainingWeek[];
  notes?: string;
  objectives?: string[];
  phaseNumber?: number;
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
 * Construct the detailed LLM prompt for program generation
 */
function constructLLMPrompt(profile: UserProfileForGeneration): string {
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
- Secondary Goal: ${onboarding.secondaryGoal || 'None'}
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

3.  **Structure & Content**:
    *   Structure the program with 1-2 phases as appropriate for a 4-6 week duration and the user's goals, based on the expert guidelines.
    *   Implement progressive overload principles as described in the expert guidelines.
    *   Ensure exercise names are standard and recognizable. If an exercise from the guidelines is not in the provided TypeScript \`ExerciseDetail.name\` list, use a very common, standard alternative or break it down if it's a complex movement.
    *   Include warm-up and cool-down for each training day. If guidelines are sparse on this, apply general best practices (e.g., 5-10 min light cardio and dynamic stretches for warm-up; 5-10 min static stretches for cool-down).
    *   Set \`estimatedDurationMinutes\` for each WorkoutDay to align with the user's preferred session duration, adapting the number of exercises or sets from the guidelines if necessary.
    *   For the \`notes\` field in each \`ExerciseDetail\`:
        *   If the exercise is a major compound lift (e.g., Squat, Bench Press, Deadlift, Overhead Press), ALWAYS include 1-2 concise, critical form cues. Examples: For Squat: 'Keep chest up, drive knees out, descend to at least parallel.' For Deadlift: 'Maintain neutral spine, engage lats, push through the floor.'
        *   If the user's \`Experience Level\` is 'Beginner (<6 months)', provide more detailed form cues or safety reminders for most exercises.
        *   If an exercise was modified due to an injury/limitation, briefly note this (e.g., 'Modified for knee comfort').
4.  **Output Format**:
    *   Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.).
    *   For rest days, set \`isRestDay: true\` and provide a minimal or empty exercises array.
    *   Ensure ${onboarding.trainingFrequencyDays} training days and ${7 - onboarding.trainingFrequencyDays} rest days per week, distributing them reasonably (e.g., not all training days consecutively if possible, unless specified in guidelines).
    *   Set \`generatedAt\` to the current ISO date string.
    *   Include appropriate tags based on goals and focus.
    *   For the \`generalAdvice\` field: Provide a brief (2-3 sentences) explanation of the program's overall structure and how it aligns with the user's \`Primary Goal\`, \`Experience Level\`, and \`Available Equipment\`. Example: 'This 4-week program focuses on Full Body workouts 3 times per week, which is ideal for your 'Beginner' experience level and 'General Fitness' goal, utilizing the Dumbbells and Bodyweight exercises you have available. The primary aim is to build foundational strength and improve movement patterns.'
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
6.  **Weight Prescription**:
    *   Utilize the "USER STRENGTH ESTIMATES" provided. The unit for these estimates is ${weightUnit}.
    *   For core compound exercises (Squat, Bench Press, Deadlift, Overhead Press if applicable) where a 1RM/e1RM is provided by the user:
        *   For sets in the 1-5 rep range (strength focus), suggest working weights typically between 80-95% of the user's 1RM/e1RM.
        *   For sets in the 6-12 rep range (hypertrophy focus), suggest working weights typically between 65-80% of 1RM/e1RM.
        *   For sets in the 12-15+ rep range (endurance focus), suggest working weights typically between 50-65% of 1RM/e1RM.
    *   If the user's \`Experience Level\` is 'Beginner' or \`Values Determined By\` is 'Unsure / Just a guess', instruct the AI to be conservative. It should prioritize form and suggest starting at the lower end of percentage ranges or even with 'just the bar' for complex movements. Emphasize gradual weight increase.
    *   For exercises where a direct 1RM is not applicable or not provided by the user (e.g., isolation exercises like Bicep Curls, dumbbell accessories, or if the user didn't provide a 1RM for the parent compound lift), instruct the AI to provide descriptive guidance. Examples: "Challenging weight for X reps", "Use bodyweight", "Light dumbbells", or suggest selecting a weight that matches a target RPE (e.g., "Select weight for RPE 7-8").
    *   The output for the \`weight\` field in the \`ExerciseDetail\` JSON object should be a string. Examples: "100 ${weightUnit}", "45 ${weightUnit}", "Bodyweight", "Challenging weight for 10 reps (RPE 8)". If a specific weight is given, ALWAYS include the unit (${weightUnit}).

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

    const parsedProgram = await callLLM(prompt, 'user', {
      response_format: { type: 'json_object' },
      max_tokens: 16000, // Reduced to stay within model limits (max 16384)
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
      const prompt = constructLLMPrompt(userProfileForGeneration)
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
      const prompt = constructLLMPrompt(userProfileForGeneration)

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
 * Checks if a logged set is a personal best and registers it
 * @param exerciseName - Name of the exercise
 * @param weight - Weight lifted
 * @param reps - Number of reps performed
 * @returns Object indicating if it's a PB and details
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
      console.error('Error getting user for PB check:', userError)
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
      console.error('Error fetching workout history for PB check:', workoutsError)
      return { isPB: false }
    }

    if (!workouts || workouts.length === 0) {
      // First time doing this exercise - it's a PB by default
      console.log(`First time performing ${exerciseName} - automatic PB!`)
      
      // Create community feed event for first-time PB
      await createCommunityFeedEventServer('NEW_PB', {
        exerciseName,
        weight,
        reps,
        pbType: 'first-time',
        previousBest: null,
      }, supabase)
      
      return { isPB: true, pbType: 'first-time' }
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

    // Check for different types of PBs
    const currentWeight = parseFloat(weight.toString())
    const currentReps = parseInt(reps.toString())

    // Type 1: Heaviest weight ever (regardless of reps)
    if (currentWeight > bestWeight) {
      console.log(`New weight PB for ${exerciseName}: ${currentWeight} (previous: ${bestWeight})`)
      
      // Create community feed event for weight PB
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
      console.log(`New reps PB for ${exerciseName}: ${currentReps} (previous: ${bestReps})`)
      
      // Create community feed event for reps PB
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
      console.log(`New weight PB for ${exerciseName} at ${currentReps} reps: ${currentWeight} (previous: ${bestWeightAtReps})`)
      
      // Create community feed event for weight-at-reps PB
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

    // No PB achieved
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
