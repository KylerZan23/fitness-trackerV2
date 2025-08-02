'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getAICoachRecommendation } from '@/app/_actions/aiCoachActions'
import type { AICoachRecommendation as AICoachRecommendationType } from '@/lib/types/aiCoach'
import { submitCoachFeedback } from '@/app/_actions/feedbackActions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

// Extract the exercise type from the main recommendation type
type AiCoachExercise = AICoachRecommendationType['workoutRecommendation']['suggestedExercises'][0]

// Re-define the interface here for clarity within the component, matching the server action
interface AICoachRecommendation extends AICoachRecommendationType {
  cacheKey?: string
}

/**
 * AI Coach recommendations content component without Card wrapper
 * Designed to be embedded within other Card containers
 */
export function AICoachContent() {
  const [recommendations, setRecommendations] = useState<AICoachRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start loading true to fetch on mount
  const [error, setError] = useState<string | null>(null)
  
  // Feedback state
  const [coachFeedbackRating, setCoachFeedbackRating] = useState<number | null>(null)
  const [coachFeedbackComment, setCoachFeedbackComment] = useState('')
  const [isSubmittingCoachFeedback, setIsSubmittingCoachFeedback] = useState(false)
  const [coachFeedbackSubmitted, setCoachFeedbackSubmitted] = useState(false)
  const [coachFeedbackError, setCoachFeedbackError] = useState<string | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const { addToast } = useToast()

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    // Reset feedback state when fetching new recommendations
    setCoachFeedbackRating(null)
    setCoachFeedbackComment('')
    setCoachFeedbackSubmitted(false)
    setCoachFeedbackError(null)
    setIsCommentExpanded(false)
    
    try {
      const result = await getAICoachRecommendation()
      if ('error' in result) {
        setError(result.error)
        setRecommendations(null)
      } else {
        setRecommendations(result)
      }
    } catch (e) {
      console.error('Failed to fetch AI coach recommendations:', e)
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
      setRecommendations(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCoachFeedbackSubmit = async () => {
    if (!coachFeedbackRating || !recommendations) return

    setIsSubmittingCoachFeedback(true)
    setCoachFeedbackError(null)

    try {
      // Generate content hash as fallback if no cache key
      let recommendationContentHash: string | undefined
      if (!recommendations.cacheKey) {
        const contentString = JSON.stringify({
          workoutRecommendation: recommendations.workoutRecommendation,
          runRecommendation: recommendations.runRecommendation,
          generalInsight: recommendations.generalInsight,
          focusAreaSuggestion: recommendations.focusAreaSuggestion,
        })
        recommendationContentHash = btoa(contentString).substring(0, 50) // Simple hash
      }

      const result = await submitCoachFeedback(
        coachFeedbackRating,
        coachFeedbackComment.trim() || undefined,
        recommendations.cacheKey,
        recommendationContentHash
      )

      if (result.success) {
        setCoachFeedbackSubmitted(true)
        addToast({
          type: 'success',
          title: 'Feedback submitted!',
          description: 'Thank you for helping us improve your AI coaching experience.',
        })
      } else {
        setCoachFeedbackError(result.error)
        addToast({
          type: 'error',
          title: 'Failed to submit feedback',
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Error submitting coach feedback:', error)
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setCoachFeedbackError(errorMessage)
      addToast({
        type: 'error',
        title: 'Failed to submit feedback',
        description: errorMessage,
      })
    } finally {
      setIsSubmittingCoachFeedback(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const renderRecommendationBlock = (
    title: string,
    details: string | undefined | null,
    icon: string,
    suggestedExercises?: AiCoachExercise[]
  ) => {
    if (!details) return null

    return (
      <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
        <h3 className="text-md font-semibold text-slate-700 mb-1">
          {icon} {title}
        </h3>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{details}</p>
        {suggestedExercises && suggestedExercises.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-slate-500">Suggested Exercises:</p>
            <ul className="list-disc list-inside pl-2">
              {suggestedExercises.map((ex, index) => (
                <li key={index} className="text-sm text-slate-600">
                  {ex.name}: {ex.sets} sets of {ex.reps} reps
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">AI Coach is thinking...</p>
        </div>
      </div>
    )
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!isLoading && !error && !recommendations) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">
          No recommendations available at the moment.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecommendations}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recommendations */}
      {!isLoading && !error && recommendations && (
        <div className="space-y-3">
          {renderRecommendationBlock(
            recommendations.workoutRecommendation.title,
            recommendations.workoutRecommendation.details,
            '🏋️', // Dumbbell emoji for workout
            recommendations.workoutRecommendation.suggestedExercises
          )}
          {recommendations.runRecommendation &&
            renderRecommendationBlock(
              recommendations.runRecommendation.title,
              recommendations.runRecommendation.details,
              '🏃' // Runner emoji for run
            )}
          {renderRecommendationBlock(
            recommendations.generalInsight.title,
            recommendations.generalInsight.details,
            '💡' // Lightbulb emoji for insight
          )}
          {recommendations.focusAreaSuggestion &&
            renderRecommendationBlock(
              recommendations.focusAreaSuggestion.title,
              recommendations.focusAreaSuggestion.details,
              '🎯' // Target emoji for focus area
            )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center pt-4 border-t border-gray-200">
        <Button 
          onClick={fetchRecommendations} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Get New Advice'}
        </Button>
      </div>

      {/* Feedback Section */}
      {!isLoading && !error && recommendations && (
        <div className="pt-4 border-t border-gray-200">
          {coachFeedbackSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-green-600 fill-current" />
                <p className="text-sm font-medium text-green-800">
                  Thanks for your feedback on this advice!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-medium text-slate-700">Was this advice helpful?</h4>
              </div>

              {/* Star Rating */}
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoveredRating ?? coachFeedbackRating ?? 0) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCoachFeedbackRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`p-1 transition-all duration-200 hover:scale-110 ${
                        isActive ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                      }`}
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                    </button>
                  )
                })}
                {coachFeedbackRating && (
                  <span className="ml-2 text-xs text-slate-600">
                    {coachFeedbackRating} star{coachFeedbackRating !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Comment Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsCommentExpanded(!isCommentExpanded)}
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <span>Add comment (optional)</span>
                  {isCommentExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                
                {isCommentExpanded && (
                  <div className="mt-2">
                    <Textarea
                      placeholder="Share your thoughts about this recommendation..."
                      value={coachFeedbackComment}
                      onChange={(e) => setCoachFeedbackComment(e.target.value)}
                      className="min-h-[60px] text-xs resize-none"
                      disabled={isSubmittingCoachFeedback}
                    />
                  </div>
                )}
              </div>

              {/* Error Display */}
              {coachFeedbackError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-xs text-red-700">{coachFeedbackError}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleCoachFeedbackSubmit}
                disabled={!coachFeedbackRating || isSubmittingCoachFeedback}
                size="sm"
                className="w-full"
              >
                {isSubmittingCoachFeedback ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}