'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { NeuralOnboardingFlow } from '@/components/onboarding/NeuralOnboardingFlow'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { OnboardingCompletionData } from '@/types/neural'

/**
 * Neural Onboarding Page
 * 
 * This is the dedicated Neural onboarding flow for creating AI-powered training programs.
 * Different from the general onboarding, this focuses specifically on Neural program generation.
 */
export default function NeuralOnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const getUserSession = async () => {
      const supabase = await createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        toast.error('Please log in to access Neural onboarding')
        router.push('/login?redirect=/neural/onboarding')
        return
      }

      setUserId(session.user.id)
      setIsLoading(false)
    }

    getUserSession()
  }, [router])

  const handleComplete = async (programData: OnboardingCompletionData) => {
    console.log('Neural onboarding completed with program data:', programData)
    
    try {
      // If we have the full program data, store it to avoid fetch dependency
      if (programData?.program && programData?.programId) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('freshProgram', JSON.stringify({
            id: programData.programId,
            program: programData.program,
            createdAt: programData.createdAt || new Date().toISOString()
          }))
        }
        toast.success('Your Neural program has been created!')
        router.push(`/programs/${programData.programId}`)
      } else if (programData?.programId) {
        // Fallback: redirect with ID only (will trigger fetch)
        toast.success('Your Neural program has been created!')
        router.push(`/programs/${programData.programId}`)
      } else {
        // Fallback to programs dashboard
        toast.success('Neural onboarding completed!')
        router.push('/programs')
      }
    } catch (error) {
      console.error('Error handling Neural onboarding completion:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push('/programs')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Loading Neural Onboarding
          </h3>
          <p className="text-gray-700">
            Preparing your personalized program creation experience...
          </p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null // Will redirect to login
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -top-10 left-0 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-sm font-medium shadow-sm backdrop-blur">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {/* Brain glyph via emoji to avoid heavy icon here */}
                🧠
              </span>
              <span className="text-blue-700">Coach Neural</span>
            </div>
            <h1 className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
              Create Your Neural Program
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600 md:text-xl">
              AI-crafted programming tailored to your goals, experience, and schedule.
            </p>
          </div>

          {/* Flow container */}
          <div className="rounded-2xl border border-blue-200/50 bg-white/80 shadow-xl backdrop-blur-sm">
            <NeuralOnboardingFlow
              userId={userId}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
