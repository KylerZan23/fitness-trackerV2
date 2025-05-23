import React from 'react'
import { type TrainingPhase } from '@/lib/types/program'
import { type CompletedDayIdentifier } from '@/app/_actions/aiProgramActions'
import { ProgramWeekDisplay } from './ProgramWeekDisplay'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Target, FileText } from 'lucide-react'

interface ProgramPhaseDisplayProps {
  phase: TrainingPhase
  phaseIndex: number
  completedDays: CompletedDayIdentifier[]
}

export function ProgramPhaseDisplay({ phase, phaseIndex, completedDays }: ProgramPhaseDisplayProps) {
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
                <span className="text-sm font-medium">
                  {phase.durationWeeks} weeks
                </span>
              </div>
              {phase.weeks.length > 0 && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {phase.weeks.length} training weeks
                  </span>
                </div>
              )}
            </CardDescription>
          </div>
        </div>

        {/* Phase Notes */}
        {phase.notes && (
          <div className="mt-4 p-3 bg-white rounded-md border">
            <p className="text-sm text-gray-700">
              <strong>Phase Notes:</strong> {phase.notes}
            </p>
          </div>
        )}

        {/* Phase Objectives */}
        {phase.objectives && phase.objectives.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Phase Objectives:</span>
            </div>
            <div className="space-y-1">
              {phase.objectives.map((objective, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Weeks Accordion */}
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Training Weeks
            </h4>
            <p className="text-sm text-gray-600">
              Expand each week to view detailed workout plans and exercises.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {phase.weeks.map((week, weekIndex) => (
              <AccordionItem 
                key={`week-${week.weekNumber}-${weekIndex}`} 
                value={`week-${week.weekNumber}-${weekIndex}`}
                className="border-2 border-gray-200 rounded-lg px-4 transition-colors hover:border-blue-300"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        Week {week.weekNumber}
                      </Badge>
                      <span className="font-medium text-gray-900">
                        Training Week {weekIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {week.days.length} days
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <ProgramWeekDisplay 
                    week={week} 
                    weekIndex={weekIndex} 
                    phaseIndex={phaseIndex}
                    completedDays={completedDays} 
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
} 