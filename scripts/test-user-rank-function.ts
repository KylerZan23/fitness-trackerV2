#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserRankFunction() {
  console.log('🧪 Testing get_user_rank_for_lift function...')

  try {
    // First, let's get a sample user ID from the database
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found in database')
      return
    }

    const testUserId = users[0].id
    console.log(`👤 Testing with user ID: ${testUserId}`)

    // Test the function with different lift patterns
    const liftPatterns = ['%bench%', '%squat%', '%deadlift%']

    for (const pattern of liftPatterns) {
      console.log(`\n🏋️ Testing pattern: ${pattern}`)
      
      const { data, error } = await supabase.rpc('get_user_rank_for_lift', {
        p_user_id: testUserId,
        lift_type_pattern: pattern,
      })

      if (error) {
        console.error(`❌ Error with pattern ${pattern}:`, error.message)
      } else if (data && data.length > 0) {
        const result = data[0]
        console.log(`✅ Rank: ${result.rank}, Best e1RM: ${result.best_e1rm}`)
      } else {
        console.log(`ℹ️ No rank found for pattern ${pattern}`)
      }
    }

    console.log('\n🎉 User rank function test completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testUserRankFunction() 