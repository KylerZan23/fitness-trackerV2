import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Flame, BarChart3, Target, Clock, Brain, Minimize2, Square, X } from 'lucide-react'

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
          <div className="relative w-[680px] h-[420px] bg-gray-800 rounded-lg border-2 border-gray-700 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            {/* Laptop screen bezel */}
            <div className="absolute top-3 left-3 right-3 bottom-3 bg-black rounded-md overflow-hidden">
              {/* Browser window */}
              <div className="h-full bg-white flex flex-col">
                {/* Browser header */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-600 border border-gray-300">
                      neurallift.com/program
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Minimize2 className="w-3 h-3 text-gray-400" />
                    <Square className="w-3 h-3 text-gray-400" />
                    <X className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
                
                {/* Page content */}
                <div className="flex-1 p-4 overflow-hidden">
                  {/* App header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">N</span>
                      </div>
                      <span className="font-bold text-gray-900">NeuralLift</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">My Program</span>
                      <div className="w-6 h-6 bg-primary rounded-full"></div>
                    </div>
                  </div>
                
                  {/* Coach Message */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">A Message from Neural</h3>
                        <p className="text-xs text-gray-600">Your AI fitness coach</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">Welcome to your personalized training program! I've analyzed your goals and created a plan optimized for strength and muscle growth.</p>
                  </div>
                  
                  {/* Today's Session Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-lg">💪</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-blue-900">Today's Session</h3>
                          <p className="text-sm text-blue-700">Upper Body Focus</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-blue-600 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">45 minutes</span>
                        </div>
                        <span className="text-xs text-blue-500">6 exercises</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:shadow-md transition-shadow">
                      <Play className="w-4 h-4" />
                      <span>Start Workout</span>
                    </button>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Streak Card */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flame className="w-4 h-4" />
                        <span className="text-lg font-bold">7</span>
                      </div>
                      <p className="text-xs opacity-90">day streak</p>
                    </div>
                    
                    {/* Progress Card */}
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-3 text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-lg font-bold">85%</span>
                      </div>
                      <p className="text-xs opacity-90">progress</p>
                    </div>
                    
                    {/* Duration Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 text-white">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-lg font-bold">12</span>
                      </div>
                      <p className="text-xs opacity-90">weeks total</p>
                    </div>
                  </div>
                  
                  {/* Program Overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Strength Building Program</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Phase 1 - Foundation</span>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Week 3 of 12</span>
                        <span>65% complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
    </section>
  )
} 