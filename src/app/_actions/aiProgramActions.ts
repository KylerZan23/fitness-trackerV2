'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { type OnboardingData } from '@/lib/types/onboarding'
import { 
  type TrainingProgram, 
  type TrainingPhase, 
  type TrainingWeek, 
  type WorkoutDay, 
  type ExerciseDetail,
  DayOfWeek,
  type WorkoutFocus
} from '@/lib/types/program'

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
  category: z.enum(["Compound", "Isolation", "Cardio", "Mobility", "Core", "Warm-up", "Cool-down"]).optional(),
})

const WorkoutDaySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  focus: z.enum([
    "Upper Body",
    "Lower Body", 
    "Push",
    "Pull",
    "Legs",
    "Full Body",
    "Cardio",
    "Core",
    "Arms",
    "Back",
    "Chest",
    "Shoulders",
    "Glutes",
    "Recovery/Mobility",
    "Sport-Specific",
    "Rest Day"
  ]).optional(),
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
  difficultyLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
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
  focus?: string; // e.g., "Upper Body", "Lower Body"
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
`;
}

/**
 * Construct the detailed LLM prompt for program generation
 */
function constructLLMPrompt(profile: UserProfileForGeneration): string {
  const onboarding = profile.onboarding_responses
  
  if (!onboarding) {
    throw new Error('User has not completed onboarding')
  }

  const typeDefinitions = getTypeScriptInterfaceDefinitions()
  
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
`;

  const instructions = `
PROGRAM GENERATION INSTRUCTIONS:
1. Generate a comprehensive 4-6 week training program
2. Structure the program with 1-2 phases depending on duration and goals
3. Base exercise selection strictly on available equipment: ${onboarding.equipment.join(', ')}
4. Consider experience level (${profile.experience_level}) for exercise complexity and volume
5. Implement progressive overload throughout the program
6. Ensure exercise names are standard and recognizable
7. Include warm-up and cool-down for each training day
8. Set estimatedDurationMinutes to match the user's preferred session duration
9. Use dayOfWeek numbers (1=Monday, 2=Tuesday, etc.)
10. For rest days, set isRestDay: true and provide minimal exercises array
11. Generate ${onboarding.trainingFrequencyDays} training days per week with ${7 - onboarding.trainingFrequencyDays} rest days
12. Set generatedAt to current ISO date string
13. Include appropriate tags based on goals and focus
14. Provide practical generalAdvice for program execution

IMPORTANT: Return ONLY valid JSON matching the TrainingProgram interface. No additional text or markdown.
`;

  return `You are an expert strength and conditioning coach tasked with creating a personalized training program. Generate a JSON object matching the following TypeScript interface structure:

${typeDefinitions}

${userDataSection}

${instructions}`;
}

/**
 * Determine program duration based on user goals
 */
function getDurationBasedOnGoals(onboarding: OnboardingData): number {
  const { primaryGoal } = onboarding
  
  // Adjust duration based on goals (shortened to 4-6 weeks to manage token limits)
  if (primaryGoal === 'General Fitness') return 4
  if (primaryGoal === 'Fat Loss') return 6
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
    const apiKey = process.env.LLM_API_KEY
    // Use environment variable if set, otherwise default to standard OpenAI chat completions endpoint
    const apiEndpoint = process.env.LLM_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions'
    
    if (!apiKey) { // Only check for API key now
      console.error('Missing LLM API Key configuration')
      return { error: 'LLM API Key not configured. Please contact support.' }
    }

    console.log('Calling LLM API for program generation...')
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 16000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('LLM API error:', response.status, errorText)
      return { error: `LLM API error: ${response.status}` }
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid LLM API response structure:', data)
      return { error: 'Invalid response from LLM API' }
    }

    const programJson = data.choices[0].message.content
    console.log('Raw LLM JSON Response length:', programJson.length)
    
    // Write full response to temporary file for debugging
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filePath = path.join(process.cwd(), `.tmp/llm_response_${timestamp}.json`)
      // Ensure .tmp directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, programJson, 'utf8')
      console.log(`Full LLM response saved to: ${filePath}`)
    } catch (fileError) {
      console.error('Failed to save LLM response to file:', fileError)
    }
    
    let cleanedJsonString = programJson;
    if (cleanedJsonString.startsWith('```json')) {
      cleanedJsonString = cleanedJsonString.substring(7); // Remove ```json
    }
    if (cleanedJsonString.endsWith('```')) {
      cleanedJsonString = cleanedJsonString.substring(0, cleanedJsonString.length - 3); // Remove ```
    }
    cleanedJsonString = cleanedJsonString.trim(); // Trim whitespace
    
    try {
      console.log('Raw LLM JSON Response:', programJson)
      const parsedProgram = JSON.parse(cleanedJsonString)
      return { program: parsedProgram }
    } catch (parseError) {
      console.error('Failed to parse LLM JSON response:', parseError)
      return { error: 'LLM returned invalid JSON' }
    }

  } catch (error) {
    console.error('Error calling LLM API:', error)
    return { error: 'Failed to communicate with AI service' }
  }
}

/**
 * Generate a personalized training program for a user
 */
export async function generateTrainingProgram(userIdToGenerateFor?: string): Promise<ProgramGenerationResponse> {
  try {
    const supabase = await createClient()

    // Get user ID
    let userId: string
    if (userIdToGenerateFor) {
      userId = userIdToGenerateFor
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
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
      .select('id, name, age, primary_training_focus, experience_level, onboarding_responses')
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
        aiModelUsed: llmResult.program.aiModelUsed || 'gpt-4o-mini'
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
        ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o-mini',
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
      success: true 
    }

  } catch (error) {
    console.error('Unexpected error in generateTrainingProgram:', error)
    return { 
      error: 'An unexpected error occurred while generating your program', 
      success: false 
    }
  }
}

/**
 * Get a user's current active training program
 */
export async function getCurrentTrainingProgram(userId?: string): Promise<{ program?: any; error?: string }> {
  try {
    const supabase = await createClient()

    let targetUserId: string
    if (userId) {
      targetUserId = userId
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
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
export async function fetchActiveProgramAction(): Promise<{ program: any | null; completedDays: CompletedDayIdentifier[]; error?: string }> {
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
      dayOfWeek: workout.linked_program_day_of_week
    }))

    console.log(`Found ${completedDays.length} completed workout days for program ${program.id}`)
    
    return { program, completedDays }
  } catch (error) {
    console.error('Error in fetchActiveProgramAction:', error)
    return { 
      program: null, 
      completedDays: [],
      error: 'Failed to fetch your training program. Please try again.' 
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