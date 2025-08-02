'use client'

import { useState, useEffect } from 'react'
import { Clock, Target, TrendingUp, Dumbbell, ChevronDown, ChevronUp, Trophy, Heart, MessageCircle, Send, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProBadge } from '@/components/ui/ProBadge'
import type { FollowedUserActivity, ExerciseDetail } from '@/app/_actions/communityActions'
import { 
  toggleActivityLike, 
  addActivityComment, 
  getActivityComments,
  type ActivityComment 
} from '@/app/_actions/activitySocialActions'

interface WorkoutActivityCardProps {
  activity: FollowedUserActivity
}

// Use ActivityComment from the actions file instead of local Comment interface

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

function ExerciseDetailItem({ exercise }: { exercise: ExerciseDetail }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">{exercise.exercise_name}</h4>
          {exercise.isPR && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-600 uppercase">PR</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
          <span>{exercise.sets} sets</span>
          <span>{exercise.reps} reps</span>
          <span>{exercise.weight} lbs</span>
          {exercise.duration > 0 && <span>{exercise.duration}m</span>}
        </div>
      </div>
    </div>
  )
}

function PRBanner({ prExercises }: { prExercises: string[] }) {
  if (prExercises.length === 0) return null
  
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <div>
          <h4 className="font-semibold text-yellow-800">Personal Record!</h4>
          <p className="text-sm text-yellow-700">
            New PR in {prExercises.length === 1 ? prExercises[0] : `${prExercises.length} exercises`}
          </p>
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment }: { comment: ActivityComment }) {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
  
  return (
    <div className="flex space-x-3 py-3">
      <UserAvatar 
        name={comment.user.name}
        email=""
        size={8}
        profilePictureUrl={comment.user.profile_picture_url}
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">{comment.user.name}</span>
          <ProBadge userId={comment.user.id} variant="compact" />
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <p className="text-sm text-gray-700">{comment.content}</p>
      </div>
    </div>
  )
}

function CommentSection({ 
  activityId, 
  comments, 
  onCommentAdded 
}: { 
  activityId: string
  comments: ActivityComment[]
  onCommentAdded: (comment: ActivityComment) => void 
}) {
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const result = await addActivityComment(activityId, commentText.trim())
      
      if (result.success && result.comment) {
        onCommentAdded(result.comment)
        setCommentText('')
      } else {
        console.error('Failed to add comment:', result.error)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex space-x-3">
          <UserAvatar 
            name="Current User"
            email=""
            size={8}
            profilePictureUrl={undefined}
          />
          <div className="flex-1">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {commentText.length}/500 characters
              </span>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentText('')}
                  disabled={!commentText.trim()}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}

function SocialButtons({ 
  activity, 
  onCommentToggle,
  showComments 
}: { 
  activity: FollowedUserActivity
  onCommentToggle: () => void
  showComments: boolean
}) {
  const [liked, setLiked] = useState(activity.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(activity.likes_count || 0)
  
  const handleLike = async () => {
    try {
      const result = await toggleActivityLike(activity.id)
      
      if (result.success) {
        setLiked(result.liked)
        setLikeCount(result.likes_count)
      } else {
        console.error('Failed to toggle like:', result.error)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }
  
  return (
    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
        <span className="text-sm">{likeCount}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onCommentToggle}
        className={`flex items-center space-x-2 ${showComments ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm">{activity.comments_count || 0}</span>
      </Button>
    </div>
  )
}

export function WorkoutActivityCard({ activity }: WorkoutActivityCardProps) {
  const [showExercises, setShowExercises] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<ActivityComment[]>([])
  const [commentCount, setCommentCount] = useState(activity.comments_count || 0)
  
  const { icon: IconComponent, color, bg } = getWorkoutIcon(activity.workout.name)
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
  const hasExerciseDetails = activity.workout.exerciseDetails && activity.workout.exerciseDetails.length > 0
  const hasPRs = activity.workout.prExercises && activity.workout.prExercises.length > 0

  // Load comments when opening the section
  const loadComments = async () => {
    try {
      const result = await getActivityComments(activity.id)
      if (result.success && result.comments) {
        setComments(result.comments)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleCommentToggle = async () => {
    const newShowComments = !showComments
    setShowComments(newShowComments)
    
    // Load comments when opening the section
    if (newShowComments && comments.length === 0) {
      await loadComments()
    }
  }

  // Load comments on mount if there are existing comments
  useEffect(() => {
    if (commentCount > 0 && comments.length === 0) {
      loadComments()
    }
  }, [commentCount])
  
  const handleCommentAdded = (newComment: ActivityComment) => {
    setComments(prev => [newComment, ...prev])
    setCommentCount(prev => prev + 1)
    // Update the activity's comment count
    activity.comments_count = commentCount + 1
  }

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
              <ProBadge userId={activity.user.id} variant="compact" />
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

        {/* PR Banner - positioned between workout info and stats */}
        {hasPRs && <PRBanner prExercises={activity.workout.prExercises!} />}

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

        {/* Exercises section with dropdown */}
        {activity.workout.exercises > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setShowExercises(!showExercises)}
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
              disabled={!hasExerciseDetails}
            >
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Exercises</span>
                <span className="text-sm text-gray-600">
                  {activity.workout.exercises} exercise{activity.workout.exercises !== 1 ? 's' : ''}
                </span>
              </div>
              {hasExerciseDetails && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400">
                    {showExercises ? 'Hide' : 'Show'} details
                  </span>
                  {showExercises ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </Button>

            {/* Exercise details dropdown */}
            {showExercises && hasExerciseDetails && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {activity.workout.exerciseDetails!.map((exercise) => (
                  <ExerciseDetailItem key={exercise.id} exercise={exercise} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social buttons */}
        <SocialButtons 
          activity={{...activity, comments_count: commentCount}} 
          onCommentToggle={handleCommentToggle}
          showComments={showComments}
        />

        {/* Comments section - show when opened OR when there are existing comments */}
        {showComments && (
          <CommentSection
            activityId={activity.id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
          />
        )}
        
        {/* Comments toggle for existing comments when section is closed */}
        {!showComments && commentCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleCommentToggle}
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  View {commentCount} comment{commentCount !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 