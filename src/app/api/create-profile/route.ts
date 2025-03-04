import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Define a type for the profile data
interface ProfileData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  fitness_goals?: string;
  age?: number;
}

// Helper function to decode JWT token payload
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString());
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
}

// Ensure this is only executed on the server
export async function POST(request: NextRequest) {
  try {
    console.log('Profile creation API called')
    
    // Get request body data
    const body = await request.json()
    const { id, email, name, fitness_goals, age, auth_token } = body
    
    console.log(`Request for profile creation - ID: ${id}, Email: ${email}`)
    console.log(`Auth token provided: ${auth_token ? 'Yes' : 'No'}`)
    
    if (!id || !email) {
      console.error('Missing required fields: ID or email')
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 })
    }
    
    // Create SERVICE ROLE client to verify the auth token
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Using SERVICE_ROLE_KEY for verification
    )
    
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Verify token if provided
    if (auth_token) {
      console.log(`API - Profile Creation: Starting token verification with token length: ${auth_token.length}`)
      console.log(`API - Profile Creation: First 10 chars of token: ${auth_token.substring(0, 10)}...`)
      
      try {
        // Decode JWT payload to get user ID
        const decodedToken = decodeJwtPayload(auth_token);
        
        if (!decodedToken || !decodedToken.sub) {
          console.error('API - Profile Creation: Invalid token format or missing subject (user ID)');
          return NextResponse.json(
            { error: 'Auth token verification failed: Invalid token format' },
            { status: 401 }
          );
        }
        
        console.log(`API - Profile Creation: Token sub (user ID): ${decodedToken.sub}`);
        console.log(`API - Profile Creation: Token expiration: ${new Date(decodedToken.exp * 1000).toISOString()}`);
        
        // Verify token hasn't expired
        if (decodedToken.exp * 1000 < Date.now()) {
          console.error('API - Profile Creation: Token has expired');
          return NextResponse.json(
            { error: 'Auth token verification failed: Token expired' },
            { status: 401 }
          );
        }
        
        // Get user by ID directly using admin API
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(decodedToken.sub);
        
        if (userError) {
          console.error('API - Profile Creation: Error getting user:', userError);
          return NextResponse.json(
            { error: `Auth token verification failed: ${userError.message}` },
            { status: 401 }
          );
        }
        
        if (!userData.user) {
          console.error('API - Profile Creation: No user found with token ID');
          return NextResponse.json(
            { error: 'Unauthorized - invalid authentication token (no user)' },
            { status: 401 }
          );
        }
        
        // Make sure user ID matches the token
        console.log(`API - Profile Creation: User from admin.getUserById:`, userData.user ? JSON.stringify({
          id: userData.user.id,
          email: userData.user.email,
          role: userData.user.role,
          aud: userData.user.aud
        }) : 'null');
        
        if (userData.user.id !== id) {
          console.error(`API - Profile Creation: User ID mismatch - Token user: ${userData.user.id}, Request ID: ${id}`);
          return NextResponse.json(
            { error: 'Unauthorized - user ID from token does not match requested ID' },
            { status: 401 }
          );
        }
        
        console.log('API - Profile Creation: Auth token verified successfully');
      } catch (sessionError: any) {
        console.error('API - Profile Creation: Token verification error:', sessionError)
        console.error('API - Profile Creation: Error message:', sessionError.message)
        console.error('API - Profile Creation: Error name:', sessionError.name)
        console.error('API - Profile Creation: Error stack:', sessionError.stack)
        
        // Log the complete error object for detailed debugging
        console.error('API - Profile Creation: Complete error object:', JSON.stringify({
          message: sessionError.message,
          name: sessionError.name,
          code: sessionError.code,
          details: sessionError.details,
          hint: sessionError.hint,
          stack: sessionError.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
        }, null, 2))
        
        return NextResponse.json(
          { error: `Auth token verification failed: ${sessionError.message}` },
          { status: 401 }
        )
      }
    } else {
      console.log('No auth token provided, proceeding with admin client only')
    }
    
    // Prepare profile data with proper typing
    const profileData: ProfileData = {
      id,
      email,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    // Add optional fields if provided
    if (fitness_goals) {
      profileData.fitness_goals = fitness_goals
    } else {
      profileData.fitness_goals = 'Get fit'
    }
    
    if (age !== undefined) {
      profileData.age = age
    }
    
    console.log('Creating profile with data:', JSON.stringify(profileData, null, 2))
    
    // Create profile using admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData)
    
    if (error) {
      console.error('Server-side profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Profile created successfully')
    return NextResponse.json({ success: true, message: 'Profile created successfully' })
    
  } catch (error: any) {
    console.error('Profile creation API error:', error)
    return NextResponse.json(
      { error: `Failed to create profile: ${error?.message || 'Unknown error'}` }, 
      { status: 500 }
    )
  }
} 