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
        {/* Trust Ratings */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">4.8/5</span>
          </div>
          <p className="text-sm text-gray-600">
            Trusted by <span className="font-semibold">10,000+</span> fitness enthusiasts
          </p>
        </div>

        {/* Media Outlets */}
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-6">
            As featured in
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
            <div className="text-2xl font-bold text-primary mb-1">10,000+</div>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">500,000+</div>
            <p className="text-sm text-gray-600">Workouts Completed</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">98%</div>
            <p className="text-sm text-gray-600">User Satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  )
} 