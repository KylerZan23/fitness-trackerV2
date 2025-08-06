'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  Clock, 
  Activity, 
  Play, 
  Book, 
  Lightbulb, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Video,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Exercise } from '@/types/neural'

interface NeuralExerciseDetailProps {
  /** Exercise data */
  exercise: Exercise
  /** Workout name for context */
  workoutName?: string
  /** Program name for context */
  programName?: string
  /** Callback when back button is pressed */
  onBack?: () => void
  /** Callback when exercise is started */
  onStart?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

interface RPEGuideProps {
  rpeRange: string
}

function RPEGuide({ rpeRange }: RPEGuideProps) {
  const getRPEInfo = (rpe: string) => {
    // Extract numeric values from RPE string (e.g., "7-8" -> 7.5)
    const rpeNum = parseFloat(rpe.split('-')[0]) || 7
    
    if (rpeNum <= 6) {
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        description: 'Easy - Could do many more reps',
        intensity: 'Light'
      }
    } else if (rpeNum <= 7) {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
        description: 'Moderate - Could do 3-4 more reps',
        intensity: 'Moderate'
      }
    } else if (rpeNum <= 8) {
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        description: 'Hard - Could do 2-3 more reps',
        intensity: 'Hard'
      }
    } else {
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        description: 'Very Hard - 0-1 reps in reserve',
        intensity: 'Very Hard'
      }
    }
  }

  const rpeInfo = getRPEInfo(rpeRange)

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>RPE Guidance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3 mb-3">
          <Badge className={cn("px-3 py-1", rpeInfo.color)}>
            RPE {rpeRange}
          </Badge>
          <Badge variant="outline">
            {rpeInfo.intensity}
          </Badge>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          {rpeInfo.description}
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <span className="font-semibold">Neural's Tip:</span> RPE allows you to autoregulate intensity based on daily readiness. If you feel stronger today, push closer to the higher end of the range.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function NeuralExerciseDetail({
  exercise,
  workoutName,
  programName,
  onBack,
  onStart,
  isLoading = false,
  className
}: NeuralExerciseDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'progression'>('overview')
  const [setTimer, setSetTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSetTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseRestTime = (restString: string): number => {
    // Extract seconds from rest string (e.g., "90 seconds" -> 90, "2 minutes" -> 120)
    const match = restString.match(/(\d+)\s*(second|minute|min|sec)/i)
    if (match) {
      const value = parseInt(match[1])
      const unit = match[2].toLowerCase()
      return unit.startsWith('min') ? value * 60 : value
    }
    return 90 // Default to 90 seconds
  }

  const targetRestSeconds = parseRestTime(exercise.rest || '90 seconds')

  return (
    <div className={cn("space-y-6", className)}>
      {/* Exercise Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workout
            </Button>
            
            {/* Set Timer */}
            {isTimerRunning && (
              <div className="flex items-center space-x-2 bg-white/80 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm font-semibold">
                  {formatTime(setTimer)}
                </span>
                {setTimer >= targetRestSeconds && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {workoutName && (
                  <Badge variant="outline" className="text-xs">
                    {workoutName}
                  </Badge>
                )}
                {programName && (
                  <Badge variant="outline" className="text-xs">
                    {programName}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {exercise.name}
              </CardTitle>
              {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {exercise.targetMuscles.map((muscle, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Exercise Prescription */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-blue-200/50">
              <div className="text-lg font-bold text-gray-900">{exercise.sets}</div>
              <div className="text-sm text-gray-600">Sets</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200/50">
              <div className="text-lg font-bold text-gray-900">{exercise.reps}</div>
              <div className="text-sm text-gray-600">Reps</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-indigo-200/50">
              <div className="text-lg font-bold text-gray-900">{exercise.load || 'BW'}</div>
              <div className="text-sm text-gray-600">Load</div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-emerald-200/50">
              <div className="text-lg font-bold text-gray-900">{exercise.rest}</div>
              <div className="text-sm text-gray-600">Rest</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              onClick={() => {
                setSetTimer(0)
                setIsTimerRunning(true)
                onStart?.()
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Set
            </Button>
            
            {setTimer > 0 && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSetTimer(0)
                  setIsTimerRunning(false)
                }}
              >
                Reset Timer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'form', label: 'Form & Cues', icon: Lightbulb },
          { id: 'progression', label: 'Progression', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* RPE Guidance */}
            {exercise.rpe && <RPEGuide rpeRange={exercise.rpe} />}
            
            {/* Exercise Notes */}
            {exercise.notes && (
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Book className="w-5 h-5 text-purple-600" />
                    <span>Exercise Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{exercise.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Scientific Rationale */}
            {exercise.rationale && (
              <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span>Neural's Scientific Rationale</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-3">{exercise.rationale}</p>
                  <div className="text-xs text-blue-700 bg-blue-100 rounded-lg p-3">
                    <span className="font-semibold">Evidence-Based:</span> This exercise selection and prescription is based on current exercise science research and biomechanical principles.
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'form' && (
          <>
            {/* Video Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Video className="w-5 h-5 text-green-600" />
                  <span>Exercise Demonstration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exercise.videoUrl ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Video player would be integrated here</p>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-center">
                      High-quality exercise demonstration<br />
                      <span className="text-sm">Coming soon in Neural Pro</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Cues */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <span>Form Cues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exercise.formCues ? (
                  <div className="space-y-2">
                    {exercise.formCues.split('\n').map((cue, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{cue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Maintain proper alignment throughout the movement</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Focus on controlled movement tempo</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Breathe consistently throughout the set</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <span className="font-semibold">Safety First:</span> Stop the exercise if you feel any pain or discomfort. Form quality is more important than load progression.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'progression' && (
          <>
            {/* Progression Guidelines */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Progression Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">When to Progress Load</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Complete all sets at RPE lower than prescribed range</li>
                      <li>• Maintain excellent form throughout all reps</li>
                      <li>• Feel you could have done 1-2 additional reps on last set</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Progression Strategy</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Increase load by 2.5-5% when ready to progress</li>
                      <li>• Add reps before adding weight for bodyweight exercises</li>
                      <li>• Focus on movement quality over pure load increases</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">When to Deload</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• RPE consistently higher than prescribed range</li>
                      <li>• Form begins to break down during sets</li>
                      <li>• Feeling unusually fatigued or recovering poorly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Neural's Progression Insights */}
            <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Neural's Progression Intelligence</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Coach Neural continuously analyzes your performance data to optimize progression timing. 
                      The AI considers not just this exercise, but your overall training load, recovery markers, 
                      and movement patterns to provide personalized progression recommendations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default NeuralExerciseDetail
