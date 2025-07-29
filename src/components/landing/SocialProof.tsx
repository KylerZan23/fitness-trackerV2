import React from 'react'
import { Star } from 'lucide-react'

const mediaOutlets = [
  'Men\'s Health',
  'Forbes',
  'TechCrunch',
  'Fitness Magazine',
  'Wired',
  'Fast Company'
]

export function SocialProof() {
  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Media Outlets */}
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-6">
            Pending Feature In
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
            {mediaOutlets.map((outlet, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-12 px-4 text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors duration-200"
              >
                {outlet}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-blue mb-1">10,000+</div>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-blue mb-1">500,000+</div>
            <p className="text-sm text-gray-600">Workouts Completed</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-blue mb-1">98%</div>
            <p className="text-sm text-gray-600">User Satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  )
} 