#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { isFeatureEnabled } from '../src/lib/featureFlags';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testDualPipelineRouting() {
  console.log('🧪 Testing Dual Pipeline Routing...\n');

  // Test with different user IDs to see percentage rollout
  const testUserIds = [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001', 
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009'
  ];

  let phoenixCount = 0;
  let legacyCount = 0;

  console.log('📊 Testing 10 different user IDs with 1% rollout:');
  console.log('=' .repeat(60));

  for (const userId of testUserIds) {
    try {
      const usePhoenix = await isFeatureEnabled(userId, 'phoenix_pipeline_enabled');
      
      if (usePhoenix) {
        phoenixCount++;
        console.log(`👤 User ${userId.slice(0, 8)}... → 🚀 PHOENIX Pipeline`);
      } else {
        legacyCount++;
        console.log(`👤 User ${userId.slice(0, 8)}... → 🔄 Legacy Pipeline`);
      }
    } catch (error) {
      console.error(`❌ Error testing user ${userId}:`, error);
    }
  }

  console.log('=' .repeat(60));
  console.log(`📈 Results:`);
  console.log(`   🚀 Phoenix Pipeline: ${phoenixCount} users (${(phoenixCount / testUserIds.length * 100).toFixed(1)}%)`);
  console.log(`   🔄 Legacy Pipeline: ${legacyCount} users (${(legacyCount / testUserIds.length * 100).toFixed(1)}%)`);
  console.log(`   📊 Expected Phoenix: ~1% (${(testUserIds.length * 0.01).toFixed(1)} users)`);

  // Test admin override
  console.log('\n🔧 Testing Admin Override...');
  
  // Enable admin override
  const { error: updateError } = await serviceClient
    .from('feature_flags')
    .update({ admin_override_enabled: true })
    .eq('flag_name', 'phoenix_pipeline_enabled');

  if (updateError) {
    console.error('❌ Error setting admin override:', updateError);
    return;
  }

  console.log('✅ Admin override enabled');

  // Test a user with admin override
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const usePhoenixWithOverride = await isFeatureEnabled(testUserId, 'phoenix_pipeline_enabled');
  
  console.log(`👤 User ${testUserId.slice(0, 8)}... with admin override → ${usePhoenixWithOverride ? '🚀 PHOENIX' : '🔄 Legacy'}`);

  // Disable admin override
  await serviceClient
    .from('feature_flags')
    .update({ admin_override_enabled: null })
    .eq('flag_name', 'phoenix_pipeline_enabled');

  console.log('✅ Admin override disabled');

  // Test user-specific override
  console.log('\n👤 Testing User-Specific Override...');
  
  const overrideUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Add user override to force Phoenix
  const { error: overrideError } = await serviceClient
    .from('user_feature_overrides')
    .upsert({
      user_id: overrideUserId,
      flag_name: 'phoenix_pipeline_enabled',
      is_enabled: true,
      reason: 'Test override'
    });

  if (overrideError) {
    console.error('❌ Error setting user override:', overrideError);
  } else {
    console.log('✅ User override set');
    
    const usePhoenixWithUserOverride = await isFeatureEnabled(overrideUserId, 'phoenix_pipeline_enabled');
    console.log(`👤 User ${overrideUserId.slice(0, 8)}... with user override → ${usePhoenixWithUserOverride ? '🚀 PHOENIX' : '🔄 Legacy'}`);
    
    // Clean up user override
    await serviceClient
      .from('user_feature_overrides')
      .delete()
      .eq('user_id', overrideUserId)
      .eq('flag_name', 'phoenix_pipeline_enabled');
    
    console.log('✅ User override cleaned up');
  }

  console.log('\n🎉 Dual Pipeline Routing Test Complete!');
}

// Run the test
testDualPipelineRouting().catch(console.error); 