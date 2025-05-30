import { useState, useCallback, useEffect } from 'react'
import { OnboardingFlowEngine } from '../OnboardingFlowEngine'
import { ONBOARDING_QUESTIONS, QUESTION_CONDITIONS } from '../QuestionRegistry'
import { 
  type OnboardingFormData, 
  type OnboardingFlowState,
  type UserProfile 
} from '../types/onboarding-flow'

/**
 * React hook for managing onboarding flow state
 * Provides a clean interface for components to interact with the flow engine
 */
export function useOnboardingFlow(
  profile?: UserProfile,
  initialAnswers: Partial<OnboardingFormData> = {}
) {
  // Initialize the flow engine
  const [flowEngine] = useState(() => 
    new OnboardingFlowEngine(ONBOARDING_QUESTIONS, initialAnswers, QUESTION_CONDITIONS)
  )

  // Flow state
  const [state, setState] = useState<OnboardingFlowState>(() => ({
    currentQuestionIndex: flowEngine.getCurrentIndex(),
    answers: flowEngine.getAnswers(),
    questionsToShow: flowEngine.getQuestionsToShow(),
    progress: flowEngine.calculateProgress(),
    isLoading: false,
    error: undefined
  }))

  // Update state from flow engine
  const updateState = useCallback(() => {
    setState({
      currentQuestionIndex: flowEngine.getCurrentIndex(),
      answers: flowEngine.getAnswers(),
      questionsToShow: flowEngine.getQuestionsToShow(),
      progress: flowEngine.calculateProgress(),
      isLoading: false,
      error: undefined
    })
  }, [flowEngine])

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    return flowEngine.getCurrentQuestion()
  }, [flowEngine])

  // Answer a question
  const answerQuestion = useCallback((questionId: keyof OnboardingFormData, value: any) => {
    try {
      flowEngine.updateAnswer(questionId, value)
      updateState()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
    }
  }, [flowEngine, updateState])

  // Navigate to next question
  const goToNext = useCallback(() => {
    try {
      const success = flowEngine.goToNext()
      updateState()
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
      return false
    }
  }, [flowEngine, updateState])

  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    try {
      const success = flowEngine.goToPrevious()
      updateState()
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
      return false
    }
  }, [flowEngine, updateState])

  // Skip current question (if optional)
  const skipQuestion = useCallback(() => {
    try {
      const success = flowEngine.skipCurrentQuestion()
      updateState()
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
      return false
    }
  }, [flowEngine, updateState])

  // Jump to a specific question
  const goToQuestion = useCallback((questionId: keyof OnboardingFormData) => {
    try {
      const success = flowEngine.goToQuestion(questionId)
      updateState()
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
      return false
    }
  }, [flowEngine, updateState])

  // Check if we can proceed to next question
  const canGoNext = useCallback(() => {
    return flowEngine.canGoNext()
  }, [flowEngine])

  // Check if we can go back to previous question
  const canGoPrevious = useCallback(() => {
    return flowEngine.canGoPrevious()
  }, [flowEngine])

  // Check if the flow is complete
  const isComplete = useCallback(() => {
    return flowEngine.isComplete()
  }, [flowEngine])

  // Reset the flow
  const reset = useCallback(() => {
    try {
      flowEngine.reset()
      updateState()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
    }
  }, [flowEngine, updateState])

  // Clear any errors
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: undefined
    }))
  }, [])

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }))
  }, [])

  // Get validation error for current question
  const getValidationError = useCallback((questionId: keyof OnboardingFormData, value: any) => {
    const question = flowEngine.getQuestionsToShow().find(q => q.id === questionId)
    if (!question) return undefined

    try {
      question.validation.parse(value)
      return undefined
    } catch (error: any) {
      return error.errors?.[0]?.message || 'Invalid value'
    }
  }, [flowEngine])

  // Get answer for a specific question
  const getAnswer = useCallback((questionId: keyof OnboardingFormData) => {
    return state.answers[questionId]
  }, [state.answers])

  // Get all answers
  const getAllAnswers = useCallback(() => {
    return state.answers
  }, [state.answers])

  // Update state when flow engine changes (shouldn't happen often)
  useEffect(() => {
    updateState()
  }, [updateState])

  return {
    // State
    state,
    
    // Current question info
    currentQuestion: getCurrentQuestion(),
    canGoNext: canGoNext(),
    canGoPrevious: canGoPrevious(),
    isComplete: isComplete(),
    
    // Actions
    answerQuestion,
    goToNext,
    goToPrevious,
    skipQuestion,
    goToQuestion,
    reset,
    clearError,
    setLoading,
    
    // Utilities
    getValidationError,
    getAnswer,
    getAllAnswers,
    
    // Profile data
    profile
  }
} 