'use client'

import { Clock, Target, TrendingUp, Dumbbell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FollowedUserActivity } from '@/app/_actions/communityActions'

interface WorkoutActivityCardProps {
  activity: FollowedUserActivity
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k lbs`
  }
  return `${volume.toLocaleString()} lbs`
}

function getWorkoutIcon(workoutName: string) {
  const name = workoutName.toLowerCase()
  
  if (name.includes('push') || name.includes('chest') || name.includes('bench')) {
    return { icon: Dumbbell, color: 'text-blue-600', bg: 'bg-blue-100' }
  }
  
  if (name.includes('pull') || name.includes('back') || name.includes('row')) {
    return { icon: Target, color: 'text-green-600', bg: 'bg-green-100' }
  }
  
  if (name.includes('leg') || name.includes('squat') || name.includes('deadlift')) {
    return { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' }
  }
  
  // Default for mixed/other workouts
  return { icon: Dumbbell, color: 'text-orange-600', bg: 'bg-orange-100' }
}

export function WorkoutActivityCard({ activity }: WorkoutActivityCardProps) {
  const { icon: IconComponent, color, bg } = getWorkoutIcon(activity.workout.name)
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow bg-white border border-gray-200">
      <CardContent className="p-6">
        {/* Header with user info */}
        <div className="flex items-center space-x-3 mb-4">
                     <UserAvatar 
             name={activity.user.name}
             email=""
             size={10}
             profilePictureUrl={activity.user.profile_picture_url}
           />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{activity.user.name}</h3>
              <span className="text-sm text-gray-500">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Workout info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className={`p-3 rounded-xl ${bg}`}>
            <IconComponent className={`w-6 h-6 ${color}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">{activity.workout.name}</h2>
              {activity.workout.prCount > 0 && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {activity.workout.prCount} PRs
                </Badge>
              )}
            </div>
            <p className="text-gray-600">Strength Training</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Duration */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(activity.workout.duration)}
            </div>
            <div className="text-sm text-blue-600 font-medium">Duration</div>
          </div>

          {/* Sets */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {activity.workout.sets}
            </div>
            <div className="text-sm text-purple-600 font-medium">Sets</div>
          </div>

          {/* Volume */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatVolume(activity.workout.volume)}
            </div>
            <div className="text-sm text-green-600 font-medium">Volume</div>
          </div>
        </div>

        {/* Exercises section */}
        {activity.workout.exercises > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Exercises</span>
            </div>
            <div className="mt-1">
              <span className="text-sm text-gray-600">
                {activity.workout.exercises} exercise{activity.workout.exercises !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 