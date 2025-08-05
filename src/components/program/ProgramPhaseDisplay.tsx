import React from 'react'
import { type TrainingPhase, type TrainingProgram } from '@/lib/types/program'
import { type CompletedDayIdentifier } from '@/app/_actions/aiProgramActions'
import { SubscriptionGatedWeek } from './SubscriptionGatedWeek'
import { Accordion } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PhaseBadge } from '@/components/ui/PhaseBadge'
import { Calendar, Target, FileText, Clock, Lightbulb } from 'lucide-react'

interface ProgramPhaseDisplayProps {
  phase: TrainingPhase
  phaseIndex: number
  completedDays: CompletedDayIdentifier[]
  allPhases: TrainingPhase[] // Add this to calculate absolute week indices
}

export function ProgramPhaseDisplay({
  phase,
  phaseIndex,
  completedDays,
  allPhases,
}: ProgramPhaseDisplayProps) {
  // Calculate absolute week indices for subscription gating
  const calculateAbsoluteWeekIndex = (currentPhaseIndex: number, weekIndex: number): number => {
    let totalWeeks = 0
    
    // Count weeks from all phases before the current phase
    for (let i = 0; i < currentPhaseIndex; i++) {
      totalWeeks += allPhases[i]?.weeks?.length || 0
    }
    
    // Add the current week index
    return totalWeeks + weekIndex
  }
  return (
    <Card className="mb-6">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              Phase {phaseIndex + 1}: {phase.phaseName}
            </CardTitle>
            <CardDescription className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{phase.durationWeeks} weeks</span>
              </div>
              {phase.weeks.length > 0 && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{phase.weeks.length} training weeks</span>
                </div>
              )}
            </CardDescription>
          </div>
        </div>

        {/* Phase Type & Goal */}
        <div className="mt-4 space-y-3">
          {/* Phase Type Badge */}
          <div className="flex items-center gap-2">
            <PhaseBadge 
              phaseType={phase.phaseType} 
              phaseName={phase.phaseName}
              durationWeeks={phase.durationWeeks}
              size="md"
            />
          </div>

          {/* Phase Goal */}
          {phase.primaryGoal && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-indigo-800 mb-1">Primary Goal</p>
                  <p className="text-sm text-indigo-700">{phase.primaryGoal}</p>
                </div>
              </div>
            </div>
          )}

          {/* Phase Timeline */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Phase Timeline</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span><strong>{phase.durationWeeks}</strong> weeks total</span>
              <span><strong>{phase.weeks.length}</strong> training weeks</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Weeks Accordion */}
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Training Weeks</h4>
            <p className="text-sm text-gray-600">
              Expand each week to view detailed workout plans and exercises.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {phase.weeks.map((week, weekIndex) => {
              const absoluteWeekIndex = calculateAbsoluteWeekIndex(phaseIndex, weekIndex)
              
              return (
                <SubscriptionGatedWeek
                  key={`week-${week.weekNumber}-${weekIndex}`}
                  week={week}
                  weekIndex={weekIndex}
                  phaseIndex={phaseIndex}
                  completedDays={completedDays}
                  weekNumber={week.weekNumber}
                  absoluteWeekIndex={absoluteWeekIndex}
                />
              )
            })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}
