import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Flame, BarChart3, Target, Clock } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
            Stop Guessing.
            <br />
            <span className="text-primary">Start Progressing.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-gray-600 leading-relaxed">
            Get personalized, AI-powered workout plans that adapt to your goals, equipment, and performance. 
            Your elite AI personal trainer is ready to transform your fitness journey.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            First week free. No credit card required.
          </p>
        </div>
        
        <div className="relative h-96 lg:h-auto flex justify-center lg:justify-end">
          <div className="relative w-[280px] h-[560px] bg-gray-900 rounded-[40px] border-[8px] border-gray-800 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="absolute top-0 left-0 w-full h-full rounded-[32px] overflow-hidden bg-white">
              <div className="p-4 h-full flex flex-col">
                {/* Phone header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-1 bg-gray-300 rounded"></div>
                  <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Today's Session Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 mb-3 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs">💪</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-blue-900">Today's Session</h3>
                      <p className="text-xs text-blue-700">Upper Body Focus</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-900">45 minutes</span>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1">
                    <Play className="w-3 h-3" />
                    <span>Start Workout</span>
                  </button>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Streak Card */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-2 text-white">
                    <div className="flex items-center space-x-1 mb-1">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs font-bold">7</span>
                    </div>
                    <p className="text-xs opacity-90">days</p>
                  </div>
                  
                  {/* Progress Card */}
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-2 text-white">
                    <div className="flex items-center space-x-1 mb-1">
                      <BarChart3 className="w-3 h-3" />
                      <span className="text-xs font-bold">85%</span>
                    </div>
                    <p className="text-xs opacity-90">progress</p>
                  </div>
                  
                  {/* Duration Card */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2 text-white">
                    <div className="flex items-center space-x-1 mb-1">
                      <Target className="w-3 h-3" />
                      <span className="text-xs font-bold">12</span>
                    </div>
                    <p className="text-xs opacity-90">weeks</p>
                  </div>
                </div>
                
                {/* Program Overview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Strength Building Program</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Phase 1 - Foundation</span>
                      <span className="text-xs font-medium text-brand-green">Active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-brand-green h-1 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
                
                {/* Workout History Preview */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Recent Workouts</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                        <span className="text-xs text-gray-700">Push Day</span>
                      </div>
                      <span className="text-xs text-gray-500">2 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-brand-blue rounded-full"></div>
                        <span className="text-xs text-gray-700">Pull Day</span>
                      </div>
                      <span className="text-xs text-gray-500">4 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-brand-purple rounded-full"></div>
                        <span className="text-xs text-gray-700">Legs</span>
                      </div>
                      <span className="text-xs text-gray-500">6 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phone notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
    </section>
  )
} 