import { NextRequest, NextResponse } from 'next/server';
import { removeUserFeatureOverride } from '@/lib/featureFlags';
import { createClient } from '@/utils/supabase/server';

/**
 * DELETE /api/admin/feature-flags/[flagName]/overrides/[userId]
 * Remove user override for a specific feature flag (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flagName: string; userId: string }> }
) {
  try {
    // Development mode bypass for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Check authentication and admin status
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!isDevelopment && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Skip admin check in development mode
    if (!isDevelopment) {
      // Check if user is admin using the database function
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_user_admin', { user_id: user!.id });

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        return NextResponse.json(
          { error: 'Error checking admin permissions' },
          { status: 500 }
        );
      }
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const { flagName, userId } = await params;

    // Remove user override
    const result = await removeUserFeatureOverride(userId, flagName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}