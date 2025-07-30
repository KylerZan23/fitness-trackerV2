'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Brain,
  Heart,
  Zap,
  Info,
  Plus
} from 'lucide-react'
import { AutoregulationProtocol } from '@/lib/validation/enhancedProgramSchema'

interface AutoregulationGuidelinesProps {
  protocol: AutoregulationProtocol
  currentPhase: string
  onRPELog?: (rpe: number, notes: string) => void
  userReadiness?: 'high' | 'normal' | 'low' | 'very-low'
  className?: string
}

interface RPELevel {
  value: number
  label: string
  description: string
  color: string
  intensity: string
}

const RPE_SCALE: RPELevel[] = [
  { value: 1, label: 'Very Easy', description: 'Could do many more reps', color: 'bg-green-200', intensity: '~50% 1RM' },
  { value: 2, label: 'Easy', description: 'Could do many more reps', color: 'bg-green-300', intensity: '~55% 1RM' },
  { value: 3, label: 'Light', description: 'Could do many more reps', color: 'bg-green-400', intensity: '~60% 1RM' },
  { value: 4, label: 'Light-Moderate', description: 'Could do 5-6 more reps', color: 'bg-yellow-200', intensity: '~65% 1RM' },
  { value: 5, label: 'Moderate', description: 'Could do 4-5 more reps', color: 'bg-yellow-300', intensity: '~70% 1RM' },
  { value: 6, label: 'Moderate-Hard', description: 'Could do 3-4 more reps', color: 'bg-yellow-400', intensity: '~75% 1RM' },
  { value: 7, label: 'Hard', description: 'Could do 2-3 more reps', color: 'bg-orange-300', intensity: '~80% 1RM' },
  { value: 8, label: 'Very Hard', description: 'Could do 1-2 more reps', color: 'bg-orange-400', intensity: '~85% 1RM' },
  { value: 9, label: 'Extremely Hard', description: 'Could do 1 more rep', color: 'bg-red-400', intensity: '~90% 1RM' },
  { value: 10, label: 'Maximum', description: 'Could not do more reps', color: 'bg-red-500', intensity: '~95-100% 1RM' }
]

const READINESS_ADJUSTMENTS = {
  'high': {
    label: 'Ready to Go',
    adjustment: '+1 RPE',
    color: 'text-green-600',
    icon: <Zap className="w-4 h-4" />,
    description: 'Feeling great, well-rested, motivated'
  },
  'normal': {
    label: 'Feeling Good',
    adjustment: 'No change',
    color: 'text-blue-600',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Normal energy, adequate recovery'
  },
  'low': {
    label: 'Sore/Tired',
    adjustment: '-1 RPE',
    color: 'text-yellow-600',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Slight fatigue, minor soreness'
  },
  'very-low': {
    label: 'Very Fatigued',
    adjustment: '-2 RPE or deload',
    color: 'text-red-600',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'High fatigue, poor sleep, stress'
  }
}

function RPEScaleVisual({ targetRange, currentPhase }: { targetRange: [number, number], currentPhase: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">RPE Scale Reference</h4>
        <Badge variant="outline">
          {currentPhase} Target: {targetRange[0]}-{targetRange[1]}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {RPE_SCALE.map((level) => {
          const isInRange = level.value >= targetRange[0] && level.value <= targetRange[1]
          
          return (
            <div 
              key={level.value}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${isInRange ? 'border-blue-500 shadow-md' : 'border-gray-200'}
                ${level.color}
              `}
            >
              <div className="text-center">
                <div className="font-bold text-lg mb-1">{level.value}</div>
                <div className="text-xs font-medium mb-1">{level.label}</div>
                <div className="text-xs opacity-80">{level.intensity}</div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="text-xs text-gray-600 mt-2">
        <p>• RPE 6-7: Moderate effort, good for volume work</p>
        <p>• RPE 8-9: High effort, good for strength/intensity work</p>
        <p>• RPE 10: Maximum effort, use sparingly</p>
      </div>
    </div>
  )
}

function ReadinessAdjustments({ 
  protocol, 
  userReadiness = 'normal' 
}: { 
  protocol: AutoregulationProtocol
  userReadiness: string 
}) {
  const adjustmentGuidelines = protocol.adjustmentGuidelines
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Brain className="w-4 h-4" />
        Daily Readiness Adjustments
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(READINESS_ADJUSTMENTS).map(([level, info]) => {
          const isCurrentReadiness = level === userReadiness
          const guideline = adjustmentGuidelines[level as keyof typeof adjustmentGuidelines]
          
          return (
            <Card 
              key={level}
              className={`
                border-2 transition-all
                ${isCurrentReadiness ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              `}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {info.icon}
                  <span className={`font-medium ${info.color}`}>
                    {info.label}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {info.adjustment}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {info.description}
                </p>
                
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <strong>Protocol:</strong> {guideline}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function RPELogger({ onRPELog }: { onRPELog?: (rpe: number, notes: string) => void }) {
  const [selectedRPE, setSelectedRPE] = useState<number>(7)
  const [notes, setNotes] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const handleLogRPE = () => {
    if (onRPELog) {
      setIsLogging(true)
      onRPELog(selectedRPE, notes)
      
      // Reset form after logging
      setTimeout(() => {
        setNotes('')
        setIsLogging(false)
      }, 500)
    }
  }

  if (!onRPELog) return null

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log RPE
        </CardTitle>
        <CardDescription>
          Record your perceived exertion for this exercise or session
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            RPE Rating: {selectedRPE}/10
          </label>
          <Slider
            value={[selectedRPE]}
            onValueChange={(value) => setSelectedRPE(value[0])}
            min={1}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Easy</span>
            <span>Moderate</span>
            <span>Maximum</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did this feel? Any adjustments needed?"
            rows={2}
            className="text-sm"
          />
        </div>

        <Button 
          onClick={handleLogRPE}
          disabled={isLogging}
          className="w-full"
          size="sm"
        >
          {isLogging ? 'Logging...' : 'Log RPE'}
        </Button>
      </CardContent>
    </Card>
  )
}

function RecoveryMarkers({ protocol }: { protocol: AutoregulationProtocol }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Recovery Markers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs">
            {protocol.recoveryMarkers.map((marker, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {marker}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Fatigue Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs">
            {protocol.fatigueIndicators.map((indicator, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {indicator}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export function AutoregulationGuidelines({
  protocol,
  currentPhase,
  onRPELog,
  userReadiness = 'normal',
  className = ''
}: AutoregulationGuidelinesProps) {
  const phaseTargets = useMemo(() => {
    const phaseKey = currentPhase.toLowerCase() as keyof typeof protocol.phaseRPETargets
    return protocol.phaseRPETargets[phaseKey] || protocol.phaseRPETargets.accumulation
  }, [protocol, currentPhase])

  const targetRange: [number, number] = [phaseTargets.min, phaseTargets.max]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Autoregulation Guidelines</CardTitle>
              <CardDescription>
                RPE-based training adjustments for {currentPhase} phase
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Phase-Specific RPE Targets */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                {currentPhase} Phase Targets
              </h3>
              <Badge className="bg-purple-100 text-purple-800">
                RPE {phaseTargets.target} (±{Math.max(phaseTargets.target - phaseTargets.min, phaseTargets.max - phaseTargets.target)})
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-gray-600">Minimum</div>
                <div className="text-xl font-bold text-purple-600">{phaseTargets.min}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Target</div>
                <div className="text-xl font-bold text-purple-800">{phaseTargets.target}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Maximum</div>
                <div className="text-xl font-bold text-purple-600">{phaseTargets.max}</div>
              </div>
            </div>
          </div>

          {/* RPE Scale Visualization */}
          <RPEScaleVisual targetRange={targetRange} currentPhase={currentPhase} />

          {/* Readiness Adjustments */}
          <ReadinessAdjustments protocol={protocol} userReadiness={userReadiness} />

          {/* RPE Logger */}
          {onRPELog && <RPELogger onRPELog={onRPELog} />}

          {/* Recovery Markers & Fatigue Indicators */}
          <RecoveryMarkers protocol={protocol} />

          {/* Educational Note */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-purple-800 mb-1">
                  Autoregulation Principles
                </p>
                <p className="text-purple-700 text-xs leading-relaxed">
                  Autoregulation allows you to adjust training intensity based on daily readiness. 
                  Listen to your body, use the RPE scale consistently, and adjust loads accordingly. 
                  This approach maximizes training adaptations while minimizing overreaching risk.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 