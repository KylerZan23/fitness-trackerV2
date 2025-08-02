'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getUserProfile } from '@/lib/db/index'
import { enhancedWeakPointAnalysis, type StrengthProfile, type WeakPointProtocol } from '@/lib/weakPointAnalysis'
import { AlertTriangle, CheckCircle, Target, Clock, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const supabase = createClient()

interface OnboardingData {
  squat1RMEstimate?: number
  benchPress1RMEstimate?: number
  deadlift1RMEstimate?: number
  overheadPress1RMEstimate?: number
}

/**
 * Weak Point Analysis content component for AI Coach dashboard
 * Analyzes strength ratios and provides corrective exercise recommendations
 */
export function WeakPointAnalysisContent() {
  const [analysis, setAnalysis] = useState<WeakPointProtocol | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    const loadWeakPointAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user profile with onboarding data
        const profile = await getUserProfile(supabase)
        
        if (!profile?.onboarding_responses) {
          setHasData(false)
          setLoading(false)
          return
        }

        const onboarding = profile.onboarding_responses as OnboardingData

        // Check if we have sufficient strength data (at least 3 of 4 lifts)
        const strengthData = [
          onboarding.squat1RMEstimate,
          onboarding.benchPress1RMEstimate,
          onboarding.deadlift1RMEstimate,
          onboarding.overheadPress1RMEstimate
        ].filter(val => val && val > 0)

        if (strengthData.length < 3) {
          setHasData(false)
          setLoading(false)
          return
        }

        // Create strength profile for analysis
        const strengthProfile: StrengthProfile = {
          squat1RM: onboarding.squat1RMEstimate || 0,
          bench1RM: onboarding.benchPress1RMEstimate || 0,
          deadlift1RM: onboarding.deadlift1RMEstimate || 0,
          overheadPress1RM: onboarding.overheadPress1RMEstimate || 0
        }

        // Perform weak point analysis
        const analysisResult = enhancedWeakPointAnalysis(strengthProfile)
        setAnalysis(analysisResult)
        setHasData(true)

      } catch (err) {
        console.error('Error performing weak point analysis:', err)
        setError('Unable to analyze your strength ratios. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadWeakPointAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-600" />
          <p className="text-sm text-gray-600">Analyzing your strength ratios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Strength Data Needed</h3>
        <p className="text-gray-600 text-sm mb-4">
          We need your strength estimates for at least 3 major lifts to perform analysis.
        </p>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.location.href = '/onboarding'}
        >
          Complete Strength Assessment
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No analysis data available.</p>
      </div>
    )
  }

  const getSeverityColor = (severity: 'Moderate' | 'High') => {
    return severity === 'High' ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200'
  }

  const getSeverityIcon = (severity: 'Moderate' | 'High') => {
    return severity === 'High' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Analysis Summary */}
      {analysis.issues.length === 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Balanced Strength Profile</h4>
              <p className="text-sm text-green-700">
                Your strength ratios are within optimal ranges. Keep up the balanced training!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Identified Imbalances</h4>
            <Badge variant="secondary" className="text-xs">
              {analysis.issues.length} issue{analysis.issues.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Issues List */}
          {analysis.issues.map((issue, index) => (
            <div 
              key={index}
              className={`p-3 border rounded-lg ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm capitalize">
                      {issue.ratioName.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${issue.severity === 'High' ? 'border-red-300' : 'border-orange-300'}`}
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs mb-2">{issue.explanation}</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span>Your ratio: <strong>{issue.yourRatio}</strong></span>
                    <span>Target: <strong>{issue.standardMinimum}+</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Corrective Exercises */}
      {analysis.correctionExercises.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Recommended Corrective Exercises
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {analysis.correctionExercises.map((exercise, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-blue-700">{exercise}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Weak Points Summary */}
      {analysis.primaryWeakPoints.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">Focus Areas</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.primaryWeakPoints.map((weakPoint, index) => (
              <Badge 
                key={index}
                variant="outline"
                className="text-xs border-amber-300 text-amber-700"
              >
                {weakPoint.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reassessment Timeline */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>
            Re-assess in <strong>{analysis.reassessmentPeriodWeeks} weeks</strong> to track progress
          </span>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Analysis based on established strength coaching standards and your current 1RM estimates
        </p>
      </div>
    </div>
  )
}