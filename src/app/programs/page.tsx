'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Share2, Cpu, Target, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/Sidebar'
// Removed import for decommissioned programs module
interface ProgramSummary {
  id: string;
  program_name: string;
  week_number: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/**
 * Neural Programs Dashboard
 * 
 * Main dashboard for viewing and managing Neural-generated training programs.
 * Provides quick access to create new programs and view existing ones.
 */
export default function ProgramsDashboard() {
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('User')
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Verify authentication
        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          toast.error('Please log in to view your programs')
          router.push('/login?redirect=/programs')
          return
        }

        // Populate sidebar user info
        const email = session.user.email || undefined
        setUserEmail(email)
        setUserName(session.user.user_metadata?.full_name || email?.split('@')[0] || 'User')
        setProfilePictureUrl(session.user.user_metadata?.avatar_url || null)

        // Fetch programs from API with retry for transient failures
        const { retryFetch } = await import('@/lib/utils/retryFetch')
        const result = await retryFetch('/api/programs', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }, {
          maxAttempts: 3,
          initialDelay: 500,
          retryableStatusCodes: [500, 502, 503, 504], // Don't retry 404s for list
          enableLogging: process.env.NODE_ENV === 'development'
        })
        
        if (!result.success) {
          const error = result.error
          throw new Error(`Failed to load programs after ${result.attempts} attempts: ${error?.message || 'Unknown error'}`)
        }

        const data = result.data
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load programs')
        }

        setPrograms(data.data || [])
        
        // Log successful retry info for debugging
        if (result.attempts > 1) {
          console.log(`[ProgramsList] ✅ Programs loaded after ${result.attempts} attempts in ${Math.round(result.totalTime/1000)}s`)
        }
      } catch (err) {
        console.error('Error loading programs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load programs')
        toast.error('Unable to load your programs')
      } finally {
        setIsLoading(false)
      }
    }

    loadPrograms()
  }, [router])

  const handleCreateNewProgram = () => {
    router.push('/neural/onboarding')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          profilePictureUrl={profilePictureUrl}
          onLogout={async () => {
            const supabase = await createClient()
            await supabase.auth.signOut()
            router.push('/login')
          }}
        />
        <div className="max-w-7xl mx-auto animate-pulse md:ml-64 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/60"></div>
              <div>
                <div className="h-7 w-56 bg-white/60 rounded"></div>
                <div className="mt-2 h-4 w-96 bg-white/50 rounded"></div>
              </div>
            </div>
            <div className="h-10 w-56 bg-white/60 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/60" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-white/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Sidebar */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        profilePictureUrl={profilePictureUrl}
        onLogout={async () => {
          const supabase = await createClient()
          await supabase.auth.signOut()
          router.push('/login')
        }}
      />

      {/* Main content area with left offset for fixed sidebar */}
      <div className="max-w-7xl mx-auto md:ml-64 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur flex items-center justify-center shadow-sm">
                <Cpu className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Neural Programs</h1>
                <p className="text-gray-600 text-sm md:text-base">
                  AI-tailored programs to guide your weekly progress and maximize outcomes.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateNewProgram}
              size="lg"
              className="rounded-full bg-black text-white hover:bg-black/90"
            >
              Create Neural Program
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200/60 bg-red-50/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center text-red-700">
                <div className="mr-3">⚠️</div>
                <div>
                  <h3 className="font-semibold">Unable to load programs</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions (top) */}
        {programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border border-gray-200/60 bg-white/70 backdrop-blur hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <button onClick={handleCreateNewProgram} className="flex items-start w-full text-left">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mr-4">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create New Program</h3>
                    <p className="text-sm text-gray-600">Start a fresh AI plan</p>
                  </div>
                </button>
              </CardContent>
            </Card>
            <Card className="border border-gray-200/60 bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center mr-4">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Share Progress</h3>
                    <p className="text-sm text-gray-600">Showcase your journey</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200/60 bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <Link href="/analytics" className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mr-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-600">Insights and trends</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Programs Grid */}
        {programs.length === 0 && !error ? (
          <Card className="text-center py-12 bg-white/70 backdrop-blur">
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Ready to start your Neural journey?
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Create your first AI-powered training program tailored to your goals and schedule.
                </p>
                <Button onClick={handleCreateNewProgram} size="lg" className="rounded-full bg-black text-white hover:bg-black/90">
                  Create Your First Program
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card
                key={program.id}
                className="border border-gray-200/60 bg-white/70 backdrop-blur hover:shadow-lg transition-all cursor-pointer"
              >
                <Link href={`/programs/${program.id}`} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {program.program_name}
                        </CardTitle>
                        <div className="text-sm text-gray-600">Week {program.week_number}</div>
                      </div>
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                        <Cpu className="w-3 h-3 mr-1" />
                        Neural
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          Created
                        </div>
                        <span className="text-gray-600">{formatDate(program.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          Updated
                        </div>
                        <span className="text-gray-600">{formatDate(program.updated_at)}</span>
                      </div>
                      <div className="pt-2">
                        <div className="inline-flex items-center text-indigo-600 font-medium">
                          View Program
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
        
      </div>
    </div>
  )
}
