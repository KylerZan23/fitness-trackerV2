'use client'

import { useState, useEffect } from 'react'
import { Users, MessageSquare, Crown, Plus, Shield, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  canViewExpertQA, 
  createExpertQAPost, 
  getExpertQAPosts,
  type ExpertQAPost 
} from '@/app/_actions/communityActions'
import { PostCard } from './PostCard'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { formatDistanceToNow } from 'date-fns'

interface ExpertQAManagerProps {
  groupId?: string
}

export function ExpertQAManager({ groupId }: ExpertQAManagerProps) {
  const [canView, setCanView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<ExpertQAPost[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const result = await canViewExpertQA()
      setCanView(result.canView)
      
      if (result.canView) {
        loadExpertQAPosts()
      }
    } catch (error) {
      console.error('Error checking Expert Q&A access:', error)
      setError('Failed to verify access permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadExpertQAPosts = async () => {
    try {
      const result = await getExpertQAPosts(1, 20, groupId)
      if (result.success && result.data) {
        setPosts(result.data)
      } else {
        setError(result.error || 'Failed to load Expert Q&A posts')
      }
    } catch (error) {
      console.error('Error loading Expert Q&A posts:', error)
      setError('Failed to load posts')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Q&A - Pro Feature</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get exclusive access to expert insights and advanced discussions. 
          Upgrade to Pro to unlock Expert Q&A content.
        </p>
        <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <span>Expert Q&A</span>
                <Crown className="w-5 h-5 text-amber-600" />
              </h2>
              <p className="text-amber-700">
                Exclusive content for Pro members - Expert insights and advanced discussions
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ask Expert
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <ExpertQACreateForm 
          groupId={groupId}
          onSuccess={() => {
            setShowCreateForm(false)
            loadExpertQAPosts()
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <ExpertQAPostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expert Q&A Posts Yet</h3>
            <p className="text-gray-600">
              Be the first to ask a question or share expert insights!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Expert Q&A Create Form Component
interface ExpertQACreateFormProps {
  groupId?: string
  onSuccess: () => void
  onCancel: () => void
}

function ExpertQACreateForm({ groupId, onSuccess, onCancel }: ExpertQACreateFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      if (groupId) {
        formData.append('groupId', groupId)
      }

      const result = await createExpertQAPost(formData)
      
      if (result.success) {
        onSuccess()
        setTitle('')
        setContent('')
      } else {
        setError(result.error || 'Failed to create Expert Q&A post')
      }
    } catch (error) {
      console.error('Error creating Expert Q&A post:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-amber-50">
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Shield className="w-5 h-5" />
          <span>Create Expert Q&A Post</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Question or Topic Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your expert question or insight?"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Detailed Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your detailed question, insight, or expert knowledge..."
              rows={6}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Expert Q&A'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Expert Q&A Post Card Component
interface ExpertQAPostCardProps {
  post: ExpertQAPost
}

function ExpertQAPostCard({ post }: ExpertQAPostCardProps) {
  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50/30 to-yellow-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              name={post.user.name} 
              profilePictureUrl={post.user.profile_picture_url} 
            />
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold">{post.user.name}</p>
                <ProBadge userId={post.user.id} variant="compact" />
              </div>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Shield className="w-3 h-3 mr-1" />
            Expert Q&A
          </Badge>
        </div>
        <CardTitle className="pt-4 text-gray-900">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}