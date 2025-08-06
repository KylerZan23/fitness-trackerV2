'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Clock, User, Share2, Cpu, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
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

        // Fetch programs from API
        const response = await fetch('/api/programs')
        
        if (!response.ok) {
          throw new Error('Failed to load programs')
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load programs')
        }

        setPrograms(result.data || [])
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-lg shadow-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <Cpu className="mr-3 h-8 w-8 text-blue-600" />
                Neural Programs
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                AI-powered training programs tailored to your goals and preferences. 
                Each program adapts and evolves with your progress.
              </p>
            </div>
            <Button 
              onClick={handleCreateNewProgram}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Neural Program
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <div className="mr-3">⚠️</div>
                <div>
                  <h3 className="font-semibold">Unable to load programs</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Programs Grid */}
        {programs.length === 0 && !error ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Ready to start your Neural journey?
                </h2>
                <p className="text-gray-600 mb-8 max-w-md">
                  Create your first AI-powered training program. Neural analyzes your goals, 
                  experience, and preferences to build the perfect workout plan.
                </p>
                <Button 
                  onClick={handleCreateNewProgram}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Program
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <Link href={`/programs/${program.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {program.program_name}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Week {program.week_number}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Cpu className="w-3 h-3 mr-1" />
                        Neural
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Created</span>
                        <span>{formatDate(program.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last Updated</span>
                        <span>{formatDate(program.updated_at)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Program
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {programs.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors duration-200">
              <CardContent className="p-6">
                <button 
                  onClick={handleCreateNewProgram}
                  className="w-full text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Create New Program</h3>
                    <p className="text-sm text-gray-600">
                      Generate a fresh Neural program with updated preferences
                    </p>
                  </div>
                </button>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Share Progress</h3>
                  <p className="text-sm text-gray-600">
                    Share your Neural programs with friends and trainers
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6">
                <Link href="/analytics" className="block">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Track your progress and Neural insights
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
