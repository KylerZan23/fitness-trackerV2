import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // This needs to be added to .env.local

async function createTestUser() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Please check .env.local')
    process.exit(1)
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const testUser = {
    email: 'test@fitnesstrack.local',
    password: 'Test123!@#',
    user_metadata: {
      name: 'Test User',
      age: 25,
      fitness_goals: 'Build strength and improve endurance',
    },
  }

  try {
    // Create user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: testUser.user_metadata,
    })

    if (createError) {
      throw createError
    }

    if (!user.user) {
      throw new Error('Failed to create test user')
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.user.id,
      email: testUser.email,
      name: testUser.user_metadata.name,
      age: testUser.user_metadata.age,
      fitness_goals: testUser.user_metadata.fitness_goals,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }

    console.log('\n=== Test User Created Successfully ===')
    console.log('Email:', testUser.email)
    console.log('Password:', testUser.password)
    console.log('User ID:', user.user.id)
    console.log('\nYou can now log in with these credentials at http://localhost:3001/login')
  } catch (error) {
    console.error('Error creating test user:', error)
    process.exit(1)
  }
}

createTestUser()
