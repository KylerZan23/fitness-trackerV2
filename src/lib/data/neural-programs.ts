import { createClient } from '@/utils/supabase/server';
import { getReadAfterWriteClient, recordProgramWrite, markProgramAsReplicated } from '@/lib/db/read-after-write';

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
 * Save a neural program to the database with transactional integrity
 * 
 * This function ensures the program is successfully committed to the database
 * before returning. No success response should be sent until this completes.
 */
export async function saveNeuralProgram(data: CreateNeuralProgramData) {
  // Use write-optimized client for database writes
  const supabase = await getReadAfterWriteClient({ operation: 'write' });
  
  // Validate input data before attempting database operation
  if (!data.user_id) {
    throw new Error('TRANSACTIONAL_INTEGRITY: user_id is required for database commit');
  }
  
  if (!data.program_content) {
    throw new Error('TRANSACTIONAL_INTEGRITY: program_content is required for database commit');
  }

  // Perform atomic insert operation
  const { data: savedProgram, error } = await supabase
    .from('neural_programs')
    .insert({
      user_id: data.user_id,
      program_content: data.program_content,
      metadata: data.metadata ?? {}
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`TRANSACTIONAL_INTEGRITY: Database commit failed - ${error.message} (Code: ${error.code})`);
  }

  // Verify the returned data is valid and complete
  if (!savedProgram || !savedProgram.id) {
    throw new Error('TRANSACTIONAL_INTEGRITY: Database insert succeeded but returned invalid data - no ID confirmed');
  }

  if (savedProgram.user_id !== data.user_id) {
    throw new Error('TRANSACTIONAL_INTEGRITY: Database insert succeeded but returned mismatched user_id');
  }
  
  if (!savedProgram.program_content) {
    throw new Error('TRANSACTIONAL_INTEGRITY: Database insert succeeded but program_content is missing');
  }

  // Database commit confirmed - record write for read-after-write consistency
  recordProgramWrite(savedProgram.id, savedProgram.user_id, 'creation');
  
  // Database commit confirmed - safe to return success
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
 * Get a specific neural program by ID with read-after-write consistency
 */
export async function getNeuralProgramById(programId: string, userId: string) {
  // Use read-after-write client to handle fresh writes
  const supabase = await getReadAfterWriteClient({ 
    programId, 
    operation: 'read' 
  });
  
  const { data: program, error } = await supabase
    .from('neural_programs')
    .select('*')
    .eq('id', programId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get neural program: ${error.message}`);
  }

  // If we successfully read from replica, mark as replicated
  markProgramAsReplicated(programId);

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
  // Use write-optimized client for updates
  const supabase = await getReadAfterWriteClient({ operation: 'write' });
  
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

  // Record update for read-after-write consistency
  recordProgramWrite(programId, userId, 'update');

  return updatedProgram;
}

/**
 * Delete a neural program
 */
export async function deleteNeuralProgram(programId: string, userId: string) {
  // Use write-optimized client for deletions
  const supabase = await getReadAfterWriteClient({ operation: 'write' });
  
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
