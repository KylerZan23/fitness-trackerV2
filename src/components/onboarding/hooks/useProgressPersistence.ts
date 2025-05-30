import { useState, useEffect, useCallback } from 'react'
import { type OnboardingFormData } from '../types/onboarding-flow'

interface ProgressData {
  answers: Partial<OnboardingFormData>
  currentQuestionIndex: number
  completedQuestions: string[]
  lastUpdated: string
  sessionId: string
}

const STORAGE_KEY = 'onboarding_progress'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Custom hook for persisting onboarding progress
 * Automatically saves progress to localStorage and restores on return
 */
export function useProgressPersistence() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [sessionId] = useState(() => generateSessionId())

  /**
   * Save progress to localStorage
   */
  const saveProgress = useCallback((
    answers: Partial<OnboardingFormData>,
    currentQuestionIndex: number,
    completedQuestions: string[] = []
  ) => {
    try {
      const progressData: ProgressData = {
        answers,
        currentQuestionIndex,
        completedQuestions,
        lastUpdated: new Date().toISOString(),
        sessionId
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData))
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progressData))
      
      console.info('Progress saved successfully')
    } catch (error) {
      console.warn('Failed to save progress:', error)
    }
  }, [sessionId])

  /**
   * Load progress from localStorage
   */
  const loadProgress = useCallback((): ProgressData | null => {
    try {
      // Try localStorage first
      let stored = localStorage.getItem(STORAGE_KEY)
      
      // Fallback to sessionStorage
      if (!stored) {
        stored = sessionStorage.getItem(STORAGE_KEY)
      }

      if (!stored) {
        return null
      }

      const progressData: ProgressData = JSON.parse(stored)
      
      // Check if progress is still valid (not expired)
      const lastUpdated = new Date(progressData.lastUpdated)
      const now = new Date()
      const timeDiff = now.getTime() - lastUpdated.getTime()
      
      if (timeDiff > SESSION_TIMEOUT) {
        console.info('Progress expired, starting fresh')
        clearProgress()
        return null
      }

      console.info('Progress loaded successfully')
      return progressData
    } catch (error) {
      console.warn('Failed to load progress:', error)
      return null
    }
  }, [])

  /**
   * Clear saved progress
   */
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
      console.info('Progress cleared')
    } catch (error) {
      console.warn('Failed to clear progress:', error)
    }
  }, [])

  /**
   * Check if there's saved progress available
   */
  const hasSavedProgress = useCallback((): boolean => {
    const progress = loadProgress()
    return progress !== null && Object.keys(progress.answers).length > 0
  }, [loadProgress])

  /**
   * Get progress summary for display
   */
  const getProgressSummary = useCallback((): {
    hasProgress: boolean
    questionsAnswered: number
    lastUpdated?: string
    timeAgo?: string
  } => {
    const progress = loadProgress()
    
    if (!progress) {
      return { hasProgress: false, questionsAnswered: 0 }
    }

    const questionsAnswered = Object.keys(progress.answers).length
    const lastUpdated = progress.lastUpdated
    const timeAgo = formatTimeAgo(new Date(lastUpdated))

    return {
      hasProgress: true,
      questionsAnswered,
      lastUpdated,
      timeAgo
    }
  }, [loadProgress])

  /**
   * Auto-save progress with debouncing
   */
  const autoSaveProgress = useCallback(
    debounce((
      answers: Partial<OnboardingFormData>,
      currentQuestionIndex: number,
      completedQuestions: string[]
    ) => {
      saveProgress(answers, currentQuestionIndex, completedQuestions)
    }, 1000), // Save after 1 second of inactivity
    [saveProgress]
  )

  /**
   * Initialize progress persistence
   */
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return {
    isLoaded,
    saveProgress,
    loadProgress,
    clearProgress,
    hasSavedProgress,
    getProgressSummary,
    autoSaveProgress
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format time ago string
 */
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return 'just now'
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }
}

/**
 * Debounce function to limit how often auto-save runs
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Hook for showing progress restoration dialog
 */
export function useProgressRestoration() {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [progressSummary, setProgressSummary] = useState<{
    hasProgress: boolean
    questionsAnswered: number
    timeAgo?: string
  }>({ hasProgress: false, questionsAnswered: 0 })

  const { hasSavedProgress, getProgressSummary, loadProgress, clearProgress } = useProgressPersistence()

  /**
   * Check for saved progress on mount
   */
  useEffect(() => {
    if (hasSavedProgress()) {
      const summary = getProgressSummary()
      setProgressSummary(summary)
      setShowRestoreDialog(true)
    }
  }, [hasSavedProgress, getProgressSummary])

  /**
   * Restore progress and close dialog
   */
  const restoreProgress = useCallback(() => {
    const progress = loadProgress()
    setShowRestoreDialog(false)
    return progress
  }, [loadProgress])

  /**
   * Start fresh and clear saved progress
   */
  const startFresh = useCallback(() => {
    clearProgress()
    setShowRestoreDialog(false)
  }, [clearProgress])

  return {
    showRestoreDialog,
    progressSummary,
    restoreProgress,
    startFresh,
    setShowRestoreDialog
  }
} 