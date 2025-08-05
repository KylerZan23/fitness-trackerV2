import { NextRequest, NextResponse } from 'next/server';
import { updateFeatureFlagConfig } from '@/lib/featureFlags';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * PATCH /api/admin/feature-flags/[flagName]
 * Update feature flag configuration (admin only)
 */
export async function PATCH(
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

    const { flagName } = await params;
    const updates = await request.json();

    // Validate updates
    const allowedFields = [
      'isEnabled', 
      'rolloutPercentage', 
      'adminOverrideEnabled', 
      'adminOverrideDisabled',
      'description',
      'metadata'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    // Map frontend field names to database column names
    const dbUpdates: any = {};
    if (filteredUpdates.isEnabled !== undefined) dbUpdates.is_enabled = filteredUpdates.isEnabled;
    if (filteredUpdates.rolloutPercentage !== undefined) dbUpdates.rollout_percentage = filteredUpdates.rolloutPercentage;
    if (filteredUpdates.adminOverrideEnabled !== undefined) dbUpdates.admin_override_enabled = filteredUpdates.adminOverrideEnabled;
    if (filteredUpdates.adminOverrideDisabled !== undefined) dbUpdates.admin_override_disabled = filteredUpdates.adminOverrideDisabled;
    if (filteredUpdates.description !== undefined) dbUpdates.description = filteredUpdates.description;
    if (filteredUpdates.metadata !== undefined) dbUpdates.metadata = filteredUpdates.metadata;

    // Update feature flag using service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await serviceClient
      .from('feature_flags')
      .update(dbUpdates)
      .eq('flag_name', flagName);

    if (updateError) {
      console.error('Error updating feature flag:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}