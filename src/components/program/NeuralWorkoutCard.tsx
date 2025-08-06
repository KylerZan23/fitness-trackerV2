'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Target, 
  Activity, 
  Timer, 
  CheckCircle, 
  Circle,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Workout, Exercise } from '@/types/neural'
import { NeuralExerciseDetail } from './NeuralExerciseDetail'

interface NeuralWorkoutCardProps {
  /** Workout data */
  workout: Workout
  /** Program name for context */
  programName?: string
  /** Week number for context */
  weekNumber?: number
  /** Callback when back button is pressed */
  onBack?: () => void
  /** Callback when workout is started */
  onStart?: () => void
  /** Selected exercise ID for detail view */
  selectedExerciseId?: string
  /** Callback when exercise is selected */
  onExerciseSelect?: (exerciseId: string) => void
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

interface ExerciseGroupProps {
  title: string
  exercises: Exercise[]
  icon: React.ReactNode
  color: string
  defaultExpanded?: boolean
  onExerciseSelect: (exercise: Exercise) => void
}

function ExerciseGroup({ 
  title, 
  exercises, 
  icon, 
  color, 
  defaultExpanded = true,
  onExerciseSelect 
}: ExerciseGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  if (exercises.length === 0) return null

  return (
    <Card className="border border-gray-200">
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-600">{exercises.length} exercises</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onExerciseSelect(exercise)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="font-medium">{exercise.sets} sets</span>
                        <span>{exercise.reps} reps</span>
                        <span>{exercise.load}</span>
                        {exercise.rpe && (
                          <Badge variant="outline" className="text-xs">
                            RPE {exercise.rpe}
                          </Badge>
                        )}
                      </div>
                      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exercise.targetMuscles.slice(0, 3).map((muscle, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                          {exercise.targetMuscles.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{exercise.targetMuscles.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exercise.rest}
                      </div>
                      <div className="text-xs text-gray-500">rest</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function NeuralWorkoutCard({
  workout,
  programName,
  weekNumber,
  onBack,
  onStart,
  selectedExerciseId,
  onExerciseSelect,
  isLoading = false,
  className
}: NeuralWorkoutCardProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    if (selectedExerciseId) {
      const allExercises = [...workout.warmup, ...workout.mainExercises, ...(workout.finisher || [])]
      const exercise = allExercises.find(e => e.id === selectedExerciseId)
      setSelectedExercise(exercise || null)
    } else {
      setSelectedExercise(null)
    }
  }, [selectedExerciseId, workout])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    onExerciseSelect?.(exercise.id)
  }

  const handleBackToWorkout = () => {
    setSelectedExercise(null)
    onExerciseSelect?.('')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const totalExercises = workout.warmup.length + workout.mainExercises.length + (workout.finisher?.length || 0)

  // If an exercise is selected, show the exercise detail
  if (selectedExercise) {
    return (
      <div className={className}>
        <NeuralExerciseDetail
          exercise={selectedExercise}
          onBack={handleBackToWorkout}
          workoutName={workout.name}
          programName={programName}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Workout Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Program
            </Button>
            
            {/* Timer Display */}
            {isTimerRunning && (
              <div className="flex items-center space-x-2 bg-white/80 px-3 py-1 rounded-full">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm font-semibold">
                  {formatTime(workoutTimer)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {programName && (
                  <Badge variant="outline" className="text-xs">
                    {programName}
                  </Badge>
                )}
                {weekNumber && (
                  <Badge variant="outline" className="text-xs">
                    Week {weekNumber}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {workout.name}
              </CardTitle>
              <p className="text-gray-600">{workout.focus}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Workout Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-blue-200/50">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">{workout.duration}min</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200/50">
              <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">{totalExercises}</div>
              <div className="text-xs text-gray-600">Exercises</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-indigo-200/50">
              <Timer className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">{workout.totalEstimatedTime}min</div>
              <div className="text-xs text-gray-600">Total Time</div>
            </div>
          </div>

          {/* Start Workout Button */}
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
            onClick={() => {
              setIsTimerRunning(true)
              onStart?.()
            }}
            disabled={isTimerRunning}
          >
            {isTimerRunning ? (
              <>
                <Timer className="w-5 h-5 mr-2" />
                Workout In Progress
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Workout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Exercise Groups */}
      <div className="space-y-4">
        {/* Warmup */}
        <ExerciseGroup
          title="Warmup"
          exercises={workout.warmup}
          icon={<Zap className="w-4 h-4 text-white" />}
          color="bg-gradient-to-r from-orange-500 to-red-500"
          onExerciseSelect={handleExerciseSelect}
        />

        {/* Main Exercises */}
        <ExerciseGroup
          title="Main Exercises"
          exercises={workout.mainExercises}
          icon={<Brain className="w-4 h-4 text-white" />}
          color="bg-gradient-to-r from-blue-600 to-purple-600"
          onExerciseSelect={handleExerciseSelect}
        />

        {/* Finisher */}
        {workout.finisher && (
          <ExerciseGroup
            title="Finisher"
            exercises={workout.finisher}
            icon={<Flame className="w-4 h-4 text-white" />}
            color="bg-gradient-to-r from-emerald-500 to-teal-500"
            onExerciseSelect={handleExerciseSelect}
            defaultExpanded={false}
          />
        )}
      </div>

      {/* Neural Coaching Tips */}
      <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Neural's Coaching Tips</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Focus on movement quality over speed during warmup exercises</li>
                <li>• Use RPE guidance to autoregulate intensity for main exercises</li>
                <li>• Rest periods are scientifically optimized for your training adaptations</li>
                <li>• Tap any exercise for detailed form cues and coaching insights</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NeuralWorkoutCard
