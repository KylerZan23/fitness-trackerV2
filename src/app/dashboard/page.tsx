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
  averageDuration: 0
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
  const [showWelcome, setShowWelcome] = useState(true)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [isMuscleChartCollapsed, setIsMuscleChartCollapsed] = useState(false)
  // Get user's timezone once on mount
  const [userTimezone, setUserTimezone] = useState('UTC'); // Default to UTC

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
        console.error('Profile fetch error:', profileError)
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
    <DashboardLayout sidebarProps={sidebarProps}>
      {/* Display persistent error as a banner - Adjust colors for light theme */}
      {error && session && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
          <Error message={`Warning: ${error}`} />
        </div>
      )}

      {/* Welcome Message - Apply gradient and adjust text/button colors */}
      {showWelcome && profile && (
        // Apply gradient, adjust padding/shadow, text colors
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg mb-6 shadow-md relative text-white">
          <button
            onClick={() => setShowWelcome(false)}
            // Adjust button color for gradient background
            className="absolute top-2 right-2 text-white/70 hover:text-white"
            aria-label="Dismiss welcome message"
          >
            &times;
          </button>
          {/* Ensure text is white */}
          <h1 className="text-2xl font-semibold text-white">
            Welcome back, {profile.name}!
          </h1>
          {/* Adjust paragraph text color (slightly less prominent) */}
          <p className="text-blue-100 mt-1">Let's check your progress.</p>
        </div>
      )}

      {/* Section for Today's Stats - Adjust title color */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Snapshot</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {/* StatsCards updated */}
        {/* Changed title from "Workouts" to "Exercises" */}
        <StatsCard title="Exercises" value={todayStats.totalWorkouts ?? 0} iconName="dumbbell" />
        <StatsCard title="Sets" value={todayStats.totalSets ?? 0} iconName="layers" />
        <StatsCard title="Reps" value={todayStats.totalReps ?? 0} iconName="repeat" />
        {/* Changed title from "Avg Duration" to "Duration" */}
        {/* Changed value from averageDuration to totalDuration */}
        <StatsCard title="Duration" value={`${todayStats.totalDuration ?? 0} min`} iconName="clock" />
        <StatsCard title="Avg Weight" value={`${todayStats.averageWeight ?? 0} ${weightUnit}`} iconName="weight" />
      </div>

      {/* Section for Charts - Adjust container and text colors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Workout Trends Chart Container - Span 2 columns */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Workout Trends</h2>
          {trends.length > 0 ? (
            <WorkoutChart data={trends} />
          ) : (
            <p className="text-gray-500">No workout data available for this period.</p>
          )}
        </div>

        {/* Muscle Distribution Chart Container (Takes first column implicitly) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Muscle Group Focus</h2>
            <button
              onClick={() => setIsMuscleChartCollapsed(!isMuscleChartCollapsed)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {isMuscleChartCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
          {!isMuscleChartCollapsed && (
            <MuscleDistributionChart userId={session?.user?.id} weightUnit={weightUnit} />
          )}
          {isMuscleChartCollapsed && (
            <p className="text-gray-500 text-sm">Chart collapsed.</p>
          )}
        </div>

        {/* Goals Card Container (Takes second column implicitly) */}
        <GoalsCard />

      </div>

      {/* Recent Activity Section - Adjust container and text colors */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        {session?.user?.id && <RecentRun userId={session.user.id} />}
        {!session?.user?.id && <p className="text-gray-500 text-sm">Loading activity...</p>}
      </div>

      {/* Call to Action / Quick Links - Button style might be okay, check contrast */}
      <div className="mt-8 text-center">
          <Link
            href="/workout/new"
            // Keep indigo button for primary action, check contrast on gray-100 bg
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Log New Workout
          </Link>
      </div>

    </DashboardLayout>
  )
} 