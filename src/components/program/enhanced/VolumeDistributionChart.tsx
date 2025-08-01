'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { VolumeDistribution } from '@/lib/validation/enhancedProgramSchema'
import { VolumeLandmarks } from '@/lib/types/program'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface VolumeDistributionChartProps {
  volumeDistribution: VolumeDistribution
  individualLandmarks: Record<string, VolumeLandmarks>
  currentWeekVolume?: Record<string, number>
  showComplianceIndicators?: boolean
  className?: string
}

interface MuscleVolumeData {
  name: string
  displayName: string
  weeklyVolume: number
  percentageOfMAV: number
  landmarks: VolumeLandmarks
  complianceStatus: 'optimal' | 'below-mev' | 'above-mrv' | 'caution'
  complianceColor: string
  progressBarColor: string
}

const MUSCLE_GROUP_DISPLAY_NAMES: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs/Core'
}

const VOLUME_ZONE_EXPLANATIONS = {
  'below-mev': {
    title: 'Below MEV',
    description: 'Volume below the minimum effective threshold. May not stimulate significant adaptation.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  'optimal': {
    title: 'Optimal Zone',
    description: 'Volume within the optimal range (MEV-MAV). Maximum adaptation with manageable fatigue.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'caution': {
    title: 'High Volume',
    description: 'Volume near maximum recoverable limits (MAV-MRV). Monitor fatigue carefully.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  'above-mrv': {
    title: 'Above MRV',
    description: 'Volume exceeds maximum recoverable limits. High risk of overreaching.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

function determineComplianceStatus(
  weeklyVolume: number,
  landmarks: VolumeLandmarks
): 'optimal' | 'below-mev' | 'above-mrv' | 'caution' {
  if (weeklyVolume < landmarks.MEV) return 'below-mev'
  if (weeklyVolume > landmarks.MRV) return 'above-mrv'
  if (weeklyVolume > landmarks.MAV) return 'caution'
  return 'optimal'
}

function getComplianceColor(status: string): string {
  switch (status) {
    case 'optimal': return 'bg-green-500'
    case 'caution': return 'bg-yellow-500'
    case 'below-mev': return 'bg-red-500'
    case 'above-mrv': return 'bg-red-600'
    default: return 'bg-gray-500'
  }
}

function getProgressBarColor(status: string): string {
  switch (status) {
    case 'optimal': return 'bg-green-500'
    case 'caution': return 'bg-yellow-500'
    case 'below-mev': return 'bg-red-400'
    case 'above-mrv': return 'bg-red-600'
    default: return 'bg-gray-400'
  }
}

function ComplianceIcon({ status }: { status: string }) {
  switch (status) {
    case 'optimal':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'caution':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    case 'below-mev':
    case 'above-mrv':
      return <XCircle className="w-4 h-4 text-red-600" />
    default:
      return <Info className="w-4 h-4 text-gray-600" />
  }
}

export function VolumeDistributionChart({
  volumeDistribution,
  individualLandmarks,
  currentWeekVolume,
  showComplianceIndicators = true,
  className = ''
}: VolumeDistributionChartProps) {
  const muscleVolumeData: MuscleVolumeData[] = useMemo(() => {
    const muscleGroups = Object.keys(volumeDistribution)
    
    return muscleGroups.map(muscle => {
      const volumeData = volumeDistribution[muscle as keyof VolumeDistribution]
      const landmarks = individualLandmarks[muscle]
      
      if (!volumeData || !landmarks) {
        return null
      }

      const weeklyVolume = currentWeekVolume?.[muscle] ?? volumeData.weeklyVolume
      const complianceStatus = determineComplianceStatus(weeklyVolume, landmarks)
      
      return {
        name: muscle,
        displayName: MUSCLE_GROUP_DISPLAY_NAMES[muscle] || muscle,
        weeklyVolume,
        percentageOfMAV: volumeData.percentageOfMAV,
        landmarks,
        complianceStatus,
        complianceColor: getComplianceColor(complianceStatus),
        progressBarColor: getProgressBarColor(complianceStatus)
      }
    }).filter(Boolean) as MuscleVolumeData[]
  }, [volumeDistribution, individualLandmarks, currentWeekVolume])

  const overallCompliance = useMemo(() => {
    const optimalCount = muscleVolumeData.filter(m => m.complianceStatus === 'optimal').length
    const totalCount = muscleVolumeData.length
    return {
      optimalCount,
      totalCount,
      percentage: totalCount > 0 ? Math.round((optimalCount / totalCount) * 100) : 0
    }
  }, [muscleVolumeData])

  if (muscleVolumeData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p>Volume distribution data not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Volume Distribution
              </CardTitle>
              <CardDescription>
                Weekly training volume vs individual landmarks (MEV/MAV/MRV)
              </CardDescription>
            </div>
            {showComplianceIndicators && (
              <div className="text-right">
                <Badge 
                  variant={overallCompliance.percentage >= 70 ? 'default' : 'destructive'}
                  className="mb-1"
                >
                  {overallCompliance.optimalCount}/{overallCompliance.totalCount} Optimal
                </Badge>
                <p className="text-xs text-gray-600">
                  {overallCompliance.percentage}% compliance
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Volume Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
            {Object.entries(VOLUME_ZONE_EXPLANATIONS).map(([key, zone]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <div className={`w-3 h-3 rounded-full ${getComplianceColor(key)}`} />
                    <span className="text-xs font-medium">{zone.title}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{zone.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Muscle Group Volume Bars */}
          <div className="space-y-4">
            {muscleVolumeData.map((muscle) => (
              <div key={muscle.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ComplianceIcon status={muscle.complianceStatus} />
                    <span className="font-medium text-sm">{muscle.displayName}</span>
                    <Badge variant="outline" className="text-xs">
                      {muscle.weeklyVolume} sets
                    </Badge>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>{Math.round(muscle.percentageOfMAV)}% of MAV</div>
                  </div>
                </div>

                {/* Volume Bar with Landmarks */}
                <div className="relative">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <span>MEV: {muscle.landmarks.MEV}</span>
                    <span>•</span>
                    <span>MAV: {muscle.landmarks.MAV}</span>
                    <span>•</span>
                    <span>MRV: {muscle.landmarks.MRV}</span>
                  </div>
                  
                  {/* Background bar showing landmarks */}
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    {/* MEV-MAV zone (optimal) */}
                    <div 
                      className="absolute top-0 h-full bg-green-200"
                      style={{
                        left: `${(muscle.landmarks.MEV / muscle.landmarks.MRV) * 100}%`,
                        width: `${((muscle.landmarks.MAV - muscle.landmarks.MEV) / muscle.landmarks.MRV) * 100}%`
                      }}
                    />
                    
                    {/* MAV-MRV zone (caution) */}
                    <div 
                      className="absolute top-0 h-full bg-yellow-200"
                      style={{
                        left: `${(muscle.landmarks.MAV / muscle.landmarks.MRV) * 100}%`,
                        width: `${((muscle.landmarks.MRV - muscle.landmarks.MAV) / muscle.landmarks.MRV) * 100}%`
                      }}
                    />
                    
                    {/* Actual volume bar */}
                    <div 
                      className={`absolute top-0 h-full ${muscle.progressBarColor} transition-all duration-300`}
                      style={{
                        width: `${Math.min((muscle.weeklyVolume / muscle.landmarks.MRV) * 100, 100)}%`
                      }}
                    />
                    
                    {/* Volume overflow indicator */}
                    {muscle.weeklyVolume > muscle.landmarks.MRV && (
                      <div className="absolute top-0 right-0 h-full w-2 bg-red-600 border-l-2 border-white" />
                    )}
                  </div>
                  
                  {/* Landmark markers */}
                  <div className="relative -mt-1">
                    {/* MEV marker */}
                    <div 
                      className="absolute w-0.5 h-2 bg-gray-600"
                      style={{ left: `${(muscle.landmarks.MEV / muscle.landmarks.MRV) * 100}%` }}
                    />
                    {/* MAV marker */}
                    <div 
                      className="absolute w-0.5 h-2 bg-gray-600"
                      style={{ left: `${(muscle.landmarks.MAV / muscle.landmarks.MRV) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Compliance Warning */}
                {muscle.complianceStatus !== 'optimal' && (
                  <div className={`p-2 rounded text-xs ${VOLUME_ZONE_EXPLANATIONS[muscle.complianceStatus].bgColor} ${VOLUME_ZONE_EXPLANATIONS[muscle.complianceStatus].borderColor} border`}>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-medium">
                        {VOLUME_ZONE_EXPLANATIONS[muscle.complianceStatus].title}:
                      </span>
                    </div>
                    <p className="mt-1">{VOLUME_ZONE_EXPLANATIONS[muscle.complianceStatus].description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Recommendations */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Volume Recommendations</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {overallCompliance.percentage >= 80 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Excellent volume distribution. Continue current programming.</span>
                </div>
              ) : overallCompliance.percentage >= 60 ? (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Good volume distribution with room for optimization.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-3 h-3" />
                  <span>Volume distribution needs adjustment. Consider modifying program.</span>
                </div>
              )}
              
              {muscleVolumeData.filter(m => m.complianceStatus === 'below-mev').length > 0 && (
                <p>• Consider increasing volume for muscle groups below MEV</p>
              )}
              
              {muscleVolumeData.filter(m => m.complianceStatus === 'above-mrv').length > 0 && (
                <p>• Reduce volume for muscle groups above MRV to prevent overreaching</p>
              )}
              
              {muscleVolumeData.filter(m => m.complianceStatus === 'caution').length > 0 && (
                <p>• Monitor fatigue for high-volume muscle groups</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 