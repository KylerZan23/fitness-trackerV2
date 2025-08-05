import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/test-auth
 * Test authentication status and admin privileges
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated',
        authError: authError?.message
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Check admin status
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_user_admin', { user_id: user.id });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        profileEmail: profile?.email
      },
      isAdmin: isAdmin || false,
      adminError: adminError?.message,
      profileError: profileError?.message
    });
  } catch (error) {
    console.error('Error in test-auth:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}