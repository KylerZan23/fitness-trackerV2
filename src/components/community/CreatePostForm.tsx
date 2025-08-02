'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createPost } from '@/app/_actions/communityActions'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { useReadOnlyMode, useReadOnlyGuard } from '@/contexts/ReadOnlyModeContext'

interface CreatePostFormProps {
  groupId: string
}

export function CreatePostForm({ groupId }: CreatePostFormProps) {
  const { isReadOnlyMode } = useReadOnlyMode()
  const checkReadOnlyGuard = useReadOnlyGuard()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string[]
    content?: string[]
    groupId?: string[]
  }>({})
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is in read-only mode
    if (!checkReadOnlyGuard('create posts')) {
      return
    }
    
    // Clear previous errors
    setError('')
    setFieldErrors({})
    
    // Client-side validation
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters long')
      return
    }
    
    if (!content.trim()) {
      setError('Please enter some content')
      return
    }
    
    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', content.trim())
      formData.append('groupId', groupId)

      const result = await createPost(formData)

      if (result.success) {
        setTitle('')
        setContent('')
        router.refresh() // Refresh the page to show the new post
      } else {
        // Handle detailed validation errors
        if (result.errors) {
          setFieldErrors(result.errors)
          setError('Please fix the errors below')
        } else {
          setError(result.error || 'Failed to create post')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <Input
          type="text"
          placeholder={isReadOnlyMode ? "Upgrade to premium to create posts..." : "What's on your mind? Give your post a title..."}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`text-base ${fieldErrors.title ? 'border-red-500' : ''}`}
          maxLength={100}
          disabled={isSubmitting || isReadOnlyMode}
        />
        {fieldErrors.title && (
          <div className="mt-1 text-sm text-red-600">
            {fieldErrors.title.join(', ')}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {title.length}/100 characters (minimum 3)
        </div>
      </div>
      
      <div>
        <Textarea
          placeholder={isReadOnlyMode ? "Upgrade to premium to create posts..." : "Share your thoughts, ask a question, or start a discussion..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className={`text-base resize-none ${fieldErrors.content ? 'border-red-500' : ''}`}
          maxLength={2000}
          disabled={isSubmitting || isReadOnlyMode}
        />
        {fieldErrors.content && (
          <div className="mt-1 text-sm text-red-600">
            {fieldErrors.content.join(', ')}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {content.length}/2000 characters (minimum 10)
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || title.trim().length < 3 || content.trim().length < 10 || isReadOnlyMode}
          className="flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>
            {isReadOnlyMode ? 'Upgrade Required' : (isSubmitting ? 'Posting...' : 'Post')}
          </span>
        </Button>
      </div>
    </form>
  )
} 