import React from 'react'
import { UserPlus, BrainCircuit, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Onboard',
    description: 'Tell us about your fitness goals, experience level, available equipment, and any limitations. Our comprehensive assessment takes just 5 minutes.',
    features: ['Goals & preferences', 'Fitness experience', 'Equipment access', 'Injury considerations'],
    color: 'brand-blue',
    bgColor: 'bg-brand-blue/10',
    textColor: 'text-brand-blue',
    numberColor: 'text-brand-blue/20',
    dotColor: 'bg-brand-blue',
    ctaColor: 'bg-brand-blue/5 text-brand-blue',
    borderColor: 'border-brand-blue/20'
  },
  {
    number: '02',
    icon: BrainCircuit,
    title: 'Get Program',
    description: 'Our AI analyzes your profile and generates a completely personalized training program designed specifically for your goals and constraints.',
    features: ['AI-powered generation', 'Personalized workouts', 'Progressive difficulty', 'Equipment-specific'],
    color: 'primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
    numberColor: 'text-primary/20',
    dotColor: 'bg-primary',
    ctaColor: 'bg-primary/5 text-primary',
    borderColor: 'border-primary/20'
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Train & Track',
    description: 'Follow your program, log workouts, and watch as our AI coach provides insights and adjustments to optimize your progress over time.',
    features: ['Smart tracking', 'Progress analytics', 'AI coaching', 'Program adjustments'],
    color: 'brand-green',
    bgColor: 'bg-brand-green/10',
    textColor: 'text-brand-green',
    numberColor: 'text-brand-green/20',
    dotColor: 'bg-brand-green',
    ctaColor: 'bg-brand-green/5 text-brand-green',
    borderColor: 'border-brand-green/20'
  }
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with your personalized fitness journey in three simple steps. Our AI does the heavy lifting so you can focus on lifting heavy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`text-6xl font-bold ${step.numberColor}`}>{step.number}</div>
                    <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center`}>
                      <step.icon className={`w-8 h-8 ${step.textColor}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {step.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className={`w-1.5 h-1.5 ${step.dotColor} rounded-full`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Arrow between steps (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className={`w-8 h-8 bg-white rounded-full border-2 ${steps[index + 1].borderColor} flex items-center justify-center shadow-sm`}>
                    <ArrowRight className={`w-4 h-4 ${steps[index + 1].textColor}`} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-brand-purple/10 text-brand-purple px-6 py-3 rounded-full text-sm font-medium">
            <UserPlus className="w-4 h-4" />
            Ready to start your journey? It takes less than 5 minutes
          </div>
        </div>
      </div>
    </section>
  )
} 