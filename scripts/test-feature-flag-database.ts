#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testFeatureFlagDatabase() {
  console.log('🧪 Testing Feature Flag Database Logic...\n');

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
      // Call the database function directly
      const { data: isEnabled, error } = await serviceClient
        .rpc('is_feature_enabled_for_user', {
          p_user_id: userId,
          p_flag_name: 'phoenix_pipeline_enabled'
        });

      if (error) {
        console.error(`❌ Error for user ${userId}:`, error);
        legacyCount++;
        console.log(`👤 User ${userId.slice(0, 8)}... → 🔄 Legacy Pipeline (error)`);
      } else {
        if (isEnabled) {
          phoenixCount++;
          console.log(`👤 User ${userId.slice(0, 8)}... → 🚀 PHOENIX Pipeline`);
        } else {
          legacyCount++;
          console.log(`👤 User ${userId.slice(0, 8)}... → 🔄 Legacy Pipeline`);
        }
      }
    } catch (error) {
      console.error(`❌ Error testing user ${userId}:`, error);
      legacyCount++;
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
  const { data: isEnabledWithOverride, error: overrideError } = await serviceClient
    .rpc('is_feature_enabled_for_user', {
      p_user_id: testUserId,
      p_flag_name: 'phoenix_pipeline_enabled'
    });

  if (overrideError) {
    console.error('❌ Error with admin override:', overrideError);
  } else {
    console.log(`👤 User ${testUserId.slice(0, 8)}... with admin override → ${isEnabledWithOverride ? '🚀 PHOENIX' : '🔄 Legacy'}`);
  }

  // Disable admin override
  await serviceClient
    .from('feature_flags')
    .update({ admin_override_enabled: null })
    .eq('flag_name', 'phoenix_pipeline_enabled');

  console.log('✅ Admin override disabled');

  console.log('\n🎉 Feature Flag Database Test Complete!');
}

// Run the test
testFeatureFlagDatabase().catch(console.error); 