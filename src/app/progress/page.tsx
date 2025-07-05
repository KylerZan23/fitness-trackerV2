'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getUserProfile, getWorkoutTrends } from '@/lib/db'
import { TrendingUp, BarChart3, Activity } from 'lucide-react'

// Import UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Import chart components
import { WorkoutChart } from '@/components/dashboard/WorkoutChart'
import { MuscleDistributionChart } from '@/components/workout/MuscleDistributionChart'

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
  weight_unit?: 'kg' | 'lbs'
}

export default function ProgressPage() {
  const router = useRouter()
  
  // State variables
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workoutTrends, setWorkoutTrends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user profile and workout data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Get user profile
        const userProfile = await getUserProfile()
        if (userProfile) {
          setProfile(userProfile)
          
          // Get workout trends data
          const trends = await getWorkoutTrends(userProfile.id)
          setWorkoutTrends(trends)
        } else {
          console.warn('No active session found. Redirecting to login.')
          router.push('/login')
          return
        }
      } catch (err) {
        console.error('Error fetching progress data:', err)
        setError('Failed to load progress data.')
        toast.error('Failed to load progress data.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [router])

  // Logout handler
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  // Prepare sidebar props
  const sidebarProps = profile
    ? {
        userName: profile.name ?? profile.email?.split('@')[0] ?? 'User',
        userEmail: profile.email,
        profilePictureUrl: profile.profile_picture_url,
        onLogout: handleLogout,
      }
    : {
        userName: 'Loading...',
        userEmail: '',
        profilePictureUrl: null,
        onLogout: handleLogout,
      }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading progress data...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Progress</h1>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progress Analytics</h1>
              <p className="text-gray-600 mt-1">
                Track your workout trends and muscle group distribution over time
              </p>
            </div>
          </div>
        </div>

        {/* Workout Trends Chart */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Workout Trends</CardTitle>
                <CardDescription className="text-gray-600">
                  View your weekly workout metrics including duration, weight, and sets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-gray-50 rounded-lg p-4">
              <WorkoutChart
                data={workoutTrends}
                weightUnit={profile?.weight_unit ?? 'kg'}
                isLoading={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Muscle Distribution Chart */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Muscle Group Distribution</CardTitle>
                <CardDescription className="text-gray-600">
                  Analyze which muscle groups you're targeting in your workouts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-gray-50 rounded-lg p-4">
              <MuscleDistributionChart
                userId={profile?.id}
                weightUnit={profile?.weight_unit ?? 'kg'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {workoutTrends.reduce((sum, day) => sum + (day.count || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(workoutTrends.reduce((sum, day) => sum + (day.totalDuration || 0), 0))} min
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {workoutTrends.reduce((sum, day) => sum + (day.totalSets || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 