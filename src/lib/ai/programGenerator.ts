'use server'

import { createClient } from '@/utils/supabase/server'
import { type OnboardingData } from '@/lib/types/onboarding'
import { type TrainingProgram, ENHANCED_PROGRAM_VALIDATION } from '@/lib/validation/enhancedProgramSchema'

interface ProgramUpdateData {
  generation_status: 'completed' | 'failed' | 'in_progress';
  generation_error: string | null;
  program_details: TrainingProgram;
  ai_model_version: string;
  weak_point_analysis: any;
  periodization_model: string;
  generation_metadata: any;
  volume_landmarks?: any;
}


// Import the core generation logic modules
import { generateEnhancedUserProfile } from '@/lib/dataInference'
import { calculateAllMuscleLandmarks } from '@/lib/volumeCalculations'
import { enhancedWeakPointAnalysis, type StrengthProfile } from '@/lib/weakPointAnalysis'
import { callLLM } from '@/lib/llmService'
import {
  VOLUME_FRAMEWORK_GUIDELINES,
  AUTOREGULATION_GUIDELINES,
  PERIODIZATION_GUIDELINES,
  WEAK_POINT_INTERVENTION_GUIDELINES,
  FATIGUE_MANAGEMENT_GUIDELINES,
  EXERCISE_SELECTION_GUIDELINES,
  NEURAL_COACHING_CUES,
} from '@/lib/llmProgramContent'

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
 * Enhanced User Data Processing Result
 */
interface EnhancedProcessingResult {
  enhancedProfile: any
  volumeLandmarks: Record<string, any>
  weakPointAnalysis: any | null
  periodizationModel: string
  autoregulationNotes: string
  identifiedWeakPoints: string[]
}

/**
 * Core program generation pipeline
 * This is the shared function that handles the entire program generation process
 * from fetching user data to validating and updating the program in the database.
 */
export async function runProgramGenerationPipeline(programId: string): Promise<void> {
  const supabase = await createClient()
  
  try {
    console.log(`🚀 Starting program generation pipeline for program ID: ${programId}`)
    
    // Update status to processing
    await supabase
      .from('training_programs')
      .update({ 
        generation_status: 'processing',
        generation_error: null 
      })
      .eq('id', programId)
    
    // Fetch the program record with user data
    const { data: programRecord, error: fetchError } = await supabase
      .from('training_programs')
      .select(`
        id,
        user_id,
        onboarding_data_snapshot,
        profiles!inner(
          name,
          age,
          weight_unit,
          primary_training_focus,
          experience_level
        )
      `)
      .eq('id', programId)
      .single()
    
    if (fetchError || !programRecord) {
      throw new Error(`Failed to fetch program record: ${fetchError?.message || 'Record not found'}`)
    }
    
    const profile = programRecord.profiles as any
    const onboardingData = programRecord.onboarding_data_snapshot as OnboardingData
    
    if (!onboardingData) {
      throw new Error('No onboarding data found for program generation')
    }
    
    // Create user profile for generation
    const userProfileForGeneration: UserProfileForGeneration = {
      id: programRecord.user_id,
      name: profile.name || 'User',
      age: profile.age || 25,
      weight_unit: profile.weight_unit,
      primary_training_focus: profile.primary_training_focus,
      experience_level: profile.experience_level,
      onboarding_responses: onboardingData,
    }
    
    console.log('📊 Processing enhanced user data...')
    
    // Step 1: Process enhanced user data (same logic from aiProgramActions.ts)
    const processingResult = await processEnhancedUserData(userProfileForGeneration)
    
    console.log('🤖 Calling enhanced LLM API...')
    
    // Step 2: Call enhanced LLM API (simplified version for background processing)
    const { program: llmResponse, error: llmError } = await callEnhancedLLMAPI(
      userProfileForGeneration, 
      processingResult,
      true // Assume paid access for background generation
    )
    
    if (llmError) {
      throw new Error(`LLM API error: ${llmError}`)
    }
    
    console.log('✅ Program generated successfully, validating...')
    
    // Step 3: Validate the generated program
    const programData = {
      ...llmResponse,
      generatedAt: llmResponse.generatedAt || new Date().toISOString(),
      aiModelUsed: llmResponse.aiModelUsed || 'gpt-4o',
    }
    
    let validatedProgram: TrainingProgram
    const validationResult = ENHANCED_PROGRAM_VALIDATION.safeParse(programData)
    if (!validationResult.success) {
      // It's better to log the detailed error for debugging purposes
      console.error('Program validation failed:', validationResult.error.flatten())
      throw new Error(`Program validation failed: ${validationResult.error.message}`)
    }
    validatedProgram = validationResult.data as unknown as TrainingProgram
    
    console.log('💾 Updating program record with generated data...')
    
    // Step 4: Update the program record with results
    const updateData: ProgramUpdateData = {
      generation_status: 'completed',
      generation_error: null,
      program_details: validatedProgram,
      ai_model_version: validatedProgram.aiModelUsed || 'gpt-4o',
      weak_point_analysis: processingResult.weakPointAnalysis,
      periodization_model: processingResult.periodizationModel,
      generation_metadata: {
        processingTimestamp: new Date().toISOString(),
        enhancedUserProfile: {
          trainingAge: processingResult.enhancedProfile.volumeParameters.trainingAge,
          recoveryCapacity: processingResult.enhancedProfile.volumeParameters.recoveryCapacity,
          stressLevel: processingResult.enhancedProfile.volumeParameters.stressLevel,
          volumeTolerance: processingResult.enhancedProfile.volumeParameters.volumeTolerance,
        },
      },
      volume_landmarks: processingResult.volumeLandmarks,
    }

    const { error: updateError } = await supabase
      .from('training_programs')
      .update(updateData)
      .eq('id', programId)
    
    if (updateError) {
      throw new Error(`Failed to update program record: ${updateError.message}`)
    }
    
    console.log(`🎉 Program generation pipeline completed successfully for program ID: ${programId}`)
    
  } catch (error: any) {
    console.error(`❌ Program generation pipeline failed for program ID: ${programId}`, error)
    
    // Update status to failed with error message
    await supabase
      .from('training_programs')
      .update({ 
        generation_status: 'failed',
        generation_error: error.message || 'Unknown error occurred during generation'
      })
      .eq('id', programId)
    
    throw error
  }
}

// Import the existing helper functions from aiProgramActions.ts
// These are the same functions used in the original implementation

async function processEnhancedUserData(
  profile: UserProfileForGeneration
): Promise<EnhancedProcessingResult> {
  const onboarding = profile.onboarding_responses
  
  if (!onboarding) {
    throw new Error('User has not completed onboarding')
  }

  console.log('🔬 Starting enhanced user data processing...')

  // Convert profile to UserData format for enhanced analysis
  const baseUserData: any = {
    id: 'temp-id',
    name: profile.name || 'User',
    email: 'user@example.com',
    age: profile.age,
    height_cm: 175, // Default
    weight_kg: 75, // Default
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
  const enhancedProfile = generateEnhancedUserProfile(baseUserData)

  // Calculate individualized volume landmarks
  const volumeLandmarks = calculateAllMuscleLandmarks(enhancedProfile.volumeParameters)

  // Perform weak point analysis if strength data is available
  let weakPointAnalysis = null
  let identifiedWeakPoints: string[] = []
  
  if (onboarding.squat1RMEstimate && onboarding.benchPress1RMEstimate && 
      onboarding.deadlift1RMEstimate && onboarding.overheadPress1RMEstimate) {
    const strengthProfile: StrengthProfile = {
      squat1RM: onboarding.squat1RMEstimate,
      bench1RM: onboarding.benchPress1RMEstimate,
      deadlift1RM: onboarding.deadlift1RMEstimate,
      overheadPress1RM: onboarding.overheadPress1RMEstimate
    }
    weakPointAnalysis = enhancedWeakPointAnalysis(strengthProfile)
    identifiedWeakPoints = weakPointAnalysis.primaryWeakPoints || []
  }

  // Select appropriate periodization model
  const periodizationModel = selectPeriodizationModel(
    enhancedProfile.experience_level || 'Beginner', 
    onboarding.primaryGoal
  )

  // Generate autoregulation recommendations
  const autoregulationNotes = generateAutoregulationNotes(
    enhancedProfile.rpeProfile, 
    enhancedProfile.recoveryProfile
  )

  return {
    enhancedProfile,
    volumeLandmarks,
    weakPointAnalysis,
    periodizationModel,
    autoregulationNotes,
    identifiedWeakPoints
  }
}

function selectPeriodizationModel(experienceLevel: string, primaryGoal: string): string {
  if (primaryGoal.includes('Strength Gain') || primaryGoal.includes('Powerlifting')) {
    return 'Strength-Focused Block Periodization'
  }
  
  if (primaryGoal.includes('Muscle Gain') || primaryGoal.includes('Hypertrophy')) {
    return 'Hypertrophy-Focused Block Periodization'
  }
  
  if (primaryGoal.includes('General Fitness') || experienceLevel === 'Beginner') {
    return 'Linear Progression Model'
  }
  
  return 'Balanced Block Periodization'
}

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

async function callEnhancedLLMAPI(
  profile: UserProfileForGeneration,
  processingResult: EnhancedProcessingResult,
  hasPaidAccess: boolean = true
): Promise<{ program?: any; error?: string }> {
  try {
    // Simplified prompt construction for background processing
    const prompt = await constructSimplifiedLLMPrompt(profile, processingResult, hasPaidAccess)
    
    const parsedProgram = await callLLM(prompt, 'user', {
      response_format: { type: 'json_object' },
      max_tokens: 8192,
      model: 'gpt-4o',
    })

    return { program: parsedProgram }
  } catch (error: any) {
    console.error('Error calling LLM API for program generation:', error)
    return {
      error: error.message || 'Failed to communicate with AI service for program generation',
    }
  }
}

async function constructSimplifiedLLMPrompt(
  profile: UserProfileForGeneration,
  processingResult: EnhancedProcessingResult,
  hasPaidAccess: boolean
): Promise<string> {
  const onboarding = profile.onboarding_responses!
  const { enhancedProfile, volumeLandmarks, weakPointAnalysis, periodizationModel } = processingResult
  
  const typeDefinitions = getTypeScriptInterfaceDefinitions()
  const weightUnit = profile.weight_unit || 'kg'

  return `You are Neural, an elite exercise scientist and evidence-based coach AI. Create a scientifically-grounded training program based on the user's profile. Your entire output MUST be a single, valid JSON object that adheres to the TrainingProgram TypeScript interface.

${typeDefinitions}

SCIENTIFIC FRAMEWORK:
${VOLUME_FRAMEWORK_GUIDELINES}

${AUTOREGULATION_GUIDELINES}

${PERIODIZATION_GUIDELINES}

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
).join(' | ')}

STRENGTH PROFILE (${weightUnit}):
- Squat 1RM: ${onboarding.squat1RMEstimate || 'Not provided'}
- Bench Press 1RM: ${onboarding.benchPress1RMEstimate || 'Not provided'}  
- Deadlift 1RM: ${onboarding.deadlift1RMEstimate || 'Not provided'}
- Overhead Press 1RM: ${onboarding.overheadPress1RMEstimate || 'Not provided'}

REQUIREMENTS:
1. Respect volume landmarks (start at MEV, progress to MAV, never exceed MRV)
2. Include anchor lifts as first exercise on training days
3. Use appropriate RPE targets (6-8 RPE typically)
${weakPointAnalysis && weakPointAnalysis.primaryWeakPoints.length > 0 ? 
  `4. Address weak points: ${weakPointAnalysis.primaryWeakPoints.join(', ')}` : ''}

Create a ${getDurationBasedOnGoals(onboarding, hasPaidAccess)}-week program with appropriate phases.

NEURAL'S COACHING CUES:
${NEURAL_COACHING_CUES}

Return ONLY valid JSON matching the TrainingProgram interface. No additional text.`
}

function getDurationBasedOnGoals(onboarding: OnboardingData, isPaidUser: boolean): number {
  if (!isPaidUser) return 1
  
  const { primaryGoal } = onboarding
  
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