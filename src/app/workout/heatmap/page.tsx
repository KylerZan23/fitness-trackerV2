'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MuscleHeatmap } from '@/components/workout/MuscleHeatmap'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function MuscleHeatmapPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          // Not authenticated - redirect to login
          router.push('/login')
          return
        }
        
        setUserId(session.user.id)
      } catch (err) {
        console.error('Authentication error:', err)
        setError('Failed to authenticate. Please try logging in again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
          <h1 className="text-2xl font-serif font-bold mb-4">Authentication Error</h1>
          <p className="mb-6 text-red-400">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1"
            >
              Retry
            </button>
            <Link
              href="/login"
              className="border border-white text-white px-4 py-2 rounded-full font-medium hover:bg-white/20 transition-colors flex-1 text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <MuscleHeatmap userId={userId || undefined} />
} 