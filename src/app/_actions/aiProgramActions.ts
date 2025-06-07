'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { type OnboardingData } from '@/lib/types/onboarding'
import { callLLM } from '@/lib/llmService'
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
  STRENGTH_GAIN_BEGINNER_GUIDELINES,
  STRENGTH_GAIN_INTERMEDIATE_GUIDELINES,
  STRENGTH_GAIN_ADVANCED_GUIDELINES,
  ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES,
  ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES,
  ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES,
  SPORT_PERFORMANCE_BEGINNER_GUIDELINES,
  SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES,
  SPORT_PERFORMANCE_ADVANCED_GUIDELINES,
  GENERAL_FITNESS_BEGINNER_GUIDELINES,
  GENERAL_FITNESS_INTERMEDIATE_GUIDELINES,
  GENERAL_FITNESS_ADVANCED_GUIDELINES,
} from '@/lib/llmProgramContent'

/**
 * Zod schemas for validating LLM-generated training program data
 */
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
    .enum(['Compound', 'Isolation', 'Cardio', 'Mobility', 'Core', 'Warm-up', 'Cool-down'])
    .optional(),
})

const WorkoutDaySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  focus: z
    .enum([
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
    .optional(),
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
  category?: "Compound" | "Isolation" | "Cardio" | "Mobility" | "Core" | "Warm-up" | "Cool-down";
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
  const focus = trainingFocus?.toLowerCase() || 'general fitness'; // Default if null
  const level = experienceLevel?.toLowerCase() || 'beginner'; // Default if null

  // Normalize experience level string to match constant suffixes
  let normalizedLevelKey: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER';
  if (level.includes('intermediate')) {
    normalizedLevelKey = 'INTERMEDIATE';
  } else if (level.includes('advanced')) {
    normalizedLevelKey = 'ADVANCED';
  }

  if (focus.includes('muscle gain') || focus.includes('bodybuilding')) {
    if (normalizedLevelKey === 'BEGINNER') return MUSCLE_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return MUSCLE_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return MUSCLE_GAIN_ADVANCED_GUIDELINES;
  } else if (focus.includes('strength gain') || focus.includes('powerlifting') || focus.includes('beginner strength')) {
    if (normalizedLevelKey === 'BEGINNER') return STRENGTH_GAIN_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return STRENGTH_GAIN_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return STRENGTH_GAIN_ADVANCED_GUIDELINES;
  } else if (focus.includes('endurance')) {
    if (normalizedLevelKey === 'BEGINNER') return ENDURANCE_IMPROVEMENT_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return ENDURANCE_IMPROVEMENT_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return ENDURANCE_IMPROVEMENT_ADVANCED_GUIDELINES;
  } else if (focus.includes('sport performance') || focus.includes('athletic performance')) {
    if (normalizedLevelKey === 'BEGINNER') return SPORT_PERFORMANCE_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return SPORT_PERFORMANCE_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return SPORT_PERFORMANCE_ADVANCED_GUIDELINES;
  } else if (focus.includes('general fitness') || focus.includes('weight loss')) { // Grouping weight loss with general fitness for guidelines
    if (normalizedLevelKey === 'BEGINNER') return GENERAL_FITNESS_BEGINNER_GUIDELINES;
    if (normalizedLevelKey === 'INTERMEDIATE') return GENERAL_FITNESS_INTERMEDIATE_GUIDELINES;
    if (normalizedLevelKey === 'ADVANCED') return GENERAL_FITNESS_ADVANCED_GUIDELINES;
  }

  // Fallback if no specific match is found
  console.warn(
    `No specific guidelines found for focus "${focus}" and level "${level}". Falling back to General Fitness Beginner.`
  );
  return GENERAL_FITNESS_BEGINNER_GUIDELINES;
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
1.  **Prioritize Expert Guidelines**: Generate a comprehensive 4-6 week training program. Base this program PRIMARILY on the "EXPERT GUIDELINES FOR ${profile.primary_training_focus?.toUpperCase() || 'USER\'S GOAL'} - ${profile.experience_level?.toUpperCase() || 'USER\'S LEVEL'}" provided below. These guidelines are CRITICAL.
2.  **Adapt to User Specifics**: You MUST adapt the expert guidelines and any example plans within them to the user's specific "Available Equipment" (${onboarding.equipment.join(', ')}), "Training Frequency" (${onboarding.trainingFrequencyDays} days/week), and "Session Duration" (${onboarding.sessionDuration}). If the user's available equipment or preferred schedule differs significantly from an example in the guidelines, modify the exercises and structure to be appropriate and safe while still adhering to the core principles (e.g., target muscle groups, progression type) from the guidelines. For instance, if guidelines suggest barbell squats but user only has dumbbells, suggest dumbbell squats or goblet squats. If guidelines suggest 5 days but user selected 3, condense the plan logically.

**CRITICAL: Session Duration & Exercise Count Requirements**:
Based on the user's selected session duration (${onboarding.sessionDuration}), you MUST include the following MINIMUM number of exercises per workout:
- **30-45 minutes**: Minimum 6-8 total exercises (2-3 warm-up, 3-4 main workout, 1-2 cool-down)
- **45-60 minutes**: Minimum 8-10 total exercises (3-4 warm-up, 4-5 main workout, 1-2 cool-down)  
- **60-75 minutes**: Minimum 10-14 total exercises (3-4 warm-up, 6-8 main workout, 2-3 cool-down)
- **75+ minutes**: Minimum 12-16 total exercises (4-5 warm-up, 7-9 main workout, 2-3 cool-down)

For ADVANCED users doing ATHLETIC PERFORMANCE training with 60+ minute sessions, you MUST include:
- Complex multi-joint movements (squats, deadlifts, presses)
- Power/explosive exercises (cleans, jumps, throws)
- Speed/agility components
- Sport-specific conditioning
- Adequate volume to justify the time commitment

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
    *   **DURATION VALIDATION**: The total estimated time for all exercises (including rest periods) MUST reasonably fill the user's selected session duration. Calculate: (sets × reps × tempo) + (sets × rest time) + transition time between exercises.
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
5.  **Focus Field**: For the \`focus\` field in WorkoutDay objects, you MUST strictly use one of the predefined values listed in the TypeScript interface. Do not combine terms or create new focus categories. If more specificity is needed, use the notes field of the WorkoutDay.
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
  if (primaryGoal === 'General Fitness') return 4
  if (primaryGoal === 'Muscle Gain') return 6
  if (primaryGoal === 'Strength Gain') return 6
  if (primaryGoal === 'Endurance Improvement') return 5
  if (primaryGoal === 'Sport-Specific') return 6

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
      max_tokens: 40000, // Increased for comprehensive program generation
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
 * Generate a personalized training program for a user
 */
export async function generateTrainingProgram(
  userIdToGenerateFor?: string
): Promise<ProgramGenerationResponse> {
  try {
    const supabase = await createClient()

    // Get user ID
    let userId: string
    if (userIdToGenerateFor) {
      userId = userIdToGenerateFor
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error in generateTrainingProgram:', authError)
        return { error: 'Authentication required', success: false }
      }
      userId = user.id
    }

    console.log('Generating training program for user:', userId)

    // Fetch user profile and onboarding data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, age, weight_unit, primary_training_focus, experience_level, onboarding_responses')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { error: 'Failed to fetch user profile', success: false }
    }

    if (!profile.onboarding_responses) {
      console.error('User has not completed onboarding:', userId)
      return { error: 'Please complete onboarding first', success: false }
    }

    // Construct LLM prompt
    const prompt = constructLLMPrompt(profile as UserProfileForGeneration)

    // Call LLM API
    const llmResult = await callLLMAPI(prompt)

    if (llmResult.error) {
      return { error: llmResult.error, success: false }
    }

    // Validate the LLM response
    let validatedProgram: TrainingProgram
    try {
      // Add generatedAt and aiModelUsed if not provided by LLM
      const programData = {
        ...llmResult.program,
        generatedAt: llmResult.program.generatedAt || new Date().toISOString(),
        aiModelUsed: llmResult.program.aiModelUsed || 'gpt-4o',
      }

      validatedProgram = TrainingProgramSchema.parse(programData)
      console.log('Program validation successful')
    } catch (validationError) {
      console.error('Program validation failed:', validationError)
      return { error: 'Generated program structure is invalid', success: false }
    }

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
      console.error('Error saving program to database:', saveError)
      return { error: 'Failed to save training program', success: false }
    }

    console.log('Training program generated and saved successfully:', savedProgram.id)

    return {
      program: validatedProgram,
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error in generateTrainingProgram:', error)
    return {
      error: 'An unexpected error occurred while generating your program',
      success: false,
    }
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
        return { error: 'Authentication required' }
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
      return { error: 'Failed to fetch training program' }
    }

    if (!program) {
      return { error: 'No active training program found' }
    }

    return { program }
  } catch (error) {
    console.error('Unexpected error in getCurrentTrainingProgram:', error)
    return { error: 'An unexpected error occurred' }
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
    const { getActiveTrainingProgram } = await import('@/lib/programDb')

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
