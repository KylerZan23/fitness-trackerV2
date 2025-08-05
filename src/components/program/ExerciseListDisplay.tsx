import React from 'react'
import { type ExerciseDetail } from '@/lib/types/program'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TierBadge } from '@/components/ui/TierBadge'
import { RPEIndicator } from '@/components/ui/RPEIndicator'
import { Lightbulb, Target, Brain, Zap, Info, Clock } from 'lucide-react'

interface ExerciseListDisplayProps {
  exercises: ExerciseDetail[]
  listTitle: string
  showEnhanced?: boolean
  exerciseRationale?: Record<string, {
    scientificJustification: string
    muscleTargets: string[]
    stimulusToFatigueRatio: 'High' | 'Moderate' | 'Low'
    tier: 'Tier_1' | 'Tier_2' | 'Tier_3'
    progressionProtocol: string
  }>
}

const TIER_COLORS = {
  'Anchor': 'bg-purple-100 text-purple-800 border-purple-200',
  'Primary': 'bg-blue-100 text-blue-800 border-blue-200',
  'Secondary': 'bg-green-100 text-green-800 border-green-200',
  'Accessory': 'bg-gray-100 text-gray-800 border-gray-200'
}

const SFR_COLORS = {
  'High': 'bg-green-100 text-green-800 border-green-200',
  'Moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Low': 'bg-red-100 text-red-800 border-red-200'
}

export function ExerciseListDisplay({ 
  exercises, 
  listTitle, 
  showEnhanced = false,
  exerciseRationale 
}: ExerciseListDisplayProps) {
  if (!exercises || exercises.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">{listTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Exercise</TableHead>
                <TableHead className="font-semibold">Sets × Reps</TableHead>
                <TableHead className="font-semibold">Rest</TableHead>
                <TableHead className="font-semibold">Details</TableHead>
                {showEnhanced && <TableHead className="font-semibold">Science</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.map((exercise, index) => {
                const rationale = exerciseRationale?.[exercise.name]
                
                return (
                  <TableRow key={index} className="border-b border-gray-100">
                    <TableCell className="font-medium">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900">{exercise.name}</div>
                          {exercise.isAnchorLift && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Target className="h-3 w-3 text-purple-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Anchor Lift - Core movement for this program</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {exercise.notes && (
                          <div className="flex items-start space-x-1.5">
                            <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs italic text-muted-foreground leading-relaxed">
                              {exercise.notes}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          <TierBadge 
                            tier={exercise.tier} 
                            isAnchorLift={exercise.isAnchorLift} 
                            size="sm" 
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {exercise.sets} × {exercise.reps}
                        </div>

                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Clock className="h-3 w-3" />
                        {exercise.rest}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 text-xs">

                        {exercise.rpe && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-600 text-xs">RPE:</span> 
                            <RPEIndicator rpe={exercise.rpe} size="sm" showIcon={false} />
                          </div>
                        )}

                      </div>
                    </TableCell>

                    {showEnhanced && (
                      <TableCell>
                        {rationale ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-blue-600 cursor-help">
                                <Brain className="h-3 w-3" />
                                <span className="text-xs">View</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <p className="font-medium">Scientific Rationale:</p>
                                <p className="text-xs">{rationale.scientificJustification}</p>
                                <div className="border-t pt-2">
                                  <p className="text-xs font-medium">Targets:</p>
                                  <p className="text-xs">{rationale.muscleTargets.join(', ')}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="text-xs text-gray-400">N/A</div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
