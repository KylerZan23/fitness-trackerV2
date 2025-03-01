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

// Ensure this is only executed on the server
export async function POST(request: NextRequest) {
  try {
    // Get request body data
    const body = await request.json()
    const { id, email, name, fitness_goals, age, auth_token } = body
    
    if (!id || !email) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 })
    }
    
    // Create anonymous client to verify the auth token
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Verify token if provided
    if (auth_token) {
      supabaseAnon.auth.setSession({ access_token: auth_token, refresh_token: '' })
      const { data: { user } } = await supabaseAnon.auth.getUser()
      
      // Make sure user ID matches the token
      if (!user || user.id !== id) {
        return NextResponse.json(
          { error: 'Unauthorized - invalid authentication token' },
          { status: 401 }
        )
      }
    }
    
    // Create admin client that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
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
    
    // Create profile using admin privileges
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData)
    
    if (error) {
      console.error('Server-side profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Profile created successfully' })
    
  } catch (error) {
    console.error('Profile creation API error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' }, 
      { status: 500 }
    )
  }
} 