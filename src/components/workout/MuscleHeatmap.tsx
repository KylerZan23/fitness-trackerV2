'use client'

import { useState, useEffect } from 'react'
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { MuscleGroup } from '@/lib/types'

interface MuscleData {
  muscleGroup: string
  sets: number
  reps: number
  weight: number
}

interface MuscleHeatmapProps {
  userId?: string
}

// Define types for front and back muscle views
interface FrontMuscleData {
  Chest: number
  Biceps: number
  Abs: number
  Quadriceps: number
  Deltoids: number
  Forearms: number
  Abductor: number
  Adductor: number
  Calves: number
}

interface BackMuscleData {
  Trapezius: number
  'Latissimus Dorsi': number
  Triceps: number
  'Erector Spinae': number
  'Posterior Thigh': number
  Glutes: number
  Calves: number
}

// Interface for muscle label positioning and data
interface MuscleLabel {
  name: string
  x: number
  y: number
  sets: number
}

export function MuscleHeatmap({ userId }: MuscleHeatmapProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [muscleData, setMuscleData] = useState<Record<string, MuscleData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate date range based on period
  const getDateRange = () => {
    if (period === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      }
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }
    }
  }

  // Format the date range for display
  const formatDateRange = () => {
    const { start, end } = getDateRange()
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }

  // Navigate to previous period
  const goToPreviousPeriod = () => {
    if (period === 'week') {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }
  }

  // Navigate to next period
  const goToNextPeriod = () => {
    if (period === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }
  }

  // Fetch muscle data from Supabase
  useEffect(() => {
    async function fetchMuscleData() {
      setLoading(true)
      setError(null)

      try {
        const { start, end } = getDateRange()

        // Get the current user ID if not provided
        let currentUserId = userId

        if (!currentUserId) {
          const { data: sessionData } = await supabase.auth.getSession()
          currentUserId = sessionData.session?.user.id

          if (!currentUserId) {
            setError('Authentication required. Please log in to view your muscle heatmap.')
            setLoading(false)
            return
          }
        }

        // Fetch workouts within date range
        const { data, error: fetchError } = await supabase
          .from('workouts')
          .select('exercise_name, sets, reps, weight, muscle_group')
          .eq('user_id', currentUserId)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        if (fetchError) throw fetchError

        // Aggregate data by muscle group
        const aggregatedData: Record<string, MuscleData> = {}

        if (data && data.length > 0) {
          data.forEach(workout => {
            const muscleGroup = workout.muscle_group

            if (!aggregatedData[muscleGroup]) {
              aggregatedData[muscleGroup] = {
                muscleGroup,
                sets: 0,
                reps: 0,
                weight: 0,
              }
            }

            aggregatedData[muscleGroup].sets += workout.sets
            aggregatedData[muscleGroup].reps += workout.sets * workout.reps
            aggregatedData[muscleGroup].weight += workout.weight
          })
        } else {
          // No workout data found
          console.log('No workout data found for the selected period')
        }

        setMuscleData(aggregatedData)
      } catch (err) {
        console.error('Error fetching muscle data:', err)
        setError('Failed to load workout data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchMuscleData()
  }, [userId, period, currentDate])

  // Map our muscle groups to more specific anatomical regions for the heatmap
  const getMuscleDisplay = (): FrontMuscleData | BackMuscleData => {
    if (view === 'front') {
      return {
        Chest: muscleData['Chest']?.sets || 0,
        Biceps: muscleData['Arms']?.sets || 0,
        Abs: muscleData['Core']?.sets || 0,
        Quadriceps: muscleData['Legs']?.sets || 0,
        Deltoids: muscleData['Shoulders']?.sets || 0,
        Forearms: muscleData['Arms']?.sets || 0, // Derived from Arms
        Abductor: muscleData['Legs']?.sets || 0, // Derived from Legs
        Adductor: muscleData['Legs']?.sets || 0, // Derived from Legs
        Calves: muscleData['Legs']?.sets || 0,
      } as FrontMuscleData
    } else {
      return {
        Trapezius: muscleData['Back']?.sets || 0,
        'Latissimus Dorsi': muscleData['Back']?.sets || 0,
        Triceps: muscleData['Arms']?.sets || 0,
        'Erector Spinae': muscleData['Back']?.sets || 0,
        'Posterior Thigh': muscleData['Legs']?.sets || 0,
        Glutes: muscleData['Legs']?.sets || 0,
        Calves: muscleData['Legs']?.sets || 0,
      } as BackMuscleData
    }
  }

  // Get muscle label positions and data for front view
  const getFrontMuscleLabels = (): MuscleLabel[] => {
    const muscles = getMuscleDisplay() as FrontMuscleData
    return [
      { name: 'Deltoids', x: 175, y: 200, sets: muscles.Deltoids },
      { name: 'Chest', x: 110, y: 190, sets: muscles.Chest },
      { name: 'Biceps', x: 60, y: 210, sets: muscles.Biceps },
      { name: 'Forearms', x: 80, y: 300, sets: muscles.Forearms },
      { name: 'Abs', x: 230, y: 300, sets: muscles.Abs },
      { name: 'Abductor', x: 185, y: 380, sets: muscles.Abductor },
      { name: 'Adductor', x: 135, y: 400, sets: muscles.Adductor },
      { name: 'Quadriceps', x: 90, y: 440, sets: muscles.Quadriceps },
      { name: 'Calves', x: 85, y: 580, sets: muscles.Calves },
    ]
  }

  // Get muscle label positions and data for back view
  const getBackMuscleLabels = (): MuscleLabel[] => {
    const muscles = getMuscleDisplay() as BackMuscleData
    return [
      { name: 'Trapezius', x: 80, y: 140, sets: muscles.Trapezius },
      { name: 'Latissimus Dorsi', x: 150, y: 240, sets: muscles['Latissimus Dorsi'] },
      { name: 'Triceps', x: 230, y: 210, sets: muscles.Triceps },
      { name: 'Erector Spinae', x: 280, y: 360, sets: muscles['Erector Spinae'] },
      { name: 'Posterior Thigh', x: 235, y: 500, sets: muscles['Posterior Thigh'] },
      { name: 'Glutes', x: 80, y: 380, sets: muscles.Glutes },
      { name: 'Calves', x: 80, y: 580, sets: muscles.Calves },
    ]
  }

  const activeMuscleLabels = view === 'front' ? getFrontMuscleLabels() : getBackMuscleLabels()

  return (
    <div className="bg-black text-white min-h-screen">
      <header className="flex justify-between items-center py-4 px-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="text-white/70 hover:text-white">
            ←
          </button>
          <h1 className="text-2xl font-bold">Muscle Heatmap</h1>
        </div>

        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg ${period === 'week' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}
            onClick={() => setPeriod('week')}
          >
            Week
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${period === 'month' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'}`}
            onClick={() => setPeriod('month')}
          >
            Month
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Date navigation */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={goToPreviousPeriod} className="p-2 text-white/70 hover:text-white">
            &lt;
          </button>
          <h2 className="text-xl font-medium">{formatDateRange()}</h2>
          <button onClick={goToNextPeriod} className="p-2 text-white/70 hover:text-white">
            &gt;
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-8 my-8">
            <div className="flex items-start">
              <div className="bg-red-800/30 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-red-300 mb-2">Error</h3>
                <p className="text-red-200">{error}</p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-800/50 text-white rounded-lg hover:bg-red-800/70 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : Object.keys(muscleData).length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 my-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-full p-4 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-white/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">No Workout Data</h3>
              <p className="text-white/70 mb-6">
                You haven't logged any workouts during this period. Log some workouts to see your
                muscle heatmap!
              </p>

              <div className="px-6 py-3 bg-white/20 text-white/70 font-medium rounded-full cursor-not-allowed">
                No Data Available
              </div>
            </div>
          </div>
        ) : (
          /* Muscle visualization */
          <div className="relative h-[600px] mx-auto mt-8 max-w-md">
            {/* Body outline */}
            <div className="relative w-full h-full">
              {view === 'front' ? (
                <svg viewBox="0 0 300 700" className="w-full h-full">
                  {/* Basic humanoid outline - front view */}
                  <path
                    d="M150,50 C180,50 200,70 200,100 C200,130 180,150 180,160 
                       C220,180 240,220 240,260 C240,300 220,340 200,360
                       C200,430 190,500 180,560 C170,620 160,660 150,700
                       C140,660 130,620 120,560 C110,500 100,430 100,360
                       C80,340 60,300 60,260 C60,220 80,180 120,160
                       C120,150 100,130 100,100 C100,70 120,50 150,50Z"
                    fill="#3a3a4c"
                  />
                  {/* Arms */}
                  <path
                    d="M180,160 C220,160 240,180 240,200 C240,240 220,280 180,300 Z"
                    fill="#3a3a4c"
                  />
                  <path
                    d="M120,160 C80,160 60,180 60,200 C60,240 80,280 120,300 Z"
                    fill="#3a3a4c"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 300 700" className="w-full h-full">
                  {/* Basic humanoid outline - back view */}
                  <path
                    d="M150,50 C180,50 200,70 200,100 C200,130 180,150 180,160 
                       C220,180 240,220 240,260 C240,300 220,340 200,360
                       C200,430 190,500 180,560 C170,620 160,660 150,700
                       C140,660 130,620 120,560 C110,500 100,430 100,360
                       C80,340 60,300 60,260 C60,220 80,180 120,160
                       C120,150 100,130 100,100 C100,70 120,50 150,50Z"
                    fill="#3a3a4c"
                  />
                  {/* Arms */}
                  <path
                    d="M180,160 C220,160 240,180 240,200 C240,240 220,280 180,300 Z"
                    fill="#3a3a4c"
                  />
                  <path
                    d="M120,160 C80,160 60,180 60,200 C60,240 80,280 120,300 Z"
                    fill="#3a3a4c"
                  />
                </svg>
              )}

              {/* Muscle labels and indicators */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {activeMuscleLabels.map((muscle, index) => (
                  <div
                    key={index}
                    className="absolute flex flex-col items-start"
                    style={{ top: `${muscle.y}px`, left: `${muscle.x}px` }}
                  >
                    <div className="text-sm text-gray-300 whitespace-nowrap">{muscle.name}</div>
                    <div className="flex items-center">
                      <span className="text-base font-medium whitespace-nowrap">
                        {muscle.sets} Sets
                      </span>
                      <div className="h-[1px] w-24 ml-2 bg-gray-500 relative z-0"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* View toggles - small body icons at bottom */}
            <div className="absolute bottom-0 right-0 flex space-x-4">
              <button
                onClick={() => setView('front')}
                className={`p-2 rounded-md ${view === 'front' ? 'bg-red-500/30' : 'bg-gray-700/50'}`}
              >
                <svg viewBox="0 0 50 100" className="w-10 h-10">
                  <path
                    d="M25,10 C30,10 33,13 33,18 C33,23 30,25 30,27 
                       C37,30 40,37 40,43 C40,50 37,57 33,60
                       C33,72 32,83 30,93 C29,103 27,110 25,115
                       C23,110 21,103 20,93 C18,83 17,72 17,60
                       C13,57 10,50 10,43 C10,37 13,30 20,27
                       C20,25 17,23 17,18 C17,13 20,10 25,10Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                onClick={() => setView('back')}
                className={`p-2 rounded-md ${view === 'back' ? 'bg-red-500/30' : 'bg-gray-700/50'}`}
              >
                <svg viewBox="0 0 50 100" className="w-10 h-10">
                  <path
                    d="M25,10 C30,10 33,13 33,18 C33,23 30,25 30,27 
                       C37,30 40,37 40,43 C40,50 37,57 33,60
                       C33,72 32,83 30,93 C29,103 27,110 25,115
                       C23,110 21,103 20,93 C18,83 17,72 17,60
                       C13,57 10,50 10,43 C10,37 13,30 20,27
                       C20,25 17,23 17,18 C17,13 20,10 25,10Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Info accordion */}
        <div className="mt-8 border-t border-white/10 pt-4">
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer py-2">
              <span className="text-lg font-medium">Learn more about Muscle Heatmap</span>
              <span className="text-white/50 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="pt-2 pb-4 text-white/70 space-y-2">
              <p>
                The Muscle Heatmap provides a visual representation of which muscle groups you've
                been training.
              </p>
              <p>
                Each muscle shows the total number of sets performed during the selected period.
              </p>
              <p>
                Use this to identify imbalances in your training and ensure you're giving attention
                to all major muscle groups.
              </p>
            </div>
          </details>
        </div>
      </main>
    </div>
  )
}
