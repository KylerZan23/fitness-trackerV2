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
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
        
        if (session?.user) {
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
        }
      } catch (error) {
        console.log('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleDashboardNavigation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Navigation error:', error)
      router.push('/login')
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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Fitness background"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="text-2xl font-bold">FitnessTracker</div>
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
                </div>
                <UserAvatar name={profile.name} email={profile.email} />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-[calc(100vh-80px)] flex flex-col justify-center">
          <div className="max-w-2xl">
            {isAuthenticated && profile ? (
              <h1 className="text-6xl font-serif mb-6">
                Welcome back, {profile.name}
              </h1>
            ) : (
              <h1 className="text-6xl font-serif mb-6">
                Track Your Fitness Journey With Confidence
              </h1>
            )}
            
            <p className="text-xl text-gray-300 mb-8">
              {isAuthenticated && profile 
                ? `Continue your fitness journey and keep up the great work!`
                : `Simple, effective workout tracking to help you achieve your fitness goals`
              }
            </p>
            
            {isAuthenticated ? (
              <div className="space-y-4">
                <button
                  onClick={handleDashboardNavigation}
                  className="inline-block px-8 py-4 bg-white text-black font-medium rounded-full text-lg hover:bg-white/90 transition-colors"
                >
                  Go to Your Dashboard
                </button>
                <p className="text-gray-400 ml-2">Continue tracking your fitness journey</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/signup"
                  className="inline-block px-8 py-4 bg-white text-black font-medium rounded-full text-lg hover:bg-white/90 transition-colors"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/login"
                  className="inline-block ml-4 text-white hover:text-gray-300 transition-colors"
                >
                  Already have an account?
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-black py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Track Progress</h3>
              <p className="text-gray-400">
                Advanced tracking algorithms provide real-time insights into your fitness journey.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Smart Analytics</h3>
              <p className="text-gray-400">
                AI-powered analytics help optimize your training and recovery cycles.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-medium">Health Integration</h3>
              <p className="text-gray-400">
                Seamless integration with Apple Health and Google Fit for comprehensive tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 