'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/Icon'
import { type OnboardingFormData } from './types/onboarding-flow'
import { ONBOARDING_QUESTIONS } from './QuestionRegistry'
import { type FitnessGoal, type EquipmentType } from '@/lib/types/onboarding'
import { mapGoalToTrainingFocus } from '@/lib/utils/goalToFocusMapping'

interface ReviewSummaryProps {
  answers: Partial<OnboardingFormData>
  onEdit: (questionId: keyof OnboardingFormData) => void
  onConfirm: () => void
  onBack: () => void
  isGenerating?: boolean
}

interface SummarySection {
  title: string
  emoji: string
  items: SummaryItem[]
}

interface SummaryItem {
  label: string
  value: string | string[]
  questionId: keyof OnboardingFormData
  isOptional?: boolean
  isEmpty?: boolean
}

/**
 * Comprehensive review summary component
 * Shows all user answers in an organized format before completing onboarding
 */
export function ReviewSummary({ 
  answers, 
  onEdit, 
  onConfirm, 
  onBack, 
  isGenerating = false 
}: ReviewSummaryProps) {
  const sections = buildSummarySections(answers)
  const completionStats = calculateCompletionStats(answers)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="check-circle" className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Review Your Fitness Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please review your answers below. You can edit any section before completing your profile.
          </p>
        </div>

        {/* Completion Stats */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Profile Completion
                </h3>
                <p className="text-sm text-gray-600">
                  {completionStats.completed} of {completionStats.total} questions answered
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">
                  {completionStats.percentage}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionStats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Sections */}
        <div className="space-y-6 mb-8">
          {sections.map((section, index) => (
            <SummarySection
              key={section.title}
              section={section}
              onEdit={onEdit}
              index={index}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8 border-t">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isGenerating}
            className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Icon name="chevron-left" className="w-4 h-4 mr-2" />
            Back to Questions
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isGenerating || completionStats.percentage < 40}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <Icon name="loader" className="animate-spin w-4 h-4 mr-2" />
                Completing Profile...
              </>
            ) : (
              <>
                Complete Profile
                <Icon name="arrow-right" className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Minimum Requirements Notice */}
        {completionStats.percentage < 40 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Icon name="alert-triangle" className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Please answer at least 40% of the questions to complete your profile.
                You're currently at {completionStats.percentage}%.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Individual summary section component
 */
function SummarySection({ 
  section, 
  onEdit, 
  index 
}: { 
  section: SummarySection
  onEdit: (questionId: keyof OnboardingFormData) => void
  index: number
}) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
          <span className="text-2xl mr-3">{section.emoji}</span>
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {section.items.map((item, itemIndex) => (
            <SummaryItem
              key={`${item.questionId}-${itemIndex}`}
              item={item}
              onEdit={onEdit}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual summary item component
 */
function SummaryItem({ 
  item, 
  onEdit 
}: { 
  item: SummaryItem
  onEdit: (questionId: keyof OnboardingFormData) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">{item.label}</h4>
          {item.isOptional && (
            <Badge variant="secondary" className="text-xs">
              Optional
            </Badge>
          )}
        </div>
        
        {item.isEmpty ? (
          <p className="text-sm text-gray-500 italic">Not answered</p>
        ) : Array.isArray(item.value) ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.value.map((val, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {val}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-700">{item.value}</p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(item.questionId)}
        className="ml-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
      >
        <Icon name="edit" className="w-4 h-4 mr-1" />
        Edit
      </Button>
    </div>
  )
}

/**
 * Build summary sections from answers
 */
function buildSummarySections(answers: Partial<OnboardingFormData>): SummarySection[] {
  return [
    {
      title: 'Fitness Goals',
      emoji: '🎯',
      items: [
        {
          label: 'Primary Goal',
          value: answers.primaryGoal || '',
          questionId: 'primaryGoal',
          isEmpty: !answers.primaryGoal
        }
      ]
    },
    {
      title: 'Training Preferences',
      emoji: '💪',
      items: [
        {
          label: 'Training Frequency',
          value: answers.trainingFrequencyDays ? `${answers.trainingFrequencyDays} days per week` : '',
          questionId: 'trainingFrequencyDays',
          isEmpty: !answers.trainingFrequencyDays
        },
        {
          label: 'Session Duration',
          value: answers.sessionDuration || '',
          questionId: 'sessionDuration',
          isEmpty: !answers.sessionDuration
        },
        {
          label: 'Experience Level',
          value: answers.experienceLevel || '',
          questionId: 'experienceLevel',
          isEmpty: !answers.experienceLevel
        },
        {
          label: 'Training Focus',
          value: answers.primaryGoal ? `${mapGoalToTrainingFocus(answers.primaryGoal)} (derived from goal)` : '',
          questionId: 'primaryGoal',
          isEmpty: !answers.primaryGoal
        },
        {
          label: 'Weight Unit',
          value: answers.weightUnit || '',
          questionId: 'weightUnit',
          isEmpty: !answers.weightUnit
        }
      ]
    },
    {
      title: 'Equipment & Environment',
      emoji: '🏋️‍♂️',
      items: [
        {
          label: 'Available Equipment',
          value: Array.isArray(answers.equipment) ? answers.equipment : [],
          questionId: 'equipment',
          isEmpty: !answers.equipment || (Array.isArray(answers.equipment) && answers.equipment.length === 0)
        }
      ]
    },
    {
      title: 'Strength Assessment',
      emoji: '📊',
      items: [
        {
          label: 'Squat 1RM',
          value: answers.squat1RMEstimate ? `${answers.squat1RMEstimate} lbs` : '',
          questionId: 'squat1RMEstimate',
          isOptional: true,
          isEmpty: !answers.squat1RMEstimate
        },
        {
          label: 'Bench Press 1RM',
          value: answers.benchPress1RMEstimate ? `${answers.benchPress1RMEstimate} lbs` : '',
          questionId: 'benchPress1RMEstimate',
          isOptional: true,
          isEmpty: !answers.benchPress1RMEstimate
        },
        {
          label: 'Deadlift 1RM',
          value: answers.deadlift1RMEstimate ? `${answers.deadlift1RMEstimate} lbs` : '',
          questionId: 'deadlift1RMEstimate',
          isOptional: true,
          isEmpty: !answers.deadlift1RMEstimate
        },
        {
          label: 'Overhead Press 1RM',
          value: answers.overheadPress1RMEstimate ? `${answers.overheadPress1RMEstimate} lbs` : '',
          questionId: 'overheadPress1RMEstimate',
          isOptional: true,
          isEmpty: !answers.overheadPress1RMEstimate
        },
        {
          label: 'Assessment Confidence',
          value: formatAssessmentType(answers.strengthAssessmentType),
          questionId: 'strengthAssessmentType',
          isOptional: true,
          isEmpty: !answers.strengthAssessmentType
        }
      ]
    },
    {
      title: 'Preferences & Limitations',
      emoji: '⚠️',
      items: [
        {
          label: 'Exercise Preferences',
          value: answers.exercisePreferences || '',
          questionId: 'exercisePreferences',
          isOptional: true,
          isEmpty: !answers.exercisePreferences
        },
        {
          label: 'Injuries/Limitations',
          value: answers.injuriesLimitations || '',
          questionId: 'injuriesLimitations',
          isOptional: true,
          isEmpty: !answers.injuriesLimitations
        }
      ]
    }
  ]
}

/**
 * Calculate completion statistics
 */
function calculateCompletionStats(answers: Partial<OnboardingFormData>) {
  // Get all question IDs from the registry
  const allQuestionIds = ONBOARDING_QUESTIONS.map(q => q.id)
  
  // Count only answers that correspond to actual questions in the registry
  const answeredQuestions = allQuestionIds.filter(questionId => {
    const value = answers[questionId as keyof OnboardingFormData]
    return value !== undefined && value !== null && value !== '' && 
           (Array.isArray(value) ? value.length > 0 : true)
  }).length
  
  const totalQuestions = allQuestionIds.length
  const percentage = Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100))
  
  return {
    total: totalQuestions,
    completed: answeredQuestions,
    percentage
  }
}

/**
 * Format strength assessment type for display
 */
function formatAssessmentType(type?: string): string {
  switch (type) {
    case 'actual_1rm':
      return 'Actual 1RM (Recently tested)'
    case 'estimated_1rm':
      return 'Estimated 1RM (Based on training)'
    case 'unsure':
      return 'Not sure (Best guess)'
    default:
      return ''
  }
} 