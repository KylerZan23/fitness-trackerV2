'use client'

/**
 * Run Logger Page
 * ------------------------------------------------
 * A page for logging running activities via Strava integration
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { StravaConnect } from '@/components/run/StravaConnect'
import { RunList } from '@/components/run/RunList'
import { StravaRunList } from '@/components/run/StravaRunList'
import { ManualRunLogger } from '@/components/run/ManualRunLogger'

export default function RunLoggerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isStravaConnected, setIsStravaConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'card-view' | 'table-view' | 'log'>('card-view')
  const runId = searchParams?.get('runId')

  // Check authentication
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        
        // Get current session
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
        setUserId(currentSession.user.id)
      } catch (err) {
        console.error('Run Logger error:', err)
        // Safe error handling with type checking
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? String(err.message) 
          : 'An error occurred while loading the run logger'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionData) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (sessionData) {
        setSession(sessionData)
        setUserId(sessionData.user.id)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router])
  
  // If run ID is provided, default to card view
  useEffect(() => {
    if (runId) {
      setActiveTab('card-view')
    }
  }, [runId])
  
  const handleRunLogged = () => {
    // Refresh the run list when a new run is logged
    setActiveTab('card-view')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-lg">
          <h1 className="text-2xl font-serif font-bold mb-4">Run Logger Error</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors flex-1"
            >
              Retry
            </button>
            <Link
              href="/dashboard"
              className="border border-white text-white px-4 py-2 rounded-full font-medium hover:bg-white/20 transition-colors flex-1 text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">FitnessTracker</Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif mb-8">Run Logger</h1>
        
        {/* Strava Connect Component */}
        {userId && (
          <StravaConnect 
            userId={userId} 
            onConnectionChange={setIsStravaConnected} 
          />
        )}
        
        {/* Tabs for switching between viewing runs and logging runs */}
        <div className="mb-6 border-b border-white/10">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('card-view')}
              className={`py-3 px-2 relative ${
                activeTab === 'card-view' 
                  ? 'text-white font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Card View
              {activeTab === 'card-view' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('table-view')}
              className={`py-3 px-2 relative ${
                activeTab === 'table-view' 
                  ? 'text-white font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Table View
              {activeTab === 'table-view' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`py-3 px-2 relative ${
                activeTab === 'log' 
                  ? 'text-white font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Log Run
              {activeTab === 'log' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'card-view' && userId && (
          <StravaRunList userId={userId} isConnected={isStravaConnected} />
        )}
        
        {activeTab === 'table-view' && userId && (
          <RunList userId={userId} isConnected={isStravaConnected} />
        )}
        
        {activeTab === 'log' && userId && (
          <ManualRunLogger 
            userId={userId} 
            isConnected={isStravaConnected} 
            onRunLogged={handleRunLogged} 
          />
        )}
      </main>
    </div>
  )
} 