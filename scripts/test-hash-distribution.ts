#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testHashDistribution() {
  console.log('🧪 Testing Hash Distribution...\n');

  // Test with more diverse user IDs
  const testUsers = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-2222-3333-4444-555555555555',
    '22222222-3333-4444-5555-666666666666',
    '33333333-4444-5555-6666-777777777777',
    '44444444-5555-6666-7777-888888888888',
    '55555555-6666-7777-8888-999999999999'
  ];

  console.log('📊 Testing Hash Values:');
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
      console.log(`👤 ${userId.slice(0, 8)}... → 🚀 PHOENIX`);
    } else {
      legacyCount++;
      console.log(`👤 ${userId.slice(0, 8)}... → 🔄 Legacy`);
    }
  }

  console.log('\n📈 Results:');
  console.log(`   🚀 Phoenix Pipeline: ${phoenixCount} users (${(phoenixCount / testUsers.length * 100).toFixed(1)}%)`);
  console.log(`   🔄 Legacy Pipeline: ${legacyCount} users (${(legacyCount / testUsers.length * 100).toFixed(1)}%)`);
  console.log(`   📊 Expected Phoenix: 5% (${(testUsers.length * 0.05).toFixed(1)} users)`);

  // Test with random UUIDs
  console.log('\n🎲 Testing with Random UUIDs:');
  const randomUsers = [
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'h8i9j0k1-l2m3-4567-hijk-890123456789',
    'i9j0k1l2-m3n4-5678-ijkl-901234567890',
    'j0k1l2m3-n4o5-6789-jklm-012345678901'
  ];

  let randomPhoenixCount = 0;
  let randomLegacyCount = 0;

  for (const userId of randomUsers) {
    const { data: isEnabled } = await serviceClient
      .rpc('is_feature_enabled_for_user', {
        p_user_id: userId,
        p_flag_name: 'phoenix_pipeline_enabled'
      });

    if (isEnabled) {
      randomPhoenixCount++;
    } else {
      randomLegacyCount++;
    }
  }

  console.log(`📈 Random UUID Results:`);
  console.log(`   🚀 Phoenix Pipeline: ${randomPhoenixCount} users (${(randomPhoenixCount / randomUsers.length * 100).toFixed(1)}%)`);
  console.log(`   🔄 Legacy Pipeline: ${randomLegacyCount} users (${(randomLegacyCount / randomUsers.length * 100).toFixed(1)}%)`);

  console.log('\n✅ Hash Distribution Test Complete!');
}

// Run the test
testHashDistribution().catch(console.error); 