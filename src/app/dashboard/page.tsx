'use client'

/**
 * Dashboard Page - Client Component
 * ------------------------------------------------
 * This is the client version of the dashboard page that uses
 * the Supabase client-side API for authentication and data fetching.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWorkoutStats, getWorkoutTrends, type WorkoutStats, type WorkoutTrend } from '@/lib/db'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { WorkoutChart } from '@/components/dashboard/WorkoutChart'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
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
  const [trends, setTrends] = useState<WorkoutTrend[]>(emptyTrends)
  const [showWelcome, setShowWelcome] = useState(true)

  // Check authentication and fetch data
  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        setIsLoading(true)
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(sessionError.message)
        }
        
        if (!currentSession) {
          router.push('/login')
          return
        }
        
        setSession(currentSession)
        
        // Fetch user profile
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
        } else {
          // Create a basic profile if none exists
          const newProfile = {
            id: currentSession.user.id,
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'Fitness User',
            email: currentSession.user.email || '',
            age: currentSession.user.user_metadata?.age || 0,
            fitness_goals: currentSession.user.user_metadata?.fitness_goals || 'Get fit',
          }
          
          setProfile(newProfile)
          
          // Create profile in the database
          const { error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile)
            
          if (createError) {
            console.error('Error creating profile:', createError)
          }
        }
        
        // Fetch workout data
        try {
          const userStats = await getWorkoutStats(currentSession.user.id)
          const userTrends = await getWorkoutTrends(currentSession.user.id)
          
          setStats(userStats || emptyStats)
          setTrends(userTrends || emptyTrends)
        } catch (dataError) {
          console.error('Error fetching workout data:', dataError)
          // Use empty data rather than failing completely
          setStats(emptyStats)
          setTrends(emptyTrends)
        }
        
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while loading the dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSessionAndData()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionData) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (sessionData) {
        setSession(sessionData)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router])
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Loading your dashboard...</h2>
          <p className="text-gray-400 mt-2">Please wait while we fetch your fitness data</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
          <Error message={error} className="mb-6" />
          <p className="mb-6 text-gray-300">
            We encountered an error while loading your dashboard. This could be due to a network issue or session expiration.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors flex-1"
            >
              Retry
            </button>
            <Link
              href="/login"
              className="border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white/10 transition-colors flex-1 text-center"
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
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center">
                <UserAvatar name={profile.name} email={profile.email} size={40} />
                <div className="ml-3 hidden md:block">
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Welcome message for new users */}
      {showWelcome && (
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 m-4 relative">
          <button 
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-2">Welcome to your Fitness Dashboard!</h2>
          <p className="text-gray-300">
            This is where you'll track your progress and see your fitness journey. Get started by recording your first workout.
          </p>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Profile summary */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold">Your Fitness Dashboard</h1>
            
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
          
          {profile && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <UserAvatar name={profile.name} email={profile.email} size={60} />
                <div className="ml-4">
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-gray-400">{profile.email}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Age</p>
                  <p className="font-medium">{profile.age || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Fitness Goals</p>
                  <p className="font-medium">{profile.fitness_goals || 'No goals set'}</p>
                </div>
                <div className="md:col-span-2 mt-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Update Profile Information →
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Stats cards */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Your Workout Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatsCard 
              title="Total Workouts" 
              value={stats.totalWorkouts} 
              iconName="dumbbell" 
            />
            <StatsCard 
              title="Total Sets" 
              value={stats.totalSets} 
              iconName="layers" 
            />
            <StatsCard 
              title="Total Reps" 
              value={stats.totalReps} 
              iconName="repeat" 
            />
            <StatsCard 
              title="Avg. Weight" 
              value={`${stats.averageWeight} kg`} 
              iconName="weight" 
            />
            <StatsCard 
              title="Avg. Duration" 
              value={`${stats.averageDuration} min`} 
              iconName="clock" 
            />
          </div>
        </section>
        
        {/* Workout trends chart */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Workout Trends</h2>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {trends.length > 0 ? (
              <WorkoutChart data={trends} />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 mb-4">No workout data available yet</p>
                <Link 
                  href="/workout/new" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Log Your First Workout
                </Link>
              </div>
            )}
          </div>
        </section>
        
        {/* Health app integrations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Connect Health Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">Apple HealthKit</h3>
              <p className="text-gray-400 mb-4">
                Sync your Apple Watch and iPhone health data with FitnessTracker
              </p>
              <button
                onClick={() => alert('Apple HealthKit integration coming soon!')}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
              >
                Connect
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-3">Google Fit</h3>
              <p className="text-gray-400 mb-4">
                Import your Google Fit activity and workout data
              </p>
              <button
                onClick={() => alert('Google Fit integration coming soon!')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 