/**
 * Dashboard Page with Enhanced Authentication Debugging
 * ------------------------------------------------
 * This page implements a robust authentication flow with detailed debugging capabilities.
 * 
 * Key Features:
 * 1. Server-side cookie validation
 * 2. Session state management with retries
 * 3. Comprehensive error handling
 * 4. Detailed debugging logs
 * 
 * Testing Instructions:
 * 1. Development Testing:
 *    - Start server: yarn dev
 *    - Visit: http://localhost:3001/dashboard
 *    - Check server console for debug logs
 * 
 * 2. Authentication Flow Testing:
 *    - Use incognito mode for clean testing
 *    - Test login -> dashboard flow
 *    - Check browser console for client logs
 *    - Check server console for cookie logs
 * 
 * 3. Error Scenario Testing:
 *    - Clear cookies to test unauthenticated state
 *    - Disable network to test temporary errors
 *    - Check error handling and retry logic
 * 
 * 4. Cookie Verification:
 *    - Open Chrome DevTools > Application > Cookies
 *    - Verify presence of 'sb-access-token' and 'sb-refresh-token'
 *    - Check secure, httpOnly, and sameSite attributes
 * 
 * Debug Log Locations:
 * - Server: Terminal running 'yarn dev'
 * - Client: Browser Console
 * - Network: Chrome DevTools > Network > XHR
 */

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { getWorkoutStats, getWorkoutTrends, type WorkoutStats, type WorkoutTrend } from '@/lib/db'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { WorkoutChart } from '@/components/dashboard/WorkoutChart'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { 
  debugLogSession, 
  debugLogError, 
  debugLogCookie, 
  validateSession,
  debugAuthAPI,
  refreshSessionIfNeeded
} from '@/lib/auth-debug'
import { Session } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
}

// Mock data for testing - only used when no user is logged in
const mockProfile: UserProfile = {
  id: '1',
  name: 'Test User',
  age: 25,
  fitness_goals: 'Build muscle and improve strength',
  email: 'test@example.com'
}

const mockStats: WorkoutStats = {
  totalWorkouts: 15,
  totalSets: 45,
  totalReps: 540,
  averageWeight: 65,
  averageDuration: 45
}

const mockTrends: WorkoutTrend[] = [
  { date: '2024-01-01', count: 2, totalWeight: 130, totalDuration: 90 },
  { date: '2024-01-02', count: 1, totalWeight: 65, totalDuration: 45 },
  { date: '2024-01-03', count: 3, totalWeight: 195, totalDuration: 135 },
  { date: '2024-01-04', count: 2, totalWeight: 130, totalDuration: 90 },
  { date: '2024-01-05', count: 2, totalWeight: 130, totalDuration: 90 },
]

// Empty stats for new users with no workout data
const emptyStats: WorkoutStats = {
  totalWorkouts: 0,
  totalSets: 0,
  totalReps: 0,
  averageWeight: 0,
  averageDuration: 0
}

const emptyTrends: WorkoutTrend[] = []

// Define error types
interface AuthError {
  message: string;
  code?: string;
  isTemporary: boolean;
}

// Define session and error types
interface SessionUser {
  id: string;
  email?: string;
  aud?: string;
  role?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
}

interface AuthState {
  session: Session | null;
  error: AuthError | null;
  isLoading: boolean;
  retryCount: number;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An error occurred while loading dashboard data'
}

// Debug utility for development environment
async function debugRequestCookies() {
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    const headersList = await headers()
    
    console.log('\n=== Server-Side Cookie Debug ===')
    console.log('Timestamp:', new Date().toISOString())
    
    // Log all cookies
    const allCookies = await cookieStore.getAll()
    console.log('\nAll Cookies:')
    allCookies.forEach(cookie => {
      console.log(`${cookie.name}:`, {
        value: cookie.name.includes('token') ? '**redacted**' : cookie.value,
      })
    })

    // Specifically check auth cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    )
    
    console.log('\nAuth-Related Cookies:', authCookies.map(c => c.name))
    
    // Log raw cookie header for comparison
    const rawCookie = await headersList.get('cookie')
    console.log('\nRaw Cookie Header:', rawCookie)
    
    console.log('\nHow to verify these cookies:')
    console.log('1. Compare with browser cookies in Application tab')
    console.log('2. Check auth cookie presence and attributes')
    console.log('3. Verify expiration times are correct')
    console.log('4. Ensure secure and sameSite attributes are set')
    console.log('5. Use Application > Cookies to see full cookie details\n')
  }
}

// Enhanced error handling utility
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: string }).message === 'string'
  )
}

// Move checkSession outside the component to avoid strict mode issues
async function checkSession(supabase: any, authState: AuthState): Promise<AuthState> {
  try {
    console.log('=== Starting Session Check ===', {
      attempt: authState.retryCount + 1,
      timestamp: new Date().toISOString()
    })

    // Enhanced API debugging
    await debugAuthAPI(supabase, `Session Check (Attempt ${authState.retryCount + 1})`)

    // First, check if auth cookies exist
    const cookieStore = await cookies()
    const accessToken = await cookieStore.get('sb-access-token')
    const refreshToken = await cookieStore.get('sb-refresh-token')

    console.log('=== Auth Cookie Status ===', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isRetry: authState.retryCount > 0
    })

    // If no auth cookies exist, we're definitely not authenticated
    if (!accessToken && !refreshToken) {
      console.log('No auth cookies found - user is not authenticated')
      return {
        session: null,
        error: {
          message: 'No authentication tokens found',
          isTemporary: false
        },
        isLoading: false,
        retryCount: authState.retryCount
      }
    }

    // Attempt to get session
    const { data, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      debugLogError(sessionError, 'Session Check Error')
      
      // If we have cookies but session check fails, it might be temporary
      const isTemporary = accessToken && (
        sessionError.message?.includes('network') ||
        sessionError.message?.includes('timeout') ||
        sessionError.message?.includes('503')
      )

      return {
        session: null,
        error: {
          message: sessionError.message,
          code: sessionError.code,
          isTemporary
        },
        isLoading: false,
        retryCount: authState.retryCount
      }
    }

    if (data?.session) {
      // Log session details
      debugLogSession(data.session, 'Session Check')
      
      // Validate session and check for issues
      const { validation, issues } = validateSession(data.session)
      
      console.log('=== Session Validation ===', {
        ...validation,
        hasIssues: Object.values(issues).some(Boolean),
        issues
      })

      // If session exists but has critical issues
      if (issues.expired || issues.invalidAudience) {
        console.log('Session exists but has critical issues:', issues)
        
        // Attempt session refresh
        const refreshResult = await refreshSessionIfNeeded(supabase)
        if (refreshResult.success && refreshResult.newSession) {
          console.log('Session refreshed successfully')
          return {
            session: refreshResult.newSession,
            error: null,
            isLoading: false,
            retryCount: authState.retryCount
          }
        }

        console.log('Session refresh failed or not possible')
        return {
          session: null,
          error: {
            message: 'Session is invalid or expired',
            isTemporary: false
          },
          isLoading: false,
          retryCount: authState.retryCount
        }
      }

      return {
        session: data.session,
        error: null,
        isLoading: false,
        retryCount: authState.retryCount
      }
    }

    // If we have cookies but no session, try one more time
    // This helps with race conditions during token refresh
    if (accessToken && authState.retryCount === 0) {
      console.log('Has auth cookies but no session, will retry once')
      return {
        session: null,
        error: null,
        isLoading: true,
        retryCount: authState.retryCount + 1
      }
    }

    return {
      session: null,
      error: {
        message: 'No valid session found',
        isTemporary: false
      },
      isLoading: false,
      retryCount: authState.retryCount
    }
  } catch (error: unknown) {
    debugLogError(error, 'Session Check Exception')
    
    const isTemporaryError = isErrorWithMessage(error) && (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('503')
    )

    return {
      session: null,
      error: {
        message: isErrorWithMessage(error) ? error.message : 'Authentication check failed',
        isTemporary: isTemporaryError
      },
      isLoading: false,
      retryCount: authState.retryCount
    }
  }
}

export default async function DashboardPage() {
  try {
    // Run cookie debug at the start
    await debugRequestCookies()

    // Initialize server-side Supabase client with cookie handling
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name)
              // Log cookie details for debugging
              debugLogCookie(cookie, name)
              return cookie?.value
            } catch (error) {
              debugLogError(error, `Cookie Access - ${name}`)
              return undefined
            }
          },
          set() { /* Server component - no cookie setting needed */ },
          remove() { /* Server component - no cookie removal needed */ }
        },
      }
    )

    // Initialize authentication state
    let authState: AuthState = {
      session: null,
      error: null,
      isLoading: true,
      retryCount: 0
    }

    // Initial session check
    authState = await checkSession(supabase, authState)

    // Handle loading state with retry
    if (authState.isLoading) {
      // Add a small delay to allow for any race conditions
      await new Promise(resolve => setTimeout(resolve, 1000))
      authState = await checkSession(supabase, authState)
    }

    // Handle temporary errors with retries
    while (!authState.session && authState.error?.isTemporary && authState.retryCount < 3) {
      console.log(`Retrying session check (${authState.retryCount + 1}/3)...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      authState = await checkSession(supabase, authState)
    }

    // Final authentication check
    if (!authState.session) {
      if (authState.error?.isTemporary) {
        // Show retry UI for temporary issues
        return (
          <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="max-w-md w-full p-6">
              <Error message="Unable to verify your session. Please try again." />
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )
      }

      // Log authentication failure details
      console.log('=== Authentication Failed ===', {
        reason: 'No valid session after all checks',
        retryAttempts: authState.retryCount,
        error: authState.error,
        hasAccessToken: !!(await cookieStore.get('sb-access-token')),
        hasRefreshToken: !!(await cookieStore.get('sb-refresh-token'))
      })
      
      const returnTo = encodeURIComponent('/dashboard')
      redirect(`/login?return_to=${returnTo}`)
    }

    // Continue with the rest of the dashboard logic...

    // Keep the rest of the implementation as is, but use authState.session
    const session = authState.session

    // Initialize state variables with proper types
    let profile: UserProfile | null = null
    let stats: WorkoutStats = emptyStats // Initialize with empty stats to avoid null
    let trends: WorkoutTrend[] = emptyTrends
    let hasWorkoutData = false
    let error: string | null = null

    try {
      // Create fallback profile from user auth data
      const fallbackProfile: UserProfile = {
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        age: 0,
        fitness_goals: 'Set your fitness goals'
      }

      // Try to load the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.log('Could not load profile:', profileError.message)
        profile = fallbackProfile

        // Create profile if it doesn't exist
        if (profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              name: fallbackProfile.name,
              email: fallbackProfile.email,
              age: fallbackProfile.age,
              fitness_goals: fallbackProfile.fitness_goals,
            })

          if (insertError) {
            console.log('Could not create profile:', insertError.message)
          }
        }
      } else {
        profile = profileData
      }

      // Check for workout data
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (workoutsError) {
        console.log('Error checking workouts:', workoutsError.message)
      } else {
        hasWorkoutData = workouts && workouts.length > 0

        if (hasWorkoutData) {
          try {
            const userStats = await getWorkoutStats()
            if (userStats) {
              stats = userStats // Only assign if not null
            }
            trends = await getWorkoutTrends('week') // Default to week view
          } catch (statsError) {
            console.error('Error loading stats:', statsError)
          }
        }
      }
    } catch (err) {
      console.error('Error in dashboard:', err)
      error = getErrorMessage(err)
    }

    return (
      <div className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/profile"
                className="text-sm hover:text-white/80 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={() => alert('Sign out functionality coming soon!')}
                className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors"
              >
                Sign Out
              </button>
              <UserAvatar name={profile?.name || 'User'} email={profile?.email || ''} />
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Message for New Users */}
          {/* {showWelcome && (
            <div className="mb-8 bg-white/10 border border-green-500/30 rounded-lg p-4 animate-fadeIn">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-400">Account created successfully</h3>
                  <div className="mt-2 text-sm text-gray-300">
                    <p>Welcome to your personal fitness dashboard! This is where you'll track your workouts and monitor your progress.</p>
                    <button 
                      className="mt-2 text-green-400 hover:text-green-300 font-medium"
                      onClick={() => setShowWelcome(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )} */}
          
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-serif mb-4">
              Welcome back, {profile?.name || 'User'}
            </h1>
            <p className="text-xl text-gray-400">
              Your fitness goal: {profile?.fitness_goals || 'Set your fitness goals'}
            </p>
          </div>

          {/* No Data State */}
          {!hasWorkoutData && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-12 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="mt-4 text-2xl font-serif">No workout data yet</h2>
              <p className="mt-2 text-gray-400 max-w-md mx-auto">
                Start logging your workouts to see your stats and progress here. Track your workouts, sets, reps, and more!
              </p>
              <button
                onClick={() => window.location.href = '/profile'}
                className="mt-6 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Log Your First Workout
              </button>
            </div>
          )}

          {/* Data Visualization (only shown if user has workout data) */}
          {hasWorkoutData && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <select
                    value="week"
                    onChange={(e) => {
                      // setPeriod(e.target.value as 'week' | 'month')
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
                >
                  Log Workout
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
                <StatsCard
                  title="Total Workouts"
                  value={stats.totalWorkouts}
                  description="all time"
                />
                <StatsCard
                  title="Total Sets"
                  value={stats.totalSets}
                  description="completed"
                />
                <StatsCard
                  title="Average Weight"
                  value={`${stats.averageWeight} kg`}
                  description="per workout"
                />
                <StatsCard
                  title="Average Duration"
                  value={`${stats.averageDuration} min`}
                  description="per workout"
                />
              </div>

              {/* Workout Trends Chart */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-12">
                <h2 className="text-2xl font-serif mb-6">Your Workout Progress</h2>
                <WorkoutChart data={trends} period="week" />
              </div>
            </>
          )}

          {/* Health App Integration */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-serif mb-4">
                Apple HealthKit Integration
              </h3>
              <p className="text-gray-400 mb-6">
                Connect your Apple Health data to sync workouts automatically.
              </p>
              <button
                className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
                onClick={() => alert('Apple HealthKit integration coming soon!')}
              >
                Connect HealthKit
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-serif mb-4">
                Google Fit Integration
              </h3>
              <p className="text-gray-400 mb-6">
                Connect your Google Fit account to sync workouts automatically.
              </p>
              <button
                className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
                onClick={() => alert('Google Fit integration coming soon!')}
              >
                Connect Google Fit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in dashboard:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full p-6">
          <Error message={getErrorMessage(error)} />
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
} 