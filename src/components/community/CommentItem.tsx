'use client'

import { useState } from 'react'
import { updateComment, deleteComment } from '@/app/_actions/communityActions'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Edit2, Trash2, Save, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onCommentUpdated?: () => void
  onCommentDeleted?: () => void
}

export function CommentItem({ 
  comment, 
  currentUserId, 
  onCommentUpdated, 
  onCommentDeleted 
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = currentUserId === comment.user_id
  const isEdited = comment.updated_at !== comment.created_at

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
    setError(null)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('commentId', comment.id)
      formData.append('content', editContent.trim())

      const result = await updateComment(formData)
      
      if (result.success) {
        setIsEditing(false)
        onCommentUpdated?.()
      } else {
        setError(result.error || 'Failed to update comment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error updating comment:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteComment(comment.id)
      
      if (result.success) {
        onCommentDeleted?.()
      } else {
        setError(result.error || 'Failed to delete comment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error deleting comment:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex-shrink-0">
        <UserAvatar
          name={comment.user.name}
          profilePictureUrl={comment.user.profile_picture_url}
          size={8}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {comment.user.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            {isEdited && ' (edited)'}
          </span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit} disabled={isEditing}>
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="resize-none text-sm"
              rows={3}
              maxLength={1000}
              disabled={isUpdating}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {editContent.length}/1000 characters
              </span>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
        
        {error && (
          <p className="text-red-500 text-xs mt-2">{error}</p>
        )}
      </div>
    </div>
  )
} 