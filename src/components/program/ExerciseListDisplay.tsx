import React from 'react'
import { type ExerciseDetail } from '@/lib/types/program'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExerciseListDisplayProps {
  exercises: ExerciseDetail[]
  listTitle: string
}

export function ExerciseListDisplay({ exercises, listTitle }: ExerciseListDisplayProps) {
  if (!exercises || exercises.length === 0) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {listTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Exercise</TableHead>
              <TableHead className="font-semibold">Sets × Reps</TableHead>
              <TableHead className="font-semibold">Rest</TableHead>
              <TableHead className="font-semibold">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise, index) => (
              <TableRow key={index} className="border-b border-gray-100">
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900">
                      {exercise.name}
                    </div>
                    {exercise.category && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.category}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {exercise.sets} × {exercise.reps}
                    </div>
                    {exercise.weight && (
                      <div className="text-gray-600 text-xs">
                        {exercise.weight}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-700">
                    {exercise.rest}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1 text-xs">
                    {exercise.tempo && (
                      <div className="text-gray-600">
                        <span className="font-medium">Tempo:</span> {exercise.tempo}
                      </div>
                    )}
                    {exercise.rpe && (
                      <div className="text-gray-600">
                        <span className="font-medium">RPE:</span> {exercise.rpe}/10
                      </div>
                    )}
                    {exercise.notes && (
                      <div className="text-gray-700 italic">
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 