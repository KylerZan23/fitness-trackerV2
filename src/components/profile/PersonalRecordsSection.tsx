/**
 * Personal Records Section Component
 * ------------------------------------------------
 * Displays user's personal records for main lifts with progress
 */

import { Trophy, TrendingUp } from 'lucide-react'

interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  monthlyProgress?: number
  unit: string
}

interface PersonalRecordsSectionProps {
  records: PersonalRecord[]
  weightUnit?: 'kg' | 'lbs'
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

export function PersonalRecordsSection({ records, weightUnit = 'kg' }: PersonalRecordsSectionProps) {
  // Show top 3 records, or fallback records if none available
  const fallbackRecords: PersonalRecord[] = [
    { exerciseName: 'Squat', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit },
    { exerciseName: 'Bench Press', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit },
    { exerciseName: 'Deadlift', weight: 0, reps: 1, monthlyProgress: 0, unit: weightUnit }
  ]

  const displayRecords = records.length > 0 ? records.slice(0, 3) : fallbackRecords

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <Trophy className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Personal Records</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayRecords.map((record, index) => {
          const progressColor = getProgressColor(record.monthlyProgress || 0)
          const ProgressIcon = getProgressIcon(record.monthlyProgress || 0)
          
          return (
            <div
              key={`${record.exerciseName}-${index}`}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  {record.weight > 0 ? `${record.weight} ${record.unit}` : '--'}
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
                    No PR recorded
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 