'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Brain, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NeuralProgramDisplay } from '@/components/program/NeuralProgramDisplay'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { TrainingProgram, Workout, Exercise } from '@/types/neural'

interface ProgramData {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  program: {
    id: string
    userId: string
    programName: string
    weekNumber: number
    // Persisted Neural program content follows the TrainingProgram/Workout types
    workouts: Workout[]
    progressionNotes: string
    createdAt: string
    neuralInsights: string
  }
  metadata: Record<string, any>
}

interface ProgramPageProps {}

// Transform API response to match the Neural display components (Workout/mainExercises)
const transformProgramData = (apiProgram: ProgramData): TrainingProgram => {
  const transformedWorkouts: Workout[] = apiProgram.program.workouts.map((workout: any) => {
    const mainExercises: Exercise[] = Array.isArray(workout.mainExercises) ? workout.mainExercises : []
    const warmup: Exercise[] = Array.isArray(workout.warmup) ? workout.warmup : []
    const finisher: Exercise[] | undefined = Array.isArray(workout.finisher) ? workout.finisher : undefined

    const duration = typeof workout.duration === 'number'
      ? workout.duration
      : (typeof workout.totalEstimatedTime === 'number' ? workout.totalEstimatedTime : 0)

    return {
      id: workout.id,
      name: workout.name,
      duration,
      focus: workout.focus ?? 'General',
      warmup,
      mainExercises,
      finisher,
      totalEstimatedTime: duration,
    }
  })

  return {
    id: apiProgram.program.id,
    userId: apiProgram.program.userId,
    programName: apiProgram.program.programName,
    weekNumber: apiProgram.program.weekNumber,
    workouts: transformedWorkouts,
    progressionNotes: apiProgram.program.progressionNotes,
    createdAt: new Date(apiProgram.createdAt),
    neuralInsights: apiProgram.program.neuralInsights,
  }
}

export default function ProgramPage() {
  const router = useRouter()
  const [program, setProgram] = useState<ProgramData | null>(null)
  const [transformedProgram, setTransformedProgram] = useState<TrainingProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const params = useParams()
  const programId = useMemo(() => params.id, [params.id]) as string;

  useEffect(() => {
    const checkAuthAndFetchProgram = async () => {
      try {
        // Check authentication
        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          toast.error('Please log in to view your program')
          router.push(`/login?redirect=/programs/${programId}`)
          return
        }

        // Check for fresh program data from onboarding (avoids fetch dependency)
        let freshProgramData = null
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('freshProgram')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              if (parsed.id === programId) {
                freshProgramData = parsed
                // Clear the stored data after use
                sessionStorage.removeItem('freshProgram')
              }
            } catch (e) {
              console.warn('Failed to parse fresh program data:', e)
            }
          }
        }

        if (freshProgramData) {
          // Use the fresh program data directly (from onboarding)
          const data = {
            id: freshProgramData.id,
            userId: session.user.id,
            createdAt: freshProgramData.createdAt,
            updatedAt: freshProgramData.createdAt,
            program: freshProgramData.program,
            metadata: { source: 'neural-onboarding' }
          }
          setProgram(data)
          
          // Transform the data for the display component
          const transformed = transformProgramData(data)
          setTransformedProgram(transformed)
        } else {
          // Fallback to fetch with intelligent retry for transient failures
          const { retryProgramFetch } = await import('@/lib/utils/retryFetch')
          const result = await retryProgramFetch(programId)

          if (!result.success) {
            const error = result.error
            
            if (error?.message?.includes('401')) {
              toast.error('Please log in to view this program')
              router.push(`/login?redirect=/programs/${programId}`)
              return
            } else if (error?.message?.includes('404')) {
              // After retries, this is likely a real 404
              setError(`Program not found (attempted ${result.attempts} times over ${Math.round(result.totalTime/1000)}s)`)
            } else if (error?.message?.includes('403')) {
              setError('You do not have permission to view this program')
            } else {
              setError(`Failed to load program after ${result.attempts} attempts: ${error?.message || 'Unknown error'}`)
            }
            return
          }

          const data = result.data
          setProgram(data)
          
          // Transform the data for the display component
          const transformed = transformProgramData(data)
          setTransformedProgram(transformed)
          
          // Log successful retry info for debugging
          if (result.attempts > 1) {
            console.log(`[ProgramFetch] ✅ Program loaded after ${result.attempts} attempts in ${Math.round(result.totalTime/1000)}s`)
          }
        }
      } catch (err) {
        console.error('Failed to fetch program:', err)
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (programId) {
      checkAuthAndFetchProgram()
    }
  }, [programId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Loading Your Program
          </h3>
          <p className="text-gray-700">
            Retrieving your personalized training program...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center shadow-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {error}
          </h3>
          <p className="text-gray-700 mb-6">
            {error === 'Program not found' 
              ? 'This program does not exist or you do not have access to it.'
              : 'Please try again later or contact support if the problem persists.'
            }
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => router.push('/programs')}>
              View All Programs
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!program || !transformedProgram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Program Not Found
          </h3>
          <Button onClick={() => router.push('/programs')}>
            View All Programs
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalWorkouts = transformedProgram.workouts.length
  const avgDuration = totalWorkouts > 0
    ? Math.round(
        transformedProgram.workouts.reduce((sum, w) => sum + (w.duration ?? 0), 0) / totalWorkouts
      )
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/programs')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Programs
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              Neural Generated
            </Badge>
          </div>

          {/* Program Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">
                    {program.program.programName}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Week {program.program.weekNumber} • Created {formatDate(program.createdAt)}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {totalWorkouts} workouts/week
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~{avgDuration} min avg
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Neural Insights</h4>
                  <p className="text-gray-700">{program.program.neuralInsights}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Progression Notes</h4>
                  <p className="text-gray-700">{program.program.progressionNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Display */}
          <NeuralProgramDisplay program={transformedProgram} />
        </div>
      </div>
    </div>
  )
}
