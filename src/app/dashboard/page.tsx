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
import {
  getWorkoutStats,
  getTodayWorkoutStats,
  getWorkoutTrends,
  type WorkoutStats,
  type WorkoutTrend,
  getWeeklyMuscleComparisonData,
  WeeklyMuscleComparisonItem,
} from '@/lib/db'
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
import { WeeklyComparison } from '@/components/dashboard/WeeklyComparison'
import { EmptyState } from '@/components/ui/EmptyState'
import { FloatingActionMenu } from '@/components/ui/FloatingActionMenu'
import { ToastProvider } from '@/components/ui/Toast'
import { StreakIndicator } from '@/components/ui/StreakIndicator'

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
  averageDuration: 45,
}

const mockTrends: WorkoutTrend[] = [
  { date: '2024-01-01', count: 2, totalWeight: 130, totalDuration: 90, totalSets: 12 },
  { date: '2024-01-02', count: 1, totalWeight: 65, totalDuration: 45, totalSets: 6 },
  { date: '2024-01-03', count: 3, totalWeight: 195, totalDuration: 135, totalSets: 18 },
  { date: '2024-01-04', count: 2, totalWeight: 130, totalDuration: 90, totalSets: 12 },
  { date: '2024-01-05', count: 2, totalWeight: 130, totalDuration: 90, totalSets: 12 },
]

// Empty stats for new users with no workout data
const emptyStats: WorkoutStats = {
  totalWorkouts: 0,
  totalSets: 0,
  totalReps: 0,
  averageWeight: 0,
  averageDuration: 0,
  totalWeight: 0,
  totalDuration: 0,
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
  const [userTimezone, setUserTimezone] = useState('UTC')
  const [isCoachPopupOpen, setIsCoachPopupOpen] = useState(false)
  const [isCoachTooltipVisible, setIsCoachTooltipVisible] = useState(false)

  const [weeklyComparisonData, setWeeklyComparisonData] = useState<
    WeeklyMuscleComparisonItem[] | null
  >(null)
  const [isComparisonLoading, setIsComparisonLoading] = useState(true)
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [comparisonWeekOffset, setComparisonWeekOffset] = useState(0)

  const toggleCoachPopup = () => setIsCoachPopupOpen(prev => !prev)

  useEffect(() => {
    // This effect runs only once on the client after hydration
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(tz || 'UTC') // Set the detected timezone or fallback
      console.log('User timezone detected:', tz)
    } catch (e) {
      console.error('Error detecting timezone:', e)
      setUserTimezone('UTC') // Fallback on error
    }
  }, []) // Empty dependency array ensures it runs only once client-side

  const fetchData = useCallback(
    async (isInitialLoad = false) => {
      if (isInitialLoad) {
        setIsLoading(true)
      }
      setError(null)
      setIsComparisonLoading(true)
      setComparisonError(null)

      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

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
          console.error('Detailed Profile fetch error:', JSON.stringify(profileError, null, 2))
          console.error('profileError keys:', Object.keys(profileError))
          console.error('profileError message:', profileError.message)
          console.error('profileError code:', profileError.code)
          console.error('profileError details:', profileError.details)
          console.error('profileError hint:', profileError.hint)
        }

        if (profileData) {
          setProfile(profileData)
          if (profileData.weight_unit) {
            setWeightUnit(profileData.weight_unit)
          }
        } else {
          const newProfile = {
            id: currentSession.user.id,
            name:
              currentSession.user.user_metadata?.name ||
              currentSession.user.email?.split('@')[0] ||
              'Fitness User',
            email: currentSession.user.email || '',
            age: currentSession.user.user_metadata?.age || 0,
            fitness_goals: currentSession.user.user_metadata?.fitness_goals || 'Get fit',
            weight_unit: 'kg' as 'kg' | 'lbs',
          }
          setProfile(newProfile)
          const { error: createError } = await supabase.from('profiles').upsert(newProfile)
          if (createError) console.error('Error creating profile:', createError)
        }

        // Fetch workout data, passing the detected userTimezone
        try {
          console.log(`Fetching workout data with timezone: ${userTimezone}`)
          const [userStats, todayUserStats, userTrends] = await Promise.all([
            getWorkoutStats(), // General stats don't need timezone (yet)
            getTodayWorkoutStats(userTimezone), // Pass timezone
            // Fetch last 8 weeks of trends
            getWorkoutTrends(8, userTimezone),
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

        // Fetch weekly comparison data
        if (currentSession) {
          try {
            const comparisonDataResult = await getWeeklyMuscleComparisonData(
              currentSession.user.id,
              userTimezone,
              supabase,
              comparisonWeekOffset
            )
            setWeeklyComparisonData(comparisonDataResult)
          } catch (compError: any) {
            console.error('Error fetching weekly comparison data:', compError)
            setComparisonError(compError.message || 'Failed to load weekly comparison.')
            setWeeklyComparisonData(null)
          } finally {
            setIsComparisonLoading(false)
          }
        }
      } catch (err) {
        console.error('Dashboard fetch data error:', err)
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An unexpected error occurred'
        setError(errorMessage)
        setSession(null)
        setProfile(null)
        setStats(emptyStats)
        setTodayStats(emptyStats)
        setTrends(emptyTrends)
        setWeeklyComparisonData(null)
        setIsComparisonLoading(false)
      } finally {
        if (isInitialLoad) {
          setIsLoading(false)
        }
      }
    },
    [router, userTimezone, comparisonWeekOffset]
  )

  // Handlers for week navigation
  const handlePreviousComparisonWeek = () => {
    setComparisonWeekOffset(prevOffset => prevOffset + 1)
  }

  const handleNextComparisonWeek = () => {
    setComparisonWeekOffset(prevOffset => Math.max(0, prevOffset - 1)) // Prevent going into the future (offset < 0)
  }

  // Effect for initial data load and auth state changes
  useEffect(() => {
    // Initial fetch - fetchData will now use the timezone state
    fetchData(true)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sessionData) => {
      console.log('Auth State Change:', event, sessionData ? 'Got Session' : 'No Session')
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        router.push('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (sessionData) {
          setSession(sessionData)
          // Refetch data using the latest timezone
          fetchData(false)
        } else {
          setSession(null)
          setProfile(null)
          router.push('/login')
        }
      } else if (sessionData) {
        setSession(sessionData)
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
        console.log('Page became visible, refetching data...')
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
          <p className="text-sm text-gray-500 mt-2">
            If you are not redirected, click{' '}
            <Link href="/login" className="underline text-blue-600 hover:text-blue-800">
              here
            </Link>
            .
          </p>
        </div>
      </DashboardLayout>
    )
  }

  // Render dashboard content within the layout
  return (
    <ToastProvider>
      <DashboardLayout sidebarProps={sidebarProps}>
        {session && profile && (
          <>
            {/* Enhanced Welcome Message with fitness-inspired gradient */}
            <div className="bg-gradient-hero text-white p-8 rounded-2xl shadow-card-elevated mb-8 relative overflow-hidden animate-fadeIn">
              {/* Background pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.name}!</h1>
                    <p className="text-white/90 text-lg">Ready to crush your fitness goals today?</p>
                  </div>
                  
                  {/* Workout Streak Indicator */}
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <StreakIndicator
                      currentStreak={7} // This would come from your data
                      longestStreak={14} // This would come from your data
                      streakType="workout"
                      showMilestones={false}
                      className="bg-white/10 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

          {/* Error Display */}
          {error && <Error message={error} className="mb-6" />}

          {/* Today's Stats Summary - Enhanced with animations and gradients */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's Snapshot</h2>
              <p className="text-gray-600">Track your daily progress and achievements</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                title="Exercises" 
                value={todayStats.totalWorkouts.toString()}
                gradientType="strength"
                iconName="dumbbell"
                animationDelay={0}
                description="Workouts completed"
              />
              <StatsCard 
                title="Sets" 
                value={todayStats.totalSets.toString()}
                gradientType="endurance"
                iconName="repeat"
                animationDelay={150}
                description="Total sets performed"
              />
              <StatsCard
                title="Duration"
                value={`${Math.round(todayStats.totalDuration || 0)} min`}
                gradientType="cardio"
                iconName="clock"
                animationDelay={300}
                description="Time spent training"
              />
              <StatsCard
                title="Total Weight"
                value={`${Math.round(todayStats.totalWeight || 0)} ${weightUnit}`}
                gradientType="energy"
                iconName="trending-up"
                animationDelay={450}
                description="Weight lifted today"
              />
            </div>
          </div>

          {/* Workout Trends Chart - Enhanced with better empty state */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Workout Trends</h2>
                <p className="text-gray-600">Your progress over the last 8 weeks</p>
              </div>
            </div>
            {trends.length > 0 ? (
              <WorkoutChart data={trends} weightUnit={weightUnit} />
            ) : (
              <EmptyState
                title="Start Your Fitness Journey!"
                description="Begin tracking your workouts to see amazing progress charts and insights. Every champion started with a single workout."
                iconName="trending-up"
                actionLabel="Log Your First Workout"
                actionHref="/workout/new"
                variant="motivational"
              />
            )}
          </div>

          {/* AI Coach Section - REMOVED STATIC PLACEMENT */}
          {/* 
          <div className="lg:col-span-2 mb-6">
            <AICoachCard />
          </div>
          */}

          {/* Section for Charts (Muscle Distribution & Goals) - Enhanced styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Muscle Distribution Chart Container */}
            <div
              className={`bg-white p-6 rounded-xl shadow-card border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-card-hover ${isMuscleChartCollapsed ? 'max-h-20 overflow-hidden' : 'max-h-none'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    Muscle Distribution
                  </h3>
                  <p className="text-gray-600 text-sm">Weekly training focus</p>
                </div>
                <button
                  onClick={() => setIsMuscleChartCollapsed(!isMuscleChartCollapsed)}
                  className="text-sm text-primary hover:text-primary/80 font-medium px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {isMuscleChartCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
              {!isMuscleChartCollapsed &&
                (trends.length > 0 ? (
                  <MuscleDistributionChart userId={session?.user?.id} weightUnit={weightUnit} />
                ) : (
                  <EmptyState
                    title="Track Muscle Groups"
                    description="Start logging workouts to see which muscle groups you're targeting and maintain balanced training."
                    iconName="activity"
                    actionLabel="Log Workout"
                    actionHref="/workout/new"
                    variant="default"
                    className="py-8"
                  />
                ))}
            </div>

            {/* Goals Card Container */}
            <GoalsCard />
          </div>

          {/* Weekly Comparison Section - Use the actual component now */}
          <div className="mb-6">
            <WeeklyComparison
              data={weeklyComparisonData}
              isLoading={isComparisonLoading}
              error={comparisonError}
              weekOffset={comparisonWeekOffset}
              userTimezone={userTimezone}
              onPreviousWeek={handlePreviousComparisonWeek}
              onNextWeek={handleNextComparisonWeek}
            />
          </div>

          {/* Recent Run Card */}
          <RecentRun userId={session!.user!.id} />

          {/* Floating AI Coach Toggle Button */}
          <button
            onClick={toggleCoachPopup}
            onMouseEnter={() => setIsCoachTooltipVisible(true)}
            onMouseLeave={() => setIsCoachTooltipVisible(false)}
            className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-110"
            aria-label="Toggle AI Personal Coach"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8V4H8" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M12 8v4" />
              <path d="M12 16v4" />
              <path d="M16 12h4M8 12H4M17 9l2-2M7 9l-2-2m12 8 2 2M7 17l-2 2m7-5a1 1 0 0 0-2 0v1a1 1 0 0 0 2 0Z" />
              <path d="M12 12a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1Z" />
            </svg>
          </button>
          {isCoachTooltipVisible && (
            <div
              className="fixed bottom-28 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-md shadow-lg text-xs font-medium animate-fadeIn"
              role="tooltip"
            >
              Your AI Personal Coach: Get personalized tips and guidance!
            </div>
          )}

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              {/* AICoachCard Content Area */}
              <div className="p-3 max-h-[70vh] overflow-y-auto">
                <AICoachCard />
              </div>
            </div>
          )}

          {/* Enhanced Log New Workout Button Section */}
          <div className="mt-12 mb-24 flex justify-center">
            <Link href="/workout/new" passHref>
              <Button
                size="lg"
                className="bg-gradient-primary text-white px-12 py-6 text-xl font-bold shadow-card-elevated hover:shadow-glow-blue transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 rounded-2xl"
              >
                🏋️ Log a New Workout
              </Button>
            </Link>
          </div>
        </>
      )}
      
      {/* Floating Action Menu */}
      <FloatingActionMenu position="bottom-left" />
    </DashboardLayout>
    </ToastProvider>
  )
}
