import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dumbbell, Zap, Trophy, RefreshCw } from 'lucide-react'

interface PhaseBadgeProps {
  phaseType: 'Accumulation' | 'Intensification' | 'Realization' | 'Deload'
  phaseName: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  durationWeeks?: number
}

const PHASE_CONFIG = {
  'Accumulation': {
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    icon: Dumbbell,
    shortName: 'ACC',
    description: 'Build work capacity and muscle mass through higher volume training.',
    characteristics: ['Higher training volume', 'Moderate intensity', 'Hypertrophy focus', 'Base building'],
    typical: '60-80% 1RM, 3-5 sets, 8-15 reps'
  },
  'Intensification': {
    color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
    icon: Zap,
    shortName: 'INT',
    description: 'Increase training intensity while reducing volume to build strength.',
    characteristics: ['Higher intensity', 'Reduced volume', 'Strength focus', 'Neural adaptations'],
    typical: '80-90% 1RM, 2-4 sets, 3-6 reps'
  },
  'Realization': {
    color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
    icon: Trophy,
    shortName: 'REAL',
    description: 'Peak performance phase - test maximum strength and skill.',
    characteristics: ['Peak intensity', 'Minimal volume', 'Skill refinement', 'Competition prep'],
    typical: '90-100% 1RM, 1-3 sets, 1-3 reps'
  },
  'Deload': {
    color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    icon: RefreshCw,
    shortName: 'DELOAD',
    description: 'Recovery phase to dissipate fatigue and prepare for next training block.',
    characteristics: ['Reduced intensity', 'Reduced volume', 'Active recovery', 'Technique focus'],
    typical: '50-70% 1RM, 2-3 sets, 5-8 reps'
  }
} as const

const SIZE_CONFIG = {
  'sm': 'text-xs px-1.5 py-0.5 h-5',
  'md': 'text-sm px-2 py-1 h-6',
  'lg': 'text-base px-3 py-1.5 h-8'
} as const

export function PhaseBadge({ 
  phaseType, 
  phaseName, 
  showTooltip = true, 
  size = 'sm',
  durationWeeks 
}: PhaseBadgeProps) {
  const config = PHASE_CONFIG[phaseType]
  const Icon = config.icon
  const sizeClasses = SIZE_CONFIG[size]

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses} inline-flex items-center gap-1 transition-colors font-semibold ${showTooltip ? 'cursor-help' : ''}`}
    >
      <Icon className="h-3 w-3" />
      {size === 'sm' ? config.shortName : phaseType}
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
              <p className="font-medium">{phaseName}</p>
              <p className="text-xs text-muted-foreground mb-1">
                {phaseType} Phase {durationWeeks && `• ${durationWeeks} week${durationWeeks > 1 ? 's' : ''}`}
              </p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            
            <div className="border-t pt-2">
              <p className="text-xs font-medium mb-1">Phase Characteristics:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {config.characteristics.map((characteristic, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-current rounded-full" />
                    {characteristic}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-2">
              <p className="text-xs font-medium mb-1">Typical Loading:</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                {config.typical}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}