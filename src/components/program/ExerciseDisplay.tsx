import React from 'react'
import { type ExerciseDetail } from '@/lib/types/program'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TierBadge } from '@/components/ui/TierBadge'
import { RPEIndicator } from '@/components/ui/RPEIndicator'
import { Target, Lightbulb, Star, Clock, Dumbbell } from 'lucide-react'

interface ExerciseDisplayProps {
  exercise: ExerciseDetail
  showTierBadge?: boolean
  compact?: boolean
}



export function ExerciseDisplay({ 
  exercise, 
  showTierBadge = true, 
  compact = false 
}: ExerciseDisplayProps) {

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-gray-50">
          <div className="flex items-center space-x-2 flex-1">
            <div className="flex items-center space-x-2">
              {exercise.isAnchorLift && <Star className="h-3 w-3 text-amber-500" />}
              <span className="font-medium text-sm">{exercise.name}</span>
            </div>
            {showTierBadge && (
              <TierBadge tier={exercise.tier} isAnchorLift={exercise.isAnchorLift} size="sm" />
            )}
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Dumbbell className="h-3 w-3" />
              <span>{exercise.sets} × {exercise.reps}</span>
            </div>
            <RPEIndicator rpe={exercise.rpe} size="sm" />
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{exercise.rest}</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
        {/* Exercise Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {exercise.isAnchorLift && (
              <Tooltip>
                <TooltipTrigger>
                  <Star className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anchor Lift - Core movement for this program</p>
                </TooltipContent>
              </Tooltip>
            )}
            <h4 className="text-lg font-semibold text-gray-900">{exercise.name}</h4>
          </div>
          
          {showTierBadge && (
            <TierBadge tier={exercise.tier} isAnchorLift={exercise.isAnchorLift} size="md" />
          )}
        </div>

        {/* Exercise Prescription */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-blue-800">Sets × Reps</div>
            </div>
            <div className="text-lg font-bold text-blue-900">{exercise.sets} × {exercise.reps}</div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
            <div className="text-sm font-medium text-gray-800 mb-2">RPE Target</div>
            <div className="flex justify-center">
              <RPEIndicator rpe={exercise.rpe} size="md" showIcon={false} />
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-green-800">Rest Period</div>
            </div>
            <div className="text-lg font-bold text-green-900">{exercise.rest}</div>
          </div>
        </div>

        {/* Exercise Notes */}
        {exercise.notes && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-md border border-amber-200">
            <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-medium">Form Notes:</span> {exercise.notes}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}