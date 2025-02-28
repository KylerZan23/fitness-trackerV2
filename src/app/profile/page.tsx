'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WorkoutLog } from '@/components/workout/WorkoutLog'
import { getWorkouts, type Workout } from '@/lib/db'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface UserProfile {
  name: string
  age: number
  fitness_goals: string
  email: string
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An error occurred while loading profile data'
}

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    async function checkSessionAndRedirect() {
      try {
        // Add a small delay to give the session cookie time to be properly read
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('No active session found in initial check, redirecting to login')
          window.location.href = '/login'
          return false
        }
        
        return true
      } catch (err) {
        console.error('Error checking session:', err)
        window.location.href = '/login'
        return false
      }
    }
    
    async function loadProfile() {
      try {
        setIsLoading(true)
        setError(null)

        // Check session first before proceeding
        const hasSession = await checkSessionAndRedirect()
        if (!hasSession) return;
        
        setSessionChecked(true)
        
        // Second session check to get the user data
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          console.log('Session lost during profile loading, redirecting to login')
          window.location.href = '/login'
          return
        }

        const user = session.user

        // Create fallback profile from user auth data
        const fallbackProfile: UserProfile = {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          age: 0,
          fitness_goals: 'Set your fitness goals'
        }

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            // Log error but don't show to user - just use fallback
            console.log('Could not load profile from database:', profileError.message || 'Unknown error')
            setProfile(fallbackProfile)
            
            // Try to create a profile only if it doesn't exist
            if (profileError.code === 'PGRST116') { // PostgreSQL "not found" error
              try {
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    name: fallbackProfile.name,
                    email: fallbackProfile.email,
                    age: fallbackProfile.age,
                    fitness_goals: fallbackProfile.fitness_goals,
                  })
                
                if (insertError) {
                  // Just log the error but continue with fallback profile
                  console.log('Could not create profile in database:', insertError.message || 'Unknown error')
                }
              } catch (err) {
                // Just log the error but continue with fallback profile
                console.log('Failed to create profile:', err)
              }
            } else {
              // For other errors, set the error state but still use fallback profile
              console.log('Other profile error:', profileError.message)
            }
          } else {
            // Use the profile from the database
            setProfile(profile)
          }
        } catch (err) {
          // If any error occurs while loading profile, just use fallback
          console.log('Unexpected error loading profile:', err)
          setProfile(fallbackProfile)
        }
      } catch (err) {
        console.error('Error loading user:', err)
        setError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  useEffect(() => {
    async function loadWorkouts() {
      try {
        // Skip if session hasn't been checked yet
        if (!sessionChecked) return;
        
        // First check if there's an active session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          console.log('No active session found when loading workouts')
          setWorkouts([])
          return
        }
        
        // Then load workouts
        const recentWorkouts = await getWorkouts(5)
        setWorkouts(recentWorkouts)
      } catch (error) {
        console.log('Error loading workouts:', error)
        // Still show empty workouts array rather than breaking
        setWorkouts([])
      }
    }

    loadWorkouts()
  }, [sessionChecked])

  const handleWorkoutSuccess = async () => {
    // Reload workouts after successful log
    try {
      const recentWorkouts = await getWorkouts(5)
      setWorkouts(recentWorkouts)
    } catch (error) {
      console.log('Error reloading workouts after logging:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full p-6">
          <Error message={error} />
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-red-500">
          Failed to load profile data
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">FitnessTracker</Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-sm hover:text-white/80 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors"
            >
              Sign Out
            </button>
            <UserAvatar name={profile.name} email={profile.email} />
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Profile Information */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-2xl font-serif mb-2">Your Profile</h3>
              <p className="text-gray-400 text-sm">
                Your personal information and fitness goals
              </p>
            </div>
            
            <div className="border-t border-white/10 px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-400">Full name</dt>
                  <dd className="mt-1 text-white">{profile.name}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-400">Email address</dt>
                  <dd className="mt-1 text-white">{profile.email}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-400">Age</dt>
                  <dd className="mt-1 text-white">{profile.age}</dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-400">Fitness goals</dt>
                  <dd className="mt-1 text-white">{profile.fitness_goals}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Workout Log Form */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <WorkoutLog onSuccess={handleWorkoutSuccess} />
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif">Recent Workouts</h3>
            <Link
              href="/dashboard"
              className="text-sm text-white/80 hover:text-white"
            >
              View All →
            </Link>
          </div>
          
          {workouts.length === 0 ? (
            <p className="text-gray-400">No workouts logged yet. Start by logging your first workout!</p>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <ul className="divide-y divide-white/10">
                {workouts.map((workout) => (
                  <li key={workout.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-white">
                          {workout.exerciseName}
                        </h4>
                        <p className="mt-1 text-sm text-gray-400">
                          {workout.sets} sets × {workout.reps} reps • {workout.weight} kg/lbs • {workout.duration} minutes
                        </p>
                        {workout.notes && (
                          <p className="mt-2 text-sm text-gray-400">{workout.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 text-sm text-gray-400">
                        {new Date(workout.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 