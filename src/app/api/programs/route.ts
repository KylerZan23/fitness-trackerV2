import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getNeuralPrograms } from '@/lib/data/neural-programs'
import { logger } from '@/lib/logging'

/**
 * GET /api/programs
 * Returns a list of the authenticated user's Neural programs in a compact summary shape
 * expected by `src/app/programs/page.tsx`.
 */
export async function GET() {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized programs list attempt', {
        operation: 'listNeuralPrograms',
        component: 'programsAPI',
        requestId,
        error: authError?.message,
      })
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Neural programs list requested', {
      operation: 'listNeuralPrograms',
      component: 'programsAPI',
      requestId,
      userId: user.id,
    })

    const programs = await getNeuralPrograms(user.id)

    // Map to summary format expected by ProgramsDashboard
    const summaries = (programs || []).map((p: any) => {
      const content = p.program_content || {}
      return {
        id: p.id,
        program_name: content.programName ?? content.program_name ?? 'Neural Program',
        week_number: content.weekNumber ?? content.week_number ?? 1,
        created_at: p.created_at,
        updated_at: p.updated_at,
        user_id: user.id,
      }
    })

    const duration = Date.now() - startTime
    logger.info('Neural programs list fetched successfully', {
      operation: 'listNeuralPrograms',
      component: 'programsAPI',
      requestId,
      userId: user.id,
      count: summaries.length,
      duration,
    })

    return NextResponse.json({ success: true, data: summaries })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Neural programs list failed', {
      operation: 'listNeuralPrograms',
      component: 'programsAPI',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    })

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


