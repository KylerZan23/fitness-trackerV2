'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  getAllWorkouts,
  getUserProfile,
  HistoricalWorkout,
} from '@/lib/db/index'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MonthLogCard } from '@/components/workouts/MonthLogCard'

// Interface for grouped workout data
interface MonthlyWorkoutData {
  workouts: HistoricalWorkout[]
  totalDurationMinutes: number
}

interface YearlyWorkoutData {
  [month: number]: MonthlyWorkoutData // 0 = Jan, 11 = Dec
}

interface GroupedWorkouts {
  [year: number]: YearlyWorkoutData
}

export default function WorkoutsHistoryPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getUserProfile>> | null>(null)
  const [allWorkouts, setAllWorkouts] = useState<HistoricalWorkout[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Fetch Profile
  useEffect(() => {
    async function fetchProfileData() {
      try {
        const profileData = await getUserProfile()
        if (!profileData) {
          console.log('No profile found, redirecting to onboarding')
          router.push('/neural/onboarding')
          return
        }
        setProfile(profileData)
        console.log('Profile loaded successfully')
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile data')
      }
    }
    fetchProfileData()
  }, [router])

  // Fetch All Workouts
  const fetchAllWorkouts = useCallback(async () => {
    if (!profile) return

    try {
      setIsPageLoading(true)
      console.log('Fetching all workouts...')
      const workoutsData = await getAllWorkouts()
      setAllWorkouts(workoutsData)
      console.log(`Fetched ${workoutsData.length} total workouts.`)
    } catch (err) {
      console.error('Error fetching workouts:', err)
      toast.error('Failed to load workout history.')
      setError('Failed to load workout data')
    } finally {
      setIsPageLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (profile) {
      fetchAllWorkouts()
    }
  }, [profile, fetchAllWorkouts])

  // Group workouts by year and month
  const groupedWorkouts: GroupedWorkouts = useMemo(() => {
    console.log(`Grouping ${allWorkouts.length} workouts by year and month.`)
    
    const grouped: GroupedWorkouts = {}

    allWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.created_at)
      const year = workoutDate.getFullYear()
      const month = workoutDate.getMonth() // 0-based (0 = January)

      if (!grouped[year]) {
        grouped[year] = {}
      }

      if (!grouped[year][month]) {
        grouped[year][month] = {
          workouts: [],
          totalDurationMinutes: 0,
        }
      }

      grouped[year][month].workouts.push(workout)
      grouped[year][month].totalDurationMinutes += workout.duration
    })

    return grouped
  }, [allWorkouts])

  // Handle year selection
  const handleYearChange = useCallback((year: number) => {
    console.log(`Year changed to: ${year}`)
    setSelectedYear(year)
    setError(null)
  }, [])

  // Handle logout
  const handleLogout = useCallback(async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  // Sidebar props
  const sidebarProps = {
    userName: profile?.name || 'User',
    userEmail: profile?.email || '',
    profilePictureUrl: profile?.profile_picture_url || null,
    onLogout: handleLogout
  }

  // Get available years from grouped data
  const availableYears = useMemo(() => {
    const years = Object.keys(groupedWorkouts).map(Number).sort((a, b) => b - a)
    console.log('Available years:', years)
    return years
  }, [groupedWorkouts])

  // Get months for selected year
  const monthsForSelectedYear = useMemo(() => {
    const yearData = groupedWorkouts[selectedYear]
    if (!yearData) return []

    return Object.keys(yearData)
      .map(Number)
      .sort((a, b) => b - a) // Newest months first (Dec = 11, Jan = 0)
  }, [groupedWorkouts, selectedYear])

  // Handle navigation to specific month
  const handleViewMonth = useCallback((year: number, month: number) => {
    router.push(`/workouts/${year}/${month + 1}`) // Convert to 1-based month for URL
  }, [router])

  // Loading state
  if (isPageLoading && allWorkouts.length === 0) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading workout history...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state (only show if no workouts and there's an error)
  if (error && allWorkouts.length === 0) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Workout History</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchAllWorkouts} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Workout History</h1>
          <p className="text-muted-foreground">
            Track your progress and view your workout history by month and year.
          </p>
        </div>

        {/* Year Selection */}
        <div className="mb-6 flex flex-wrap gap-2">
          {availableYears.map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? 'default' : 'outline'}
              onClick={() => handleYearChange(year)}
            >
              {year}
            </Button>
          ))}
        </div>

        {error && <p className="text-destructive mb-4">Note: {error}</p>}

        {/* Monthly Workout Grid */}
        {monthsForSelectedYear.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monthsForSelectedYear.map(monthIndex => {
              const monthData = groupedWorkouts[selectedYear][monthIndex]
              const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ]
              return (
                <MonthLogCard
                  key={`${selectedYear}-${monthIndex}`}
                  monthName={monthNames[monthIndex]}
                  year={selectedYear}
                  workouts={monthData.workouts}
                  totalDurationHours={Math.round(monthData.totalDurationMinutes / 60 * 10) / 10}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No workouts found for {selectedYear}</h2>
            <p className="text-muted-foreground mb-6">
              Start logging your workouts to see your progress here.
            </p>
            <Button onClick={() => router.push('/workout/new')}>
              Log Your First Workout
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {allWorkouts.length > 0 && (
          <div className="mt-12 bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Total Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{allWorkouts.length}</div>
                <div className="text-sm text-muted-foreground">Total Workouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(allWorkouts.reduce((sum, w) => sum + w.duration, 0) / 60)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{availableYears.length}</div>
                <div className="text-sm text-muted-foreground">Years Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {allWorkouts.length > 0 
                    ? Math.round(allWorkouts.reduce((sum, w) => sum + w.duration, 0) / allWorkouts.length)
                    : 0}min
                </div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}