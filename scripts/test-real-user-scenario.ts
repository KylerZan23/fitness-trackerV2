#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testRealUserScenario() {
  console.log('🧪 Testing Real User Scenario...\n');

  // Test user ID (simulating a real user)
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';

  console.log('📊 Current Feature Flag Status:');
  const { data: flags } = await serviceClient
    .from('feature_flags')
    .select('*')
    .eq('flag_name', 'phoenix_pipeline_enabled')
    .single();

  if (flags) {
    console.log(`   Flag: ${flags.flag_name}`);
    console.log(`   Enabled: ${flags.is_enabled}`);
    console.log(`   Rollout: ${flags.rollout_percentage}%`);
    console.log(`   Admin Override: ${flags.admin_override_enabled || 'None'}`);
  }

  console.log('\n🔍 Testing User Pipeline Assignment:');
  
  // Test the database function directly
  const { data: isPhoenixEnabled, error } = await serviceClient
    .rpc('is_feature_enabled_for_user', {
      p_user_id: testUserId,
      p_flag_name: 'phoenix_pipeline_enabled'
    });

  if (error) {
    console.error('❌ Error checking feature flag:', error);
    return;
  }

  console.log(`👤 User ${testUserId.slice(0, 8)}... → ${isPhoenixEnabled ? '🚀 PHOENIX Pipeline' : '🔄 Legacy Pipeline'}`);

  // Simulate program generation request
  console.log('\n🎯 Simulating Program Generation Request:');
  
  const mockOnboardingData = {
    primaryGoal: 'muscle_gain',
    experienceLevel: 'beginner',
    age: 25,
    weight: 70,
    height: 175,
    // Add other required fields as needed
  };

  console.log('📋 Mock Onboarding Data:');
  console.log(`   Goal: ${mockOnboardingData.primaryGoal}`);
  console.log(`   Experience: ${mockOnboardingData.experienceLevel}`);
  console.log(`   Age: ${mockOnboardingData.age}`);

  console.log('\n🔄 Pipeline Routing Decision:');
  if (isPhoenixEnabled) {
    console.log('   → Will use Phoenix Pipeline (new, enhanced)');
    console.log('   → Enhanced user profiling and data inference');
    console.log('   → Advanced volume calculations and weak point analysis');
    console.log('   → Scientific guidelines integration');
  } else {
    console.log('   → Will use Legacy Pipeline (proven, stable)');
    console.log('   → Standard program generation');
    console.log('   → Fallback to proven methods');
  }

  // Test multiple users to see distribution
  console.log('\n📊 Testing Multiple Users (Distribution Check):');
  const testUsers = [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440019'
  ];

  let phoenixCount = 0;
  let legacyCount = 0;

  for (const userId of testUsers) {
    const { data: isEnabled } = await serviceClient
      .rpc('is_feature_enabled_for_user', {
        p_user_id: userId,
        p_flag_name: 'phoenix_pipeline_enabled'
      });

    if (isEnabled) {
      phoenixCount++;
    } else {
      legacyCount++;
    }
  }

  console.log(`📈 Results (20 users):`);
  console.log(`   🚀 Phoenix Pipeline: ${phoenixCount} users (${(phoenixCount / testUsers.length * 100).toFixed(1)}%)`);
  console.log(`   🔄 Legacy Pipeline: ${legacyCount} users (${(legacyCount / testUsers.length * 100).toFixed(1)}%)`);
  console.log(`   📊 Expected Phoenix: ${flags?.rollout_percentage || 0}% (${(testUsers.length * (flags?.rollout_percentage || 0) / 100).toFixed(1)} users)`);

  console.log('\n✅ Real User Scenario Test Complete!');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Create a real account in the app');
  console.log('   2. Complete onboarding process');
  console.log('   3. Generate a training program');
  console.log('   4. Check which pipeline was used');
  console.log('   5. Compare program quality and performance');
}

// Run the test
testRealUserScenario().catch(console.error); 