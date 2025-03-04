/**
 * Script to test Supabase token verification
 * 
 * Usage: 
 * 1. Copy a valid JWT token from browser console
 * 2. Run: node scripts/test-token.js YOUR_TOKEN_HERE
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Get token from command line argument
const token = process.argv[2];
if (!token) {
  console.error('Error: No token provided');
  console.log('Usage: node scripts/test-token.js YOUR_TOKEN_HERE');
  process.exit(1);
}

console.log(`Testing token verification...`);
console.log(`Token length: ${token.length}`);
console.log(`First 10 chars: ${token.substring(0, 10)}...`);

// Create Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test the token verification
async function verifyToken() {
  try {
    console.log('Setting session with provided token...');
    await supabaseAdmin.auth.setSession({ access_token: token, refresh_token: '' });
    console.log('Session set successfully');
    
    console.log('Getting user from token...');
    const { data, error } = await supabaseAdmin.auth.getUser();
    
    if (error) {
      console.error('❌ Token verification failed:');
      console.error(`Error message: ${error.message}`);
      console.error(`Error status: ${error.status}`);
      console.error('Full error:', error);
      return;
    }
    
    console.log('✅ Token verification successful!');
    console.log('User details:');
    console.log(`- ID: ${data.user.id}`);
    console.log(`- Email: ${data.user.email}`);
    console.log(`- Created at: ${new Date(data.user.created_at).toLocaleString()}`);
    console.log(`- Last sign in: ${new Date(data.user.last_sign_in_at).toLocaleString()}`);
    
    // Check if user has a profile
    console.log('\nChecking if user has a profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found or error checking profile:');
      console.log(profileError);
    } else {
      console.log('✅ Profile found:');
      console.log(profile);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error during verification:');
    console.error(err);
  }
}

verifyToken(); 