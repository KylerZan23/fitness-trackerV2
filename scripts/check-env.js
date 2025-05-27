/**
 * Temporary script to verify environment variables
 * Run with: node scripts/check-env.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

console.log('Checking environment variables...')

// Check SUPABASE_SERVICE_ROLE_KEY (showing only first/last few characters for security)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (serviceRoleKey) {
  const firstChars = serviceRoleKey.substring(0, 10)
  const lastChars = serviceRoleKey.substring(serviceRoleKey.length - 5)
  console.log(
    `SUPABASE_SERVICE_ROLE_KEY: ${firstChars}...${lastChars} (length: ${serviceRoleKey.length})`
  )
} else {
  console.log('SUPABASE_SERVICE_ROLE_KEY: NOT FOUND')
}

// Check NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
if (supabaseUrl) {
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
} else {
  console.log('NEXT_PUBLIC_SUPABASE_URL: NOT FOUND')
}

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
if (anonKey) {
  const firstChars = anonKey.substring(0, 10)
  const lastChars = anonKey.substring(anonKey.length - 5)
  console.log(
    `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${firstChars}...${lastChars} (length: ${anonKey.length})`
  )
} else {
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY: NOT FOUND')
}

// Check STRAVA variables
const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || ''
if (stravaClientId) {
  console.log(`NEXT_PUBLIC_STRAVA_CLIENT_ID: ${stravaClientId}`)
} else {
  console.log('NEXT_PUBLIC_STRAVA_CLIENT_ID: NOT FOUND')
}

const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET || ''
if (stravaClientSecret) {
  const firstChars = stravaClientSecret.substring(0, 10)
  const lastChars = stravaClientSecret.substring(stravaClientSecret.length - 5)
  console.log(`STRAVA_CLIENT_SECRET: ${firstChars}...${lastChars} (length: ${stravaClientSecret.length})`)
} else {
  console.log('STRAVA_CLIENT_SECRET: NOT FOUND')
}

const stravaRedirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI || ''
if (stravaRedirectUri) {
  console.log(`NEXT_PUBLIC_STRAVA_REDIRECT_URI: ${stravaRedirectUri}`)
} else {
  console.log('NEXT_PUBLIC_STRAVA_REDIRECT_URI: NOT FOUND')
}

console.log('\nEnvironment check complete.')
