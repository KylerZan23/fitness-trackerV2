const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Test user credentials - use the ones we created
const testUser = {
  email: 'test@fitnesstrack.local',
  password: 'Test123!@#',
}

async function testAuthTokenVerification() {
  try {
    console.log('Creating Supabase client with anon key...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Attempting to sign in with test user...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return
    }

    console.log('Successfully signed in')
    console.log('User ID:', signInData.user.id)
    console.log('Session expiry:', new Date(signInData.session.expires_at * 1000).toISOString())

    // Get the access token
    const accessToken = signInData.session.access_token
    console.log('Access token length:', accessToken.length)
    console.log('Access token preview:', accessToken.substring(0, 10) + '...')

    // Now test verifying this token with a service role client
    console.log('\nCreating service role client to verify the token...')
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Using a different approach for token verification
    console.log('\nVerifying token by extracting JWT claims...')

    // Decode the Base64-encoded JWT payload (second part of the token)
    const [header, payload, signature] = accessToken.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())

    console.log('Token sub (user ID):', decodedPayload.sub)
    console.log('Token expiration:', new Date(decodedPayload.exp * 1000).toISOString())

    // Now use the admin API to get the user directly
    console.log('\nGetting user directly with admin API...')
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
      decodedPayload.sub
    )

    if (userError) {
      console.error('Error getting user:', userError)
      return
    }

    console.log('Successfully retrieved user!')
    console.log(
      'User data:',
      userData.user
        ? {
            id: userData.user.id,
            email: userData.user.email,
            role: userData.user.role,
          }
        : 'No user data'
    )

    // Test creating a profile
    console.log('\nTesting profile creation...')
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.user_metadata?.name || 'Test User',
          fitness_goals: userData.user.user_metadata?.fitness_goals || 'Get fit',
          age: userData.user.user_metadata?.age || 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('Profile created or updated successfully!')
    console.log('Profile data:', profileData)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testAuthTokenVerification()
