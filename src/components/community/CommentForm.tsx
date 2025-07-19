'use client'

import { useState } from 'react'
import { createComment } from '@/app/_actions/communityActions'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send } from 'lucide-react'

interface CommentFormProps {
  postId: string
  onCommentAdded?: () => void
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('postId', postId)
      formData.append('content', content.trim())

      const result = await createComment(formData)
      
      if (result.success) {
        setContent('')
        onCommentAdded?.()
      } else {
        setError(result.error || 'Failed to post comment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start space-x-3">
        <MessageSquare className="w-5 h-5 text-gray-400 mt-3" />
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="resize-none"
            rows={3}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {content.length}/1000 characters
            </span>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting || !content.trim()}
              className="flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
            </Button>
          </div>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm ml-8">{error}</p>
      )}
    </form>
  )
} 