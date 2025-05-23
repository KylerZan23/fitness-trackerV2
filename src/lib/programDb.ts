import { createClient } from '@/utils/supabase/server'
import { type TrainingProgram } from '@/lib/types/program'
import { cookies } from 'next/headers'

/**
 * Extended training program interface that includes database ID for linking
 */
export interface TrainingProgramWithId extends TrainingProgram {
  id: string
}

/**
 * Fetch the user's currently active training program
 * @returns TrainingProgramWithId object or null if no active program found
 */
export async function getActiveTrainingProgram(): Promise<TrainingProgramWithId | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('No authenticated user found for getActiveTrainingProgram.')
    return null
  }

  const { data, error } = await supabase
    .from('training_programs')
    .select('id, program_details, program_name, total_duration_weeks, start_date, generated_at, ai_model_version')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active training program:', error)
    return null
  }

  if (!data || !data.program_details) {
    console.log('No active program found or program_details is null for user:', user.id)
    return null
  }
  
  // Extract the program_details which contains the TrainingProgram structure
  const program = data.program_details as TrainingProgram
  
  // Augment with database fields if they're not already in program_details
  if (data.program_name && !program.programName) {
    program.programName = data.program_name
  }
  if (data.total_duration_weeks && !program.durationWeeksTotal) {
    program.durationWeeksTotal = data.total_duration_weeks
  }
  if (data.generated_at && !program.generatedAt) {
    program.generatedAt = data.generated_at
  }
  if (data.ai_model_version && !program.aiModelUsed) {
    program.aiModelUsed = data.ai_model_version
  }

  // Return the program with the database ID included
  return {
    ...program,
    id: data.id
  }
} 