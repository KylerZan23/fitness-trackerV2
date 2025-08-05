import { NextRequest, NextResponse } from 'next/server';
import { getAllFeatureFlags } from '@/lib/featureFlags';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/feature-flags
 * Retrieve all feature flags (admin only)
 */
export async function GET(request: NextRequest) {
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
        .rpc('is_user_admin', { user_id: user.id });

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

    // Fetch all feature flags using service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: flags, error: flagsError } = await serviceClient
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: false });

    if (flagsError) {
      console.error('Error fetching feature flags:', flagsError);
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }

    // Map to our interface format
    const mappedFlags = flags?.map(flag => ({
      id: flag.id,
      flagName: flag.flag_name,
      description: flag.description,
      isEnabled: flag.is_enabled,
      rolloutPercentage: flag.rollout_percentage,
      adminOverrideEnabled: flag.admin_override_enabled,
      adminOverrideDisabled: flag.admin_override_disabled,
      metadata: flag.metadata || {},
      createdAt: flag.created_at,
      updatedAt: flag.updated_at
    })) || [];

    return NextResponse.json({ flags: mappedFlags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}