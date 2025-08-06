'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProFeatureGate } from '@/components/ui/ProFeatureGate'
import { VolumeProgressionChart } from '@/components/analytics/VolumeProgressionChart'
import { EnhancedPRTracker } from '@/components/analytics/EnhancedPRTracker'
import { FatigueAnalysisChart } from '@/components/analytics/FatigueAnalysisChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserProfile } from '@/lib/db/index'
import { hasProAccess, getSubscriptionStatus } from '@/lib/subscription'
import { TrendingUp, BarChart3, Activity, Download, RefreshCw } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  weight_unit?: 'kg' | 'lbs'
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    async function initializePage() {
      setIsLoading(true)
      try {
        // Get user profile
        const userProfile = await getUserProfile()
        if (!userProfile) {
          console.warn('No active session found. Redirecting to login.')
          router.push('/login')
          return
        }
        
        setProfile(userProfile)

        // Check Pro access (ProFeatureGate will handle the access control)
        const subscriptionStatus = await getSubscriptionStatus(userProfile.id)
        console.log('Analytics page - subscription status:', subscriptionStatus)
        
      } catch (error) {
        console.error('Error initializing analytics page:', error)
        toast.error('Failed to load analytics page')
      } finally {
        setIsLoading(false)
      }
    }

    initializePage()
  }, [router])

  const handleRefreshAnalytics = async () => {
    if (!profile) return

    setIsRefreshing(true)
    try {
      // Refresh the materialized view for advanced analytics
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = await createClient()
      
      const { error } = await supabase.rpc('refresh_advanced_analytics')
      
      if (error) {
        throw error
      }

      toast.success('Analytics data refreshed successfully')
      
      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      toast.error('Failed to refresh analytics data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportData = async () => {
    if (!profile) return

    try {
      // This would export user's training data
      // For now, we'll just show a success message
      toast.success('Data export feature coming soon!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span>Advanced Analytics</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Pro
                  </span>
                </h1>
                <p className="mt-2 text-gray-600">
                  Deep insights into your training progress, volume patterns, and recovery status
                </p>
              </div>

              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleRefreshAnalytics}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Data</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Pro Feature Gate Wrapper */}
          <ProFeatureGate
            featureName="Advanced Analytics Dashboard"
            featureDescription="Access comprehensive training analytics including volume progression, enhanced PR tracking, fatigue analysis, and advanced data exports."
          >
            <div className="space-y-8">
              
              {/* Key Metrics Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Analytics Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Key insights from your training data over the last 12 weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Volume Trend</p>
                          <p className="text-lg font-bold text-blue-900">+12.5%</p>
                          <p className="text-xs text-blue-600">vs last period</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">PR Improvements</p>
                          <p className="text-lg font-bold text-green-900">3</p>
                          <p className="text-xs text-green-600">this month</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Recovery Score</p>
                          <p className="text-lg font-bold text-orange-900">78%</p>
                          <p className="text-xs text-orange-600">average</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Consistency</p>
                          <p className="text-lg font-bold text-purple-900">85%</p>
                          <p className="text-xs text-purple-600">workout adherence</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Volume Progression Chart */}
              <VolumeProgressionChart 
                userId={profile.id}
                weightUnit={profile.weight_unit}
                className="bg-white shadow-sm border border-gray-200"
              />

              {/* Enhanced PR Tracker */}
              <EnhancedPRTracker 
                userId={profile.id}
                weightUnit={profile.weight_unit}
                className="bg-white shadow-sm border border-gray-200"
              />

              {/* Fatigue Analysis */}
              <FatigueAnalysisChart 
                userId={profile.id}
                weightUnit={profile.weight_unit}
                className="bg-white shadow-sm border border-gray-200"
              />

              {/* Additional Insights Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Training Insights</CardTitle>
                  <CardDescription>
                    AI-powered recommendations based on your training patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Volume Optimization</h4>
                      <p className="text-sm text-blue-800">
                        Your chest training volume has increased 15% over the last month. Consider maintaining this level for 2-3 more weeks before further increases.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Strength Progress</h4>
                      <p className="text-sm text-green-800">
                        Your squat 1RM has improved by 8% this quarter. Focus on maintaining this progression with consistent technique.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Recovery Pattern</h4>
                      <p className="text-sm text-orange-800">
                        Your legs show higher fatigue levels. Consider reducing leg volume by 10-15% next week or adding an extra rest day.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </ProFeatureGate>

        </div>
      </div>
    </DashboardLayout>
  )
}