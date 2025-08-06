'use client'

import React, { useState, useEffect } from 'react'
import { Brain, ChevronLeft, ChevronRight, Calendar, Clock, Target, TrendingUp, Book, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrainingProgram, Workout } from '@/types/neural'
import { NeuralWorkoutCard } from './NeuralWorkoutCard'

interface NeuralProgramDisplayProps {
  /** Training program data */
  program: TrainingProgram
  /** Currently selected workout ID */
  selectedWorkoutId?: string
  /** Callback when workout is selected */
  onWorkoutSelect?: (workoutId: string) => void
  /** Callback when workout is started */
  onWorkoutStart?: (workoutId: string) => void
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string
  /** Additional CSS classes */
  className?: string
}

export function NeuralProgramDisplay({
  program,
  selectedWorkoutId,
  onWorkoutSelect,
  onWorkoutStart,
  isLoading = false,
  error,
  className
}: NeuralProgramDisplayProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [showInsights, setShowInsights] = useState(false)

  useEffect(() => {
    if (selectedWorkoutId) {
      const workout = program.workouts.find(w => w.id === selectedWorkoutId)
      setSelectedWorkout(workout || null)
    } else {
      setSelectedWorkout(null)
    }
  }, [selectedWorkoutId, program.workouts])

  const handleWorkoutSelect = (workout: Workout) => {
    setSelectedWorkout(workout)
    onWorkoutSelect?.(workout.id)
  }

  const handleBackToProgram = () => {
    setSelectedWorkout(null)
    onWorkoutSelect?.('')
  }

  // If a workout is selected, show the workout detail
  if (selectedWorkout) {
    return (
      <div className={className}>
        <NeuralWorkoutCard
          workout={selectedWorkout}
          onBack={handleBackToProgram}
          onStart={() => onWorkoutStart?.(selectedWorkout.id)}
          programName={program.programName}
          weekNumber={program.weekNumber}
        />
      </div>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Program</h3>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Neural Program Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            {/* Neural Branding Icon */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <Lightbulb className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Coach Neural
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  Week {program.weekNumber}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {program.programName}
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Science-based training designed specifically for your goals
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Program Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-blue-200/50">
              <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">{program.workouts.length}</div>
              <div className="text-xs text-gray-600">Workouts</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200/50">
              <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">
                {Math.round(program.workouts.reduce((sum, w) => sum + w.duration, 0) / program.workouts.length)}min
              </div>
              <div className="text-xs text-gray-600">Avg Duration</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-indigo-200/50">
              <Target className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">
                {program.workouts.reduce((sum, w) => sum + w.mainExercises.length, 0)}
              </div>
              <div className="text-xs text-gray-600">Exercises</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-emerald-200/50">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900">Adaptive</div>
              <div className="text-xs text-gray-600">Progression</div>
            </div>
          </div>

          {/* Neural Insights Toggle */}
          <Button
            variant="ghost"
            onClick={() => setShowInsights(!showInsights)}
            className="w-full justify-between mb-4 border border-blue-200 hover:bg-blue-50"
          >
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Neural's Program Insights</span>
            </div>
            {showInsights ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Neural Insights Panel */}
          {showInsights && (
            <Card className="mb-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Book className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Evidence-Based Design</h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {program.neuralInsights || "This program integrates progressive overload principles with volume landmarks theory. Each exercise selection and progression follows evidence-based protocols from leading exercise science research."}
                    </p>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Key Principles:</span> Progressive Overload • Volume Landmarks • RPE Autoregulation • Specificity
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progression Notes */}
          {program.progressionNotes && (
            <Card className="mb-6 border border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Progression Strategy</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {program.progressionNotes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Workout Selection Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span>This Week's Workouts</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {program.workouts.map((workout, index) => (
            <Card 
              key={workout.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                "border-gray-200 hover:border-blue-300"
              )}
              onClick={() => handleWorkoutSelect(workout)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <p className="text-sm text-gray-600">{workout.focus}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{workout.duration}min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{workout.mainExercises.length} exercises</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {workout.totalEstimatedTime}min total
                  </Badge>
                </div>
                
                {/* Exercise Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Key Exercises:</p>
                  <div className="flex flex-wrap gap-1">
                    {workout.mainExercises.slice(0, 3).map((exercise, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {exercise.name}
                      </Badge>
                    ))}
                    {workout.mainExercises.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{workout.mainExercises.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NeuralProgramDisplay
