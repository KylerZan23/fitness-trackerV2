#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testProgramGenerationFix() {
  console.log('🧪 Testing Program Generation Fix...\n');

  // Test user ID
  const testUserId = '59fd82c5-6869-40b5-b380-c4d131c75e3d'; // The user from the logs

  console.log('📊 Checking Feature Flag Status:');
  const { data: flagStatus } = await serviceClient
    .rpc('is_feature_enabled_for_user', {
      p_user_id: testUserId,
      p_flag_name: 'phoenix_pipeline_enabled'
    });

  console.log(`   User ${testUserId.slice(0, 8)}... → ${flagStatus ? '🚀 PHOENIX' : '🔄 Legacy'} Pipeline`);

  console.log('\n📋 Checking User Profile:');
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  console.log(`   Name: ${profile.name || 'Unknown'}`);
  console.log(`   Email: ${profile.email || 'Unknown'}`);
  console.log(`   Onboarding Completed: ${profile.onboarding_completed || false}`);

  console.log('\n📊 Checking Training Programs:');
  const { data: programs, error: programsError } = await serviceClient
    .from('training_programs')
    .select('id, program_name, generation_status, is_active, created_at')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false });

  if (programsError) {
    console.error('❌ Error fetching programs:', programsError);
    return;
  }

  if (programs && programs.length > 0) {
    console.log(`   Found ${programs.length} program(s):`);
    programs.forEach((program, index) => {
      console.log(`   ${index + 1}. ${program.program_name} (${program.generation_status}) - Active: ${program.is_active}`);
    });
  } else {
    console.log('   No programs found');
  }

  console.log('\n✅ Program Generation Fix Test Complete!');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Try creating a new account in the app');
  console.log('   2. Complete onboarding process');
  console.log('   3. Check if program generation works');
  console.log('   4. Verify which pipeline was used');
}

// Run the test
testProgramGenerationFix().catch(console.error); 