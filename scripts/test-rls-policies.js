/**
 * RLS Policy Testing Script
 * 
 * Run this script to verify all Row Level Security policies are working correctly.
 * It tests key scenarios for each table with RLS policies.
 * 
 * Usage: node scripts/test-rls-policies.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create interactive interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompts the user for credentials
 */
async function promptForCredentials() {
  return new Promise((resolve) => {
    rl.question('Enter test email: ', (email) => {
      rl.question('Enter test password: ', (password) => {
        resolve({ email, password });
      });
    });
  });
}

/**
 * Test profile related RLS policies
 */
async function testProfileRlsPolicies(userClient, adminClient, userId) {
  console.log('\n---- Testing Profile RLS Policies ----');
  
  // Test 1: User should be able to insert their own profile
  console.log('\nTest 1: User inserting own profile');
  try {
    const profileData = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      age: 30,
      fitness_goals: 'Testing RLS policies'
    };
    
    const { data: insertData, error: insertError } = await userClient
      .from('profiles')
      .insert(profileData);
      
    if (insertError) {
      console.error('❌ Insert own profile failed:', insertError.message);
    } else {
      console.log('✅ Insert own profile succeeded');
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
  
  // Test 2: User should be able to select their own profile
  console.log('\nTest 2: User selecting own profile');
  try {
    const { data: ownProfile, error: selectError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (selectError) {
      console.error('❌ Select own profile failed:', selectError.message);
    } else if (ownProfile) {
      console.log('✅ Select own profile succeeded:', ownProfile.name);
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
  
  // Test 3: User should NOT be able to select another user's profile
  console.log('\nTest 3: User selecting another profile');
  try {
    // First create another profile with admin client
    const anotherUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    await adminClient
      .from('profiles')
      .upsert({
        id: anotherUserId,
        name: 'Another User',
        email: 'another@example.com',
        age: 25,
        fitness_goals: 'Should not be visible'
      });
    
    // Now try to select it with user client
    const { data: otherProfile, error: selectError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', anotherUserId)
      .single();
      
    if (selectError || !otherProfile) {
      console.log('✅ Select other profile properly denied');
    } else {
      console.error('❌ RLS failure: User could select another profile:', otherProfile.name);
    }
  } catch (error) {
    if (error.message.includes('Permission denied')) {
      console.log('✅ Select other profile properly denied (exception)');
    } else {
      console.error('❌ Test failed with unexpected exception:', error.message);
    }
  }
  
  // Test 4: User should be able to update their own profile
  console.log('\nTest 4: User updating own profile');
  try {
    const { data: updateData, error: updateError } = await userClient
      .from('profiles')
      .update({ fitness_goals: 'Updated goals' })
      .eq('id', userId);
      
    if (updateError) {
      console.error('❌ Update own profile failed:', updateError.message);
    } else {
      console.log('✅ Update own profile succeeded');
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
}

/**
 * Main testing function
 */
async function runTests() {
  try {
    console.log('==== SUPABASE RLS POLICY TESTER ====');
    console.log('This script will test if your RLS policies are working correctly.');
    
    // Get test credentials
    const { email, password } = await promptForCredentials();
    
    // Create admin client with service role
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create regular client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Sign in
    console.log('\nAttempting to sign in...');
    const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Failed to sign in:', signInError.message);
      process.exit(1);
    }
    
    console.log(`Signed in successfully as ${user.email} (${user.id})`);
    
    // Run RLS tests
    await testProfileRlsPolicies(supabase, adminClient, user.id);
    
    console.log('\n==== RLS TESTING COMPLETE ====');
    rl.close();
  } catch (error) {
    console.error('Test failed with an unexpected error:', error);
    rl.close();
  }
}

// Run the tests
runTests(); 