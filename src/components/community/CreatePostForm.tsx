'use client'

import { useState } from 'react'
import { createPost } from '@/app/_actions/communityActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Send } from 'lucide-react'

interface CreatePostFormProps {
  groupId?: string
  groupName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreatePostForm({ groupId, groupName, onSuccess, onCancel }: CreatePostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPost(formData)
      
      if (result.success) {
        // Reset form
        const form = document.getElementById('create-post-form') as HTMLFormElement
        if (form) {
          form.reset()
        }
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to create post')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error creating post:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="w-5 h-5" />
          <span>
            {groupId ? `Post to ${groupName || 'Group'}` : 'Create a Post'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="create-post-form" action={handleSubmit} className="space-y-4">
          {groupId && (
            <input type="hidden" name="groupId" value={groupId} />
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter a title for your post..."
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Share your thoughts, questions, or achievements..."
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 