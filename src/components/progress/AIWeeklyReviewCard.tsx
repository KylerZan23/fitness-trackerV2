'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, Target, Lightbulb, Brain, Loader2, AlertCircle, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { getAIWeeklyReview, getAIWeeklyReviewFollowUp, type AIWeeklyReview, type AIWeeklyReviewFollowUp } from '@/app/_actions/aiCoachActions'
import ActionProgressTracker from './ActionProgressTracker'

export default function AIWeeklyReviewCard() {
  const [reviewData, setReviewData] = useState<AIWeeklyReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Follow-up questions state
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [followUpHistory, setFollowUpHistory] = useState<AIWeeklyReviewFollowUp[]>([])
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpError, setFollowUpError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeeklyReview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await getAIWeeklyReview()
        
        if ('error' in result) {
          setError(result.error)
        } else {
          setReviewData(result)
        }
      } catch (err) {
        console.error('Error fetching weekly review:', err)
        setError('Unable to load your weekly review. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchWeeklyReview()
  }, [])

  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim() || !reviewData) return

    setFollowUpLoading(true)
    setFollowUpError(null)

    try {
      const result = await getAIWeeklyReviewFollowUp(reviewData, followUpQuestion.trim())
      
      if ('error' in result) {
        setFollowUpError(result.error)
      } else {
        setFollowUpHistory(prev => [...prev, result])
        setFollowUpQuestion('')
      }
    } catch (err) {
      console.error('Error getting follow-up response:', err)
      setFollowUpError('Unable to get a response to your question. Please try again.')
    } finally {
      setFollowUpLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFollowUpSubmit()
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Weekly Review</h3>
        </div>
        
        {/* Skeleton loader */}
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Analyzing your week's performance...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Weekly Review</h3>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-700">
            {error}
          </div>
        </div>
      </Card>
    )
  }

  if (!reviewData) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{reviewData.title}</h3>
      </div>
      
      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 leading-relaxed">
          {reviewData.summary}
        </p>
      </div>
      
      {/* What Went Well */}
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <Trophy className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 mb-1">What Went Well</h4>
            <p className="text-sm text-green-700 leading-relaxed">
              {reviewData.whatWentWell}
            </p>
          </div>
        </div>
      </div>
      
      {/* Improvement Area */}
      <div className="mb-4">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-800 mb-1">Focus Area</h4>
            <p className="text-sm text-orange-700 leading-relaxed">
              {reviewData.improvementArea}
            </p>
          </div>
        </div>
      </div>
      
      {/* Actionable Tip */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">This Week's Action</h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              {reviewData.actionableTip}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Progress Tracker */}
      <div className="mt-4">
        <ActionProgressTracker 
          actionableTip={reviewData.actionableTip}
          onProgressUpdate={(status) => {
            console.log('Action progress updated:', status)
          }}
        />
      </div>
      
      {/* Interactive Follow-up Section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900">Ask a Follow-up Question</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFollowUp(!showFollowUp)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {showFollowUp ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Ask Question
              </>
            )}
          </Button>
        </div>

        {showFollowUp && (
          <div className="space-y-4">
            {/* Follow-up History */}
            {followUpHistory.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {followUpHistory.map((qa, index) => (
                  <div key={index} className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MessageCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 font-medium">
                          {qa.question}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg ml-4">
                      <div className="flex items-start space-x-2">
                        <Brain className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {qa.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up Error */}
            {followUpError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{followUpError}</p>
              </div>
            )}

            {/* Question Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about your weekly review... (e.g., 'How can I improve my consistency?')"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={followUpLoading}
                className="flex-1"
              />
              <Button
                onClick={handleFollowUpSubmit}
                disabled={!followUpQuestion.trim() || followUpLoading}
                size="sm"
                className="px-3"
              >
                {followUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Suggested Questions */}
            {followUpHistory.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "How can I improve my consistency?",
                    "What exercises should I focus on?",
                    "How can I stay motivated?",
                    "What's a realistic goal for next week?"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setFollowUpQuestion(suggestion)}
                      className="text-xs h-7 px-2 text-gray-600 hover:text-gray-800"
                      disabled={followUpLoading}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          AI analysis based on your past 7 days of activity data
        </p>
      </div>
    </Card>
  )
} 