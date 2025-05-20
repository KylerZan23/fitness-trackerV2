'use client'

/**
 * Dashboard Page - Client Component
 * ------------------------------------------------
 * This is the client version of the dashboard page that uses
 * the Supabase client-side API for authentication and data fetching.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWorkoutStats, getTodayWorkoutStats, getWorkoutTrends, type WorkoutStats, type WorkoutTrend } from '@/lib/db'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { WorkoutChart } from '@/components/dashboard/WorkoutChart'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { MuscleDistributionChart } from '@/components/workout/MuscleDistributionChart'
import { RecentRun } from '@/components/dashboard/RecentRun'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GoalsCard } from '@/components/dashboard/GoalsCard'
import { AICoachCard } from '@/components/dashboard/AICoachCard'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
  weight_unit?: 'kg' | 'lbs'
  profile_picture_url?: string
}

// Mock data for testing - only used when no user is logged in
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
  averageDuration: 0,
  totalWeight: 0,
  totalDuration: 0
}

const emptyTrends: WorkoutTrend[] = []

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<WorkoutStats>(emptyStats)
  const [todayStats, setTodayStats] = useState<WorkoutStats>(emptyStats)
  const [trends, setTrends] = useState<WorkoutTrend[]>(emptyTrends)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [isMuscleChartCollapsed, setIsMuscleChartCollapsed] = useState(false)
  // Get user's timezone once on mount
  const [userTimezone, setUserTimezone] = useState('UTC'); // Default to UTC
  const [isCoachPopupOpen, setIsCoachPopupOpen] = useState(false); // New state for AI Coach popup

  // Toggle function for AI Coach popup
  const toggleCoachPopup = () => setIsCoachPopupOpen(prev => !prev);

  useEffect(() => {
      // This effect runs only once on the client after hydration
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz || 'UTC'); // Set the detected timezone or fallback
        console.log("User timezone detected:", tz);
      } catch (e) {
          console.error("Error detecting timezone:", e);
          setUserTimezone('UTC'); // Fallback on error
      }
  }, []); // Empty dependency array ensures it runs only once client-side

  // Memoized data fetching function - now uses userTimezone state
  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        setSession(null)
        return
      }

      if (!currentSession) {
        if (isInitialLoad) {
          router.push('/login')
        }
        setSession(null)
        return
      }

      setSession(currentSession)

      // Fetch profile (no change needed here)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Detailed Profile fetch error:', JSON.stringify(profileError, null, 2));
        console.error('profileError keys:', Object.keys(profileError));
        console.error('profileError message:', profileError.message);
        console.error('profileError code:', profileError.code);
        console.error('profileError details:', profileError.details);
        console.error('profileError hint:', profileError.hint);
      }

      if (profileData) {
        setProfile(profileData)
        if (profileData.weight_unit) {
          setWeightUnit(profileData.weight_unit)
        }
      } else {
        const newProfile = {
          id: currentSession.user.id,
          name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'Fitness User',
          email: currentSession.user.email || '',
          age: currentSession.user.user_metadata?.age || 0,
          fitness_goals: currentSession.user.user_metadata?.fitness_goals || 'Get fit',
          weight_unit: 'kg' as 'kg' | 'lbs'
        }
        setProfile(newProfile)
        const { error: createError } = await supabase.from('profiles').upsert(newProfile)
        if (createError) console.error('Error creating profile:', createError)
      }

      // Fetch workout data, passing the detected userTimezone
      try {
        console.log(`Fetching workout data with timezone: ${userTimezone}`);
        const [userStats, todayUserStats, userTrends] = await Promise.all([
          getWorkoutStats(), // General stats don't need timezone (yet)
          getTodayWorkoutStats(userTimezone), // Pass timezone
          // Fetch last 8 weeks of trends
          getWorkoutTrends(8, userTimezone) 
        ])

        setStats(userStats ?? emptyStats)
        setTodayStats(todayUserStats ?? emptyStats)
        setTrends(userTrends ?? emptyTrends)
      } catch (dataError) {
        console.error('Error fetching workout data:', dataError)
        setError('Failed to load workout data.')
        setStats(emptyStats)
        setTodayStats(emptyStats)
        setTrends(emptyTrends)
      }

    } catch (err) {
      console.error('Dashboard fetch data error:', err)
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'An unexpected error occurred'
      setError(errorMessage)
      setSession(null)
      setProfile(null)
      setStats(emptyStats)
      setTodayStats(emptyStats)
      setTrends(emptyTrends)
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
      }
    }
  // IMPORTANT: Add userTimezone to dependency array
  // This ensures fetchData is recreated if timezone changes (e.g., hydration)
  // and subsequent effects using fetchData get the updated version.
  }, [router, userTimezone])


  // Effect for initial data load and auth state changes
  useEffect(() => {
    // Initial fetch - fetchData will now use the timezone state
    fetchData(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionData) => {
      console.log('Auth State Change:', event, sessionData ? 'Got Session' : 'No Session');
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (sessionData) {
            setSession(sessionData);
            // Refetch data using the latest timezone
            fetchData(false);
        } else {
             setSession(null)
             setProfile(null)
             router.push('/login')
        }
      } else if (sessionData) {
         setSession(sessionData);
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  // FetchData dependency already includes userTimezone
  }, [router, fetchData])


  // Effect for refetching data on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, refetching data...");
        // Refetch data using the latest timezone
        fetchData(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  // FetchData dependency already includes userTimezone
  }, [fetchData])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  // Prepare props for the Sidebar, passed through DashboardLayout
  const sidebarProps = {
    userName: profile?.name,
    userEmail: profile?.email,
    profilePictureUrl: profile?.profile_picture_url,
    onLogout: handleLogout,
  }

  // Loading state - Update spinner color for light theme
  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))] ">
          {/* Change spinner border color */}
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state - Adjust text colors for light theme
  if (error && !session) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.24))] text-center">
          {/* Ensure Error component text is visible on light background */}
          <Error message={`Error: ${error}. Redirecting to login...`} className="text-red-600" />
          {/* Update text color */}
          <p className="text-sm text-gray-500 mt-2">If you are not redirected, click <Link href="/login" className="underline text-blue-600 hover:text-blue-800">here</Link>.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Render dashboard content within the layout
  return (
    <DashboardLayout
      sidebarProps={sidebarProps}
    >
      {session && profile && (
        <>
          {/* Welcome Message - Modified gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white p-6 rounded-lg shadow-lg mb-6">
            <h1 className="text-2xl font-bold">Welcome back, {profile.name}!</h1>
            {/* Removed sub-text, dismiss button, and quick links */}
          </div>

          {/* Error Display */}
          {error && <Error message={error} className="mb-6" />}

          {/* Today's Stats Summary - Modified Title and Card Titles */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Today's Snapshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Exercises" value={todayStats.totalWorkouts.toString()} />
              <StatsCard title="Sets" value={todayStats.totalSets.toString()} />
              <StatsCard title="Duration" value={`${Math.round(todayStats.totalDuration || 0)} min`} />
              <StatsCard title="Total Weight" value={`${Math.round(todayStats.totalWeight || 0)} ${weightUnit}`} />
            </div>
          </div>

          {/* Workout Trends Chart - MOVED HERE */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Workout Trends (Last 8 Weeks)</h2>
            {trends.length > 0 
              ? <WorkoutChart data={trends} />
              : <p className="text-sm text-gray-500">No workout data available for trends.</p>}
          </div>
          
          {/* AI Coach Section - REMOVED STATIC PLACEMENT */}
          {/* 
          <div className="lg:col-span-2 mb-6">
            <AICoachCard />
          </div>
          */}

          {/* Section for Charts (Muscle Distribution & Goals) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Muscle Distribution Chart Container */}
            <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ease-in-out ${isMuscleChartCollapsed ? 'max-h-16 overflow-hidden' : 'max-h-none'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-700">Muscle Focus (Last 30 Days)</h3>
                <button 
                  onClick={() => setIsMuscleChartCollapsed(!isMuscleChartCollapsed)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {isMuscleChartCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
              {!isMuscleChartCollapsed && (
                trends.length > 0 
                  ? <MuscleDistributionChart userId={session?.user?.id} weightUnit={weightUnit} />
                  : <p className="text-sm text-gray-500">No workout data yet to show muscle distribution.</p>
              )}
            </div>

            {/* Goals Card Container */}
            <GoalsCard /> 
          </div>
          
          {/* Recent Run Card */}
          <RecentRun userId={session!.user!.id} />
          
          {/* Floating AI Coach Toggle Button */}
          <button
            onClick={toggleCoachPopup}
            className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-110"
            aria-label="Toggle AI Personal Coach"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 8v4"/><path d="M12 16v4"/><path d="M16 12h4M8 12H4M17 9l2-2M7 9l-2-2m12 8 2 2M7 17l-2 2m7-5a1 1 0 0 0-2 0v1a1 1 0 0 0 2 0Z"/><path d="M12 12a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Z"/></svg>
          </button>

          {/* Popup Container for AI Coach Card */}
          {isCoachPopupOpen && (
            <div className="fixed bottom-24 right-8 z-40 bg-card p-1 rounded-lg shadow-xl border border-border w-full max-w-md animate-fadeInUp">
              {/* Card Header with Title and Close Button */}
              <div className="flex justify-between items-center p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">AI Personal Coach</h3>
                <button
                  onClick={() => setIsCoachPopupOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close AI Coach"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              {/* AICoachCard Content Area */}
              <div className="p-3 max-h-[70vh] overflow-y-auto">
                   <AICoachCard />
              </div>
            </div>
          )}

          {/* Add Log New Workout Button Section */}
          <div className="mt-8 mb-24 flex justify-center"> {/* Added mb-24 for spacing from bottom if content is short */}
            <Link href="/workout/new" passHref>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105"> {/* Changed to purple */}
                Log a New Workout
              </Button>
            </Link>
          </div>
        </>
      )}
    </DashboardLayout>
  )
} 