import { createClient } from '@/utils/supabase/server';

export interface NeuralProgram {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  program_content: any;
  metadata: Record<string, any>;
}

export interface CreateNeuralProgramData {
  user_id: string;
  program_content: any;
  metadata?: Record<string, any>;
}

/**
 * Save a neural program to the database
 */
export async function saveNeuralProgram(data: CreateNeuralProgramData) {
  const supabase = await createClient();
  
  const { data: savedProgram, error } = await supabase
    .from('neural_programs')
    .insert({
      user_id: data.user_id,
      program_content: data.program_content,
      metadata: data.metadata ?? {}
    })
    .select('id, created_at')
    .single();

  if (error) {
    throw new Error(`Failed to save neural program: ${error.message}`);
  }

  return savedProgram;
}

/**
 * Get neural programs for a user
 */
export async function getNeuralPrograms(userId: string) {
  const supabase = await createClient();
  
  const { data: programs, error } = await supabase
    .from('neural_programs')
    .select('id, created_at, updated_at, program_content, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get neural programs: ${error.message}`);
  }

  return programs;
}

/**
 * Get a specific neural program by ID
 */
export async function getNeuralProgramById(programId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: program, error } = await supabase
    .from('neural_programs')
    .select('*')
    .eq('id', programId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get neural program: ${error.message}`);
  }

  return program;
}

/**
 * Update a neural program
 */
export async function updateNeuralProgram(
  programId: string, 
  userId: string, 
  updates: Partial<Pick<NeuralProgram, 'program_content' | 'metadata'>>
) {
  const supabase = await createClient();
  
  const { data: updatedProgram, error } = await supabase
    .from('neural_programs')
    .update(updates)
    .eq('id', programId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update neural program: ${error.message}`);
  }

  return updatedProgram;
}

/**
 * Delete a neural program
 */
export async function deleteNeuralProgram(programId: string, userId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('neural_programs')
    .delete()
    .eq('id', programId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete neural program: ${error.message}`);
  }

  return true;
}
