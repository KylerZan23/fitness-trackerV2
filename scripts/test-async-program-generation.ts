#!/usr/bin/env tsx

/**
 * Test Script: Asynchronous Program Generation Flow
 * 
 * This script tests the complete async program generation pipeline:
 * 1. Creates a test user program record with pending status
 * 2. Calls the Edge Function to trigger background generation
 * 3. Polls the database status until completion
 * 4. Validates the generated program structure
 * 
 * Usage: npx tsx scripts/test-async-program-generation.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test user data
const TEST_USER_EMAIL = 'test-async@neurallift.com'
const TEST_USER_PASSWORD = 'test123456'

// Mock onboarding data
const MOCK_ONBOARDING_DATA = {
  primaryGoal: 'Muscle Gain: General',
  trainingFrequencyDays: 4,
  sessionDuration: '45-60 minutes',
  equipment: ['Dumbbells', 'Barbell', 'Bench', 'Pull-up Bar'],
  injuriesLimitations: 'None',
  squat1RMEstimate: 315,
  benchPress1RMEstimate: 225,
  deadlift1RMEstimate: 405,
  overheadPress1RMEstimate: 135
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createTestUser() {
  console.log('🔧 Creating test user...')
  
  // Check if user already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers()
  const userExists = existingUser.users.some(u => u.email === TEST_USER_EMAIL)
  
  if (userExists) {
    console.log('✅ Test user already exists')
    const user = existingUser.users.find(u => u.email === TEST_USER_EMAIL)!
    return user
  }
  
  // Create new test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true
  })
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }
  
  console.log('✅ Test user created successfully')
  return data.user
}

async function createTestProfile(userId: string) {
  console.log('🔧 Creating test profile...')
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (existingProfile) {
    console.log('✅ Test profile already exists')
    return existingProfile
  }
  
  // Create profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: 'Test User',
      email: TEST_USER_EMAIL,
      age: 28,
      weight_unit: 'lbs',
      primary_training_focus: 'Muscle Gain',
      experience_level: 'Intermediate',
      is_premium: true, // Give premium access for testing
      onboarding_responses: MOCK_ONBOARDING_DATA
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test profile: ${error.message}`)
  }
  
  console.log('✅ Test profile created successfully')
  return data
}

async function createPendingProgram(userId: string) {
  console.log('🔧 Creating pending program record...')
  
  const { data, error } = await supabase
    .from('training_programs')
    .insert({
      user_id: userId,
      onboarding_data_snapshot: MOCK_ONBOARDING_DATA,
      generation_status: 'pending',
      program_details: {} // Empty placeholder
    })
    .select('id')
    .single()
  
  if (error) {
    throw new Error(`Failed to create pending program: ${error.message}`)
  }
  
  console.log(`✅ Created pending program with ID: ${data.id}`)
  return data.id
}

async function getAuthToken(userId: string) {
  console.log('🔧 Getting auth token...')
  
  // Sign in the test user to get a valid JWT
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  })
  
  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`)
  }
  
  console.log('✅ Got auth token successfully')
  return data.session?.access_token!
}

async function callEdgeFunction(programId: string, authToken: string) {
  console.log('🚀 Calling Edge Function to trigger generation...')
  
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-program`
  
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ programId })
  })
  
  const responseData = await response.json()
  
  if (!response.ok) {
    throw new Error(`Edge Function call failed: ${JSON.stringify(responseData)}`)
  }
  
  console.log(`✅ Edge Function responded: ${responseData.message}`)
  console.log(`📊 Status: ${responseData.status}`)
  return responseData
}

async function pollGenerationStatus(programId: string, maxWaitTime = 5 * 60 * 1000) {
  console.log('⏳ Polling generation status...')
  
  const startTime = Date.now()
  const pollInterval = 3000 // 3 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    const { data, error } = await supabase
      .from('training_programs')
      .select('id, generation_status, generation_error, program_details, ai_model_version')
      .eq('id', programId)
      .single()
    
    if (error) {
      throw new Error(`Failed to check generation status: ${error.message}`)
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`📊 [${elapsed}s] Status: ${data.generation_status}`)
    
    if (data.generation_status === 'completed') {
      console.log('🎉 Generation completed successfully!')
      return data
    }
    
    if (data.generation_status === 'failed') {
      throw new Error(`Generation failed: ${data.generation_error}`)
    }
    
    await sleep(pollInterval)
  }
  
  throw new Error('Generation timed out after 5 minutes')
}

async function validateProgram(programData: any) {
  console.log('🔍 Validating generated program...')
  
  const program = programData.program_details
  
  // Basic structure validation
  if (!program.programName) throw new Error('Missing program name')
  if (!program.description) throw new Error('Missing program description')
  if (!program.phases || !Array.isArray(program.phases)) throw new Error('Missing or invalid phases')
  if (program.phases.length === 0) throw new Error('No phases in program')
  
  // Phase validation
  for (const phase of program.phases) {
    if (!phase.phaseName) throw new Error('Missing phase name')
    if (!phase.weeks || !Array.isArray(phase.weeks)) throw new Error('Missing or invalid weeks')
    if (phase.weeks.length === 0) throw new Error('No weeks in phase')
    
    // Week validation
    for (const week of phase.weeks) {
      if (!week.days || !Array.isArray(week.days)) throw new Error('Missing or invalid days')
      if (week.days.length === 0) throw new Error('No days in week')
      
      // Day validation
      for (const day of week.days) {
        if (typeof day.dayOfWeek !== 'number') throw new Error('Missing or invalid dayOfWeek')
        if (!day.isRestDay && (!day.exercises || !Array.isArray(day.exercises))) {
          throw new Error('Missing exercises for workout day')
        }
      }
    }
  }
  
  console.log('✅ Program structure validation passed')
  console.log(`📊 Program: "${program.programName}"`)
  console.log(`📊 Duration: ${program.durationWeeksTotal} weeks`)
  console.log(`📊 Phases: ${program.phases.length}`)
  console.log(`📊 AI Model: ${programData.ai_model_version}`)
  
  return true
}

async function cleanup(userId: string) {
  console.log('🧹 Cleaning up test data...')
  
  // Delete training programs
  await supabase
    .from('training_programs')
    .delete()
    .eq('user_id', userId)
  
  // Delete profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  // Delete user
  await supabase.auth.admin.deleteUser(userId)
  
  console.log('✅ Cleanup completed')
}

async function runTest() {
  let userId: string | null = null
  
  try {
    console.log('🚀 Starting Async Program Generation Test\n')
    
    // Step 1: Create test user and profile
    const user = await createTestUser()
    userId = user.id
    await createTestProfile(userId)
    
    // Step 2: Create pending program record
    const programId = await createPendingProgram(userId)
    
    // Step 3: Get auth token
    const authToken = await getAuthToken(userId)
    
    // Step 4: Call Edge Function
    const edgeResponse = await callEdgeFunction(programId, authToken)
    
    // Verify immediate response
    if (edgeResponse.status !== 'processing') {
      throw new Error(`Expected 'processing' status, got '${edgeResponse.status}'`)
    }
    
    // Step 5: Poll for completion
    const completedProgram = await pollGenerationStatus(programId)
    
    // Step 6: Validate program
    await validateProgram(completedProgram)
    
    console.log('\n🎉 Async Program Generation Test PASSED!')
    console.log('✅ All components working correctly:')
    console.log('   - Immediate Edge Function response')
    console.log('   - Background processing')
    console.log('   - Status tracking')
    console.log('   - Program generation')
    console.log('   - Data validation')
    
  } catch (error: any) {
    console.error('\n❌ Test FAILED:', error.message)
    process.exit(1)
  } finally {
    if (userId) {
      await cleanup(userId)
    }
  }
}

// Run the test
runTest()