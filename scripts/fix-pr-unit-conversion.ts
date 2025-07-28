#!/usr/bin/env tsx

/**
 * Fix Personal Records Unit Conversion Bug
 * 
 * This script fixes PR data for users affected by the unit conversion bug where:
 * - User entered PRs in lbs during onboarding
 * - Values were stored in lbs but treated as kg during display
 * - Resulted in double-conversion (e.g., 225 lbs → stored as 225 → treated as 225 kg → displayed as 496 lbs)
 * 
 * The fix:
 * 1. Identify users with weight_unit = 'lbs' and onboarding PR data
 * 2. Reverse the double conversion to get original intended values
 * 3. Convert original values to kg for consistent storage
 * 4. Update their onboarding_responses
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface OnboardingResponses {
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
  [key: string]: any
}

interface UserToFix {
  id: string
  name: string
  email: string
  weight_unit: string
  onboarding_responses: OnboardingResponses
}

/**
 * Reverse the double conversion to get original intended values
 * Current stored value was: originalLbs (stored as-is)
 * Display logic converts: storedValue * 2.20462 = displayedValue
 * So: originalLbs * 2.20462 = displayedValue
 * Therefore: originalLbs = displayedValue / 2.20462
 * And to store correctly in kg: originalLbs / 2.20462
 */
function fixPRValue(storedValue: number): number {
  // The stored value is in lbs (original user input)
  // Convert it to kg for proper storage
  return storedValue / 2.20462
}

async function findAffectedUsers(): Promise<UserToFix[]> {
  console.log('Finding users affected by PR unit conversion bug...')
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, name, email, weight_unit, onboarding_responses')
    .eq('weight_unit', 'lbs')
    .not('onboarding_responses', 'is', null)
  
  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
  
  // Filter users who have PR data in their onboarding responses
  const affectedUsers = users?.filter(user => {
    const responses = user.onboarding_responses as OnboardingResponses
    return responses && (
      responses.squat1RMEstimate ||
      responses.benchPress1RMEstimate ||
      responses.deadlift1RMEstimate ||
      responses.overheadPress1RMEstimate
    )
  }) || []
  
  console.log(`Found ${affectedUsers.length} potentially affected users`)
  
  return affectedUsers
}

async function fixUser(user: UserToFix): Promise<void> {
  const responses = user.onboarding_responses
  const originalResponses = { ...responses }
  let hasChanges = false
  
  console.log(`\nFixing user: ${user.name} (${user.email})`)
  console.log('Original PR values (stored in lbs, but treated as kg):')
  
  if (responses.squat1RMEstimate) {
    const original = responses.squat1RMEstimate
    const corrected = fixPRValue(original)
    console.log(`  Squat: ${original} lbs → ${corrected.toFixed(1)} kg`)
    responses.squat1RMEstimate = corrected
    hasChanges = true
  }
  
  if (responses.benchPress1RMEstimate) {
    const original = responses.benchPress1RMEstimate
    const corrected = fixPRValue(original)
    console.log(`  Bench: ${original} lbs → ${corrected.toFixed(1)} kg`)
    responses.benchPress1RMEstimate = corrected
    hasChanges = true
  }
  
  if (responses.deadlift1RMEstimate) {
    const original = responses.deadlift1RMEstimate
    const corrected = fixPRValue(original)
    console.log(`  Deadlift: ${original} lbs → ${corrected.toFixed(1)} kg`)
    responses.deadlift1RMEstimate = corrected
    hasChanges = true
  }
  
  if (responses.overheadPress1RMEstimate) {
    const original = responses.overheadPress1RMEstimate
    const corrected = fixPRValue(original)
    console.log(`  OHP: ${original} lbs → ${corrected.toFixed(1)} kg`)
    responses.overheadPress1RMEstimate = corrected
    hasChanges = true
  }
  
  if (!hasChanges) {
    console.log('  No PR values to fix')
    return
  }
  
  // Update the user's onboarding responses
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_responses: responses })
    .eq('id', user.id)
  
  if (error) {
    console.error(`  Error updating user: ${error.message}`)
    throw error
  }
  
  console.log('  ✅ Successfully updated user')
}

async function main() {
  try {
    console.log('🔧 Starting PR Unit Conversion Fix')
    console.log('=' .repeat(50))
    
    const affectedUsers = await findAffectedUsers()
    
    if (affectedUsers.length === 0) {
      console.log('No affected users found. All done! ✅')
      return
    }
    
    console.log(`\nFixing ${affectedUsers.length} users...`)
    
    for (const user of affectedUsers) {
      await fixUser(user)
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 All users fixed successfully!')
    console.log('\nThe fix ensures that:')
    console.log('1. All PR values are now stored in kg (standard unit)')
    console.log('2. Display logic will properly convert kg → user preference')
    console.log('3. Future onboarding will store values in kg consistently')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error) 