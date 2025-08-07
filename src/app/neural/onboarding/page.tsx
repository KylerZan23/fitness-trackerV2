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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your Neural Program
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of personalized training with AI-powered program generation 
              tailored specifically to your goals, experience, and preferences.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
