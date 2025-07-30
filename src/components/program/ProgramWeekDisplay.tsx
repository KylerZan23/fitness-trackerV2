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
import { Calendar, Target, Lightbulb } from 'lucide-react'

interface ProgramWeekDisplayProps {
  week: TrainingWeek
  weekIndex: number
  phaseIndex: number
  completedDays: CompletedDayIdentifier[]
}

// Helper function to get day name for accordion trigger
function getDayDisplayName(dayOfWeek: DayOfWeek, focus?: string): string {
  const dayNames = {
    [DayOfWeek.MONDAY]: 'Monday',
    [DayOfWeek.TUESDAY]: 'Tuesday',
    [DayOfWeek.WEDNESDAY]: 'Wednesday',
    [DayOfWeek.THURSDAY]: 'Thursday',
    [DayOfWeek.FRIDAY]: 'Friday',
    [DayOfWeek.SATURDAY]: 'Saturday',
    [DayOfWeek.SUNDAY]: 'Sunday',
  }

  const dayName = dayNames[dayOfWeek] || 'Unknown'
  return focus ? `${dayName}: ${focus}` : dayName
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
              {week.weekInPhase && (
                <span className="text-gray-600 font-normal">
                  {' '}
                  (Week {week.weekInPhase} in phase)
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Week Notes */}
        {week.notes && (
          <div className="mb-3 p-3 bg-white rounded-md border">
            <p className="text-sm text-gray-700">
              <strong>Week Notes:</strong> {week.notes}
            </p>
          </div>
        )}

        {/* Weekly Goals */}
        {week.weeklyGoals && week.weeklyGoals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-800">Weekly Goals:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {week.weeklyGoals.map((goal, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {week.coachTip && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-800">
                <strong>Neural's Tip:</strong> {week.coachTip}
              </p>
            </div>
          </div>
        )}
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
                      {day.estimatedDurationMinutes && !day.isRestDay && (
                        <Badge variant="outline" className="text-xs">
                          {day.estimatedDurationMinutes}min
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
