'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface UserProfile {
  name: string
  email: string
  profile_picture_url?: string | null
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
      rootMargin: '0px',
      threshold: 0.1,
    }

    const handleIntersect = (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
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
    <section
      id="about"
      className="min-h-screen bg-gray-50 text-gray-800 py-10 md:py-16 flex flex-col justify-center"
    >
      <div className="container mx-auto px-4 flex-grow flex flex-col justify-center">
        <div className="text-center mb-14 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-800">About FitTrackAI</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full animate-scale-in"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-8">
            <div ref={missionRef} className="fade-up">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-5">
                Our Mission: <br />
                <span className="text-blue-600">
                  Unlock next‑level performance through AI precision.
                </span>
              </h2>
              <p className="text-xl leading-relaxed">
                FitTrackAI fuses elite sport‑science with cutting‑edge machine learning, turning
                everyday training data into a personalized playbook for unstoppable progress.
              </p>
            </div>

            <div ref={featuresRef} className="space-y-4 fade-up">
              <h2 className="text-2xl font-bold">Why Choose FitTrackAI?</h2>
              <ul className="space-y-3">
                {[
                  'An AI-Personal Coach at your fingertips',
                  'Advanced analytics to track your progress over time',
                  'Become your best self through a goal driven format',
                  'Seamless integration with Strava',
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
            <div
              ref={storyCardRef}
              className="bg-white p-7 rounded-2xl transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center animate-pulse-subtle">
                  <span className="text-white font-bold text-xl">FT</span>
                </div>
                <div>
                  <h2 className="text-gray-800 text-2xl font-bold">Our Story</h2>
                  <p className="text-gray-500">Founded in 2025</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="leading-relaxed text-gray-700">
                  First <em>premium</em> AI fitness OS on the market.
                  <br />
                  No templates. No guesswork. Just hyper‑personal coaching, 24/7.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '50K+', label: 'Active Users' },
                    { value: '1M+', label: 'Workouts Tracked' },
                    { value: '15+', label: 'Integrations' },
                    { value: '100+', label: 'Supported Exercises' },
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
                  Our team of data scientists and elite athletes work together to create the most
                  comprehensive fitness tracking experience available, closing the gap between
                  professional analytics and everyday training through AI.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 rounded-2xl -z-10 animate-float"></div>
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-pink-500 rounded-2xl -z-10 animate-float-delayed"></div>
          </div>
        </div>

        <div ref={ctaRef} className="mt-20 text-center fade-up">
          <h2 className="text-4xl font-bold mb-5 text-gray-800">
            Join the future of fitness tracking.
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-600">
            Join thousands of users who are already tracking their progress and unlocking their
            potential with FitTrackAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="radiate-effect relative z-10 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-colors transition-transform transition-shadow duration-200 ease-in-out"
            >
              <span>Join Us</span>
            </Link>
          </div>
        </div>
      </div>

      <div ref={footerRef} className="w-full fade-in">
        <footer className="container mx-auto px-4 py-10 mt-12 border-t border-gray-200">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-8">
              {['About', 'Features', 'Pricing', 'Blog', 'Contact'].map((item, index) => (
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
                <path
                  key="facebook"
                  d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                ></path>,
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
            © {new Date().getFullYear()} FitTrackAI. All rights reserved.
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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

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
              const { error: insertError } = await supabase.from('profiles').insert({
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
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error during navigation:', error)
        router.push('/login')
        return
      }

      if (session) {
        console.log('Session found, navigating to program')
        router.push('/program')
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
      <section
        id="home"
        className="min-h-screen bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white flex flex-col"
      >
        <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="bg-black w-8 h-8 rounded flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.076A8.5 8.5 0 001.499 8.562a8.5 8.5 0 0011.018 8.241 1 1 0 01.817 1.81 10.5 10.5 0 11-10.4-14.09 1 1 0 111.382 1.453zM14.5 6a1 1 0 011 1v2.586l2.707 2.707a1 1 0 11-1.414 1.414L14 11.414V14a1 1 0 11-2 0V8a1 1 0 011-1h1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold">FitTrackAI</div>
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
                    Your Program
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                <UserAvatar
                  name={profile.name}
                  email={profile.email}
                  profilePictureUrl={profile.profile_picture_url}
                />
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Train Smarter with AI</h1>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Unlock Elite Performance.</h2>
              <p className="text-xl mb-12 max-w-lg">
                FitTrackAI's premium AI engine logs every rep and run, analyzes your data in real
                time, and delivers hyper‑personal insights that propel you past your goals.
              </p>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <button
                    onClick={handleDashboardNavigation}
                    className="inline-block px-8 py-4 bg-black text-white font-medium rounded-lg text-lg hover:bg-black/90 hover:scale-105 hover:shadow-xl hover:shadow-black/25 active:scale-95 transition-all duration-300 ease-out transform"
                  >
                    Go to Your Program
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link
                    href="/signup"
                    className="inline-block px-8 py-4 bg-black text-white font-medium rounded-lg text-lg hover:bg-black/90 hover:scale-105 hover:shadow-xl hover:shadow-black/25 active:scale-95 transition-all duration-300 ease-out transform flex items-center"
                  >
                    Get Started Free
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <p className="text-gray-100 ml-2">Start logging your workouts today!</p>
                </div>
              )}
            </div>

            <div className="relative h-[500px] md:h-[600px] hidden md:block -ml-24">
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
                        fittrack-ai-dashboard.app
                      </div>
                    </div>

                    {/* Dashboard Content (mockup) */}
                    <div className="bg-gray-50 h-[calc(100%-32px)] flex overflow-hidden">
                      {/* === SIDEBAR START === */}
                      <div className="w-36 bg-white p-3 flex flex-col border-r border-gray-200 shadow-sm">
                        {/* User Profile Area */}
                        <div className="flex flex-col items-center text-center mb-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-2 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            K
                          </div>
                          <p className="font-semibold text-gray-800 text-xs">Kyler</p>
                          <p className="text-xxs text-gray-500 truncate w-full">kzanuck@gmail.com</p>
                        </div>
                        {/* Divider */}
                        <hr className="border-gray-200 my-2" />
                        {/* Navigation Links */}
                        <nav className="flex flex-col space-y-1 text-xs">
                          {/* Home */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors">
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
                              className="text-gray-500"
                            >
                              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <span>Home</span>
                          </div>
                          {/* Dashboard (Active) */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg bg-blue-50 text-blue-700 cursor-pointer border border-blue-200">
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
                              className="text-blue-600"
                            >
                              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                            </svg>
                            <span className="font-medium">Dashboard</span>
                          </div>
                          {/* My Program */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors">
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
                              className="text-gray-500"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>My Program</span>
                          </div>
                          {/* Workouts */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors">
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
                              className="text-gray-500"
                            >
                              <path d="M6.5 6.5h11v11h-11z"></path>
                              <path d="M6.5 6.5L12 12l5.5-5.5"></path>
                            </svg>
                            <span>Workouts</span>
                          </div>
                          {/* Profile */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors">
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
                              className="text-gray-500"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Profile</span>
                          </div>
                          {/* Settings */}
                          <div className="flex items-center space-x-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer transition-colors">
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
                              className="text-gray-500"
                            >
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>Settings</span>
                          </div>
                        </nav>
                      </div>
                      {/* === SIDEBAR END === */}
                      {/* === MAIN CONTENT AREA START === */}
                      <div className="flex-1 p-4 flex flex-col space-y-4 overflow-y-auto">
                        {/* Hero Section */}
                        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
                          {/* Background pattern overlay */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          </div>
                          <div className="relative z-10 flex justify-between items-center">
                            <div>
                              <h1 className="text-lg font-bold mb-1">Welcome back, Kyler!</h1>
                              <p className="text-white/90 text-sm">Ready to crush your fitness goals today?</p>
                            </div>
                            {/* Streak Indicator */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-yellow-300 text-lg">🔥</div>
                              <div className="text-xs font-bold">7 days</div>
                              <div className="text-xxs text-white/80">On fire!</div>
                            </div>
                          </div>
                        </div>

                        {/* Today's Snapshot */}
                        <div>
                          <div className="mb-3">
                            <h2 className="text-lg font-bold text-gray-800 mb-1">Today's Snapshot</h2>
                            <p className="text-gray-600 text-sm">Track your daily progress and achievements</p>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {/* Card 1: Exercises */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                    <path d="M6.5 6.5h11v11h-11z"></path>
                                    <path d="M6.5 6.5L12 12l5.5-5.5"></path>
                                  </svg>
                                </div>
                                <h3 className="text-xxs font-semibold uppercase tracking-wider opacity-90 mb-1">EXERCISES</h3>
                                <p className="text-xl font-bold">8</p>
                                <p className="text-xxs opacity-80">Workouts completed</p>
                              </div>
                            </div>
                            {/* Card 2: Sets */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                    <path d="m15 5 4 4"></path>
                                  </svg>
                                </div>
                                <h3 className="text-xxs font-semibold uppercase tracking-wider opacity-90 mb-1">SETS</h3>
                                <p className="text-xl font-bold">21</p>
                                <p className="text-xxs opacity-80">Total sets performed</p>
                              </div>
                            </div>
                            {/* Card 3: Duration */}
                            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </div>
                                <h3 className="text-xxs font-semibold uppercase tracking-wider opacity-90 mb-1">DURATION</h3>
                                <p className="text-xl font-bold">56 min</p>
                                <p className="text-xxs opacity-80">Time spent training</p>
                              </div>
                            </div>
                            {/* Card 4: Total Weight */}
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                  </svg>
                                </div>
                                <h3 className="text-xxs font-semibold uppercase tracking-wider opacity-90 mb-1">TOTAL WEIGHT</h3>
                                <p className="text-xl font-bold">0 lbs</p>
                                <p className="text-xxs opacity-80">Weight lifted today</p>
                              </div>
                            </div>
                                </div>
                              </div>

                        {/* Workout Trends */}
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h2 className="text-lg font-bold text-gray-800 mb-1">Workout Trends</h2>
                              <p className="text-gray-600 text-sm">Your progress over the last 8 weeks</p>
                            </div>
                          </div>
                          {/* Chart Header */}
                          <div className="flex justify-between items-center mb-3">
                            <button className="text-gray-400 hover:text-gray-600 text-sm">
                              ←
                            </button>
                            <p className="text-sm font-medium text-gray-600">
                              Weekly Workout Trends (This Week)
                            </p>
                            <button className="text-gray-400 hover:text-gray-600 text-sm">
                              →
                            </button>
                          </div>
                          {/* Legend */}
                          <div className="flex justify-end mb-3">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                                <span className="text-gray-600">Duration (min)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                <span className="text-gray-600">Weight (lbs)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                                <span className="text-gray-600">Sets</span>
                              </div>
                            </div>
                          </div>
                          {/* Chart Area */}
                          <div className="relative h-32 border border-gray-200 rounded-lg bg-gray-50 p-2">
                            {/* Y-Axis Labels */}
                            <div className="absolute left-[-24px] top-0 text-xs text-gray-400 h-full flex flex-col justify-between py-1">
                              <span>60</span>
                              <span>37</span>
                              <span>0</span>
                            </div>
                            {/* Grid Lines */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
                            <div className="absolute left-0 right-0 h-px bg-gray-200" style={{ top: '50%' }}></div>
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
                            {/* Bars Container */}
                            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-7 h-full items-end gap-1 px-1">
                              {[30, 45, 0, 50, 35, 75, 0].map((value, index) => {
                                const maxHeight = 75
                                const barHeightPercentage = maxHeight > 0 ? (value / maxHeight) * 100 : 0
                                return (
                                  <div key={index} className="relative flex justify-center items-end h-full">
                                    <div
                                      className="bg-orange-400 w-[80%] rounded-t-lg hover:bg-orange-500 transition-colors shadow-sm"
                                      style={{ height: `${barHeightPercentage}%` }}
                                    ></div>
                                  </div>
                                )
                              })}
                            </div>
                            {/* X-Axis labels */}
                            <div className="absolute bottom-[-20px] left-0 right-0 grid grid-cols-7">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="text-center">
                                  <span className="text-xs text-gray-400">{day}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Muscle Distribution & Goals */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Muscle Group Focus */}
                          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Muscle Group Focus</h3>
                                <p className="text-gray-600 text-sm">Weekly training focus</p>
                              </div>
                              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Collapse
                              </button>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                              <span>Week</span>
                              <div className="flex items-center space-x-2">
                                <button className="text-gray-400 hover:text-gray-600">←</button>
                                <span className="font-medium">May 12 – May 18, 2025</span>
                                <button className="text-gray-400 hover:text-gray-600">→</button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-gray-700">Arms</span>
                                  <span className="text-gray-500 text-sm">8 sets</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Goals */}
                          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Goals (This Week)</h3>
                              </div>
                              <button className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors">
                                Add Goal
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-700">Weekly Workout Days</span>
                                  <span className="text-gray-500 text-sm">5/5 days</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-700">Duration</span>
                                  <span className="text-gray-500 text-sm">235/180 min</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>


                      </div>
                      {/* === MAIN CONTENT AREA END === */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <V0AboutSection />
    </div>
  )
}
