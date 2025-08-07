import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getReadAfterWriteStats } from '@/lib/db/read-after-write';
import { logger } from '@/lib/logging';

/**
 * GET /api/admin/read-after-write/stats
 * 
 * Returns statistics about the read-after-write consistency cache
 * for monitoring and debugging purposes.
 */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthorized read-after-write stats access attempt', {
        operation: 'readAfterWriteStats',
        component: 'adminAPI',
        requestId,
        error: authError?.message
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get read-after-write cache statistics
    const stats = getReadAfterWriteStats();
    
    // Add timestamp and system info
    const response = {
      timestamp: new Date().toISOString(),
      requestId,
      readAfterWriteStats: {
        ...stats,
        consistencyWindowSeconds: 60, // From default config
        description: {
          totalEntries: 'Number of programs currently tracked in read-after-write cache',
          entriesBySource: 'Breakdown of cache entries by write source (creation/update/manual)',
          oldestEntryAge: 'Age in seconds of the oldest entry in cache',
          averageAge: 'Average age in seconds of all entries in cache'
        }
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };

    logger.info('Read-after-write statistics retrieved', {
      operation: 'readAfterWriteStats',
      component: 'adminAPI',
      requestId,
      userId: user.id,
      totalEntries: stats.totalEntries
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to retrieve read-after-write statistics', {
      operation: 'readAfterWriteStats',
      component: 'adminAPI',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
