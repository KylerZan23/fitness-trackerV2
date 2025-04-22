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
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Session } from '@supabase/supabase-js'
import { MuscleDistributionChart } from '@/components/workout/MuscleDistributionChart'
import { RecentRun } from '@/components/dashboard/RecentRun'

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
          getWorkoutTrends('week', userTimezone) // Pass timezone
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

  // Loading state (only for initial load)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  // Error state (shows general dashboard errors)
  if (error && !session) { // Only show full error screen if session is also lost
     return (
       <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
         <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
           <h1 className="text-2xl font-serif font-bold mb-4">Dashboard Error</h1>
           <Error message={error} className="mb-6" />
           <p className="mb-6 text-gray-300">
             We encountered an error while loading your dashboard. Try refreshing the page or logging in again.
           </p>
           <div className="flex space-x-4">
             <button
               onClick={() => window.location.reload()}
               className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1"
             >
               Refresh Page
             </button>
             <Link
               href="/login"
               className="border border-white text-white px-4 py-2 rounded-full font-medium hover:bg-white/20 transition-colors flex-1 text-center"
             >
               Back to Login
             </Link>
           </div>
         </div>
       </div>
     )
   }

  // Main dashboard content
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
          
          <div className="flex items-center gap-4">
            {/* Add a logout button here */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
            
            {profile && (
              <div className="flex items-center">
                <UserAvatar 
                  name={profile.name} 
                  email={profile.email} 
                  profilePictureUrl={profile.profile_picture_url}
                  size={8}
                />
                <div className="ml-3 hidden md:block">
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Optional: Display non-blocking error messages */}
       {error && session && (
         <div className="container mx-auto px-4 pt-4">
             <Error message={`Warning: ${error}. Data might be incomplete.`} />
         </div>
       )}
      
      {/* Welcome message for new users */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 mx-4 mt-6 relative">
          <button 
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-2xl font-serif font-bold mb-2">Welcome to your Fitness Dashboard!</h2>
          <p className="text-gray-300 text-lg">
            This is where you'll track your progress and see your fitness journey. Get started by recording your first workout.
          </p>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats cards */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Today's Workout Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatsCard 
              title="Total Exercises" 
              value={todayStats.totalWorkouts} 
              iconName="dumbbell" 
            />
            <StatsCard 
              title="Total Sets" 
              value={todayStats.totalSets} 
              iconName="layers" 
            />
            <StatsCard 
              title="Total Reps" 
              value={todayStats.totalReps} 
              iconName="repeat" 
            />
            <StatsCard 
              title="Total Weight" 
              value={`${todayStats.totalWeight ?? 0} ${weightUnit}`} 
              iconName="weight" 
            />
            <StatsCard 
              title="Total Duration" 
              value={`${todayStats.totalDuration ?? 0} min`} 
              iconName="clock" 
            />
          </div>
          
          {/* Log New Workout button */}
          <div className="mt-8 flex justify-center gap-4">
            <Link 
              href="/workout/new"
              className="px-8 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
            >
              Log New Workout
            </Link>
            <Link 
              href="/run-logger"
              className="px-8 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium"
            >
              Run Logger
            </Link>
          </div>
        </section>
        
        {/* Workout trends chart */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Workout Trends</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            {trends.length > 0 ? (
              <WorkoutChart data={trends} period="week" />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6 text-lg">No workout data available yet</p>
                <Link 
                  href="/workout/new" 
                  className="px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
                >
                  Log Your First Workout
                </Link>
              </div>
            )}
          </div>
        </section>
        
        {/* Recent Run Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Running Activity</h2>
          {profile && <RecentRun userId={profile.id} />}
          {!profile && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center py-12">
              <p className="text-gray-400 mb-6 text-lg">Sign in to view your recent runs</p>
            </div>
          )}
        </section>
        
        {/* Muscle Heatmap Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Analyze Your Training</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div 
              className="flex flex-col md:flex-row items-center justify-between mb-6 cursor-pointer"
              onClick={() => setIsMuscleChartCollapsed(!isMuscleChartCollapsed)}
            >
              <div>
                <h3 className="text-2xl font-serif mb-3">Muscle Group Distribution</h3>
                <p className="text-gray-300 mb-6 md:mb-0 max-w-2xl">
                  See which muscle groups you've been training and identify imbalances in your workout routine
                </p>
              </div>
              <button 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center"
                aria-label={isMuscleChartCollapsed ? "Expand muscle chart" : "Collapse muscle chart"}
              >
                {isMuscleChartCollapsed ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Expand
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Collapse
                  </>
                )}
              </button>
            </div>
            
            {/* Embed the MuscleDistributionChart directly in the dashboard */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${isMuscleChartCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100 mt-4'}`}
            >
              {profile && <MuscleDistributionChart userId={profile.id} weightUnit={weightUnit} />}
              {!profile && <div className="text-center py-8 text-gray-400">Sign in to view your muscle group distribution</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 