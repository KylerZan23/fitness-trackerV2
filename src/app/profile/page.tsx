'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Error } from '@/components/ui/error'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SocialProfileHeader } from '@/components/profile/SocialProfileHeader'
import { TrainingFocusCards } from '@/components/profile/TrainingFocusCards'
import { ExperienceCard } from '@/components/profile/ExperienceCard'
import { AgeStatsCard } from '@/components/profile/AgeStatsCard'
import { PersonalRecordsSection } from '@/components/profile/PersonalRecordsSection'
import { ActivityFeed } from '@/components/profile/ActivityFeed'
import { FollowersModal } from '@/components/profile/FollowersModal'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/button'
import { 
  getUserProfileData, 
  getUserWorkoutStats, 
  getUserPersonalRecords, 
  getUserActivityFeed,
  type ProfileData,
  type WorkoutStats,
  type PersonalRecord,
  type ActivityItem
} from '@/app/_actions/profileActions'
import { createCustomerPortalSession } from '@/app/_actions/stripeActions'

// Using imported types from profileActions

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
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [sessionChecked, setSessionChecked] = useState(false)
  const [followersModalOpen, setFollowersModalOpen] = useState(false)
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers')

  useEffect(() => {
    async function checkSessionAndRedirect() {
      try {
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

        const hasSession = await checkSessionAndRedirect()
        if (!hasSession) return

        setSessionChecked(true)

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          console.log('Session lost during profile loading, redirecting to login')
          window.location.href = '/login'
          return
        }

        // Load profile data using server action
        try {
          const profileResult = await getUserProfileData()
          console.log('Profile page: getUserProfileData result:', profileResult)
          
          if (profileResult.success && profileResult.data) {
            setProfile(profileResult.data)
            console.log('Profile page: Profile set successfully')
          } else {
            console.error('Profile page: Failed to load profile:', profileResult.error)
            setError(profileResult.error || 'Failed to load profile data')
            return
          }
        } catch (profileError) {
          console.error('Profile page: Exception calling getUserProfileData:', profileError)
          setError('Failed to load profile data due to unexpected error')
          return
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
    async function loadAdditionalData() {
      try {
        if (!sessionChecked || !profile) return

        // Load workout stats, personal records, and activity feed in parallel
        const [statsResult, recordsResult, activitiesResult] = await Promise.all([
          getUserWorkoutStats(),
          getUserPersonalRecords(profile.weight_unit),
          getUserActivityFeed(10)
        ])

        // Set workout stats
        if (statsResult.success && statsResult.data) {
          setWorkoutStats(statsResult.data)
        } else {
          console.warn('Failed to load workout stats:', statsResult.error)
        }

        // Set personal records
        if (recordsResult.success && recordsResult.data) {
          setPersonalRecords(recordsResult.data)
        } else {
          console.warn('Failed to load personal records:', recordsResult.error)
        }

        // Set activity feed
        if (activitiesResult.success && activitiesResult.data) {
          setActivities(activitiesResult.data)
        } else {
          console.warn('Failed to load activity feed:', activitiesResult.error)
        }

      } catch (error) {
        console.error('Error loading additional data:', error)
      }
    }

    loadAdditionalData()
  }, [sessionChecked, profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Icon
          name="loader"
          className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
        <Error message={`Error: ${error}. Please try refreshing.`} className="text-red-600" />
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const result = await createCustomerPortalSession()
      if (result.url) {
        window.location.href = result.url
      } else {
        console.error(result.error)
      }
    } catch (error) {
      console.error('Error managing subscription:', error)
    }
  }

  const sidebarProps = {
    userName: profile?.name || 'User',
    userEmail: profile?.email || '',
    profilePictureUrl: profile?.profile_picture_url || null,
    onLogout: handleLogout
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Profile data could not be loaded.
      </div>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="bg-gray-50 -mx-6 sm:-mx-8 lg:-mx-12 -my-8 min-h-screen">
        {/* Social Header */}
        <SocialProfileHeader
          profile={{
            id: profile.id,
            name: profile.name,
            professional_title: profile.professional_title || undefined,
            bio: profile.bio || undefined,
            profile_picture_url: profile.profile_picture_url || undefined,
            followers_count: profile.followers_count,
            following_count: profile.following_count
          }}
          isOwnProfile={true}
          onFollowersClick={(tab) => {
            setFollowersModalTab(tab)
            setFollowersModalOpen(true)
          }}
          onProfileUpdate={async () => {
            // Reload profile data after update
            try {
              const profileResult = await getUserProfileData()
              if (profileResult.success && profileResult.data) {
                setProfile(profileResult.data)
              }
            } catch (error) {
              console.error('Error reloading profile data:', error)
            }
          }}
        />
        
        {/* Training Focus */}
        <TrainingFocusCards focuses={profile.training_focuses ?? null} />
        
        <div className="max-w-4xl mx-auto px-6 pb-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExperienceCard 
              profile={profile} 
              workoutStats={workoutStats || { totalWorkouts: 0, personalRecordsCount: 0 }} 
            />
            <AgeStatsCard 
              profile={{
                age: profile.age || undefined,
                height_cm: profile.height_cm,
                weight_kg: profile.weight_kg,
                birth_date: profile.birth_date
              }} 
              weightUnit={profile.weight_unit}
              onProfileUpdate={async () => {
                // Reload profile data after update
                try {
                  const profileResult = await getUserProfileData()
                  if (profileResult.success && profileResult.data) {
                    setProfile(profileResult.data)
                  }
                } catch (error) {
                  console.error('Error reloading profile data:', error)
                }
              }}
            />
          </div>
          
          {/* Subscription Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
            <p className="text-gray-600 mb-4">
              Manage your subscription, update payment methods, and view billing history.
            </p>
            <Button 
              onClick={handleManageSubscription}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Manage Subscription
            </Button>
          </div>
          
          {/* Personal Records */}
          <PersonalRecordsSection 
            records={personalRecords} 
            weightUnit={profile.weight_unit}
            onRecordsUpdate={async () => {
              // Reload personal records and profile data after update
              try {
                const [recordsResult, profileResult] = await Promise.all([
                  getUserPersonalRecords(profile.weight_unit),
                  getUserProfileData()
                ])
                
                if (recordsResult.success && recordsResult.data) {
                  setPersonalRecords(recordsResult.data)
                }
                
                if (profileResult.success && profileResult.data) {
                  setProfile(profileResult.data)
                }
              } catch (error) {
                console.error('Error reloading data after PR update:', error)
              }
            }}
          />
          
          {/* Activity Feed */}
          <ActivityFeed 
            activities={activities} 
            defaultExpanded={true}
          />
        </div>
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        userId={profile.id}
        userName={profile.name}
        initialTab={followersModalTab}
      />
    </DashboardLayout>
  )
}
