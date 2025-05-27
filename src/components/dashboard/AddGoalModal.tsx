'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
// Import newly added form components
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGoal } from '@/lib/goalsDb' // Import the backend function

interface AddGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onGoalAdded: () => void // Callback to refresh the list
}

// Define available metric types
const metricTypes = [
  { value: 'weekly_workout_days', label: 'Weekly Workout Days', unit: 'days' },
  { value: 'weekly_duration', label: 'Weekly Duration', unit: 'min' },
  { value: 'weekly_total_sets', label: 'Weekly Total Sets', unit: 'sets' },
  // Add 'weekly_distance' - progress needs client-side calculation
  { value: 'weekly_distance', label: 'Weekly Distance', unit: 'mi' },
]

export function AddGoalModal({ isOpen, onClose, onGoalAdded }: AddGoalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Form state
  const [metricType, setMetricType] = useState<string>(metricTypes[0].value) // Default to first option
  const [targetValue, setTargetValue] = useState<string>('')
  const [targetUnit, setTargetUnit] = useState<string>(metricTypes[0].unit)
  const [label, setLabel] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  // Update unit and default label when metric type changes
  useEffect(() => {
    const selectedMetric = metricTypes.find(m => m.value === metricType)
    setTargetUnit(selectedMetric?.unit ?? '')
    // Only set default label if the custom label field is empty
    if (!label) {
      setLabel(selectedMetric?.label ?? '')
    }
  }, [metricType]) // Removed label from dependency array to avoid overwriting user input

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMetricType(metricTypes[0].value) // Default to first option
      setTargetValue('')
      setTargetUnit(metricTypes[0].unit)
      setLabel(metricTypes[0].label) // Reset label to default
      setFormError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const targetNum = parseFloat(targetValue)
    if (isNaN(targetNum) || targetNum <= 0) {
      setFormError('Target value must be a positive number.')
      return
    }

    setIsSubmitting(true)

    try {
      // Call backend createGoal function
      await createGoal({
        metric_type: metricType,
        target_value: targetNum,
        target_unit: targetUnit,
        label: label || metricTypes.find(m => m.value === metricType)?.label, // Use selected label if custom one is empty
      })
      console.log('Goal added successfully via backend')
      onGoalAdded() // Trigger refresh
      onClose() // Close modal
    } catch (error) {
      console.error('Error adding goal:', error)
      setFormError(error instanceof Error ? error.message : 'Failed to add goal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      {' '}
      {/* Ensure close on overlay click etc. */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Set a new weekly fitness goal. Progress will be tracked automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Metric Type Select (Options updated by metricTypes array) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metricType" className="text-right">
              Metric
            </Label>
            <Select value={metricType} onValueChange={setMetricType} required>
              <SelectTrigger id="metricType" className="col-span-3">
                <SelectValue placeholder="Select metric..." />
              </SelectTrigger>
              <SelectContent>
                {metricTypes.map(mt => (
                  <SelectItem key={mt.value} value={mt.value}>
                    {mt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value Input (Updated placeholder) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetValue" className="text-right">
              Target ({targetUnit})
            </Label>
            <Input
              id="targetValue"
              type="number"
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              className="col-span-3"
              placeholder={`e.g., ${targetUnit === 'days' ? '5' : targetUnit === 'min' ? '120' : targetUnit === 'sets' ? '50' : '20'}`}
              required
              min="0.1" // Basic validation
              step="any" // Allow decimals if needed later
            />
          </div>

          {/* Optional Label Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label (Optional)
            </Label>
            <Input
              id="label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="col-span-3"
              placeholder="Custom goal name (e.g., Train 5x Week)"
            />
          </div>

          {/* Display Form Error */}
          {formError && <p className="text-sm text-red-600 col-span-4 text-center">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
