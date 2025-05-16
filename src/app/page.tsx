"use client"

import * as React from 'react'
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/ui/UserAvatar"

interface UserProfile {
  name: string;
  email: string;
  profile_picture_url?: string | null;
}

const V0AboutSection = () => {
  const missionRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const storyCardRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }

    const handleIntersect = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
          observer.unobserve(entry.target)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, observerOptions)

    const refs = [missionRef, featuresRef, storyCardRef, ctaRef, footerRef]
    refs.forEach(ref => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => {
      refs.forEach(ref => {
        if (ref.current) observer.unobserve(ref.current)
      })
      observer.disconnect()
    }
  }, [])

  return (
    <section id="about" className="min-h-screen bg-gray-50 text-gray-800 py-10 md:py-16 flex flex-col justify-center">
      <div className="container mx-auto px-4 flex-grow flex flex-col justify-center">
        <div className="text-center mb-14 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-800">About FitnessTracker</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full animate-scale-in"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-8">
            <div ref={missionRef} className="fade-up">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-5">
                Our Mission: <br />
                <span className="text-blue-600">Empower Your Fitness Journey</span>
              </h2>
              <p className="text-xl leading-relaxed">
                At FitnessTracker, we believe everyone deserves the tools to achieve their fitness goals. Our platform
                combines cutting-edge technology with user-friendly design to help you track, analyze, and improve your
                performance.
              </p>
            </div>

            <div ref={featuresRef} className="space-y-4 fade-up">
              <h2 className="text-2xl font-bold">Why Choose FitnessTracker?</h2>
              <ul className="space-y-3">
                {[
                  "Seamless integration with Strava and other fitness apps",
                  "Advanced analytics to track your progress over time",
                  "Personalized workout recommendations",
                  "Community features to keep you motivated",
                ].map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 feature-item"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="bg-blue-500 p-1 rounded-full mt-1 animate-pulse-subtle">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative">
            <div ref={storyCardRef} className="bg-white p-7 rounded-2xl shadow-lg fade-in hover-lift">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center animate-pulse-subtle">
                  <span className="text-white font-bold text-xl">FT</span>
                </div>
                <div>
                  <h2 className="text-gray-800 text-2xl font-bold">Our Story</h2>
                  <p className="text-gray-500">Founded in 2020</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="leading-relaxed text-gray-700">
                  FitnessTracker began with a simple idea: make fitness tracking accessible, intuitive, and actionable
                  for everyone.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "50K+", label: "Active Users" },
                    { value: "1M+", label: "Workouts Tracked" },
                    { value: "15+", label: "Integrations" },
                    { value: "4.8", label: "App Store Rating" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 p-4 rounded-lg stat-card"
                      style={{ transitionDelay: `${index * 75}ms` }}
                    >
                      <div className="text-3xl font-bold text-blue-600 count-up">{stat.value}</div>
                      <div className="text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <p className="leading-relaxed text-gray-700">
                  Our team of fitness enthusiasts and tech experts work together to create the most comprehensive
                  fitness tracking experience available.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 rounded-2xl -z-10 animate-float"></div>
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-pink-500 rounded-2xl -z-10 animate-float-delayed"></div>
          </div>
        </div>

        <div ref={ctaRef} className="mt-20 text-center fade-up">
          <h2 className="text-4xl font-bold mb-5 text-gray-800">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-600">
            Join thousands of users who are already tracking their progress and unlocking their potential with
            FitnessTracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all hover:scale-105 hover:shadow-lg active:scale-95 button-pulse"
            >
              Join Us
            </Link>
          </div>
        </div>
      </div>

      <div ref={footerRef} className="w-full fade-in">
        <footer className="container mx-auto px-4 py-10 mt-12 border-t border-gray-200">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-8">
              {["About", "Features", "Pricing", "Blog", "Contact"].map((item, index) => (
                <Link
                  key={index}
                  href={`/${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-blue-600 hover:underline transition-all hover:-translate-y-1"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex gap-4">
              {[
                <path key="facebook" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>,
                <React.Fragment key="twitter">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </React.Fragment>,
                <React.Fragment key="instagram">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </React.Fragment>,
              ].map((icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all hover:scale-110 hover:rotate-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-500 animate-fade-in">
            © {new Date().getFullYear()} FitnessTracker. All rights reserved.
          </div>
        </footer>
      </div>
    </section>
  )
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
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        if (!session) {
          console.log('No session found')
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
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
        
        const fallbackProfile: UserProfile = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          profile_picture_url: session.user.user_metadata?.avatar_url || null,
        }
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, email, profile_picture_url')
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
                  profile_picture_url: fallbackProfile.profile_picture_url,
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
    <div className="text-white"> 
      <section id="home" className="min-h-screen bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white flex flex-col">
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
                <UserAvatar name={profile.name} email={profile.email} profilePictureUrl={profile.profile_picture_url} />
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

        <div className="flex-grow flex items-center container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
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
                    
                    {/* Dashboard Content (mockup) */}
                    <div className="bg-gray-100 h-[calc(100%-32px)] p-4 overflow-y-auto">
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
                        {/* ... other mockup elements ... */}
                      </div>
                       {/* Simplified mockup content for brevity */}
                      <div className="text-gray-700">Dashboard mockup content...</div>
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
      </section>

      <V0AboutSection />
    </div>
  )
}
