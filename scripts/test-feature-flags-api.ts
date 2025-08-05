#!/usr/bin/env tsx

/**
 * Test script for Feature Flags API
 * Tests the core functionality of the feature flagging system
 */

import { isFeatureEnabled, getFeatureFlagStatus, FEATURE_FLAGS } from '../src/lib/featureFlags'

async function testFeatureFlags() {
  console.log('🧪 Testing Feature Flags System...\n')

  try {
    // Test with a fake user ID
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'
    
    console.log('📋 Testing Phoenix Pipeline Flag:')
    
    // Test 1: Check if Phoenix pipeline is enabled (should be false initially)
    const isPhoenixEnabled = await isFeatureEnabled(testUserId, FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED)
    console.log(`   Phoenix enabled for test user: ${isPhoenixEnabled}`)
    
    // Test 2: Get detailed status
    const phoenixStatus = await getFeatureFlagStatus(testUserId, FEATURE_FLAGS.PHOENIX_PIPELINE_ENABLED)
    console.log(`   Status source: ${phoenixStatus.source}`)
    console.log(`   Rollout percentage: ${phoenixStatus.rolloutPercentage}%`)
    
    console.log('\n📋 Testing Internal Testing Flag:')
    
    // Test 3: Check internal testing flag
    const isInternalEnabled = await isFeatureEnabled(testUserId, FEATURE_FLAGS.PHOENIX_PIPELINE_INTERNAL_TESTING)
    console.log(`   Internal testing enabled: ${isInternalEnabled}`)
    
    const internalStatus = await getFeatureFlagStatus(testUserId, FEATURE_FLAGS.PHOENIX_PIPELINE_INTERNAL_TESTING)
    console.log(`   Status source: ${internalStatus.source}`)
    
    console.log('\n📋 Testing Non-existent Flag:')
    
    // Test 4: Non-existent flag (should be false)
    const nonExistentFlag = await isFeatureEnabled(testUserId, 'non_existent_flag')
    console.log(`   Non-existent flag enabled: ${nonExistentFlag}`)
    
    console.log('\n✅ Feature Flags API tests completed successfully!')
    
    console.log('\n🎯 Next Steps:')
    console.log('   1. Visit http://localhost:3000/admin/feature-flags')
    console.log('   2. Try enabling Phoenix pipeline for internal testing')
    console.log('   3. Test the dual pipeline routing')
    
  } catch (error) {
    console.error('❌ Feature Flags API test failed:', error)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Ensure the database migration was run successfully')
    console.error('   2. Check Supabase connection in .env.local')
    console.error('   3. Verify you have the correct service role key')
  }
}

testFeatureFlags()