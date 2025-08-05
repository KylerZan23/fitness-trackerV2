import React from 'react'
import { type TrainingWeek, DayOfWeek } from '@/lib/types/program'
import { type CompletedDayIdentifier } from '@/app/_actions/aiProgramActions'
import { ProgramDayDisplay } from './ProgramDayDisplay'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressionBadge } from '@/components/ui/ProgressionBadge'
import { VolumeIndicator } from '@/components/ui/VolumeIndicator'
import { Calendar, Target, Lightbulb, TrendingUp, BarChart3 } from 'lucide-react'

interface ProgramWeekDisplayProps {
  week: TrainingWeek
  weekIndex: number
  phaseIndex: number
  completedDays: CompletedDayIdentifier[]
}

// Helper function to get day name for accordion trigger
function getDayDisplayName(dayOfWeek: DayOfWeek, focus?: string): string {
  // Phoenix Schema uses string literals, so we can use them directly
  return focus ? `${dayOfWeek}: ${focus}` : dayOfWeek
}

export function ProgramWeekDisplay({
  week,
  weekIndex,
  phaseIndex,
  completedDays,
}: ProgramWeekDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Week {week.weekNumber}
              {week.phaseWeek && (
                <span className="text-gray-600 font-normal">
                  {' '}
                  (Week {week.phaseWeek} in phase)
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Progression Strategy & Training Details */}
        <div className="mb-3 space-y-3">
          {/* Progression Strategy */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-800">Progression:</span>
              <ProgressionBadge 
                strategy={week.progressionStrategy as any} 
                weekNumber={week.weekNumber} 
                size="sm" 
              />
            </div>
          </div>

          {/* Intensity Focus & Volume Landmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Intensity Focus</span>
              </div>
              <p className="text-sm text-blue-900 font-medium">{week.intensityFocus}</p>
            </div>

            {week.weeklyVolumeLandmark && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Volume Landmark</span>
                </div>
                <VolumeIndicator 
                  landmark={week.weeklyVolumeLandmark} 
                  size="md" 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Days Accordion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-gray-800">Workout Days</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {week.days.map((day, dayIndex) => (
              <AccordionItem
                key={`day-${day.dayOfWeek}-${dayIndex}`}
                value={`day-${day.dayOfWeek}-${dayIndex}`}
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium text-gray-900">
                      {getDayDisplayName(day.dayOfWeek, day.focus)}
                    </span>
                    <div className="flex items-center space-x-2">
                      {day.isRestDay && (
                        <Badge variant="outline" className="text-xs text-green-700 bg-green-50">
                          Rest Day
                        </Badge>
                      )}
                      {day.estimatedDuration && !day.isRestDay && (
                        <Badge variant="outline" className="text-xs">
                          {day.estimatedDuration}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <ProgramDayDisplay
                    day={day}
                    completedDays={completedDays}
                    phaseIndex={phaseIndex}
                    weekIndex={weekIndex}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
