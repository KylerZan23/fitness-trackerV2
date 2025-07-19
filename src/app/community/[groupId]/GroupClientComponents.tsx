'use client'

import { CreatePostForm, PostCard } from '@/components/community'
import { Card, CardContent } from '@/components/ui/card'

// Define types for the group data
type Post = {
  id: string
  title: string
  content: string
  created_at: string
  user: { name: string; profile_picture_url: string | null } | null
}

type GroupDetails = {
  id: string
  name: string
  description: string | null
  posts: Post[]
}

interface GroupClientComponentsProps {
  group: GroupDetails
}

export function GroupClientComponents({ group }: GroupClientComponentsProps) {
  // Any client-side state or logic would live here
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">New Post</h2>
      <CreatePostForm groupId={group.id} />

      <h2 className="text-2xl font-bold mt-8 mb-4">Recent Posts</h2>
      <div className="space-y-4">
        {group.posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500 text-center">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        ) : (
          group.posts
            .filter(post => post.user !== null)
            .map(post => (
              <PostCard key={post.id} post={post as Post & { user: { name: string; profile_picture_url: string | null } }} />
            ))
        )}
      </div>
    </>
  )
} 