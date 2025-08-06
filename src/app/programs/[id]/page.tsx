'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Play, 
  BarChart3, 
  Settings, 
  Share2, 
  Copy,
  Cpu,
  Target,
  TrendingUp,
  User,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { NeuralProgramDisplay } from '@/components/program/NeuralProgramDisplay'
import type { TrainingProgram } from '@/types/neural'

/**
 * Individual Neural Program View
 * 
 * Detailed view of a specific Neural-generated training program.
 * Displays workouts, progress tracking, and Neural insights.
 */
export default function ProgramView() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  
  const [program, setProgram] = useState<TrainingProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)

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
          router.push(`/login?redirect=/programs/${programId}`)
          return
        }

        // Fetch program from API
        const response = await fetch(`/api/programs/${programId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Program not found')
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this program')
          }
          throw new Error('Failed to load program')
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load program')
        }

        setProgram(result.data)
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

    if (programId) {
      loadProgram()
    }
  }, [programId, router])

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkoutId(workoutId)
  }

  const handleWorkoutStart = (workoutId: string) => {
    // Navigate to workout session
    router.push(`/programs/${programId}/week/${program?.weekNumber}/workout/${workoutId}`)
  }

  const handleShareProgram = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Program link copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const calculateProgramProgress = () => {
    if (!program?.workouts) return 0
    
    // This is a simplified calculation - in a real app you'd track actual completion
    const totalWorkouts = program.workouts.length
    const completedWorkouts = 0 // This would come from workout session data
    
    return totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-white rounded-lg shadow-md"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-white rounded-lg shadow-md"></div>
                <div className="h-32 bg-white rounded-lg shadow-md"></div>
              </div>
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
                Unable to load program
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'This program could not be found or you do not have permission to view it.'}
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

  const progressPercentage = calculateProgramProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/programs')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Button>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Cpu className="w-3 h-3 mr-1" />
              Neural Program
            </Badge>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {program.programName}
              </h1>
              <div className="flex items-center space-x-6 text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Week {program.weekNumber}
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Created {formatDate(program.createdAt)}
                </div>
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Program
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleShareProgram}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Link href={`/programs/${programId}/week/${program.weekNumber}`}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Play className="mr-2 h-4 w-4" />
                  Start Week
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Program Display */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="insights">Neural Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Program Overview</CardTitle>
                    <CardDescription>
                      Your personalized Neural training program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {program.workouts?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Workouts</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {program.weekNumber}
                        </div>
                        <div className="text-sm text-gray-600">Week</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {Math.round(progressPercentage)}%
                        </div>
                        <div className="text-sm text-gray-600">Complete</div>
                      </div>
                    </div>
                    
                    {program.progressionNotes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Progression Notes</h4>
                        <p className="text-gray-700 leading-relaxed">
                          {program.progressionNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workouts" className="space-y-6">
                <NeuralProgramDisplay
                  program={program}
                  selectedWorkoutId={selectedWorkoutId}
                  onWorkoutSelect={handleWorkoutSelect}
                  onWorkoutStart={handleWorkoutStart}
                  className="bg-white"
                />
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Cpu className="mr-2 h-5 w-5 text-blue-600" />
                      Neural Insights
                    </CardTitle>
                    <CardDescription>
                      AI-generated analysis and recommendations for your program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {program.neuralInsights ? (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        {program.neuralInsights}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Neural insights will appear as your program progresses</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link 
                  href={`/programs/${programId}/week/${program.weekNumber}`}
                  className="w-full"
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Play className="mr-2 h-4 w-4" />
                    Start Current Week
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Program Settings
                </Button>
              </CardContent>
            </Card>

            {/* Program Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Workouts</span>
                  <span className="font-semibold">{program.workouts?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Week</span>
                  <span className="font-semibold">{program.weekNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold text-sm">
                    {formatDate(program.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Neural Badge */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Neural Powered</h3>
                <p className="text-sm text-gray-600">
                  This program was generated using advanced AI to match your specific goals and preferences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
