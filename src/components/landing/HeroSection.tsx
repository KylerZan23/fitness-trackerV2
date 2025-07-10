import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

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
            <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            First week free. No credit card required.
          </p>
        </div>
        
        <div className="relative h-96 lg:h-auto flex justify-center lg:justify-end">
          <div className="relative w-[280px] h-[560px] bg-gray-900 rounded-[40px] border-[8px] border-gray-800 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="absolute top-0 left-0 w-full h-full rounded-[32px] overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-1 bg-gray-300 rounded"></div>
                  <div className="w-8 h-8 bg-primary rounded-full"></div>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="bg-white/90 rounded-2xl p-4 shadow-sm">
                    <div className="w-16 h-2 bg-primary rounded mb-2"></div>
                    <div className="w-24 h-2 bg-gray-200 rounded"></div>
                  </div>
                  
                  <div className="bg-white/90 rounded-2xl p-4 shadow-sm">
                    <div className="w-20 h-2 bg-gray-300 rounded mb-2"></div>
                    <div className="w-16 h-2 bg-gray-200 rounded"></div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                    <div className="w-12 h-2 bg-primary rounded mb-2"></div>
                    <div className="w-18 h-2 bg-primary/60 rounded"></div>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="bg-primary rounded-xl p-3 text-center">
                    <div className="w-16 h-2 bg-white/80 rounded mx-auto"></div>
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