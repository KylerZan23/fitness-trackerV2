'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Activity,
  BarChart3,
  Plus,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react'
import { WeakPointIntervention } from '@/lib/validation/enhancedProgramSchema'

interface ProgressData {
  date: string
  value: number
  notes?: string
}

interface WeakPointInterventionsProps {
  interventions: WeakPointIntervention[]
  onProgressUpdate?: (interventionId: string, progress: ProgressData) => void
  showProgressHistory?: boolean
  className?: string
}

interface InterventionWithProgress extends WeakPointIntervention {
  id: string
  progressHistory?: ProgressData[]
  currentProgress?: number
}

const PRIORITY_COLORS = {
  'High': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800 border-red-200'
  },
  'Moderate': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'Low': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800 border-green-200'
  }
}

const WEAK_POINT_DESCRIPTIONS = {
  'WEAK_POSTERIOR_CHAIN': {
    title: 'Posterior Chain',
    description: 'Hamstrings, glutes, and lower back require strengthening',
    icon: '🦵'
  },
  'WEAK_HORIZONTAL_PRESS': {
    title: 'Horizontal Press',
    description: 'Bench press and horizontal pushing strength deficit',
    icon: '💪'
  },
  'WEAK_VERTICAL_PRESS': {
    title: 'Vertical Press',
    description: 'Overhead pressing and shoulder stability weakness',
    icon: '🏋️'
  },
  'WEAK_CORE_STABILITY': {
    title: 'Core Stability',
    description: 'Anti-extension and anti-lateral flexion deficits',
    icon: '🎯'
  },
  'WEAK_SHOULDER_STABILITY': {
    title: 'Shoulder Stability',
    description: 'Scapular control and rotator cuff deficiencies',
    icon: '🔄'
  },
  'MOVEMENT_QUALITY': {
    title: 'Movement Quality',
    description: 'Fundamental movement patterns need improvement',
    icon: '⚡'
  }
}

function StrengthRatioChart({ 
  identifiedRatio, 
  currentRatio, 
  targetRatio 
}: { 
  identifiedRatio: string
  currentRatio: number
  targetRatio: number 
}) {
  const progressPercentage = Math.min((currentRatio / targetRatio) * 100, 100)
  const isImproving = currentRatio > 0.8 * targetRatio // Assuming we start below target
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">{identifiedRatio} Ratio</h5>
        <Badge variant={isImproving ? "default" : "secondary"}>
          {currentRatio.toFixed(2)} / {targetRatio.toFixed(2)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-3" />
        <div className="flex justify-between text-xs text-gray-600">
          <span>Current: {currentRatio.toFixed(2)}</span>
          <span>Target: {targetRatio.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="text-xs">
        {progressPercentage >= 90 ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>Target ratio achieved!</span>
          </div>
        ) : progressPercentage >= 70 ? (
          <div className="flex items-center gap-1 text-blue-600">
            <TrendingUp className="w-3 h-3" />
            <span>Good progress towards target</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Continue intervention protocol</span>
          </div>
        )}
      </div>
    </div>
  )
}

function InterventionExercises({ exercises }: { exercises: string[] }) {
  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Intervention Exercises
      </h5>
      <div className="grid gap-2">
        {exercises.map((exercise, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
              {index + 1}
            </div>
            <span className="text-gray-800">{exercise}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressTracker({ 
  interventionId, 
  onProgressUpdate 
}: { 
  interventionId: string
  onProgressUpdate?: (interventionId: string, progress: ProgressData) => void 
}) {
  const [progressValue, setProgressValue] = useState('')
  const [notes, setNotes] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const handleSubmit = () => {
    if (!onProgressUpdate || !progressValue) return
    
    setIsLogging(true)
    const progress: ProgressData = {
      date: new Date().toISOString().split('T')[0],
      value: parseFloat(progressValue),
      notes: notes.trim() || undefined
    }
    
    onProgressUpdate(interventionId, progress)
    
    // Reset form
    setTimeout(() => {
      setProgressValue('')
      setNotes('')
      setIsLogging(false)
    }, 500)
  }

  if (!onProgressUpdate) return null

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">
            Current Ratio Value
          </label>
          <Input
            type="number"
            step="0.01"
            value={progressValue}
            onChange={(e) => setProgressValue(e.target.value)}
            placeholder="e.g., 0.85"
            className="text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did this assessment feel? Any observations?"
            rows={2}
            className="text-xs"
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={!progressValue || isLogging}
          size="sm"
          className="w-full"
        >
          {isLogging ? 'Logging...' : 'Log Progress'}
        </Button>
      </CardContent>
    </Card>
  )
}

function InterventionCard({ 
  intervention, 
  onProgressUpdate 
}: { 
  intervention: InterventionWithProgress
  onProgressUpdate?: (interventionId: string, progress: ProgressData) => void 
}) {
  const [showDetails, setShowDetails] = useState(false)
  
  const weakPointInfo = WEAK_POINT_DESCRIPTIONS[intervention.targetArea]
  const priorityStyle = PRIORITY_COLORS[intervention.priority]
  
  const weeksRemaining = Math.max(0, intervention.reassessmentPeriodWeeks - 
    (intervention.progressHistory?.length || 0))
  
  const latestProgress = intervention.progressHistory?.[intervention.progressHistory.length - 1]
  const progressPercentage = latestProgress ? 
    Math.min((latestProgress.value / intervention.targetRatio) * 100, 100) : 
    Math.min((intervention.currentRatio / intervention.targetRatio) * 100, 100)

  return (
    <Card className={`border-l-4 ${priorityStyle.border} ${priorityStyle.bg}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{weakPointInfo.icon}</div>
            <div>
              <CardTitle className="text-base">{weakPointInfo.title}</CardTitle>
              <CardDescription className="text-xs">
                {weakPointInfo.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={priorityStyle.badge}>
              {intervention.priority} Priority
            </Badge>
            <Badge variant="outline" className="text-xs">
              {intervention.weeklyVolume} sets/week
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Strength Ratio Progress */}
        <StrengthRatioChart 
          identifiedRatio={intervention.identifiedRatio}
          currentRatio={latestProgress?.value || intervention.currentRatio}
          targetRatio={intervention.targetRatio}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white rounded border">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {weeksRemaining}
            </div>
            <div className="text-xs text-gray-600">Weeks Left</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {intervention.progressHistory?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Assessments</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {intervention.weeklyVolume}
            </div>
            <div className="text-xs text-gray-600">Sets/Week</div>
          </div>
        </div>

        {/* Collapsible Details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-between"
        >
          <span>View Details</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </Button>

        {showDetails && (
          <div className="space-y-4 pt-2 border-t">
            {/* Intervention Exercises */}
            <InterventionExercises exercises={intervention.interventionExercises} />

            {/* Progression Protocol */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Progression Protocol
              </h5>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                {intervention.progressionProtocol}
              </div>
            </div>

            {/* Expected Outcome */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Expected Outcome
              </h5>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                {intervention.expectedOutcome}
              </div>
            </div>

            {/* Progress Tracker */}
            <ProgressTracker 
              interventionId={intervention.id}
              onProgressUpdate={onProgressUpdate}
            />

            {/* Timeline */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Next Assessment
                </span>
              </div>
              <span className="text-sm text-blue-600">
                {weeksRemaining > 0 ? `In ${weeksRemaining} weeks` : 'Due now'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function WeakPointInterventions({
  interventions,
  onProgressUpdate,
  showProgressHistory = true,
  className = ''
}: WeakPointInterventionsProps) {
  // Transform interventions to include IDs and mock progress data
  const interventionsWithProgress: InterventionWithProgress[] = useMemo(() => {
    return interventions.map((intervention, index) => ({
      ...intervention,
      id: `intervention-${index}`,
      // Mock progress history - in real app this would come from database
      progressHistory: [],
      currentProgress: intervention.currentRatio
    }))
  }, [interventions])

  const sortedInterventions = useMemo(() => {
    const priorityOrder = { 'High': 3, 'Moderate': 2, 'Low': 1 }
    return [...interventionsWithProgress].sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    )
  }, [interventionsWithProgress])

  const overallProgress = useMemo(() => {
    if (interventions.length === 0) return 0
    
    const totalProgress = interventions.reduce((sum, intervention) => {
      const progress = Math.min((intervention.currentRatio / intervention.targetRatio) * 100, 100)
      return sum + progress
    }, 0)
    
    return Math.round(totalProgress / interventions.length)
  }, [interventions])

  if (interventions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <p>No weak point interventions identified</p>
            <p className="text-sm mt-1">Your strength ratios are well balanced!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Weak Point Interventions</CardTitle>
              <CardDescription>
                Targeted protocols to address strength imbalances
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Progress Summary */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overall Intervention Progress
              </h3>
              <Badge className="bg-orange-100 text-orange-800">
                {interventions.length} Active
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {overallProgress}% average progress
                </span>
                <span className="text-gray-600">
                  {interventions.filter(i => (i.currentRatio / i.targetRatio) >= 0.9).length} near completion
                </span>
              </div>
            </div>
          </div>

          {/* Intervention Cards */}
          <div className="space-y-4">
            {sortedInterventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onProgressUpdate={onProgressUpdate}
              />
            ))}
          </div>

          {/* Educational Note */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">
                  Intervention Guidelines
                </p>
                <p className="text-orange-700 text-xs leading-relaxed">
                  Weak point interventions target specific strength imbalances identified through 
                  ratio analysis. Consistent application of these protocols, along with regular 
                  assessments, will help correct imbalances and improve overall performance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 