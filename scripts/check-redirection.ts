import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

async function checkRedirectionIssue() {
  try {
    console.log('Creating Supabase client...')
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log('-'.repeat(50))
    console.log('Session Status:')
    console.log('-'.repeat(50))

    if (sessionError) {
      console.error('Error checking session:', sessionError.message)
      return
    }

    if (session) {
      console.log('User is currently logged in')
      console.log('User ID:', session.user.id)
      console.log('User Email:', session.user.email)
      console.log('Session Expiry:', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry set')

      console.log('\nPotential issue: If you are logged in, the middleware is configured to')
      console.log('redirect you from /login and /signup to /dashboard.')
      console.log('\nTroubleshooting suggestions:')
      console.log('1. Sign out completely before testing the landing page links')
      console.log('2. Use the ?bypass=true parameter to bypass the redirect:')
      console.log('   - http://localhost:3000/login?bypass=true')
      console.log('   - http://localhost:3000/signup?bypass=true')

      // Offer to sign out
      console.log('\nWould you like to sign out now? (Run this with custom code)')
    } else {
      console.log('No active session found - user is NOT logged in')
      console.log('\nIf you are NOT logged in but still experiencing redirects:')
      console.log('Check for issues in:')
      console.log('1. The landing page (page.tsx) - ensure Link components are used')
      console.log('2. Check for client-side redirects in useEffect hooks')
    }

    console.log('\nTo help identify the issue:')
    console.log('- Use browser dev tools and network tab to observe redirects')
    console.log('- Check console logs for auth/middleware messages')
    console.log('- Try opening the app in incognito/private browsing mode')
  } catch (error) {
    console.error('Error in redirect check:', error)
  }
}

checkRedirectionIssue()
