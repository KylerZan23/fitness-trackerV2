'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWorkouts, type Workout } from '@/lib/db'
import { Error } from '@/components/ui/error'
import Link from 'next/link'
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload'
import { SqlMigrationRunner } from '@/components/admin/SqlMigrationRunner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'
import { Label } from '@/components/ui/label'
import { Share2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type OnboardingData } from '@/lib/types/onboarding'

interface UserProfile {
  id: string
  name: string
  age: number
  fitness_goals: string
  email: string
  weight_unit?: 'kg' | 'lbs'
  profile_picture_url?: string
  role?: string
  primary_training_focus?: string | null
  experience_level?: string | null
  onboarding_responses?: OnboardingData
  onboarding_completed?: boolean
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMigrationNotice, setShowMigrationNotice] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [fitnessGoals, setFitnessGoals] = useState('')
  const [primaryTrainingFocus, setPrimaryTrainingFocus] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)

  // Constants for select options
  const PRIMARY_TRAINING_FOCUS_OPTIONS = [
    { value: 'General Fitness', label: 'General Fitness' },
    { value: 'Bodybuilding', label: 'Bodybuilding' },
    { value: 'Powerlifting', label: 'Powerlifting' },
    { value: 'Weight Loss', label: 'Weight Loss' },
    { value: 'Endurance', label: 'Endurance' },
    { value: 'Athletic Performance', label: 'Athletic Performance' },
    { value: 'Beginner Strength', label: 'Beginner Strength' },
    { value: 'Other', label: 'Other' },
  ]

  const EXPERIENCE_LEVEL_OPTIONS = [
    { value: 'Beginner (<6 months)', label: 'Beginner (<6 months)' },
    { value: 'Intermediate (6mo-2yr)', label: 'Intermediate (6mo-2yr)' },
    { value: 'Advanced (2+ years)', label: 'Advanced (2+ years)' },
  ]

  useEffect(() => {
    async function checkSessionAndRedirect() {
      try {
        // Add a small delay to give the session cookie time to be properly read
        await new Promise(resolve => setTimeout(resolve, 500))

        const {
          data: { session },
        } = await supabase.auth.getSession()

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
        if (!hasSession) return

        setSessionChecked(true)

        // Second session check to get the user data
        const {
          data: { session },
        } = await supabase.auth.getSession()
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
          fitness_goals: 'Set your fitness goals',
          primary_training_focus: null,
          experience_level: null,
          onboarding_responses: undefined,
          onboarding_completed: false,
        }

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            // Log error but don't show to user - just use fallback
            console.log(
              'Could not load profile from database:',
              profileError.message || 'Unknown error'
            )
            setProfile(fallbackProfile)

            // Try to create a profile only if it doesn't exist
            if (profileError.code === 'PGRST116') {
              // PostgreSQL "not found" error
              try {
                const { error: insertError } = await supabase.from('profiles').insert({
                  id: user.id,
                  name: fallbackProfile.name,
                  email: fallbackProfile.email,
                  age: fallbackProfile.age,
                  fitness_goals: fallbackProfile.fitness_goals,
                  primary_training_focus: fallbackProfile.primary_training_focus,
                  experience_level: fallbackProfile.experience_level,
                  onboarding_responses: fallbackProfile.onboarding_responses,
                  onboarding_completed: fallbackProfile.onboarding_completed,
                })

                if (insertError) {
                  // Just log the error but continue with fallback profile
                  console.log(
                    'Could not create profile in database:',
                    insertError.message || 'Unknown error'
                  )
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
        if (!sessionChecked) return

        // First check if there's an active session
        const {
          data: { session },
        } = await supabase.auth.getSession()
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
    if (profile) {
      // Optimization: Only call setters if the value has actually changed.
      if (name !== (profile.name || '')) setName(profile.name || '')
      if (age !== (profile.age?.toString() || '')) setAge(profile.age?.toString() || '')
      if (fitnessGoals !== (profile.fitness_goals || ''))
        setFitnessGoals(profile.fitness_goals || '')
      if (primaryTrainingFocus !== (profile.primary_training_focus ?? null)) {
        setPrimaryTrainingFocus(profile.primary_training_focus ?? null)
      }
      if (experienceLevel !== (profile.experience_level ?? null)) {
        setExperienceLevel(profile.experience_level ?? null)
      }
    }
  }, [profile])

  const toggleWeightUnit = async () => {
    if (!profile) return

    const newWeightUnit = profile.weight_unit === 'kg' ? 'lbs' : 'kg'
    setIsUpdating(true)

    try {
      // Update the local state immediately for better UX
      setProfile(prevProfile =>
        prevProfile ? { ...prevProfile, weight_unit: newWeightUnit } : null
      )

      // Try to update the database if the column exists
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ weight_unit: newWeightUnit })
        .eq('id', profile.id)

      if (updateError) {
        // Log the error but don't show it to the user
        console.error('Error updating weight unit in database:', updateError)
        console.error('Error code:', updateError.code)
        console.error('Error message:', updateError.message)

        // If the column doesn't exist, we'll just use the local state
        if (updateError.code === 'PGRST204' && updateError.message.includes('weight_unit')) {
          console.log(
            'weight_unit column does not exist in the database yet. Using local state instead.'
          )
          // Show migration notice to the user
          setShowMigrationNotice(true)
          // We'll still update the profile object in memory
          setProfile({
            ...profile,
            weight_unit: newWeightUnit,
          })
        }
      } else {
        // Update was successful, update the profile object
        setProfile({
          ...profile,
          weight_unit: newWeightUnit,
        })
        // Hide migration notice if it was shown before
        setShowMigrationNotice(false)
      }
    } catch (err) {
      console.error('Error toggling weight unit:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Let the auth state listener handle the redirect
      // router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Optionally set an error state here too
    }
  }

  const handleProfilePictureUpdate = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        profile_picture_url: url,
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setIsUpdating(true)
    setError(null)

    const updates = {
      name,
      age: parseInt(age, 10) || 0,
      fitness_goals: fitnessGoals,
      weight_unit: profile.weight_unit, // Ensure weight_unit is from profile state (already refactored)
      primary_training_focus: primaryTrainingFocus,
      experience_level: experienceLevel,
      onboarding_responses: profile.onboarding_responses,
      onboarding_completed: profile.onboarding_completed,
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        setError(getErrorMessage(updateError))
      } else {
        setProfile(prevProfile => (prevProfile ? { ...prevProfile, ...updates } : null))
        setError(null)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleShareProfile = async () => {
    if (!profile) return

    const publicProfileUrl = `${window.location.origin}/p/${profile.id}`
    
    // Try to use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}'s Fitness Profile`,
          text: `Check out ${profile.name}'s fitness achievements!`,
          url: publicProfileUrl,
        })
        return
      } catch (err) {
        // If sharing was cancelled or failed, fall back to clipboard
        console.log('Share cancelled or failed, falling back to clipboard')
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      // Note: useToast should be called as a hook at the top level
      // For now, we'll use a simple alert
      alert('Profile link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      alert('Failed to copy profile link. Please try again.')
    }
  }

  // Prepare props for the Sidebar
  const sidebarProps = {
    userName: profile?.name,
    userEmail: profile?.email,
    profilePictureUrl: profile?.profile_picture_url,
    onLogout: handleSignOut, // Pass the sign out handler
  }

  // Loading state (simplified for layout)
  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))] ">
          <Icon
            name="loader"
            className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"
          />
        </div>
      </DashboardLayout>
    )
  }

  // Error state (simplified for layout)
  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.24))] text-center">
          <Error message={`Error: ${error}. Please try refreshing.`} className="text-red-600" />
        </div>
      </DashboardLayout>
    )
  }

  // Handle case where profile is still null after loading (shouldn't happen with fallback logic, but safe)
  if (!profile) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))] text-gray-500">
          Profile data could not be loaded.
        </div>
      </DashboardLayout>
    )
  }

  // Main Profile Content - Apply Layout and Light Theme Styling
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

      {/* Grid for Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Info & Picture */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">User Information</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-500">
                  Name
                </Label>
                <p id="name" className="text-gray-800">
                  {profile.name}
                </p>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-500">
                  Email
                </Label>
                <p id="email" className="text-gray-800">
                  {profile.email}
                </p>
              </div>
              <div>
                <Label htmlFor="age" className="text-sm font-medium text-gray-500">
                  Age
                </Label>
                <p id="age" className="text-gray-800">
                  {profile.age > 0 ? profile.age : 'Not set'}
                </p>
              </div>
              <div>
                <Label htmlFor="goals" className="text-sm font-medium text-gray-500">
                  Fitness Goals
                </Label>
                <p id="goals" className="text-gray-800 italic">
                  {profile.fitness_goals || 'Not set'}
                </p>
              </div>
              {/* TODO: Add an Edit Profile Button/Modal here later */}
            </div>
          </div>

          {/* Profile Picture Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h2>
            <ProfilePictureUpload
              userId={profile.id}
              existingUrl={profile.profile_picture_url ?? null}
              onUploadComplete={handleProfilePictureUpdate}
            />
          </div>
        </div>

        {/* Right Column: Workouts, Settings, Admin */}
        <div className="md:col-span-2 space-y-6">
          {/* Recent Workouts Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Workouts</h2>
            {workouts.length > 0 ? (
              <ul className="space-y-2">
                {workouts.map(workout => (
                  <li
                    key={workout.id}
                    className="text-sm text-gray-600 border-b border-gray-100 pb-1"
                  >
                    {workout.created_at
                      ? new Date(workout.created_at).toLocaleDateString()
                      : 'Date unknown'}{' '}
                    - {workout.exerciseName} ({workout.sets}x{workout.reps} @ {workout.weight}
                    {profile.weight_unit})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent workouts logged.</p>
            )}
            <Link
              href="/workouts"
              className="text-sm text-blue-600 hover:underline mt-4 inline-block"
            >
              View All Workouts
            </Link>
          </div>

          {/* Settings Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
            {showMigrationNotice && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm">
                Database update available for weight units. Consider running migrations.
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Weight Unit Preference</Label>
              <Button variant="outline" size="sm" onClick={toggleWeightUnit} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : `Use ${profile?.weight_unit === 'kg' ? 'lbs' : 'kg'}`}
              </Button>
            </div>
          </div>

          {/* Share Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Share Your Profile</h2>
            <p className="text-sm text-gray-600 mb-4">
              Share your fitness achievements with friends and family! Your public profile showcases your workout streak, personal bests, and fitness stats.
            </p>
            <Button
              onClick={handleShareProfile}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>Share My Profile</span>
            </Button>
          </div>

          {/* Edit Profile Details Card - NEW */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <input
                  id="editName"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editAge" className="text-sm font-medium text-gray-700">
                  Age
                </Label>
                <input
                  id="editAge"
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="editFitnessGoals" className="text-sm font-medium text-gray-700">
                  Fitness Goals
                </Label>
                <textarea
                  id="editFitnessGoals"
                  value={fitnessGoals}
                  onChange={e => setFitnessGoals(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Primary Training Focus */}
              <div>
                <Label
                  htmlFor="primary_training_focus"
                  className="text-sm font-medium text-gray-700"
                >
                  Primary Training Focus
                </Label>
                <Select
                  value={primaryTrainingFocus ?? ''}
                  onValueChange={selectedValue => {
                    const newEffectiveValue = selectedValue === '' ? null : selectedValue
                    if (primaryTrainingFocus !== newEffectiveValue) {
                      setPrimaryTrainingFocus(newEffectiveValue)
                    }
                  }}
                >
                  <SelectTrigger id="primary_training_focus" className="mt-1 w-full">
                    <SelectValue placeholder="Select your primary training focus" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_TRAINING_FOCUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div>
                <Label htmlFor="experience_level" className="text-sm font-medium text-gray-700">
                  Experience Level
                </Label>
                <Select
                  value={experienceLevel ?? ''}
                  onValueChange={selectedValue => {
                    const newEffectiveValue = selectedValue === '' ? null : selectedValue
                    if (experienceLevel !== newEffectiveValue) {
                      setExperienceLevel(newEffectiveValue)
                    }
                  }}
                >
                  <SelectTrigger id="experience_level" className="mt-1 w-full">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVEL_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isUpdating ? 'Saving...' : 'Save Profile'}
              </Button>
              {error && <Error message={error} className="text-red-500 text-sm mt-2" />}
            </div>
          </div>

          {/* Admin Section Card (Conditional) */}
          {profile.role === 'admin' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Tools</h2>
              <SqlMigrationRunner />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
