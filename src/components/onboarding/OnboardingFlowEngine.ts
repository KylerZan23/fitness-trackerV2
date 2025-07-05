import { 
  type Question, 
  type OnboardingFormData, 
  type ProgressInfo,
  type QuestionConditions 
} from './types/onboarding-flow'

/**
 * Engine that manages the flow of individual onboarding questions
 * Handles progression, conditional logic, and progress tracking
 */
export class OnboardingFlowEngine {
  private questions: Question[]
  private answers: Partial<OnboardingFormData>
  private currentIndex: number
  private conditions: QuestionConditions

  constructor(
    questions: Question[], 
    initialAnswers: Partial<OnboardingFormData> = {},
    conditions: QuestionConditions = {}
  ) {
    this.questions = [...questions].sort((a, b) => a.order - b.order)
    this.answers = { ...initialAnswers }
    this.currentIndex = 0
    this.conditions = conditions
  }

  /**
   * Get all questions that should be shown based on current answers
   */
  getQuestionsToShow(): Question[] {
    return this.questions.filter(question => this.shouldShowQuestion(question))
  }

  /**
   * Determine if a question should be shown based on conditional logic
   */
  shouldShowQuestion(question: Question): boolean {
    // If question has its own shouldShow logic, use that
    if (question.shouldShow) {
      return question.shouldShow(this.answers)
    }

    // Check global conditions
    if (this.conditions[question.id]) {
      return this.conditions[question.id](this.answers)
    }

    // Default: show the question
    return true
  }

  /**
   * Get the current question based on the current index
   */
  getCurrentQuestion(): Question | null {
    const questionsToShow = this.getQuestionsToShow()
    return questionsToShow[this.currentIndex] || null
  }

  /**
   * Get the next question in the flow
   */
  getNextQuestion(): Question | null {
    const questionsToShow = this.getQuestionsToShow()
    const nextIndex = this.currentIndex + 1
    return questionsToShow[nextIndex] || null
  }

  /**
   * Get the previous question in the flow
   */
  getPreviousQuestion(): Question | null {
    const questionsToShow = this.getQuestionsToShow()
    const prevIndex = this.currentIndex - 1
    return questionsToShow[prevIndex] || null
  }

  /**
   * Move to the next question
   */
  goToNext(): boolean {
    const questionsToShow = this.getQuestionsToShow()
    if (this.currentIndex < questionsToShow.length) {
      this.currentIndex++
      return true
    }
    return false
  }

  /**
   * Move to the previous question
   */
  goToPrevious(): boolean {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return true
    }
    return false
  }

  /**
   * Jump to a specific question by ID
   */
  goToQuestion(questionId: keyof OnboardingFormData): boolean {
    const questionsToShow = this.getQuestionsToShow()
    const questionIndex = questionsToShow.findIndex(q => q.id === questionId)
    
    if (questionIndex !== -1) {
      this.currentIndex = questionIndex
      return true
    }
    return false
  }

  /**
   * Update an answer and recalculate which questions should be shown
   */
  updateAnswer(questionId: keyof OnboardingFormData, value: any): void {
    this.answers = {
      ...this.answers,
      [questionId]: value
    }

    // Recalculate questions to show and adjust current index if needed
    const questionsToShow = this.getQuestionsToShow()
    const currentQuestion = this.getCurrentQuestion()
    
    // If current question is no longer valid, find the nearest valid question
    if (currentQuestion && !this.shouldShowQuestion(currentQuestion)) {
      const newIndex = Math.min(this.currentIndex, questionsToShow.length - 1)
      this.currentIndex = Math.max(0, newIndex)
    }
  }

  /**
   * Skip the current question (only if it's optional)
   */
  skipCurrentQuestion(): boolean {
    const currentQuestion = this.getCurrentQuestion()
    if (currentQuestion?.isOptional) {
      return this.goToNext()
    }
    return false
  }

  /**
   * Calculate progress information
   */
  calculateProgress(): ProgressInfo {
    const questionsToShow = this.getQuestionsToShow()
    const answeredQuestions = questionsToShow.filter(question => {
      const answer = this.answers[question.id]
      return answer !== undefined && answer !== null && answer !== ''
    })

    const current = Math.min(answeredQuestions.length + 1, questionsToShow.length)
    const total = questionsToShow.length
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0

    return {
      current,
      total,
      percentage
    }
  }

  /**
   * Check if the flow is complete
   */
  isComplete(): boolean {
    const questionsToShow = this.getQuestionsToShow()
    const requiredQuestions = questionsToShow.filter(q => !q.isOptional)
    
    // First, check if all required questions are answered
    const allRequiredAnswered = requiredQuestions.every(question => {
      const answer = this.answers[question.id]
      return answer !== undefined && answer !== null && answer !== ''
    })
    
    // Only consider complete if we've gone past the last question AND all required are answered
    const hasReachedEnd = this.currentIndex >= questionsToShow.length
    
    return allRequiredAnswered && hasReachedEnd
  }

  /**
   * Get all current answers
   */
  getAnswers(): Partial<OnboardingFormData> {
    return { ...this.answers }
  }

  /**
   * Get the current question index
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * Check if we can go to the next question
   */
  canGoNext(): boolean {
    const currentQuestion = this.getCurrentQuestion()
    if (!currentQuestion) return false

    // If question is optional, we can always proceed
    if (currentQuestion.isOptional) return true

    // For required questions, check if we have a valid answer
    const answer = this.answers[currentQuestion.id]
    return answer !== undefined && answer !== null && answer !== ''
  }

  /**
   * Check if we can go to the previous question
   */
  canGoPrevious(): boolean {
    return this.currentIndex > 0
  }

  /**
   * Reset the flow to the beginning
   */
  reset(): void {
    this.currentIndex = 0
    this.answers = {}
  }
} 