'use client'

import { useEffect, useState } from 'react'
import { Users, Activity } from 'lucide-react'
import { WorkoutActivityCard } from './WorkoutActivityCard'
import { getFollowedUsersActivities, type FollowedUserActivity } from '@/app/_actions/communityActions'

function useActivitiesFeed() {
  const [activities, setActivities] = useState<FollowedUserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setError(null)
        const result = await getFollowedUsersActivities(20)
        
        if (result.success && result.data) {
          setActivities(result.data)
        } else {
          setError(result.error || 'Failed to fetch activities')
          setActivities([])
        }
      } catch (error) {
        console.error('Error in fetchActivities:', error)
        setError('Unexpected error occurred')
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return { activities, loading, error }
}

function ActivitiesFeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="w-5 h-5 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyActivitiesState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Activity className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Yet</h3>
      <div className="text-gray-600 max-w-md mx-auto space-y-2">
        <p>Start following other users to see their workout activities here!</p>
        <p className="text-sm">Go to the Communities tab or search for users to follow.</p>
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load activities</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

export function ActivitiesFeed() {
  const { activities, loading, error } = useActivitiesFeed()

  if (loading) {
    return <ActivitiesFeedSkeleton />
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        onRetry={() => window.location.reload()} 
      />
    )
  }

  if (activities.length === 0) {
    return <EmptyActivitiesState />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Activities
        </h2>
        <span className="text-sm text-gray-500">
          {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <WorkoutActivityCard 
            key={activity.id} 
            activity={activity} 
          />
        ))}
      </div>
    </div>
  )
} 