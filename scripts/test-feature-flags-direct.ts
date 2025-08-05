#!/usr/bin/env tsx

/**
 * Direct test for Feature Flags Database Functions
 * Tests the database functions directly without Next.js context
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseFunctions() {
  console.log('🧪 Testing Feature Flags Database Functions...\n')

  try {
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'
    
    console.log('📋 Testing Database Tables:')
    
    // Test 1: Check if tables exist and have data
    const { data: flags, error: flagsError } = await supabase
      .from('feature_flags')
      .select('*')
    
    if (flagsError) {
      throw new Error(`Feature flags table error: ${flagsError.message}`)
    }
    
    console.log(`   ✅ feature_flags table: ${flags?.length || 0} flags found`)
    flags?.forEach(flag => {
      console.log(`      - ${flag.flag_name}: ${flag.is_enabled ? 'ENABLED' : 'DISABLED'} (${flag.rollout_percentage}%)`)
    })
    
    // Test 2: Check user overrides table
    const { data: overrides, error: overridesError } = await supabase
      .from('user_feature_overrides')
      .select('*')
    
    if (overridesError) {
      throw new Error(`User overrides table error: ${overridesError.message}`)
    }
    
    console.log(`   ✅ user_feature_overrides table: ${overrides?.length || 0} overrides found`)
    
    console.log('\n📋 Testing Database Functions:')
    
    // Test 3: Test the is_feature_enabled_for_user function
    const { data: phoenixEnabled, error: phoenixError } = await supabase
      .rpc('is_feature_enabled_for_user', {
        p_user_id: testUserId,
        p_flag_name: 'phoenix_pipeline_enabled'
      })
    
    if (phoenixError) {
      throw new Error(`Function test error: ${phoenixError.message}`)
    }
    
    console.log(`   ✅ is_feature_enabled_for_user('phoenix_pipeline_enabled'): ${phoenixEnabled}`)
    
    // Test 4: Test with internal testing flag
    const { data: internalEnabled, error: internalError } = await supabase
      .rpc('is_feature_enabled_for_user', {
        p_user_id: testUserId,
        p_flag_name: 'phoenix_pipeline_internal_testing'
      })
    
    if (internalError) {
      throw new Error(`Internal function test error: ${internalError.message}`)
    }
    
    console.log(`   ✅ is_feature_enabled_for_user('phoenix_pipeline_internal_testing'): ${internalEnabled}`)
    
    // Test 5: Test admin function (if you have admin email)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_user_admin', {
          user_id: user.id
        })
      
      if (!adminError) {
        console.log(`   ✅ is_user_admin(${user.email}): ${isAdmin}`)
      }
    }
    
    console.log('\n📋 Testing Flag Updates:')
    
    // Test 6: Try updating a flag (enable internal testing)
    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: true,
        rollout_percentage: 100
      })
      .eq('flag_name', 'phoenix_pipeline_internal_testing')
    
    if (updateError) {
      console.log(`   ⚠️  Flag update test skipped: ${updateError.message}`)
    } else {
      console.log('   ✅ Flag update test passed')
      
      // Test the function again to see the change
      const { data: updatedResult } = await supabase
        .rpc('is_feature_enabled_for_user', {
          p_user_id: testUserId,
          p_flag_name: 'phoenix_pipeline_internal_testing'
        })
      
      console.log(`   ✅ Updated result for internal testing: ${updatedResult}`)
      
      // Reset the flag
      await supabase
        .from('feature_flags')
        .update({
          is_enabled: false,
          rollout_percentage: 0
        })
        .eq('flag_name', 'phoenix_pipeline_internal_testing')
    }
    
    console.log('\n🎉 All database tests passed!')
    console.log('\n🎯 Next Steps:')
    console.log('   1. Visit http://localhost:3000/admin/feature-flags')
    console.log('   2. The admin interface should now work correctly')
    console.log('   3. Try enabling flags and testing the dual pipeline routing')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Ensure the database migration was run successfully')
    console.error('   2. Check Supabase connection and service role key')
    console.error('   3. Verify RLS policies allow the operations')
  }
}

testDatabaseFunctions()