import { NextRequest, NextResponse } from 'next/server';
import { emergencyRollback } from '@/lib/featureFlags';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/feature-flags/[flagName]/emergency-rollback
 * Execute emergency rollback for a feature flag (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flagName: string }> }
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

    const { flagName } = await params;
    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required for emergency rollback' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Execute emergency rollback directly
    const { error } = await serviceClient
      .from('feature_flags')
      .update({
        admin_override_disabled: true,
        admin_override_enabled: null,
        metadata: {
          emergency_rollback: true,
          rollback_reason: reason,
          rollback_at: new Date().toISOString()
        },
        updated_by: user?.id || null
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error('Error during emergency rollback:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Log the emergency rollback for audit purposes
    console.log(`[FeatureFlags] Emergency rollback executed by ${user?.email || 'development'} for ${flagName}: ${reason}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during emergency rollback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}