import React from 'react'
import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Manager',
    photo: 'SC',
    rating: 5,
    quote: 'FitTrackAI completely transformed my approach to fitness. The AI-generated programs are spot-on for my goals, and I\'ve seen incredible progress in just 3 months. The personalization is unmatched!'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Software Engineer',
    photo: 'MR',
    rating: 5,
    quote: 'As someone who travels frequently, I love how the app adapts to whatever equipment I have available. The progress tracking keeps me motivated, and the AI coach feels like having a personal trainer in my pocket.'
  },
  {
    name: 'Emily Johnson',
    role: 'Physical Therapist',
    photo: 'EJ',
    rating: 5,
    quote: 'The injury-aware programming is incredible. After my knee surgery, FitTrackAI helped me safely return to strength training with modifications I never would have thought of. Truly impressive technology.'
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by <span className="text-primary">Fitness Enthusiasts</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our community has to say about their transformation journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/30" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        star <= testimonial.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.photo}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">Ready to join thousands of satisfied users?</p>
          <div className="inline-flex items-center gap-2 text-primary font-medium">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            4.8/5 average rating from 2,000+ reviews
          </div>
        </div>
      </div>
    </section>
  )
} 