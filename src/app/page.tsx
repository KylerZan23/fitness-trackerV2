'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface UserProfile {
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        console.log('Checking authentication status...')
        // Force a fresh session check from the server
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        // If there's no session, set isAuthenticated to false
        if (!session) {
          console.log('No session found')
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        // Validate the session is still valid
        const { data: userResponse, error: userError } = await supabase.auth.getUser()
        
        if (userError || !userResponse.user) {
          console.error('Invalid session detected, clearing...')
          await supabase.auth.signOut()
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        console.log('Valid session detected')
        setIsAuthenticated(true)
        
        // Profile handling
        const fallbackProfile: UserProfile = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        }
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.log('Could not load profile from database:', profileError.message)
            setProfile(fallbackProfile)
            
            if (profileError.code === 'PGRST116') {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  name: fallbackProfile.name,
                  email: fallbackProfile.email,
                  age: 0,
                  fitness_goals: 'Set your fitness goals',
                })
              
              if (insertError) {
                console.log('Could not create profile:', insertError.message)
              }
            }
          } else {
            setProfile(profileData)
          }
        } catch (error) {
          console.log('Error loading profile:', error)
          setProfile(fallbackProfile)
        }
      } catch (error) {
        console.log('Error checking auth:', error)
        setIsAuthenticated(false)
        setIsLoading(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleDashboardNavigation = async () => {
    try {
      console.log('Dashboard navigation requested...')
      // Force fresh session check
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error during navigation:', error)
        router.push('/login')
        return
      }
      
      if (session) {
        console.log('Session found, navigating to dashboard')
        router.push('/dashboard')
      } else {
        console.log('No session found, redirecting to login')
        router.push('/login')
      }
    } catch (error) {
      console.error('Navigation error:', error)
      router.push('/login')
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      console.log('Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        console.log('Successfully signed out')
        setIsAuthenticated(false)
        setProfile(null)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
      // Force refresh the page
      window.location.href = '/'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="bg-black w-8 h-8 rounded flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.076A8.5 8.5 0 001.499 8.562a8.5 8.5 0 0011.018 8.241 1 1 0 01.817 1.81 10.5 10.5 0 11-10.4-14.09 1 1 0 111.382 1.453zM14.5 6a1 1 0 011 1v2.586l2.707 2.707a1 1 0 11-1.414 1.414L14 11.414V14a1 1 0 11-2 0V8a1 1 0 011-1h1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-xl font-bold">FitnessTracker</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {isAuthenticated && profile ? (
            <>
              <div className="items-center hidden md:flex">
                <button
                  onClick={handleDashboardNavigation}
                  className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors mr-4"
                >
                  Your Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <UserAvatar name={profile.name} email={profile.email} />
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text Content */}
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Track Your Progress,
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Unlock Your Potential.
          </h2>
          <p className="text-xl mb-12 max-w-lg">
            Log workouts, track runs with Strava, analyze your performance, 
            and achieve your fitness goals with FitnessTracker.
          </p>
          
          {isAuthenticated ? (
            <div className="space-y-4">
              <button
                onClick={handleDashboardNavigation}
                className="inline-block px-8 py-4 bg-black text-white font-medium rounded-lg text-lg hover:bg-black/90 transition-colors"
              >
                Go to Your Dashboard
              </button>
              <p className="text-gray-100 ml-2">Continue tracking your fitness journey</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                href="/signup"
                className="inline-block px-8 py-4 bg-black text-white font-medium rounded-lg text-lg hover:bg-black/90 transition-colors flex items-center"
              >
                Get Started Free
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <p className="text-gray-100 ml-2">Start logging your workouts today!</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Computer Screen Mockup */}
        <div className="relative h-[500px] md:h-[600px] hidden md:block">
          {/* Laptop/Computer Mockup */}
          <div className="relative mx-auto w-full h-full max-w-4xl flex flex-col items-center">
            {/* Computer Screen */}
            <div className="w-full h-[80%] bg-black rounded-t-xl overflow-hidden border-8 border-black shadow-2xl">
              {/* Screen Content */}
              <div className="bg-white h-full w-full p-2 overflow-hidden">
                {/* Browser UI Top Bar */}
                <div className="h-8 w-full bg-gray-200 rounded-t-md flex items-center px-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto bg-white rounded-md px-3 py-1 text-sm text-gray-600">
                    fitness-tracker-dashboard.app
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="bg-gray-100 h-[calc(100%-32px)] p-4 overflow-y-auto">
                  {/* Dashboard Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        FT
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
                        <p className="text-sm text-gray-500">Welcome back, Alex</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-3 py-1 bg-gray-200 rounded-md text-sm text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        Search
                      </button>
                      <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                      <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Activity Overview */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Week's Workouts</div>
                      <div className="flex items-end">
                        <div className="text-2xl font-bold text-gray-800 mr-2">5</div>
                        <div className="text-xs text-green-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          25%
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Total Distance</div>
                      <div className="flex items-end">
                        <div className="text-2xl font-bold text-gray-800 mr-2">18.6 mi</div>
                        <div className="text-xs text-green-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                          12%
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Avg. Pace</div>
                      <div className="flex items-end">
                        <div className="text-2xl font-bold text-gray-800 mr-2">8:24/mi</div>
                        <div className="text-xs text-red-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                          </svg>
                          5%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Run */}
                  <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Recent Run</h3>
                        <button className="text-sm text-blue-600">View All</button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-medium text-gray-800">Evening Run</h4>
                            <span className="text-sm text-gray-500">Yesterday</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Central Park Loop</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="text-xs text-gray-500">Distance</div>
                              <div className="font-medium">5.2 mi</div>
                            </div>
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="text-xs text-gray-500">Time</div>
                              <div className="font-medium">42:15</div>
                            </div>
                            <div className="bg-gray-100 p-2 rounded">
                              <div className="text-xs text-gray-500">Avg. Pace</div>
                              <div className="font-medium">8:07/mi</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Workout Progress */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-white rounded-lg shadow-sm p-4">
                      <h3 className="font-bold text-gray-800 mb-4">Weekly Progress</h3>
                      {/* Mock Chart */}
                      <div className="h-48 flex items-end space-x-2">
                        <div className="h-[10%] w-full bg-blue-100 rounded-t"></div>
                        <div className="h-[30%] w-full bg-blue-200 rounded-t"></div>
                        <div className="h-[20%] w-full bg-blue-100 rounded-t"></div>
                        <div className="h-[60%] w-full bg-blue-300 rounded-t"></div>
                        <div className="h-[40%] w-full bg-blue-200 rounded-t"></div>
                        <div className="h-[70%] w-full bg-blue-400 rounded-t"></div>
                        <div className="h-[50%] w-full bg-blue-300 rounded-t"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h3 className="font-bold text-gray-800 mb-4">Goals</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Weekly Distance</span>
                            <span className="text-gray-800">15/20 mi</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Workout Days</span>
                            <span className="text-gray-800">4/5 days</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Avg Pace Goal</span>
                            <span className="text-gray-800">8:30/mi</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Computer Base/Stand */}
            <div className="w-[70%] h-[4%] bg-gray-800 rounded-b-lg"></div>
            <div className="w-[20%] h-[3%] bg-gray-700 rounded-b"></div>
            <div className="w-[25%] h-[1%] bg-gray-300 mt-1 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 