#!/usr/bin/env tsx

import { createClient } from '@/utils/supabase/server'
import { hasActiveSubscription } from '@/lib/permissions'

async function testProgramGeneration() {
  const supabase = await createClient()
  
  console.log('🧪 Testing Program Generation Fix...')
  
  // Test with the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('❌ Authentication failed:', authError)
    return
  }
  
  console.log(`👤 Testing with user: ${user.id}`)
  
  // Check subscription status
  const hasPaidAccess = await hasActiveSubscription(user.id)
  console.log(`💰 Subscription status - Has paid access: ${hasPaidAccess}`)
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, age, weight_unit, primary_training_focus, experience_level, is_premium, trial_ends_at, onboarding_responses')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    console.error('❌ Failed to fetch profile:', profileError)
    return
  }
  
  console.log(`📊 Profile: ${profile.name}, Age: ${profile.age}, Experience: ${profile.experience_level}`)
  console.log(`🎯 Goal: ${profile.onboarding_responses?.primaryGoal}`)
  console.log(`📅 Training Frequency: ${profile.onboarding_responses?.trainingFrequencyDays} days/week`)
  
  // Create a new training program record
  const { data: newProgram, error: insertError } = await supabase
    .from('training_programs')
    .insert({
      user_id: user.id,
      onboarding_data_snapshot: profile.onboarding_responses,
      generation_status: 'pending'
    })
    .select()
    .single()
  
  if (insertError || !newProgram) {
    console.error('❌ Failed to create program record:', insertError)
    return
  }
  
  console.log(`📝 Created program record: ${newProgram.id}`)
  
  // Trigger program generation via Edge Function
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('❌ No active session found')
    return
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-program`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ programId: newProgram.id })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ Edge function failed: ${response.status} - ${errorText}`)
    return
  }
  
  const result = await response.json()
  console.log(`✅ Edge function response:`, result)
  
  // Wait a moment for processing
  console.log('⏳ Waiting for program generation to complete...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Check the generated program
  const { data: generatedProgram, error: fetchError } = await supabase
    .from('training_programs')
    .select('generation_status, generation_error, program_details')
    .eq('id', newProgram.id)
    .single()
  
  if (fetchError || !generatedProgram) {
    console.error('❌ Failed to fetch generated program:', fetchError)
    return
  }
  
  console.log(`📋 Generation status: ${generatedProgram.generation_status}`)
  
  if (generatedProgram.generation_error) {
    console.error(`❌ Generation error: ${generatedProgram.generation_error}`)
    return
  }
  
  if (generatedProgram.program_details) {
    const program = generatedProgram.program_details
    console.log(`🎉 Program generated successfully!`)
    console.log(`📝 Program name: ${program.programName}`)
    console.log(`📖 Description: ${program.description}`)
    console.log(`⏱️ Duration: ${program.durationWeeksTotal} weeks`)
    
    if (program.phases && program.phases.length > 0) {
      const firstPhase = program.phases[0]
      console.log(`🏗️ Phase: ${firstPhase.phaseName}`)
      
      if (firstPhase.weeks && firstPhase.weeks.length > 0) {
        const firstWeek = firstPhase.weeks[0]
        console.log(`📅 Week ${firstWeek.weekNumber}:`)
        
        const workoutDays = firstWeek.days.filter((day: any) => !day.isRestDay)
        const restDays = firstWeek.days.filter((day: any) => day.isRestDay)
        
        console.log(`💪 Workout days: ${workoutDays.length}`)
        console.log(`😴 Rest days: ${restDays.length}`)
        
        workoutDays.forEach((day: any, index: number) => {
          console.log(`  Day ${day.dayOfWeek} (${day.focus}): ${day.exercises.length} exercises`)
          day.exercises.forEach((exercise: any, exIndex: number) => {
            console.log(`    ${exIndex + 1}. ${exercise.name} - ${exercise.sets}x${exercise.reps}`)
          })
        })
        
        // Verify the fix
        if (hasPaidAccess) {
          if (program.durationWeeksTotal >= 4 && workoutDays.length >= 4) {
            console.log(`✅ PAID USER: Correctly generated full program (${program.durationWeeksTotal} weeks, ${workoutDays.length} workout days)`)
          } else {
            console.log(`❌ PAID USER: Incorrect program structure (${program.durationWeeksTotal} weeks, ${workoutDays.length} workout days)`)
          }
        } else {
          if (program.durationWeeksTotal === 1 && workoutDays.length >= 4) {
            console.log(`✅ FREE TRIAL: Correctly generated sample week (${program.durationWeeksTotal} week, ${workoutDays.length} workout days)`)
          } else {
            console.log(`❌ FREE TRIAL: Incorrect program structure (${program.durationWeeksTotal} weeks, ${workoutDays.length} workout days)`)
          }
        }
      }
    }
  } else {
    console.log('❌ No program details found')
  }
}

// Run the test
testProgramGeneration().catch(console.error) 