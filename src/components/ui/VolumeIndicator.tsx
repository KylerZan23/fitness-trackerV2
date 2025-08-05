import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface VolumeIndicatorProps {
  landmark: 'MEV' | 'MAV' | 'MRV' | string
  currentVolume?: number
  targetVolume?: number
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const VOLUME_CONFIG = {
  'MEV': {
    name: 'Minimum Effective Volume',
    color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    icon: CheckCircle,
    description: 'The minimum volume needed to see meaningful adaptation. Safe starting point.',
    recommendation: 'Good for beginners or when recovering from high stress periods.'
  },
  'MAV': {
    name: 'Maximum Adaptive Volume',
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    icon: BarChart3,
    description: 'Optimal volume for maximum muscle growth and strength gains.',
    recommendation: 'Sweet spot for most intermediate trainees. Aim to progress toward this.'
  },
  'MRV': {
    name: 'Maximum Recoverable Volume',
    color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
    icon: AlertTriangle,
    description: 'Maximum volume you can recover from. Use sparingly and with caution.',
    recommendation: 'Only for advanced trainees during specialization phases. Monitor recovery closely.'
  }
} as const

const SIZE_CONFIG = {
  'sm': 'text-xs px-1.5 py-0.5 h-5',
  'md': 'text-sm px-2 py-1 h-6',
  'lg': 'text-base px-3 py-1.5 h-8'
} as const

function getVolumeConfig(landmark: string) {
  if (landmark in VOLUME_CONFIG) {
    return VOLUME_CONFIG[landmark as keyof typeof VOLUME_CONFIG]
  }
  
  // Fallback for custom landmarks
  return {
    name: landmark,
    color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200',
    icon: BarChart3,
    description: 'Custom volume landmark for this training phase.',
    recommendation: 'Follow your coach\'s guidance for this volume target.'
  }
}

export function VolumeIndicator({ 
  landmark, 
  currentVolume, 
  targetVolume, 
  showProgress = false, 
  size = 'sm' 
}: VolumeIndicatorProps) {
  const config = getVolumeConfig(landmark)
  const Icon = config.icon
  const sizeClasses = SIZE_CONFIG[size]

  const progressPercentage = (currentVolume && targetVolume) 
    ? Math.min((currentVolume / targetVolume) * 100, 100) 
    : 0

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses} inline-flex items-center gap-1 transition-colors font-medium cursor-help`}
    >
      <Icon className="h-3 w-3" />
      {landmark}
    </Badge>
  )

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-2">
              <div>
                <p className="font-medium">{config.name}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs font-medium mb-1">Training Recommendation:</p>
                <p className="text-xs text-muted-foreground">{config.recommendation}</p>
              </div>
              {currentVolume && targetVolume && (
                <div className="border-t pt-2">
                  <p className="text-xs font-medium">
                    Volume: {currentVolume} / {targetVolume} sets
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progressPercentage.toFixed(0)}% of target
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {showProgress && currentVolume && targetVolume && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Volume Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}