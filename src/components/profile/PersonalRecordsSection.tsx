/**
 * Personal Records Section Component
 * ------------------------------------------------
 * Displays user's personal records for main lifts with inline editing
 */

import { useState } from 'react'
import { Trophy, TrendingUp, Edit2, Check, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updatePersonalRecord, deletePersonalRecord } from '@/app/_actions/profileActions'

interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  monthlyProgress?: number
  unit: string
  achievedAt: string
}

interface PersonalRecordsSectionProps {
  records: PersonalRecord[]
  weightUnit?: 'kg' | 'lbs'
  onRecordsUpdate?: () => void
}

function getProgressColor(progress: number): string {
  if (progress > 15) return 'text-green-600'
  if (progress > 5) return 'text-blue-600'
  if (progress > 0) return 'text-yellow-600'
  return 'text-gray-500'
}

function getProgressIcon(progress: number) {
  if (progress > 0) {
    return <TrendingUp className="w-4 h-4" />
  }
  return null
}

function convertWeight(weightKg: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') {
    return Math.round(weightKg * 2.20462)
  }
  return Math.round(weightKg)
}

function convertWeightToKg(value: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') {
    return value / 2.20462
  }
  return value
}

export function PersonalRecordsSection({ records, weightUnit = 'kg', onRecordsUpdate }: PersonalRecordsSectionProps) {
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Edit state
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  // Show top 3 records, or fallback records if none available
  const fallbackRecords: PersonalRecord[] = [
    { exerciseName: 'Squat', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit, achievedAt: new Date().toISOString() },
    { exerciseName: 'Bench Press', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit, achievedAt: new Date().toISOString() },
    { exerciseName: 'Deadlift', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit, achievedAt: new Date().toISOString() }
  ]

  const displayRecords = records.length > 0 ? records.slice(0, 3) : fallbackRecords

  const handleEdit = (exerciseName: string, currentWeight: number, currentReps: number) => {
    setEditingRecord(exerciseName)
    setError(null)
    // Convert weight to display unit
    const displayWeight = currentWeight > 0 ? convertWeight(currentWeight, weightUnit) : ''
    setEditWeight(displayWeight.toString())
    setEditReps(currentReps > 0 ? currentReps.toString() : '')
  }

  const handleCancel = () => {
    setEditingRecord(null)
    setError(null)
    setEditWeight('')
    setEditReps('')
  }

  const handleSave = async (exerciseName: string) => {
    try {
      setIsSaving(true)
      setError(null)

      // Validate inputs
      const weight = parseFloat(editWeight)
      const reps = parseInt(editReps)

      if (isNaN(weight) || weight <= 0) {
        throw new Error('Please enter a valid weight')
      }

      if (isNaN(reps) || reps <= 0 || reps > 100) {
        throw new Error('Please enter valid reps (1-100)')
      }

      // Convert weight to kg for storage
      const weightInKg = convertWeightToKg(weight, weightUnit)

      const result = await updatePersonalRecord({
        exerciseName,
        weight: weightInKg,
        reps,
        achievedAt: new Date().toISOString()
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update personal record')
      }

      setEditingRecord(null)
      setEditWeight('')
      setEditReps('')
      onRecordsUpdate?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (exerciseName: string) => {
    if (!confirm(`Are you sure you want to delete your ${exerciseName} personal record?`)) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const result = await deletePersonalRecord(exerciseName)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete personal record')
      }

      onRecordsUpdate?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Trophy className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Personal Records</h3>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayRecords.map((record, index) => {
          const progressColor = getProgressColor(record.monthlyProgress || 0)
          const ProgressIcon = getProgressIcon(record.monthlyProgress || 0)
          const isEditing = editingRecord === record.exerciseName
          const displayWeight = record.weight > 0 ? convertWeight(record.weight, weightUnit) : 0
          
          return (
            <div
              key={`${record.exerciseName}-${index}`}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all duration-200"
            >
              {!isEditing ? (
                // Display Mode
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="text-2xl font-bold text-purple-900">
                      {record.weight > 0 ? `${displayWeight} ${weightUnit}` : '--'}
                    </div>
                    {record.weight > 0 && (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(record.exerciseName, record.weight, record.reps)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(record.exerciseName)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {record.weight === 0 && (
                      <Button
                        onClick={() => handleEdit(record.exerciseName, 0, 1)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-base font-semibold text-gray-800 mb-2">
                    {record.exerciseName}
                  </div>
                  
                  {/* Monthly Progress */}
                  {record.monthlyProgress !== undefined && record.monthlyProgress > 0 && (
                    <div className={`flex items-center justify-center gap-1 ${progressColor}`}>
                      {ProgressIcon}
                      <span className="text-xs font-medium">
                        +{record.monthlyProgress} {record.unit} this month
                      </span>
                    </div>
                  )}
                  
                  {record.weight === 0 && (
                    <div className="text-xs text-gray-500">
                      Click + to add PR
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <div className="text-center space-y-3">
                  <div className="text-base font-semibold text-gray-800">
                    {record.exerciseName}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Weight ({weightUnit})</label>
                      <input
                        type="number"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        placeholder="0"
                        min="0"
                        max={weightUnit === 'lbs' ? '2000' : '900'}
                        step="0.5"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                      <input
                        type="number"
                        value={editReps}
                        onChange={(e) => setEditReps(e.target.value)}
                        placeholder="1"
                        min="1"
                        max="100"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-1">
                    <Button
                      onClick={() => handleSave(record.exerciseName)}
                      disabled={isSaving}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={isSaving}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 