import { NextRequest, NextResponse } from 'next/server';
import { getUserOverridesForFlag, setUserFeatureOverride } from '@/lib/featureFlags';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/feature-flags/[flagName]/overrides
 * Get user overrides for a specific feature flag (admin only)
 */
export async function GET(
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
    
    // Use service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: overrides, error } = await serviceClient
      .from('user_feature_overrides')
      .select('*')
      .eq('flag_name', flagName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user overrides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user overrides' },
        { status: 500 }
      );
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('Error fetching user overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags/[flagName]/overrides
 * Add user override for a specific feature flag (admin only)
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
    const { userId, isEnabled, reason, expiresAt } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled must be a boolean' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: insertError } = await serviceClient
      .from('user_feature_overrides')
      .upsert({
        user_id: userId,
        flag_name: flagName,
        is_enabled: isEnabled,
        reason: reason,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        created_by: user?.id || null
      });

    if (insertError) {
      console.error('Error adding user override:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}