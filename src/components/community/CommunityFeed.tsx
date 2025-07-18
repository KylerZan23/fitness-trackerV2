'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Trophy, Flame, Dumbbell, Clock } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface CommunityFeedEvent {
  id: string
  event_type: 'WORKOUT_COMPLETED' | 'NEW_PB' | 'STREAK_MILESTONE' | 'NEW_POST'
  metadata: Record<string, any>
  created_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
    weight_unit?: 'kg' | 'lbs'
  }
}

function useCommunityFeedEvents() {
  const [events, setEvents] = useState<CommunityFeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setError(null)
        const { data, error } = await supabase
          .from('community_feed_events')
          .select(`
            id,
            event_type,
            metadata,
            created_at,
            user_id,
            profiles!inner (
              id,
              name,
              email,
              profile_picture_url,
              weight_unit
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Error fetching community feed events:', error)
          setError(`Database error: ${error.message}`)
          setEvents([])
          return
        }

        // Transform the data to match our interface
        const transformedEvents = (data || []).map((item: any) => ({
          id: item.id,
          event_type: item.event_type,
          metadata: item.metadata,
          created_at: item.created_at,
          user: {
            id: item.profiles.id,
            name: item.profiles.name,
            email: item.profiles.email,
            avatar_url: item.profiles.profile_picture_url,
            weight_unit: item.profiles.weight_unit
          }
        })) as CommunityFeedEvent[]

        setEvents(transformedEvents)
      } catch (error) {
        console.error('Error in fetchEvents:', error)
        setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return { events, loading, error }
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'WORKOUT_COMPLETED':
      return <Dumbbell className="w-5 h-5 text-blue-600" />
    case 'NEW_PB':
      return <Trophy className="w-5 h-5 text-yellow-600" />
    case 'STREAK_MILESTONE':
      return <Flame className="w-5 h-5 text-orange-600" />
    case 'NEW_POST':
      return <Users className="w-5 h-5 text-purple-600" />
    default:
      return <Users className="w-5 h-5 text-gray-600" />
  }
}

function getEventBadgeColor(eventType: string) {
  switch (eventType) {
    case 'WORKOUT_COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'NEW_PB':
      return 'bg-yellow-100 text-yellow-800'
    case 'STREAK_MILESTONE':
      return 'bg-orange-100 text-orange-800'
    case 'NEW_POST':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatEventMessage(event: CommunityFeedEvent): string {
  const { event_type, metadata } = event
  const userName = event.user.name || 'Someone'

  switch (event_type) {
    case 'WORKOUT_COMPLETED':
      const workoutName = metadata.workoutName || 'their workout'
      const exerciseCount = metadata.exerciseCount || 0
      const duration = metadata.duration || 0
      
      return `${userName} just completed ${workoutName}${exerciseCount > 0 ? ` (${exerciseCount} exercises)` : ''}${duration > 0 ? ` in ${duration} minutes` : ''}!`

    case 'NEW_PB':
      const exerciseName = metadata.exerciseName || 'an exercise'
      const weight = metadata.weight || 0
      const reps = metadata.reps || 0
      const unit = event.user.weight_unit || 'kg'
      
      return `${userName} just hit a new ${exerciseName} PR: ${weight} ${unit} for ${reps} reps! 🏆`

    case 'STREAK_MILESTONE':
      const streakDays = metadata.streakDays || 0
      return `${userName} is on a ${streakDays}-day workout streak! 🔥`

    case 'NEW_POST':
      const postTitle = metadata.title || 'something'
      return `${userName} shared a new post: "${postTitle}"`

    default:
      return `${userName} achieved something awesome!`
  }
}

function CommunityFeedItem({ event }: { event: CommunityFeedEvent }) {
  const isNewPB = event.event_type === 'NEW_PB'
  
  return (
    <Card className={`mb-4 hover:shadow-md transition-shadow ${isNewPB ? 'bg-yellow-50 border-yellow-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10">
              <UserAvatar 
                name={event.user.name}
                email={event.user.email}
                size={10}
              />
            </div>
          </div>
          
          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {getEventIcon(event.event_type)}
              <Badge className={getEventBadgeColor(event.event_type)}>
                {event.event_type.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-gray-900 text-sm leading-relaxed">
              {formatEventMessage(event)}
            </p>
            
            {/* Additional metadata display for PBs */}
            {event.event_type === 'NEW_PB' && event.metadata.previousBest && (
              <div className="mt-2 text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                Previous best: {event.metadata.previousBest.weight} {event.user.weight_unit || 'kg'} for {event.metadata.previousBest.reps} reps
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CommunityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CommunityFeed() {
  const { events, loading, error } = useCommunityFeedEvents()

  if (loading) {
    return <CommunityFeedSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load community feed</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No community activity yet</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Complete your first workout or hit a personal best to start sharing your achievements with the community!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event: CommunityFeedEvent) => (
        <CommunityFeedItem key={event.id} event={event} />
      ))}
    </div>
  )
} 