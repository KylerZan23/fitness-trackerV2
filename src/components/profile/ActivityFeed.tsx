/**
 * Activity Feed Component
 * ------------------------------------------------
 * Timeline of user activities with different types and timestamps
 */

import { useState } from 'react'
import { Activity, Trophy, Users, MessageCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'workout_completed' | 'pr_achieved' | 'user_followed' | 'post_created'
  data: {
    title: string
    subtitle?: string
    progress?: string
    badge?: string
  }
  created_at: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  defaultExpanded?: boolean
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'workout_completed':
      return { icon: Activity, color: 'text-green-600', bg: 'bg-green-100' }
    case 'pr_achieved':
      return { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' }
    case 'user_followed':
      return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' }
    case 'post_created':
      return { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100' }
    default:
      return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' }
  }
}

function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Recently'
  }
}

export function ActivityFeed({ activities, defaultExpanded = true }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const displayActivities = activities

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  if (displayActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
          </div>
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Hide</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Show</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        {isExpanded && (
          <div className="text-center py-8 text-gray-500 transition-all duration-200">
            No recent activity to display
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Activity className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">
            ({displayActivities.length} {displayActivities.length === 1 ? 'item' : 'items'})
          </span>
        </div>
        
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Hide</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-3">
          {displayActivities.map((activity) => {
            const { icon: IconComponent, color, bg } = getActivityIcon(activity.type)
            const timeAgo = formatTimeAgo(activity.created_at)

            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                {/* Activity Icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${bg}`}>
                  <IconComponent className={`w-4 h-4 ${color}`} />
                </div>

                {/* Activity Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {activity.data.title}
                        </h4>
                        {activity.data.badge && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {activity.data.badge}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo}</span>
                        </div>
                        {activity.data.subtitle && (
                          <>
                            <span>•</span>
                            <span>{activity.data.subtitle}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {activity.data.progress && (
                      <div className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {activity.data.progress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 