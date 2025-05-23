import React from 'react'
import { type WorkoutDay, DayOfWeek } from '@/lib/types/program'
import { type CompletedDayIdentifier } from '@/app/_actions/aiProgramActions'
import { ExerciseListDisplay } from './ExerciseListDisplay'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, CheckCircle2 } from 'lucide-react'

interface ProgramDayDisplayProps {
  day: WorkoutDay
  completedDays: CompletedDayIdentifier[]
  phaseIndex: number
  weekIndex: number
}

// Helper function to convert DayOfWeek enum to readable string
function formatDayOfWeek(dayOfWeek: DayOfWeek): string {
  switch (dayOfWeek) {
    case DayOfWeek.MONDAY:
      return 'Monday'
    case DayOfWeek.TUESDAY:
      return 'Tuesday'
    case DayOfWeek.WEDNESDAY:
      return 'Wednesday'
    case DayOfWeek.THURSDAY:
      return 'Thursday'
    case DayOfWeek.FRIDAY:
      return 'Friday'
    case DayOfWeek.SATURDAY:
      return 'Saturday'
    case DayOfWeek.SUNDAY:
      return 'Sunday'
    default:
      return 'Unknown'
  }
}

export function ProgramDayDisplay({ day, completedDays, phaseIndex, weekIndex }: ProgramDayDisplayProps) {
  const dayName = formatDayOfWeek(day.dayOfWeek)

  // Check if this day has been completed
  const isCompleted = completedDays.some(
    cd => cd.phaseIndex === phaseIndex &&
          cd.weekIndex === weekIndex &&
          cd.dayOfWeek === day.dayOfWeek
  )

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              {dayName}
            </h3>
            {day.focus && (
              <Badge variant="outline" className="text-sm">
                {day.focus}
              </Badge>
            )}
            {/* Completion Indicator - only show for non-rest days */}
            {isCompleted && !day.isRestDay && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  Completed
                </Badge>
              </div>
            )}
          </div>
          
          {day.estimatedDurationMinutes && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {day.estimatedDurationMinutes} minutes
              </span>
            </div>
          )}
        </div>

        {day.notes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700 italic">
              <strong>Notes:</strong> {day.notes}
            </p>
          </div>
        )}
      </div>

      {/* Rest Day Display */}
      {day.isRestDay ? (
        <div className="text-center py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-800 mb-2">
              Rest Day
            </h4>
            <p className="text-green-700">
              Take today to recover and prepare for your next workout.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Warm-up */}
          {day.warmUp && day.warmUp.length > 0 && (
            <ExerciseListDisplay 
              exercises={day.warmUp} 
              listTitle="🔥 Warm-up" 
            />
          )}

          {/* Main Exercises */}
          {day.exercises && day.exercises.length > 0 && (
            <ExerciseListDisplay 
              exercises={day.exercises} 
              listTitle="💪 Main Workout" 
            />
          )}

          {/* Cool-down */}
          {day.coolDown && day.coolDown.length > 0 && (
            <ExerciseListDisplay 
              exercises={day.coolDown} 
              listTitle="🧘 Cool-down" 
            />
          )}
        </div>
      )}
    </div>
  )
} 