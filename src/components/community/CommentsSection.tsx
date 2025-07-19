'use client'

import { useState, useEffect } from 'react'
import { getPostComments } from '@/app/_actions/communityActions'
import { supabase } from '@/lib/supabase'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { Button } from '@/components/ui/button'
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  user: {
    name: string
    profile_picture_url: string | null
  }
}

interface CommentsSectionProps {
  postId: string
  initialCommentCount?: number
}

export function CommentsSection({ postId, initialCommentCount = 0 }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [commentCount, setCommentCount] = useState(initialCommentCount)

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)
    }
    getCurrentUser()
  }, [])

  const fetchComments = async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await getPostComments(postId)
      
      if (result.success && result.data) {
        // Transform the data to handle Supabase's array structure for joined data
        const transformedComments = result.data.map((item: any) => ({
          ...item,
          user: Array.isArray(item.user) ? item.user[0] : item.user
        })) as Comment[]
        
        setComments(transformedComments)
        setCommentCount(transformedComments.length)
      } else {
        setError(result.error || 'Failed to load comments')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExpanded = () => {
    if (!isExpanded && comments.length === 0) {
      fetchComments()
    }
    setIsExpanded(!isExpanded)
  }

  const handleCommentAdded = () => {
    fetchComments()
  }

  const handleCommentUpdated = () => {
    fetchComments()
  }

  const handleCommentDeleted = () => {
    fetchComments()
  }

  return (
    <div className="space-y-4">
      <Separator />
      
      {/* Comments Header/Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleExpanded}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {commentCount === 0 
              ? 'No comments yet' 
              : `${commentCount} comment${commentCount === 1 ? '' : 's'}`
            }
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expanded Comments Section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Comment Form */}
          <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
          
          {/* Comments List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading comments...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchComments}>
                Try Again
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                                 <CommentItem
                   key={comment.id}
                   comment={comment}
                   currentUserId={currentUserId ?? undefined}
                   onCommentUpdated={handleCommentUpdated}
                   onCommentDeleted={handleCommentDeleted}
                 />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 