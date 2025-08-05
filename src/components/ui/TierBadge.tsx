import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Star, Target, Zap, Circle } from 'lucide-react'

interface TierBadgeProps {
  tier: 'Anchor' | 'Primary' | 'Secondary' | 'Accessory'
  isAnchorLift?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const TIER_CONFIG = {
  'Anchor': {
    color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
    icon: Star,
    description: 'Core compound movements that form the foundation of your training program',
    priority: 1
  },
  'Primary': {
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    icon: Target,
    description: 'Major compound exercises that drive strength and muscle development',
    priority: 2
  },
  'Secondary': {
    color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    icon: Zap,
    description: 'Supporting exercises that complement your main lifts',
    priority: 3
  },
  'Accessory': {
    color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    icon: Circle,
    description: 'Isolation exercises for muscle balance and injury prevention',
    priority: 4
  }
} as const

const SIZE_CONFIG = {
  'sm': 'text-xs px-1.5 py-0.5 h-5',
  'md': 'text-sm px-2 py-1 h-6',
  'lg': 'text-base px-3 py-1.5 h-8'
} as const

export function TierBadge({ 
  tier, 
  isAnchorLift = false, 
  showIcon = true, 
  size = 'sm' 
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier]
  const Icon = config.icon
  const sizeClasses = SIZE_CONFIG[size]

  // Special styling for anchor lifts
  const anchorStyling = isAnchorLift 
    ? 'bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 border-amber-400 shadow-sm font-semibold'
    : config.color

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${anchorStyling} ${sizeClasses} inline-flex items-center gap-1 transition-colors cursor-help`}
          >
            {showIcon && <Icon className="h-3 w-3" />}
            {isAnchorLift ? 'ANCHOR' : tier.toUpperCase()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {isAnchorLift ? 'Anchor Lift' : `${tier} Exercise`}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            {isAnchorLift && (
              <p className="text-xs text-amber-600 font-medium">
                This is a key movement for your program - focus on perfect form and progression.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}