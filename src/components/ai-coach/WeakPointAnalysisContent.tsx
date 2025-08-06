'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * WeakPointAnalysisContent Component
 * Temporarily unavailable - weak point analysis will be redesigned
 */
export function WeakPointAnalysisContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Weak Point Analysis
        </CardTitle>
        <CardDescription>
          Feature temporarily unavailable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-sm">
            Weak point analysis is being redesigned as part of our new training system.
            Check back soon for enhanced strength ratio analysis and corrective exercise recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}