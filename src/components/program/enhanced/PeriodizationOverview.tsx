'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  TrendingUp, 
  Zap, 
  Target, 
  Clock,
  BarChart3,
  Activity,
  RefreshCw,
  Info
} from 'lucide-react'

interface EnhancedTrainingPhase {
  phaseName: string
  durationWeeks: number
  phaseNumber?: number
  primaryAdaptation: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'skill_acquisition' | 'recovery' | 'peaking'
  progressionType: 'volume_progression' | 'intensity_progression' | 'density_progression' | 'frequency_progression' | 'complexity_progression'
  objectives?: string[]
}

interface PeriodizationOverviewProps {
  phases: EnhancedTrainingPhase[]
  currentPhase?: number
  currentWeek?: number
  progressionModel: string
  className?: string
}

const ADAPTATION_COLORS = {
  'hypertrophy': {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: '💪',
    description: 'Muscle growth and size'
  },
  'strength': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: '🏋️',
    description: 'Maximum force production'
  },
  'power': {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: '⚡',
    description: 'Force velocity and explosiveness'
  },
  'endurance': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: '🏃',
    description: 'Cardiovascular capacity'
  },
  'skill_acquisition': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: '🎯',
    description: 'Movement quality and technique'
  },
  'recovery': {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    icon: '🧘',
    description: 'Active recovery and deload'
  },
  'peaking': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: '🎖️',
    description: 'Competition preparation'
  }
}

const PROGRESSION_DESCRIPTIONS = {
  'volume_progression': 'Gradual increase in training volume (sets × reps)',
  'intensity_progression': 'Progressive overload through increased weight/resistance',
  'density_progression': 'More work accomplished in the same time period',
  'frequency_progression': 'Increased training frequency per muscle group',
  'complexity_progression': 'Advanced exercise variations and techniques'
}

const PERIODIZATION_MODELS = {
  'Linear Progression': {
    description: 'Steady, progressive increase in intensity over time',
    characteristics: ['Beginner-friendly', 'Predictable progression', 'Simple implementation']
  },
  'Daily Undulating Periodization': {
    description: 'Daily variation in training variables within the same week',
    characteristics: ['Frequent stimulus variation', 'Reduced adaptation plateau', 'Complex planning']
  },
  'Block Periodization': {
    description: 'Sequential training blocks focusing on specific adaptations',
    characteristics: ['Concentrated training stress', 'Clear adaptation goals', 'Structured progression']
  },
  'Conjugate Method': {
    description: 'Simultaneous development of multiple training qualities',
    characteristics: ['Advanced methodology', 'Year-round peaking', 'High complexity']
  },
  'Autoregulated Progression': {
    description: 'Training adjustments based on daily readiness and performance',
    characteristics: ['Individualized approach', 'Flexible progression', 'Requires experience']
  }
}

function PhaseTimeline({ 
  phases, 
  currentPhase = 0, 
  currentWeek = 1 
}: { 
  phases: EnhancedTrainingPhase[]
  currentPhase?: number
  currentWeek?: number 
}) {
  const totalWeeks = phases.reduce((sum, phase) => sum + phase.durationWeeks, 0)
  let cumulativeWeeks = 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Training Timeline</h4>
        <Badge variant="outline">
          {totalWeeks} weeks total
        </Badge>
      </div>
      
      <div className="relative">
        {/* Timeline bar */}
        <div className="h-8 bg-gray-200 rounded-lg overflow-hidden flex">
          {phases.map((phase, index) => {
            const widthPercentage = (phase.durationWeeks / totalWeeks) * 100
            const adaptationStyle = ADAPTATION_COLORS[phase.primaryAdaptation]
            const isCurrentPhase = index === currentPhase
            
            cumulativeWeeks += phase.durationWeeks
            
            return (
              <div
                key={index}
                className={`
                  h-full flex items-center justify-center text-xs font-medium transition-all
                  ${adaptationStyle.bg} ${adaptationStyle.text} ${adaptationStyle.border}
                  ${isCurrentPhase ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  ${index > 0 ? 'border-l' : ''}
                `}
                style={{ width: `${widthPercentage}%` }}
              >
                <div className="text-center px-1">
                  <div className="text-lg mb-1">{adaptationStyle.icon}</div>
                  <div className="font-semibold truncate">{phase.phaseName}</div>
                  <div className="text-xs opacity-80">{phase.durationWeeks}w</div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Current week indicator */}
        {currentPhase !== undefined && currentWeek !== undefined && (
          <div 
            className="absolute top-0 h-8 w-1 bg-blue-600 z-10"
            style={{ 
              left: `${((currentWeek / totalWeeks) * 100)}%` 
            }}
          >
            <div className="absolute -top-6 -left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Week {currentWeek}
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(ADAPTATION_COLORS).map(([key, style]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${style.bg} ${style.border} border`} />
            <span className="text-gray-600 capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhaseBreakdown({ phases }: { phases: EnhancedTrainingPhase[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Phase Details</h4>
      
      <div className="space-y-3">
        {phases.map((phase, index) => {
          const adaptationStyle = ADAPTATION_COLORS[phase.primaryAdaptation]
          
          return (
            <Card key={index} className={`border-l-4 ${adaptationStyle.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{adaptationStyle.icon}</span>
                    <div>
                      <h5 className="font-medium">{phase.phaseName}</h5>
                      <p className="text-xs text-gray-600">
                        {adaptationStyle.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${adaptationStyle.bg} ${adaptationStyle.text}`}>
                      {phase.durationWeeks} weeks
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {phase.progressionType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                {phase.objectives && phase.objectives.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Objectives:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {phase.objectives.map((objective, objIndex) => (
                        <li key={objIndex} className="flex items-start gap-1">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ProgressionStrategy({ 
  phases, 
  progressionModel 
}: { 
  phases: EnhancedTrainingPhase[]
  progressionModel: string 
}) {
  const modelInfo = PERIODIZATION_MODELS[progressionModel as keyof typeof PERIODIZATION_MODELS]
  
  const progressionTypes = useMemo(() => {
    const types = phases.reduce((acc, phase) => {
      if (!acc[phase.progressionType]) {
        acc[phase.progressionType] = 0
      }
      acc[phase.progressionType] += phase.durationWeeks
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(types).map(([type, weeks]) => ({ type, weeks }))
  }, [phases])

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Periodization Model</h4>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <h5 className="font-medium">{progressionModel}</h5>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">
              {modelInfo?.description || 'Custom periodization approach'}
            </p>
            
            {modelInfo && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Key Characteristics:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {modelInfo.characteristics.map((char, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="text-purple-600">✓</span>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Progression Strategies</h4>
        <div className="space-y-2">
          {progressionTypes.map(({ type, weeks }) => (
            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <span className="text-sm font-medium capitalize">
                  {type.replace('_', ' ')}
                </span>
                <p className="text-xs text-gray-600">
                  {PROGRESSION_DESCRIPTIONS[type as keyof typeof PROGRESSION_DESCRIPTIONS]}
                </p>
              </div>
              <Badge variant="outline">{weeks}w</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PeriodizationOverview({
  phases,
  currentPhase = 0,
  currentWeek = 1,
  progressionModel,
  className = ''
}: PeriodizationOverviewProps) {
  const totalWeeks = phases.reduce((sum, phase) => sum + phase.durationWeeks, 0)
  const completionPercentage = Math.round((currentWeek / totalWeeks) * 100)
  
  const adaptationDistribution = useMemo(() => {
    const distribution = phases.reduce((acc, phase) => {
      if (!acc[phase.primaryAdaptation]) {
        acc[phase.primaryAdaptation] = 0
      }
      acc[phase.primaryAdaptation] += phase.durationWeeks
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(distribution).map(([adaptation, weeks]) => ({
      adaptation,
      weeks,
      percentage: Math.round((weeks / totalWeeks) * 100)
    }))
  }, [phases, totalWeeks])

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Periodization Overview</CardTitle>
              <CardDescription>
                Training phase structure and progression strategy
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Program Progress */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Program Progress
              </h3>
              <Badge className="bg-indigo-100 text-indigo-800">
                Week {currentWeek} of {totalWeeks}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{completionPercentage}% complete</span>
                <span>
                  {phases.length - currentPhase} phase{phases.length - currentPhase !== 1 ? 's' : ''} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Phase Timeline */}
          <PhaseTimeline 
            phases={phases}
            currentPhase={currentPhase}
            currentWeek={currentWeek}
          />

          {/* Adaptation Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-3">Training Focus Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {adaptationDistribution.map(({ adaptation, weeks, percentage }) => {
                const style = ADAPTATION_COLORS[adaptation as keyof typeof ADAPTATION_COLORS]
                
                return (
                  <div key={adaptation} className={`p-3 rounded-lg border ${style.bg} ${style.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <span className={`font-medium capitalize ${style.text}`}>
                          {adaptation.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant="outline" className={style.text}>
                        {percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {weeks} weeks • {style.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phase Breakdown */}
          <PhaseBreakdown phases={phases} />

          {/* Progression Strategy */}
          <ProgressionStrategy 
            phases={phases}
            progressionModel={progressionModel}
          />

          {/* Educational Note */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-indigo-800 mb-1">
                  Periodization Principles
                </p>
                <p className="text-indigo-700 text-xs leading-relaxed">
                  Periodization organizes training into structured phases, each targeting specific 
                  adaptations. This systematic approach optimizes performance gains while managing 
                  fatigue and preventing overtraining through planned variation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 