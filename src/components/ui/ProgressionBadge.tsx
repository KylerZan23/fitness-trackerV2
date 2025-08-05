import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, BarChart3, Zap, Waves, Brain } from 'lucide-react'

interface ProgressionBadgeProps {
  strategy: 'Linear' | 'Double Progression' | 'Reverse Pyramid' | 'Wave Loading' | 'Autoregulated'
  weekNumber: number
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const PROGRESSION_CONFIG = {
  'Linear': {
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    icon: TrendingUp,
    description: 'Steady increase in weight or reps each week. Simple and effective for beginners.',
    example: 'Week 1: 3×8, Week 2: 3×9, Week 3: 3×10, Week 4: 3×8 +5lbs'
  },
  'Double Progression': {
    color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    icon: BarChart3,
    description: 'Increase reps first, then weight. Progress both variables systematically.',
    example: '3×8-12 → Increase reps to 12, then add weight and drop back to 8 reps'
  },
  'Reverse Pyramid': {
    color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
    icon: Zap,
    description: 'Start heavy, decrease weight and increase reps each set.',
    example: 'Set 1: Heavy weight × 6, Set 2: -10% × 8, Set 3: -20% × 10'
  },
  'Wave Loading': {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
    icon: Waves,
    description: 'Undulating intensity pattern within and across weeks.',
    example: 'Week 1: Heavy, Week 2: Medium, Week 3: Light, Week 4: Very Heavy'
  },
  'Autoregulated': {
    color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
    icon: Brain,
    description: 'Adjust intensity based on daily readiness and RPE feedback.',
    example: 'Feeling great? Add weight. Feeling tired? Reduce load or do prescribed.'
  }
} as const

const SIZE_CONFIG = {
  'sm': 'text-xs px-1.5 py-0.5 h-5',
  'md': 'text-sm px-2 py-1 h-6',
  'lg': 'text-base px-3 py-1.5 h-8'
} as const

export function ProgressionBadge({ 
  strategy, 
  weekNumber, 
  showTooltip = true, 
  size = 'sm' 
}: ProgressionBadgeProps) {
  const config = PROGRESSION_CONFIG[strategy]
  const Icon = config.icon
  const sizeClasses = SIZE_CONFIG[size]

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses} inline-flex items-center gap-1 transition-colors font-medium ${showTooltip ? 'cursor-help' : ''}`}
    >
      <Icon className="h-3 w-3" />
      {strategy}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div>
              <p className="font-medium">{strategy} Progression</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs font-medium mb-1">Example Implementation:</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                {config.example}
              </p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-blue-600 font-medium">
                Currently in Week {weekNumber}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}