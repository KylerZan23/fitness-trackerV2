'use client'

import { useState, useEffect } from 'react'
import { getGroupPosts, getAllPosts } from '@/app/_actions/communityActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Calendar, Loader2 } from 'lucide-react'
import { CommentsSection } from './CommentsSection'

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  user: {
    name: string
    profile_picture_url: string | null
  } | null
  group?: {
    name: string
  } | null
}

interface PostListProps {
  groupId?: string
  groupName?: string
}

export function PostList({ groupId, groupName }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError(null)
        const result = groupId 
          ? await getGroupPosts(groupId)
          : await getAllPosts()
        
        if (result.success) {
          setPosts(result.data as Post[])
        } else {
          setError(result.error || 'Failed to load posts')
        }
      } catch (err) {
        setError('An unexpected error occurred')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [groupId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load posts</h3>
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

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {groupId ? `No posts in ${groupName || 'this group'} yet` : 'No posts yet'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {groupId 
            ? 'Be the first to share something with the group!'
            : 'Be the first to create a post and start the conversation!'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <UserAvatar
                  name={post.user?.name || 'Anonymous'}
                  email=""
                  size={10}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {post.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                  {post.group && (
                    <Badge variant="outline" className="text-xs">
                      {post.group.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
            <CommentsSection postId={post.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 