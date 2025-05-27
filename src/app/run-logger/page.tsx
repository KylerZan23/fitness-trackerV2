'use client'

/**
 * Run Logger Page
 * ------------------------------------------------
 * A page for logging running activities via Strava integration
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { StravaConnect } from '@/components/run/StravaConnect'
import { RunList } from '@/components/run/RunList'
import { StravaRunList } from '@/components/run/StravaRunList'
// import { ManualRunLogger } from '@/components/run/ManualRunLogger' // Removed import
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Icon } from '@/components/ui/Icon'
import { Error as ErrorComponent } from '@/components/ui/error'
import { Button } from '@/components/ui/button'

function RunLoggerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string | undefined>(undefined)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(undefined)
  const [isStravaConnected, setIsStravaConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'card-view' | 'table-view' | 'log'>('card-view')
  const runId = searchParams?.get('runId')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
          setIsLoading(false)
          return
        }

        if (!currentSession) {
          router.push('/login')
          return // isLoading will be set to false in finally block if this path is taken after router.push completes
        }

        setSession(currentSession)
        setUserId(currentSession.user.id)

        // Fetch minimal profile for DashboardLayout
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, profile_picture_url')
          .eq('id', currentSession.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          console.warn('Error fetching profile for layout:', profileError.message)
          // Not setting main page error, layout will degrade gracefully
        }
        if (profileData) {
          setProfileName(profileData.name || undefined)
          setProfilePictureUrl(profileData.profile_picture_url || undefined)
        }
      } catch (err) {
        console.error('Run Logger setup error:', err)
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'An error occurred while loading the run logger'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sessionData) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (sessionData) {
        setSession(sessionData)
        setUserId(sessionData.user.id)
        // Optionally re-fetch profile info here if it can change during the session
      } else {
        // Handle cases like USER_DELETED, TOKEN_REFRESHED_ERROR etc.
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (runId) {
      setActiveTab('card-view')
    }
  }, [runId])

  // const handleRunLogged = () => { // Function no longer needed as ManualRunLogger is removed
  //   setActiveTab('card-view')
  //   // Potentially add a toast notification here or trigger a refresh of the run list data
  // }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login') // Explicit redirect after sign out
  }

  const sidebarProps = {
    userName: profileName,
    userEmail: session?.user?.email,
    profilePictureUrl: profilePictureUrl,
    onLogout: handleSignOut,
  }

  if (isLoading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))]">
          <Icon name="loader" className="animate-spin h-12 w-12 text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <Icon name="alertTriangle" className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Run Logger Error</h2>
            <ErrorComponent message={error} className="text-red-600 mb-6" />
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
              <Button
                onClick={() => (typeof window !== 'undefined' ? window.location.reload() : null)}
                variant="outline"
              >
                Retry
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="default">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Main content when not loading and no error
  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Run Logger</h1>

        {userId && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Strava Connection</h2>
            <StravaConnect userId={userId} onConnectionChange={setIsStravaConnected} />
          </div>
        )}

        {/* Tabs removed as per request, only Activity Feed (Cards) will be shown by default */}
        {/* <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('card-view')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'card-view'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Feed (Cards)
            </button>
          </nav>
        </div> */}

        {/* Content Area - Directly show StravaRunList as other tabs are removed */}
        <div className="mt-6">
          {userId && <StravaRunList userId={userId} isConnected={isStravaConnected} />}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function RunLoggerPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout
          sidebarProps={{
            userName: undefined,
            userEmail: undefined,
            profilePictureUrl: undefined,
            onLogout: () => {},
          }}
        >
          <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.24))]">
            <Icon name="loader" className="animate-spin h-12 w-12 text-indigo-600" />
          </div>
        </DashboardLayout>
      }
    >
      <RunLoggerContent />
    </Suspense>
  )
}
