'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@/components/ui/Icon'
import {
  ActionStatus,
  WeeklyReviewActionTracking,
  upsertActionTracking,
  updateActionTracking,
  getCurrentWeekActionTracking,
} from '@/app/_actions/weeklyReviewActionTracking'

interface ActionProgressTrackerProps {
  actionableTip: string
  onProgressUpdate?: (status: ActionStatus) => void
}

const statusConfig = {
  pending: {
    label: 'Not Started',
    icon: 'Clock',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Ready to begin'
  },
  in_progress: {
    label: 'In Progress',
    icon: 'PlayCircle',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Working on it'
  },
  completed: {
    label: 'Completed',
    icon: 'CheckCircle2',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Well done!'
  },
  skipped: {
    label: 'Skipped',
    icon: 'SkipForward',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Maybe next time'
  }
}

export default function ActionProgressTracker({ actionableTip, onProgressUpdate }: ActionProgressTrackerProps) {
  const [tracking, setTracking] = useState<WeeklyReviewActionTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load existing tracking data
  useEffect(() => {
    loadActionTracking()
  }, [actionableTip])

  const loadActionTracking = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getCurrentWeekActionTracking()
      
      if (!result.success) {
        setError(result.error || 'Failed to load progress')
        return
      }

      if (result.data) {
        setTracking(result.data)
        setNotes(result.data.progress_notes || '')
      } else {
        // No tracking exists yet - initialize with pending status
        const initResult = await upsertActionTracking(actionableTip, 'pending')
        if (initResult.success && initResult.data) {
          setTracking(initResult.data)
        }
      }
    } catch (err) {
      console.error('Error loading action tracking:', err)
      setError('Failed to load progress tracking')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: ActionStatus) => {
    if (!tracking) return

    try {
      setUpdating(true)
      setError(null)

      const result = await updateActionTracking(tracking.review_week_start, {
        status: newStatus,
        progress_notes: notes || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to update progress')
        return
      }

      if (result.data) {
        setTracking(result.data)
        onProgressUpdate?.(newStatus)
      }
    } catch (err) {
      console.error('Error updating action tracking:', err)
      setError('Failed to update progress')
    } finally {
      setUpdating(false)
    }
  }

  const handleNotesUpdate = async () => {
    if (!tracking) return

    try {
      setUpdating(true)
      setError(null)

      const result = await updateActionTracking(tracking.review_week_start, {
        status: tracking.status,
        progress_notes: notes || undefined
      })

      if (!result.success) {
        setError(result.error || 'Failed to save notes')
        return
      }

      if (result.data) {
        setTracking(result.data)
      }
    } catch (err) {
      console.error('Error saving notes:', err)
      setError('Failed to save notes')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <span className="text-sm text-amber-700">Loading progress tracker...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadActionTracking}
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tracking) {
    return null
  }

  const currentStatus = statusConfig[tracking.status]

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            <Icon name="Target" className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800">Action Progress</span>
          </div>
          <Badge className={`${currentStatus.color} border`}>
            <Icon name={currentStatus.icon as any} className="mr-1 h-3 w-3" />
            {currentStatus.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Text */}
        <div className="rounded-lg bg-white/60 p-3">
          <p className="text-sm text-gray-700">{actionableTip}</p>
        </div>

        {/* Status Update Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {(['pending', 'in_progress', 'completed', 'skipped'] as ActionStatus[]).map((status) => {
            const config = statusConfig[status]
            const isActive = tracking.status === status
            
            return (
              <Button
                key={status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate(status)}
                disabled={updating}
                className={`
                  h-auto flex-col space-y-1 py-2
                  ${isActive 
                    ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' 
                    : 'border-amber-200 text-amber-700 hover:bg-amber-100'
                  }
                `}
              >
                <Icon name={config.icon as any} className="h-4 w-4" />
                <span className="text-xs font-medium">{config.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Progress Notes Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="h-auto p-2 text-amber-700 hover:bg-amber-100"
          >
            <Icon name={showNotes ? "ChevronUp" : "ChevronDown"} className="mr-1 h-4 w-4" />
            <span className="text-sm">
              {showNotes ? 'Hide Notes' : 'Add Progress Notes'}
            </span>
          </Button>

          {showNotes && (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your progress, challenges, or insights..."
                className="min-h-[80px] resize-none border-amber-200 bg-white/60 text-sm placeholder:text-gray-500 focus:border-amber-400 focus:ring-amber-400"
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNotesUpdate}
                  disabled={updating}
                  className="border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  {updating ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-amber-600 border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="Save" className="mr-1 h-3 w-3" />
                      Save Notes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Completion Info */}
        {tracking.completion_date && (
          <div className="flex items-center space-x-2 rounded-lg bg-green-50 p-2">
            <Icon name="CheckCircle2" className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">
              Completed on {new Date(tracking.completion_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 