'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
import {
  getAllWorkouts,
  getUserProfile,
  HistoricalWorkout,
  getLocalStravaRunsForYear,
} from '@/lib/db/index'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MonthLogCard } from '@/components/workouts/MonthLogCard'
import { triggerStravaSync } from '@/app/_actions/stravaActions'

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
  const [allLiftingWorkouts, setAllLiftingWorkouts] = useState<HistoricalWorkout[]>([])
  const [localStravaRuns, setLocalStravaRuns] = useState<HistoricalWorkout[]>([])
  const [isLoadingLifting, setIsLoadingLifting] = useState(true)
  const [isLoadingLocalRuns, setIsLoadingLocalRuns] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // State for Strava Sync UI
  const [isSyncingStrava, setIsSyncingStrava] = useState(false)
  const [syncStravaMessage, setSyncStravaMessage] = useState<string | null>(null)

  // Fetch Profile
  useEffect(() => {
    async function fetchProfileData() {
      try {
        const userProfile = await getUserProfile()
        if (userProfile) {
          setProfile(userProfile)
        } else {
          console.warn('Workouts page: No profile found.')
          setProfile(null)
        }
      } catch (err) {
        console.error('Error fetching user profile for workouts page:', err)
        setError('Failed to load user data.')
        setProfile(null)
      }
    }
    fetchProfileData()
  }, [])

  // Fetch Lifting Workouts
  useEffect(() => {
    async function fetchLiftingWorkouts() {
      setIsLoadingLifting(true)
      setError(null)
      try {
        const workoutsData = await getAllWorkouts()
        const typedLiftingWorkouts = workoutsData.map(w => ({ ...w, type: 'lift' as const }))
        setAllLiftingWorkouts(typedLiftingWorkouts)
        console.log(`Fetched ${typedLiftingWorkouts.length} lifting workouts.`)
      } catch (err) {
        console.error('Error fetching all lifting workouts:', err)
        setError('Failed to load lifting workout history.')
        setAllLiftingWorkouts([])
      } finally {
        setIsLoadingLifting(false)
      }
    }
    fetchLiftingWorkouts()
  }, [])

  // Function to fetch local Strava runs, can be called by effect or after sync
  const fetchLocalRunsForCalendar = useCallback(async () => {
    if (!profile?.id) {
      setLocalStravaRuns([])
      return
    }
    setIsLoadingLocalRuns(true)
    // setError(null); // Don't clear general error, sync might have its own message handling
    console.log(`Fetching local Strava runs for user ${profile.id} and year ${selectedYear}`)
    try {
      const runsData = await getLocalStravaRunsForYear(profile.id, selectedYear)
      setLocalStravaRuns(runsData)
      console.log(`Fetched ${runsData.length} local Strava runs for ${selectedYear}.`)
    } catch (err) {
      console.error('Error fetching local Strava runs for calendar:', err)
      toast.error('Failed to load Strava run history from local store for calendar.')
      setLocalStravaRuns([])
    } finally {
      setIsLoadingLocalRuns(false)
    }
  }, [profile?.id, selectedYear])

  // Fetch Locally Stored Strava Runs on initial load or when year/profile changes
  useEffect(() => {
    fetchLocalRunsForCalendar()
  }, [fetchLocalRunsForCalendar])

  // Strava Sync Handler
  const handleStravaSync = async () => {
    if (!profile?.strava_connected) {
      setSyncStravaMessage('Please connect your Strava account first (e.g., in profile settings).')
      toast.error('Strava account not connected.')
      return
    }
    setIsSyncingStrava(true)
    setSyncStravaMessage('Syncing recent Strava runs, please wait...')
    try {
      const result = await triggerStravaSync('recent')
      if (result.error) {
        setSyncStravaMessage(`Sync failed: ${result.error}`)
        toast.error(`Strava Sync Error: ${result.error}`)
      } else {
        setSyncStravaMessage(
          `Sync complete! Synced: ${result.syncedCount} activities. New: ${result.newActivitiesCount}. Last activity processed: ${result.lastActivityDate ? new Date(result.lastActivityDate).toLocaleDateString() : 'N/A'}. Data should refresh.`
        )
        toast.success(`Strava sync complete. New activities: ${result.newActivitiesCount}.`)
        // Re-fetch local runs to update the calendar immediately after sync
        // revalidatePath in server action should handle cache, this ensures UI updates state.
        fetchLocalRunsForCalendar()
      }
    } catch (e: any) {
      console.error('Client-side error calling Strava sync action:', e)
      setSyncStravaMessage('Client error during sync: ' + e.message)
      toast.error('Client error during Strava sync.')
    } finally {
      setIsSyncingStrava(false)
    }
  }

  // Combine Lifting Workouts and Local Strava Runs
  const combinedWorkouts = useMemo<HistoricalWorkout[]>(() => {
    console.log(
      `Combining ${allLiftingWorkouts.length} lifting workouts and ${localStravaRuns.length} local Strava runs.`
    )
    return [...allLiftingWorkouts, ...localStravaRuns]
  }, [allLiftingWorkouts, localStravaRuns])

  // Group Combined Workouts by Year and Month
  const groupedWorkouts = useMemo<GroupedWorkouts>(() => {
    const groups: GroupedWorkouts = {}
    const currentCombinedWorkouts = combinedWorkouts || []
    for (const workout of currentCombinedWorkouts) {
      try {
        const date = new Date(workout.created_at)
        const year = date.getFullYear()
        const month = date.getMonth()

        if (!groups[year]) {
          groups[year] = {}
        }
        if (!groups[year][month]) {
          groups[year][month] = { workouts: [], totalDurationMinutes: 0 }
        }

        groups[year][month].workouts.push(workout)
        groups[year][month].totalDurationMinutes += workout.duration
      } catch (parseError) {
        console.error(
          `Error parsing date for workout ID ${workout.id} (${workout.type}): ${workout.created_at}`,
          parseError
        )
      }
    }
    console.log('Grouped combined workouts:', groups)
    return groups
  }, [combinedWorkouts])

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setProfile(null)
      setAllLiftingWorkouts([])
      setLocalStravaRuns([])
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out.')
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

  const currentYearData = groupedWorkouts[selectedYear] || {}
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]

  // --- Render Logic --- //

  const isPageLoading = isLoadingLifting || isLoadingLocalRuns

  if (isPageLoading && combinedWorkouts.length === 0 && !syncStravaMessage) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))] ">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && combinedWorkouts.length === 0 && !syncStravaMessage) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">
            Error Loading Workout History
          </h1>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Workout History - {selectedYear}</h1>
        {profile?.strava_connected && (
          <Button onClick={handleStravaSync} disabled={isSyncingStrava}>
            {isSyncingStrava ? 'Syncing Strava...' : 'Sync Recent Strava Runs'}
          </Button>
        )}
      </div>

      {syncStravaMessage && (
        <div
          className={`p-3 mb-4 rounded-md text-sm ${syncStravaMessage.includes('failed') || syncStravaMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
        >
          {syncStravaMessage}
        </div>
      )}

      {error && !syncStravaMessage && <p className="text-destructive mb-4">Note: {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {monthNames.map((name, index) => {
          const monthData = currentYearData[index]
          const totalDurationMinutes = monthData?.totalDurationMinutes ?? 0
          const totalDurationHours = Math.round(totalDurationMinutes / 60)
          const workoutsForMonth = monthData?.workouts ?? []

          return (
            <MonthLogCard
              key={`${selectedYear}-${index}`}
              monthName={name}
              year={selectedYear}
              workouts={workoutsForMonth}
              totalDurationHours={totalDurationHours}
            />
          )
        })}
      </div>
    </DashboardLayout>
  )
}
