'use client'

import { useState } from 'react'
import { createPost } from '@/app/_actions/communityActions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CreatePostFormProps {
  groupId?: string
}

export function CreatePostForm({ groupId }: CreatePostFormProps) {
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
    <Card>
      <CardContent className="pt-6">
        <form id="create-post-form" action={handleSubmit} className="space-y-4">
          <Input name="title" placeholder="Post Title" required />
          <Textarea name="content" placeholder="What's on your mind?" required />
          {groupId && <input type="hidden" name="groupId" value={groupId} />}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
} 