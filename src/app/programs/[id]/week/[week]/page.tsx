'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle, 
  Circle,
  Target,
  Cpu,
  TrendingUp,
  BarChart3,
  Timer,
  Dumbbell,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { TrainingProgram, Workout } from '@/types/neural'

/**
 * Weekly Neural Program View
 * 
 * Focused view of a specific week within a Neural program.
 * Shows daily workouts with completion tracking and detailed exercise information.
 */
export default function WeeklyProgramView() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  const weekNumber = parseInt(params.week as string, 10)
  
  const [program, setProgram] = useState<TrainingProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDay | null>(null)
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadProgram = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Verify authentication
        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          toast.error('Please log in to view this program')
          router.push(`/login?redirect=/programs/${programId}/week/${weekNumber}`)
          return
        }

        // Fetch program from API with intelligent retry for transient failures
        const { retryProgramFetch } = await import('@/lib/utils/retryFetch')
        const result = await retryProgramFetch(programId)
        
        if (!result.success) {
          const error = result.error
          
          if (error?.message?.includes('404')) {
            throw new Error(`Program not found (attempted ${result.attempts} times)`)
          } else if (error?.message?.includes('403')) {
            throw new Error('You do not have permission to view this program')
          }
          throw new Error(`Failed to load program after ${result.attempts} attempts: ${error?.message || 'Unknown error'}`)
        }

        setProgram(result.data)
        
        // Log successful retry info for debugging
        if (result.attempts > 1) {
          console.log(`[WeeklyProgramFetch] ✅ Program loaded after ${result.attempts} attempts in ${Math.round(result.totalTime/1000)}s`)
        }
        
        // Validate week number
        if (weekNumber !== result.data.weekNumber) {
          console.warn(`Week mismatch: requested ${weekNumber}, program is week ${result.data.weekNumber}`)
        }

      } catch (err) {
        console.error('Error loading program:', err)
        setError(err instanceof Error ? err.message : 'Failed to load program')
        
        if (err instanceof Error && err.message.includes('not found')) {
          toast.error('Program not found')
          router.push('/programs')
        } else {
          toast.error('Unable to load the program')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (programId && !isNaN(weekNumber)) {
      loadProgram()
    } else {
      setError('Invalid program or week number')
      setIsLoading(false)
    }
  }, [programId, weekNumber, router])

  const handleWorkoutStart = (workout: WorkoutDay) => {
    // In a real app, this would create a workout session and navigate to the workout interface
    toast.success(`Starting ${workout.name}`)
    // For now, just mark as selected
    setSelectedWorkout(workout)
  }

  const handleWorkoutComplete = (workoutId: string) => {
    setCompletedWorkouts(prev => new Set([...prev, workoutId]))
    toast.success('Workout completed!')
  }

  const calculateWeekProgress = () => {
    if (!program?.workouts) return 0
    const totalWorkouts = program.workouts.length
    const completed = completedWorkouts.size
    return totalWorkouts > 0 ? (completed / totalWorkouts) * 100 : 0
  }

  const formatDuration = (exercises: any[]) => {
    // Estimate workout duration based on exercise count and type
    // This is a simplified calculation
    const baseTime = exercises.length * 3 // 3 minutes per exercise
    const restTime = exercises.length * 2 // 2 minutes rest between exercises
    return Math.round((baseTime + restTime) / 5) * 5 // Round to nearest 5 minutes
  }

  const getDayName = (index: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[index] || `Day ${index + 1}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-lg shadow-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">⚠️</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Unable to load week view
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'This program week could not be found.'}
              </p>
              <Button onClick={() => router.push('/programs')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const weekProgress = calculateWeekProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/programs/${programId}`)}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Program
            </Button>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Cpu className="w-3 h-3 mr-1" />
              Neural Program
            </Badge>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  Week {weekNumber}
                </h1>
                <ChevronRight className="h-8 w-8 text-gray-400" />
                <h2 className="text-2xl font-semibold text-gray-700">
                  {program.programName}
                </h2>
              </div>
              
              <div className="flex items-center space-x-6 text-gray-600 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {program.workouts?.length || 0} workouts this week
                </div>
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  {completedWorkouts.size} completed
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Week Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(weekProgress)}% complete</span>
                </div>
                <Progress value={weekProgress} className="h-3" />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Stats
              </Button>
              <Link href={`/programs/${programId}`}>
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Program Overview
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {program.workouts?.map((workout, index) => {
            const isCompleted = completedWorkouts.has(workout.id || `workout-${index}`)
            const estimatedDuration = formatDuration(workout.exercises || [])

            return (
              <Card 
                key={workout.id || index} 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${
                  isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : selectedWorkout?.id === workout.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedWorkout(workout)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {workout.name}
                        </CardTitle>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {getDayName(index)}
                        </div>
                        <div className="flex items-center">
                          <Timer className="w-4 h-4 mr-1" />
                          ~{estimatedDuration} min
                        </div>
                        <div className="flex items-center">
                          <Dumbbell className="w-4 h-4 mr-1" />
                          {workout.exercises?.length || 0} exercises
                        </div>
                      </div>
                    </div>
                    
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Exercise Preview */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Exercises</h4>
                        <div className="space-y-1">
                          {workout.exercises.slice(0, 3).map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="text-sm text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              {exercise.name}
                              {exercise.sets && (
                                <span className="ml-auto text-xs text-gray-500">
                                  {exercise.sets} sets
                                </span>
                              )}
                            </div>
                          ))}
                          {workout.exercises.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{workout.exercises.length - 3} more exercises
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {isCompleted ? (
                        <Button variant="outline" className="flex-1 text-green-600 border-green-200">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Completed
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWorkoutStart(workout)
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Workout
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWorkout(workout)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Selected Workout Details */}
        {selectedWorkout && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                {selectedWorkout.name} - Detailed View
              </CardTitle>
              <CardDescription>
                Complete exercise breakdown with sets, reps, and guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedWorkout.exercises?.map((exercise, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {exercise.name}
                        </h4>
                        {exercise.muscleGroups && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {exercise.muscleGroups.map((muscle, muscleIndex) => (
                              <Badge key={muscleIndex} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {exercise.sets && (
                          <div className="text-lg font-semibold text-gray-900">
                            {exercise.sets} sets
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="text-sm text-gray-600">
                            {exercise.reps} reps
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {exercise.load && (
                        <div>
                          <span className="font-medium text-gray-700">Load:</span>
                          <span className="ml-1 text-gray-600">{exercise.load}</span>
                        </div>
                      )}
                      {exercise.rpe && (
                        <div>
                          <span className="font-medium text-gray-700">RPE:</span>
                          <span className="ml-1 text-gray-600">{exercise.rpe}</span>
                        </div>
                      )}
                      {exercise.restBetweenSets && (
                        <div>
                          <span className="font-medium text-gray-700">Rest:</span>
                          <span className="ml-1 text-gray-600">{exercise.restBetweenSets}</span>
                        </div>
                      )}
                    </div>

                    {exercise.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises found for this workout</p>
                  </div>
                )}

                <div className="flex justify-center space-x-4 pt-4">
                  <Button 
                    onClick={() => handleWorkoutStart(selectedWorkout)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start This Workout
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedWorkout(null)}
                  >
                    Close Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Summary */}
        {weekProgress > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Week {weekNumber} Progress
                  </h3>
                  <p className="text-gray-600">
                    {completedWorkouts.size} of {program.workouts?.length || 0} workouts completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {Math.round(weekProgress)}%
                  </div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
