'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fetchActiveProgramAction, type CompletedDayIdentifier } from '@/app/_actions/aiProgramActions'
import { type TrainingProgram } from '@/lib/types/program'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Calendar, Target, Clock } from 'lucide-react'
import { ProgramPhaseDisplay } from '@/components/program/ProgramPhaseDisplay'

interface UserProfile {
  id: string
  name: string
  email: string
  profile_picture_url?: string
}

export default function ProgramPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [programData, setProgramData] = useState<TrainingProgram | null>(null)
  const [completedDays, setCompletedDays] = useState<CompletedDayIdentifier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(`Session error: ${sessionError.message}`)
        return
      }

      if (!currentSession) {
        router.push('/login')
        return
      }

      setSession(currentSession)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, profile_picture_url')
        .eq('id', currentSession.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError)
      }

      if (profileData) {
        setProfile(profileData)
      } else {
        // Create minimal profile if it doesn't exist
        const newProfile = {
          id: currentSession.user.id,
          name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
          email: currentSession.user.email || '',
        }
        setProfile(newProfile)
      }

      // Fetch training program using server action
      const result = await fetchActiveProgramAction()
      
      if (result.error) {
        setError(result.error)
      } else {
        setProgramData(result.program)
        setCompletedDays(result.completedDays || [])
        
        // Console log the full program data as requested
        if (result.program) {
          console.log('Successfully fetched training program:', result.program)
          console.log('Completed workout days:', result.completedDays)
        }
      }

    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: 'Loading...',
          userEmail: '',
          onLogout: handleLogout,
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your training program...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: profile?.name || 'User',
          userEmail: profile?.email || '',
          profilePictureUrl: profile?.profile_picture_url,
          onLogout: handleLogout,
        }}
      >
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
          {error}
        </div>
        <div className="text-center">
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!programData) {
    return (
      <DashboardLayout
        sidebarProps={{
          userName: profile?.name || 'User',
          userEmail: profile?.email || '',
          profilePictureUrl: profile?.profile_picture_url,
          onLogout: handleLogout,
        }}
      >
        <div className="text-center space-y-6">
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-2xl">No Active Training Program</CardTitle>
              <CardDescription>
                You don't have an active training program yet. Complete your onboarding to generate a personalized program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  Complete Onboarding
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      sidebarProps={{
        userName: profile?.name || 'User',
        userEmail: profile?.email || '',
        profilePictureUrl: profile?.profile_picture_url,
        onLogout: handleLogout,
      }}
    >
      <div className="space-y-6">
        {/* Program Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {programData.programName}
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                {programData.description}
              </p>
            </div>
          </div>
          
          {/* Program Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {programData.durationWeeksTotal} weeks
                </p>
              </div>
            </div>
            
            {programData.trainingFrequency && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Frequency</p>
                  <p className="text-xl font-bold text-gray-900">
                    {programData.trainingFrequency}x per week
                  </p>
                </div>
              </div>
            )}
            
            {programData.difficultyLevel && (
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Level</p>
                  <p className="text-xl font-bold text-gray-900">
                    {programData.difficultyLevel}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* General Advice */}
        {programData.generalAdvice && (
          <Card>
            <CardHeader>
              <CardTitle>General Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">
                {programData.generalAdvice}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Required Equipment */}
        {programData.requiredEquipment && programData.requiredEquipment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {programData.requiredEquipment.map((equipment, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Program Phases */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Training Program Details
            </h2>
            <p className="text-gray-600">
              Your personalized training program is organized into phases. Click on each phase and week to explore detailed workouts and exercises.
            </p>
          </div>
          
          {programData.phases.map((phase, phaseIndex) => (
            <ProgramPhaseDisplay 
              key={`phase-${phaseIndex}`}
              phase={phase} 
              phaseIndex={phaseIndex}
              completedDays={completedDays}
            />
          ))}
        </div>

        {/* Development Note - Updated for Phase 3.2 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✅ <strong>Phase 3.2 Complete:</strong> Your training program is now fully detailed with expandable phases, weeks, and individual workout days. You can explore every exercise with complete instructions, sets, reps, and rest periods.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
} 