/**
 * Training Focus Cards Component
 * ------------------------------------------------
 * Orange gradient cards showing user's training specializations
 */

import { Target, Trophy, TrendingUp, Dumbbell, Heart, Zap } from 'lucide-react'

interface TrainingFocus {
  id: string
  name: string
  description: string
  icon: string
}

interface TrainingFocusCardsProps {
  focuses: string[] | null
}

const TRAINING_FOCUS_OPTIONS: TrainingFocus[] = [
  {
    id: 'powerlifting',
    name: 'Powerlifting',
    description: 'Competition Prep',
    icon: 'dumbbell'
  },
  {
    id: 'strength',
    name: 'Strength',
    description: 'Max Lifts',
    icon: 'trophy'
  },
  {
    id: 'progressive',
    name: 'Progressive',
    description: 'Overload',
    icon: 'trending-up'
  },
  {
    id: 'bodybuilding',
    name: 'Bodybuilding',
    description: 'Hypertrophy',
    icon: 'target'
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Cardio Training',
    icon: 'heart'
  },
  {
    id: 'athletic',
    name: 'Athletic',
    description: 'Performance',
    icon: 'zap'
  }
]

function getFocusIcon(iconName: string) {
  switch (iconName) {
    case 'dumbbell':
      return Dumbbell
    case 'trophy':
      return Trophy
    case 'trending-up':
      return TrendingUp
    case 'target':
      return Target
    case 'heart':
      return Heart
    case 'zap':
      return Zap
    default:
      return Target
  }
}

export function TrainingFocusCards({ focuses }: TrainingFocusCardsProps) {
  // If no focuses are set, show default popular ones
  const defaultFocuses = ['powerlifting', 'strength', 'progressive']
  const displayFocuses = focuses && focuses.length > 0 ? focuses : defaultFocuses
  
  // Get the focus objects for display
  const focusesToShow = TRAINING_FOCUS_OPTIONS.filter(focus => 
    displayFocuses.includes(focus.id)
  ).slice(0, 3) // Limit to 3 cards

  if (focusesToShow.length === 0) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-3">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5" />
          <h2 className="text-xl font-bold">Primary Training Focus</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focusesToShow.map((focus) => {
            const IconComponent = getFocusIcon(focus.icon)
            
            return (
              <div
                key={focus.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 p-2.5 bg-white/20 rounded-full">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{focus.name}</h3>
                  <p className="text-orange-100 text-xs">{focus.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 