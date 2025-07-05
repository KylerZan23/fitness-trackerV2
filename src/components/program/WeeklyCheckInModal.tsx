'use client'

import { useState } from 'react'
import { adaptNextWeek } from '@/app/_actions/aiProgramActions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Brain, TrendingDown, CheckCircle, TrendingUp, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface WeeklyCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  onAdaptationComplete: () => void
  weekNumber: number
}

export function WeeklyCheckInModal({
  isOpen,
  onClose,
  onAdaptationComplete,
  weekNumber
}: WeeklyCheckInModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<'easy' | 'good' | 'hard' | null>(null)
  const [adaptationComplete, setAdaptationComplete] = useState(false)
  const { addToast } = useToast()

  const handleFeedbackSubmit = async (feedback: 'easy' | 'good' | 'hard') => {
    setIsSubmitting(true)
    setSelectedFeedback(feedback)

    try {
      const result = await adaptNextWeek(feedback)

      if (result.success) {
        setAdaptationComplete(true)
        addToast({
          type: 'success',
          title: 'Program adapted!',
          description: `Your next week has been adjusted based on your feedback.`,
        })
        
        // Wait a moment to show success, then close and refresh
        setTimeout(() => {
          setAdaptationComplete(false)
          setSelectedFeedback(null)
          onAdaptationComplete()
          onClose()
        }, 2000)
      } else {
        addToast({
          type: 'error',
          title: 'Adaptation failed',
          description: result.error || 'Failed to adapt your program. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFeedback(null)
      setAdaptationComplete(false)
      onClose()
    }
  }

  const feedbackOptions = [
    {
      value: 'hard' as const,
      label: 'Too Hard',
      description: 'I struggled to complete most workouts',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200 hover:border-red-300',
    },
    {
      value: 'good' as const,
      label: 'Just Right',
      description: 'Challenging but manageable',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200 hover:border-green-300',
    },
    {
      value: 'easy' as const,
      label: 'Too Easy',
      description: 'I could have done more',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-300',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Weekly Check-In
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            How did week {weekNumber} feel? Your feedback helps me adapt your next week's training.
          </DialogDescription>
        </DialogHeader>

        {adaptationComplete ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Program Adapted!
              </h3>
              <p className="text-green-700">
                Your next week has been customized based on your feedback.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedFeedback === option.value
              const isDisabled = isSubmitting

              return (
                <Card key={option.value}>
                  <CardContent className="p-0">
                    <Button
                      variant="ghost"
                      className={`w-full h-auto p-4 justify-start text-left transition-all duration-200 ${
                        option.bgColor
                      } ${option.borderColor} border ${
                        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      onClick={() => handleFeedbackSubmit(option.value)}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`p-2 rounded-lg ${option.bgColor.replace('hover:', '')}`}>
                          {isSubmitting && isSelected ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                          ) : (
                            <Icon className={`h-5 w-5 ${option.color}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!adaptationComplete && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full"
            >
              Skip This Week
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 