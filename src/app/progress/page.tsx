'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/db/index'
import { TrendingUp, BarChart3, Activity, Zap } from 'lucide-react'

// Import UI Components
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Import new strength analytics components
import { StatsCard, StrengthStatsCard, StrengthVitalsGrid } from '@/components/ui/StatsCard'
import { StrengthProgressionChart } from '@/components/progress/StrengthProgressionChart'
import { MuscleDistributionChart } from '@/components/workout/MuscleDistributionChart'

// Import strength calculation utilities
import {
  WorkoutData,
  getCurrentStrengthLevels,
  calculate7DayVolume,
  isValidWorkoutForE1RM,
  formatE1RM,
} from '@/lib/utils/strengthCalculations'

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
  weight_unit?: 'kg' | 'lbs'
}

interface UserActivitySummary {
  total_workout_sessions: number
  total_run_sessions: number
  avg_workout_duration_minutes: number | null
  avg_run_distance_meters: number
  avg_run_duration_seconds: number
  muscle_group_summary: {
    [group: string]: {
      total_sets: number
      last_trained_date: string
      total_volume: number
      distinct_exercises_count: number
    }
  }
  dynamic_exercise_progression: any[]
  last_3_runs: any[]
  recent_run_pace_trend: string
  workout_days_this_week: number
  workout_days_last_week: number
}

export default function ProgressPage() {
  const router = useRouter()
  
  // State variables
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activitySummary, setActivitySummary] = useState<UserActivitySummary | null>(null)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch comprehensive data for strength analytics
  useEffect(() => {
    async function fetchStrengthAnalyticsData() {
      setIsLoading(true)
      try {
        // Get user profile first
        const userProfile = await getUserProfile()
        if (!userProfile) {
          console.warn('No active session found. Redirecting to login.')
          router.push('/login')
          return
        }
        
        setProfile(userProfile)

        // Fetch comprehensive activity summary using RPC
        const { data: summaryData, error: summaryError } = await supabase.rpc(
          'get_user_activity_summary',
          { 
            user_id_param: userProfile.id, 
            period_days_param: 30 
          }
        )

        if (summaryError) {
          console.error('Error fetching activity summary:', summaryError)
          throw new Error(`Failed to fetch activity summary: ${summaryError.message}`)
        }

        setActivitySummary(summaryData)

        // Fetch detailed workout history for strength progression analysis (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const { data: workoutsData, error: workoutsError } = await supabase
          .from('workouts')
          .select('id, exercise_name, sets, reps, weight, created_at, muscle_group, notes')
          .eq('user_id', userProfile.id)
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: true })

        if (workoutsError) {
          console.error('Error fetching workout history:', workoutsError)
          throw new Error(`Failed to fetch workout history: ${workoutsError.message}`)
        }

        // Filter for valid strength training workouts
        const validWorkouts = (workoutsData || [])
          .filter(isValidWorkoutForE1RM)
          .map(workout => ({
            id: workout.id,
            exercise_name: workout.exercise_name,
            sets: workout.sets,
            reps: workout.reps,
            weight: workout.weight,
            created_at: workout.created_at,
            muscle_group: workout.muscle_group,
            notes: workout.notes
          }))

        setWorkoutHistory(validWorkouts)

        console.log(`Successfully fetched ${validWorkouts.length} strength training workouts`)

      } catch (err) {
        console.error('Error fetching strength analytics data:', err)
        setError('Failed to load strength analytics data.')
        toast.error('Failed to load strength analytics data.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStrengthAnalyticsData()
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

  // Calculate strength metrics from workout data
  const strengthLevels = workoutHistory.length > 0 
    ? getCurrentStrengthLevels(workoutHistory)
    : { squat: null, bench: null, deadlift: null, overhead_press: null }

  const weeklyVolume = workoutHistory.length > 0
    ? calculate7DayVolume(workoutHistory, profile?.weight_unit || 'kg')
    : { value: 0, unit: profile?.weight_unit || 'kg' }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Cards skeleton */}
          <StrengthVitalsGrid>
            {[...Array(4)].map((_, i) => (
              <StatsCard
                key={i}
                title="Loading..."
                value="—"
                isLoading={true}
              />
            ))}
          </StrengthVitalsGrid>

          {/* Chart skeletons */}
          <div className="space-y-6">
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Strength Analytics</h1>
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
      <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Strength Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Track your strength progression, analyze training patterns, and optimize your performance
              </p>
            </div>
          </div>
        </div>

        {/* Strength Vitals Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Strength Vitals</h2>
          <StrengthVitalsGrid>
            <StrengthStatsCard
              liftName="Squat"
              e1rmValue={strengthLevels.squat?.value || null}
              unit={profile?.weight_unit || 'kg'}
              confidence={strengthLevels.squat?.confidence}
              lastTested={strengthLevels.squat?.date ? new Date(strengthLevels.squat.date).toLocaleDateString() : undefined}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            
            <StrengthStatsCard
              liftName="Bench Press"
              e1rmValue={strengthLevels.bench?.value || null}
              unit={profile?.weight_unit || 'kg'}
              confidence={strengthLevels.bench?.confidence}
              lastTested={strengthLevels.bench?.date ? new Date(strengthLevels.bench.date).toLocaleDateString() : undefined}
              icon={<Activity className="w-5 h-5" />}
            />
            
            <StrengthStatsCard
              liftName="Deadlift"
              e1rmValue={strengthLevels.deadlift?.value || null}
              unit={profile?.weight_unit || 'kg'}
              confidence={strengthLevels.deadlift?.confidence}
              lastTested={strengthLevels.deadlift?.date ? new Date(strengthLevels.deadlift.date).toLocaleDateString() : undefined}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            
            <StatsCard
              title="7-Day Volume"
              value={weeklyVolume.value.toLocaleString()}
              unit={weeklyVolume.unit}
              subtitle="Total weight moved"
              icon={<Zap className="w-5 h-5" />}
            />
          </StrengthVitalsGrid>
        </div>

        {/* Strength Progression Chart */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Strength Progression</h2>
          <StrengthProgressionChart
            workoutHistory={workoutHistory}
            weightUnit={profile?.weight_unit || 'kg'}
          />
        </div>

        {/* Enhanced Muscle Distribution Chart */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Distribution</h2>
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Muscle Group Distribution</CardTitle>
                  <CardDescription className="text-gray-600">
                    Analyze your training focus across different muscle groups - toggle between sets and volume
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
        </div>

        {/* Summary Statistics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Workouts"
              value={activitySummary?.total_workout_sessions || 0}
              subtitle="Last 30 days"
              icon={<BarChart3 className="w-5 h-5" />}
            />

            <StatsCard
              title="Avg Duration"
              value={Math.round(activitySummary?.avg_workout_duration_minutes || 0)}
              unit="min"
              subtitle="Per session"
              icon={<Activity className="w-5 h-5" />}
            />

            <StatsCard
              title="This Week"
              value={activitySummary?.workout_days_this_week || 0}
              unit="days"
              subtitle="Training frequency"
              icon={<TrendingUp className="w-5 h-5" />}
            />

            <StatsCard
              title="Consistency"
              value={activitySummary?.workout_days_last_week || 0}
              unit="days"
              subtitle="Last week"
              icon={<Zap className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 