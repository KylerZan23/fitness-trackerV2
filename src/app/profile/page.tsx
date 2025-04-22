'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWorkouts, type Workout } from '@/lib/db'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload'
import { SqlMigrationRunner } from '@/components/admin/SqlMigrationRunner'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
  weight_unit?: 'kg' | 'lbs'
  profile_picture_url?: string
  role?: string
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
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMigrationNotice, setShowMigrationNotice] = useState(false)

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
          id: user.id,
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

  useEffect(() => {
    if (profile?.weight_unit) {
      setWeightUnit(profile.weight_unit);
    }
  }, [profile]);

  const toggleWeightUnit = async () => {
    if (!profile) return;
    
    const newWeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setIsUpdating(true);
    
    try {
      // Update the local state immediately for better UX
      setWeightUnit(newWeightUnit);
      
      // Try to update the database if the column exists
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ weight_unit: newWeightUnit })
        .eq('id', profile.id);
        
      if (updateError) {
        // Log the error but don't show it to the user
        console.error('Error updating weight unit in database:', updateError);
        console.error('Error code:', updateError.code);
        console.error('Error message:', updateError.message);
        
        // If the column doesn't exist, we'll just use the local state
        if (updateError.code === 'PGRST204' && updateError.message.includes('weight_unit')) {
          console.log('weight_unit column does not exist in the database yet. Using local state instead.');
          // Show migration notice to the user
          setShowMigrationNotice(true);
          // We'll still update the profile object in memory
          setProfile({
            ...profile,
            weight_unit: newWeightUnit
          });
        }
      } else {
        // Update was successful, update the profile object
        setProfile({
          ...profile,
          weight_unit: newWeightUnit
        });
        // Hide migration notice if it was shown before
        setShowMigrationNotice(false);
      }
    } catch (err) {
      console.error('Error toggling weight unit:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleProfilePictureUpdate = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        profile_picture_url: url
      });
    }
  };

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
      <div className="min-h-screen bg-black text-white p-6">
        <Error message={error} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <Error message="Could not load profile data" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">FitnessTracker</Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
            <UserAvatar 
              name={profile.name} 
              email={profile.email}
              profilePictureUrl={profile.profile_picture_url}
            />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif mb-8">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Profile Info */}
          <div className="md:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              
              {/* Profile Picture Upload Component */}
              <ProfilePictureUpload 
                userId={profile.id}
                existingUrl={profile.profile_picture_url ?? null}
                onUploadComplete={handleProfilePictureUpdate}
              />
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Name</p>
                      <p className="text-xl">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p>{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Age</p>
                      <p>{profile.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Fitness Goals</p>
                      <p className="whitespace-pre-wrap">{profile.fitness_goals || 'No goals set yet'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-serif mb-4">Preferences</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Weight Unit</p>
                      <div className="flex items-center">
                        <button
                          onClick={toggleWeightUnit}
                          disabled={isUpdating}
                          className={`flex items-center justify-center rounded-full h-6 w-12 p-1 transition-colors ${
                            weightUnit === 'kg' ? 'bg-white' : 'bg-gray-700'
                          }`}
                        >
                          <div className={`rounded-full h-4 w-4 transform transition-transform ${
                            weightUnit === 'kg' ? 'translate-x-0 bg-black' : 'translate-x-6 bg-white'
                          }`}></div>
                        </button>
                        <span className="ml-2">
                          {weightUnit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
                        </span>
                      </div>
                      
                      {showMigrationNotice && (
                        <div className="mt-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                          <p className="text-yellow-400 text-sm">
                            Your preference will be saved for this session, but your database needs to be migrated to permanently save this setting.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Admin Tools Section */}
                {profile.role === 'admin' && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <h2 className="text-2xl font-serif mb-4">Admin Tools</h2>
                    <SqlMigrationRunner 
                      adminOnly={true}
                      description="Run database migrations to fix issues like profile picture storage."
                      migrationName="Profile Database Fix"
                    />
                  </div>
                )}
                
                <div className="border-t border-white/10 pt-6">
                  <Link 
                    href="/profile/edit"
                    className="px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Recent Activity & Stats */}
          <div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-serif mb-4">Recent Activity</h2>
              
              {workouts.length > 0 ? (
                <div className="space-y-4">
                  {workouts.map((workout, index) => (
                    <div key={workout.id || index} className="border-b border-white/10 pb-4 last:border-0">
                      <p className="font-medium">{workout.exerciseName || 'Workout ' + (index + 1)}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(workout.created_at).toLocaleDateString()} • {workout.sets} sets × {workout.reps} reps
                      </p>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <Link
                      href="/workouts"
                      className="text-sm text-white/70 hover:text-white"
                    >
                      View all workouts →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-400 mb-4">No workouts logged yet</p>
                  <Link
                    href="/workout/log"
                    className="text-white hover:underline"
                  >
                    Log your first workout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 