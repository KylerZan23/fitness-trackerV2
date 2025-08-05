import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react'

interface RPEIndicatorProps {
  rpe: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const SIZE_CONFIG = {
  'sm': 'text-xs px-1.5 py-0.5 h-5',
  'md': 'text-sm px-2 py-1 h-6',
  'lg': 'text-base px-3 py-1.5 h-8'
} as const

function parseRPE(rpe: string): number {
  // Extract numeric value from RPE string (e.g., "8", "@8", "7-8" -> 8)
  const match = rpe.match(/(\d+(?:\.\d+)?)/g)
  if (!match) return 7 // Default to moderate
  
  // If range (e.g., "7-8"), take the higher value
  const numbers = match.map(Number)
  return Math.max(...numbers)
}

function getRPEConfig(rpe: string) {
  const rpeValue = parseRPE(rpe)
  
  if (rpeValue >= 9) {
    return {
      color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
      icon: AlertTriangle,
      label: 'Very Hard',
      description: 'Maximum effort - 1 rep in reserve or less. Use sparingly.'
    }
  } else if (rpeValue >= 8) {
    return {
      color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
      icon: Activity,
      label: 'Hard',
      description: 'Challenging but controlled - 2-3 reps in reserve.'
    }
  } else if (rpeValue >= 6) {
    return {
      color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
      icon: CheckCircle,
      label: 'Moderate',
      description: 'Moderate intensity - 4+ reps in reserve. Good for volume work.'
    }
  } else {
    return {
      color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
      icon: CheckCircle,
      label: 'Easy',
      description: 'Light intensity - warm-up or recovery work.'
    }
  }
}

const RPE_SCALE = [
  { value: 6, description: "Easy - No fatigue, could do many more reps" },
  { value: 7, description: "Moderate - Starting to feel it, several reps left" },
  { value: 8, description: "Hard - Difficult, 2-3 reps left in tank" },
  { value: 9, description: "Very Hard - 1 rep left, maximum effort zone" },
  { value: 10, description: "Maximum - No reps left, absolute limit" }
]

export function RPEIndicator({ 
  rpe, 
  showTooltip = true, 
  size = 'sm',
  showIcon = true 
}: RPEIndicatorProps) {
  const config = getRPEConfig(rpe)
  const Icon = config.icon
  const sizeClasses = SIZE_CONFIG[size]

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses} inline-flex items-center gap-1 transition-colors font-medium ${showTooltip ? 'cursor-help' : ''}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      RPE {rpe}
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
              <p className="font-medium">RPE {rpe} - {config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs font-medium mb-1">RPE Scale Reference:</p>
              <div className="space-y-0.5">
                {RPE_SCALE.map((item) => (
                  <div 
                    key={item.value} 
                    className={`text-xs ${parseRPE(rpe) === item.value ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    <span className="font-mono">{item.value}:</span> {item.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}