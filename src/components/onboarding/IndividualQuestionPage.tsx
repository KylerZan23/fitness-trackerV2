'use client'

import React from 'react'
import { BaseQuestionLayout } from './questions/BaseQuestionLayout'
import { PrimaryGoalQuestion } from './questions/PrimaryGoalQuestion'
import { SecondaryGoalQuestion } from './questions/SecondaryGoalQuestion'
import { PrimaryTrainingFocusQuestion } from './questions/PrimaryTrainingFocusQuestion'
import { ExperienceLevelQuestion } from './questions/ExperienceLevelQuestion'
import { SessionDurationQuestion } from './questions/SessionDurationQuestion'
import { TrainingFrequencyQuestion } from './questions/TrainingFrequencyQuestion'
import { EquipmentAccessQuestion } from './questions/EquipmentAccessQuestion'
import { ExercisePreferencesQuestion } from './questions/ExercisePreferencesQuestion'
import { InjuriesQuestion } from './questions/InjuriesQuestion'
import { UnitPreferenceQuestion } from './questions/UnitPreferenceQuestion'
import { StrengthAssessmentQuestion } from './questions/StrengthAssessmentQuestion'
import { ReviewSummary } from './ReviewSummary'
import { useOnboardingFlow } from './hooks/useOnboardingFlow'
import { useOnboardingValidation } from './hooks/useOnboardingValidation'
import { useProgressPersistence, useProgressRestoration } from './hooks/useProgressPersistence'
import { type Question, type OnboardingFormData } from './types/onboarding-flow'
import { type WeightUnit } from '@/lib/types/onboarding'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/Icon'

interface IndividualQuestionPageProps {
  onComplete: (data: any) => void
  onError?: (error: string) => void
}

/**
 * Renders the appropriate question component based on the question type
 */
function QuestionRenderer({ question, value, onChange, error, allAnswers }: {
  question: Question
  value: any
  onChange: (value: any) => void
  error?: string
  allAnswers?: Partial<OnboardingFormData>
}) {
  const questionProps = { value, onChange, error, allAnswers }

  // Get the selected weight unit for strength questions
  const selectedWeightUnit = (allAnswers?.weightUnit as WeightUnit) || 'lbs'

  // Simple strength question component
  const StrengthQuestionComponent = ({ exercise, emoji, placeholder }: { exercise: string, emoji: string, placeholder: string }) => {
    const currentValue = value as number | undefined

    const handleInputChange = (inputValue: string) => {
      if (inputValue === '') {
        onChange(undefined)
        return
      }
      
      const numValue = parseInt(inputValue, 10)
      if (!isNaN(numValue) && numValue > 0) {
        onChange(numValue)
      }
    }

    // Unit-specific placeholders and calculations
    const unitLabel = selectedWeightUnit
    const unitPlaceholders = {
      kg: {
        squat: 'e.g., 100',
        bench: 'e.g., 80', 
        deadlift: 'e.g., 120',
        ohp: 'e.g., 60'
      },
      lbs: {
        squat: 'e.g., 225',
        bench: 'e.g., 185',
        deadlift: 'e.g., 275', 
        ohp: 'e.g., 135'
      }
    }

    const getPlaceholder = () => {
      const exerciseKey = exercise.toLowerCase().includes('squat') ? 'squat' :
                         exercise.toLowerCase().includes('bench') ? 'bench' :
                         exercise.toLowerCase().includes('deadlift') ? 'deadlift' : 'ohp'
      return unitPlaceholders[selectedWeightUnit][exerciseKey as keyof typeof unitPlaceholders.kg]
    }

    return (
      <div className="space-y-6">
        {/* Exercise Header */}
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="text-6xl mb-4">{emoji}</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {exercise} Strength
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            What's your estimated 1-rep max for the {exercise.toLowerCase()}? This helps us recommend appropriate training weights.
          </p>
        </div>

        {/* Weight Input */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="space-y-2">
            <label htmlFor="strength-weight" className="text-lg font-semibold text-gray-900 block">
              {exercise} 1RM ({unitLabel})
            </label>
            <div className="relative">
              <input
                id="strength-weight"
                type="number"
                placeholder={getPlaceholder()}
                value={currentValue || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full text-xl py-4 pr-16 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                step={selectedWeightUnit === 'kg' ? '2.5' : '5'}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-lg">
                {unitLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Helpful Information */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">💡 About {exercise} 1RM</h4>
            <p className="text-sm text-blue-800 mb-2">
              Your {exercise.toLowerCase()} 1RM is the maximum weight you can lift for one complete repetition with proper form.
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• If you don't know your exact 1RM, estimate based on your heaviest sets</li>
              <li>• Use online 1RM calculators if you know your 3RM or 5RM</li>
              <li>• When in doubt, it's better to underestimate than overestimate</li>
            </ul>
          </div>

          {currentValue && currentValue > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">
                ✅ Great! We'll use {currentValue} {unitLabel} for your {exercise.toLowerCase()} recommendations
              </h4>
              <p className="text-sm text-green-800">
                Based on this, we'll suggest training weights around:
              </p>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• <strong>Heavy sets (1-5 reps):</strong> {Math.round(currentValue * 0.85)}-{Math.round(currentValue * 0.95)} {unitLabel}</li>
                <li>• <strong>Moderate sets (6-12 reps):</strong> {Math.round(currentValue * 0.65)}-{Math.round(currentValue * 0.80)} {unitLabel}</li>
                <li>• <strong>Light sets (12+ reps):</strong> {Math.round(currentValue * 0.50)}-{Math.round(currentValue * 0.65)} {unitLabel}</li>
              </ul>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">
              💡 Don't know your {exercise.toLowerCase()} 1RM? No problem! You can skip this question and we'll provide general guidance instead.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Assessment type component
  const AssessmentTypeComponent = () => {
    const currentValue = value as string | undefined

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            How confident are you in these numbers?
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This helps us understand how to use your strength data for recommendations.
          </p>
        </div>

        {/* Options */}
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { value: 'actual_1rm', label: 'Actual 1RM', description: "I've tested these recently", emoji: '🎯' },
            { value: 'estimated_1rm', label: 'Estimated 1RM', description: 'Based on my recent training', emoji: '📊' },
            { value: 'unsure', label: 'Not sure', description: 'Best guess, might be off', emoji: '🤷‍♀️' }
          ].map((option) => {
            const isSelected = currentValue === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`
                  w-full p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                  ${isSelected 
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-4 ring-indigo-500/20' 
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{option.emoji}</div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {option.label}
                    </h4>
                    <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    )
  }

  switch (question.id) {
    case 'primaryGoal':
      return <PrimaryGoalQuestion {...questionProps} />
    case 'secondaryGoal':
      return <SecondaryGoalQuestion {...questionProps} />
    case 'primaryTrainingFocus':
      return <PrimaryTrainingFocusQuestion {...questionProps} />
    case 'experienceLevel':
      return <ExperienceLevelQuestion {...questionProps} />
    case 'weightUnit':
      return <UnitPreferenceQuestion {...questionProps} />
    case 'sessionDuration':
      return <SessionDurationQuestion {...questionProps} />
    case 'trainingFrequencyDays':
      return <TrainingFrequencyQuestion {...questionProps} />
    case 'equipment':
      return <EquipmentAccessQuestion {...questionProps} />
    case 'exercisePreferences':
      return <ExercisePreferencesQuestion {...questionProps} />
    case 'injuriesLimitations':
      return <InjuriesQuestion {...questionProps} />
    case 'squat1RMEstimate':
      return <StrengthQuestionComponent exercise="Squat" emoji="🏋️‍♂️" placeholder="e.g., 225" />
    case 'benchPress1RMEstimate':
      return <StrengthQuestionComponent exercise="Bench Press" emoji="💪" placeholder="e.g., 185" />
    case 'deadlift1RMEstimate':
      return <StrengthQuestionComponent exercise="Deadlift" emoji="🔥" placeholder="e.g., 275" />
    case 'overheadPress1RMEstimate':
      return <StrengthQuestionComponent exercise="Overhead Press" emoji="🚀" placeholder="e.g., 135" />
    case 'strengthAssessmentType':
      return <AssessmentTypeComponent />
    default:
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Question component not yet implemented: {question.id}</p>
          <p className="text-sm text-gray-500 mt-2">This question will be available soon!</p>
        </div>
      )
  }
}

/**
 * Progress restoration dialog component
 */
function ProgressRestorationDialog({
  show,
  progressSummary,
  onRestore,
  onStartFresh
}: {
  show: boolean
  progressSummary: { questionsAnswered: number; timeAgo?: string }
  onRestore: () => void
  onStartFresh: () => void
}) {
  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Icon name="clock" className="w-5 h-5 mr-2 text-indigo-600" />
            Continue Previous Session?
          </DialogTitle>
          <DialogDescription>
            We found your previous progress from {progressSummary.timeAgo}. 
            You had answered {progressSummary.questionsAnswered} questions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onStartFresh}
            className="flex-1"
          >
            Start Fresh
          </Button>
          <Button
            onClick={onRestore}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <Icon name="play" className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Main Individual Question Page component with Phase 3 advanced features
 * Includes animations, real-time validation, progress persistence, and review summary
 */
export function IndividualQuestionPage({ onComplete, onError }: IndividualQuestionPageProps) {
  const [showReview, setShowReview] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Progress restoration
  const {
    showRestoreDialog,
    progressSummary,
    restoreProgress,
    startFresh
  } = useProgressRestoration()

  // Main onboarding flow
  const {
    state,
    currentQuestion,
    canGoNext,
    canGoPrevious,
    isComplete,
    answerQuestion,
    goToNext,
    goToPrevious,
    skipQuestion,
    getAllAnswers,
    goToQuestion
  } = useOnboardingFlow()

  // Real-time validation
  const {
    updateValidation,
    getValidation
  } = useOnboardingValidation()

  // Progress persistence
  const { autoSaveProgress } = useProgressPersistence()

  // Auto-save progress when answers change
  React.useEffect(() => {
    if (Object.keys(state.answers).length > 0) {
      autoSaveProgress(
        state.answers,
        state.currentQuestionIndex,
        Object.keys(state.answers)
      )
    }
  }, [state.answers, state.currentQuestionIndex, autoSaveProgress])

  // Handle completion
  React.useEffect(() => {
    if (isComplete && !showReview) {
      setShowReview(true)
    }
  }, [isComplete, showReview])

  // Handle errors
  React.useEffect(() => {
    if (state.error && onError) {
      onError(state.error)
    }
  }, [state.error, onError])

  // Handle progress restoration
  const handleRestoreProgress = () => {
    const progress = restoreProgress()
    if (progress) {
      // Restore the progress to the flow engine
      // This would need to be implemented in the flow engine
      console.info('Progress restored:', progress)
    }
  }

  const handleStartFresh = () => {
    startFresh()
  }

  // Handle answer changes with real-time validation
  const handleAnswerChange = async (value: any) => {
    if (!currentQuestion) return

    // Update the answer
    answerQuestion(currentQuestion.id, value)

    // Perform real-time validation
    await updateValidation(currentQuestion.id, value, state.answers)
  }

  // Handle review summary actions
  const handleEditFromReview = (questionId: keyof OnboardingFormData) => {
    setShowReview(false)
    goToQuestion(questionId)
  }

  const handleConfirmAndGenerate = async () => {
    setIsGenerating(true)
    try {
      const allAnswers = getAllAnswers()
      await onComplete(allAnswers)
    } catch (error) {
      console.error('Error generating program:', error)
      if (onError) {
        onError('Failed to generate training program. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBackToQuestions = () => {
    setShowReview(false)
    // Go back to the last question to continue the flow
    const questionsToShow = state.questionsToShow
    if (questionsToShow.length > 0) {
      const lastQuestionIndex = questionsToShow.length - 1
      // Set the current index to the last question so user can continue
      goToQuestion(questionsToShow[lastQuestionIndex].id)
    }
  }

  // Show review summary if complete
  if (showReview) {
    return (
      <ReviewSummary
        answers={getAllAnswers()}
        onEdit={handleEditFromReview}
        onConfirm={handleConfirmAndGenerate}
        onBack={handleBackToQuestions}
        isGenerating={isGenerating}
      />
    )
  }

  // Show loading state
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized questions...</p>
        </div>
      </div>
    )
  }

  // Get current validation state
  const validation = getValidation(currentQuestion.id)
  const currentValue = state.answers[currentQuestion.id]

  return (
    <>
      {/* Progress Restoration Dialog */}
      <ProgressRestorationDialog
        show={showRestoreDialog}
        progressSummary={progressSummary}
        onRestore={handleRestoreProgress}
        onStartFresh={handleStartFresh}
      />

      {/* Main Question Layout */}
      <BaseQuestionLayout
        title={currentQuestion.title}
        description={currentQuestion.description}
        progress={state.progress}
        onNext={goToNext}
        onPrevious={goToPrevious}
        onSkip={currentQuestion.isOptional ? () => skipQuestion() : undefined}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isOptional={currentQuestion.isOptional}
        isLoading={state.isLoading}
        error={validation.error || state.error}
        questionKey={currentQuestion.id} // For animations
      >
        <QuestionRenderer
          question={currentQuestion}
          value={currentValue}
          onChange={handleAnswerChange}
          error={validation.error}
          allAnswers={state.answers}
        />

        {/* Real-time validation feedback */}
        {validation.warning && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Icon name="alert-triangle" className="w-4 h-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">{validation.warning}</p>
            </div>
          </div>
        )}

        {validation.suggestion && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Icon name="lightbulb" className="w-4 h-4 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">{validation.suggestion}</p>
            </div>
          </div>
        )}
      </BaseQuestionLayout>
    </>
  )
} 