import React from 'react'
import { BrainCircuit, BarChart, Target, Dumbbell, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: BrainCircuit,
    title: 'AI Program Generation',
    description: 'Get personalized workout plans powered by advanced AI that adapts to your goals, equipment, and fitness level.',
    color: 'primary', // Keep primary orange for main feature
    bgColor: 'bg-primary/10',
    hoverBgColor: 'group-hover:bg-primary/20',
    textColor: 'text-primary'
  },
  {
    icon: BarChart,
    title: 'Holistic Progress Tracking',
    description: 'Track every aspect of your fitness journey with comprehensive analytics and visual progress insights.',
    color: 'brand-blue',
    bgColor: 'bg-brand-blue/10',
    hoverBgColor: 'group-hover:bg-brand-blue/20',
    textColor: 'text-brand-blue'
  },
  {
    icon: Target,
    title: 'Smart Goal Setting',
    description: 'Set and achieve realistic fitness goals with AI-powered recommendations and milestone tracking.',
    color: 'brand-green',
    bgColor: 'bg-brand-green/10',
    hoverBgColor: 'group-hover:bg-brand-green/20',
    textColor: 'text-brand-green'
  },
  {
    icon: Dumbbell,
    title: 'Exercise Library',
    description: 'Access a comprehensive library of exercises with detailed instructions and form guidance.',
    color: 'brand-purple',
    bgColor: 'bg-brand-purple/10',
    hoverBgColor: 'group-hover:bg-brand-purple/20',
    textColor: 'text-brand-purple'
  },
  {
    icon: Calendar,
    title: 'Adaptive Scheduling',
    description: 'Flexible workout scheduling that adapts to your lifestyle and adjusts based on your performance.',
    color: 'brand-teal',
    bgColor: 'bg-brand-teal/10',
    hoverBgColor: 'group-hover:bg-brand-teal/20',
    textColor: 'text-brand-teal'
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Deep insights into your workout patterns, strength gains, and overall fitness progression.',
    color: 'brand-indigo',
    bgColor: 'bg-brand-indigo/10',
    hoverBgColor: 'group-hover:bg-brand-indigo/20',
    textColor: 'text-brand-indigo'
  }
]

export function FeatureSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="text-primary">Excel</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools and insights you need to reach your fitness goals faster and smarter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-gray-200 bg-white"
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center ${feature.hoverBgColor} transition-colors duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.textColor}`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Start your transformation today
          </div>
        </div>
      </div>
    </section>
  )
} 