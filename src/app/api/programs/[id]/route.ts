import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getNeuralProgramById } from '@/lib/data/neural-programs'
import { logger } from '@/lib/logging'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const { id: programId } = await params;

  try {
    const supabase = await createClient();

    logger.info('Neural program fetch requested', {
      operation: 'fetchNeuralProgram',
      component: 'programsAPI',
      requestId,
      programId: programId
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthorized program fetch attempt', {
        operation: 'fetchNeuralProgram',
        component: 'programsAPI',
        requestId,
        programId: programId,
        error: authError?.message
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch program using Data Access Layer with RLS protection
    let program;
    try {
      program = await getNeuralProgramById(programId, user.id);
    } catch (error) {
      logger.warn('Program not found or access denied', {
        operation: 'fetchNeuralProgram',
        component: 'programsAPI',
        requestId,
        programId: programId,
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof Error && error.message.includes('Failed to get neural program')) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }
      throw error;
    }

    const duration = Date.now() - startTime;

    logger.info('Neural program fetched successfully', {
      operation: 'fetchNeuralProgram',
      component: 'programsAPI',
      requestId,
      programId: programId,
      userId: user.id,
      duration
    });

    return NextResponse.json({
      id: program.id,
      userId: program.user_id,
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      program: program.program_content,
      metadata: program.metadata
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Neural program fetch failed', {
      operation: 'fetchNeuralProgram',
      component: 'programsAPI',
      requestId,
      programId: programId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
