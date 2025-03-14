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
import { MuscleDistributionChart } from '@/components/workout/MuscleDistributionChart'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
  weight_unit?: 'kg' | 'lbs'
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
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')

  // Check authentication and fetch data
  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        setIsLoading(true)
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
          return
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
          // Set weight unit from profile if available
          if (profileData.weight_unit) {
            setWeightUnit(profileData.weight_unit)
          }
        } else {
          // Create a basic profile if none exists
          const newProfile = {
            id: currentSession.user.id,
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'Fitness User',
            email: currentSession.user.email || '',
            age: currentSession.user.user_metadata?.age || 0,
            fitness_goals: currentSession.user.user_metadata?.fitness_goals || 'Get fit',
            weight_unit: 'kg' as 'kg' | 'lbs'
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
          const userStats = await getWorkoutStats()
          const userTrends = await getWorkoutTrends('day')
          
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
        // Safe error handling with type checking
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? String(err.message) 
          : 'An error occurred while loading the dashboard'
        setError(errorMessage)
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
  
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      router.push('/login?bypass=true')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
          <h1 className="text-2xl font-serif font-bold mb-4">Dashboard Error</h1>
          <Error message={error} className="mb-6" />
          <p className="mb-6 text-gray-300">
            We encountered an error while loading your dashboard. This could be due to a network issue or session expiration.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1"
            >
              Retry
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
              disabled={isLoading}
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
            
            {profile && (
              <div className="flex items-center">
                <UserAvatar name={profile.name} email={profile.email} size={40} />
                <div className="ml-3 hidden md:block">
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
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
        {/* Profile summary */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-4xl font-serif">Your Fitness Dashboard</h1>
            
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors"
            >
              Edit Profile
            </button>
          </div>
          
          {profile && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="flex items-center">
                <UserAvatar name={profile.name} email={profile.email} size={60} />
                <div className="ml-4">
                  <h2 className="text-2xl font-serif">{profile.name}</h2>
                  <p className="text-gray-400">{profile.email}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Age</p>
                  <p className="font-medium text-xl">{profile.age || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fitness Goals</p>
                  <p className="font-medium text-xl">{profile.fitness_goals || 'No goals set'}</p>
                </div>
                <div className="md:col-span-2 mt-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                  >
                    Update Profile Information →
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Stats cards */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Your Workout Statistics</h2>
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
              value={`${stats.averageWeight} ${weightUnit}`} 
              iconName="weight" 
            />
            <StatsCard 
              title="Avg. Duration" 
              value={`${stats.averageDuration} min`} 
              iconName="clock" 
            />
          </div>
          
          {/* Log New Workout button */}
          <div className="mt-8 flex justify-center">
            <Link 
              href="/workout/new"
              className="px-8 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
            >
              Log New Workout
            </Link>
          </div>
        </section>
        
        {/* Workout trends chart */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Workout Trends</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            {trends.length > 0 ? (
              <WorkoutChart data={trends} period="day" />
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
        
        {/* Muscle Heatmap Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Analyze Your Training</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-serif mb-3">Muscle Group Distribution</h3>
                <p className="text-gray-300 mb-6 max-w-2xl">
                  See which muscle groups you've been training and identify imbalances in your workout routine
                </p>
              </div>
            </div>
            
            {/* Embed the MuscleDistributionChart directly in the dashboard */}
            <div className="mt-4">
              {profile && <MuscleDistributionChart userId={profile.id} />}
              {!profile && <div className="text-center py-8 text-gray-400">Sign in to view your muscle group distribution</div>}
            </div>
          </div>
        </section>
        
        {/* Health app integrations */}
        <section className="mb-12">
          <h2 className="text-3xl font-serif mb-6">Connect Health Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <h3 className="text-2xl font-serif mb-3">Apple HealthKit</h3>
              <p className="text-gray-300 mb-6">
                Sync your Apple Watch and iPhone health data with FitnessTracker
              </p>
              <button
                onClick={() => alert('Apple HealthKit integration coming soon!')}
                className="px-6 py-2 bg-black border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Connect
              </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <h3 className="text-2xl font-serif mb-3">Google Fit</h3>
              <p className="text-gray-300 mb-6">
                Import your Google Fit activity and workout data
              </p>
              <button
                onClick={() => alert('Google Fit integration coming soon!')}
                className="px-6 py-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors"
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