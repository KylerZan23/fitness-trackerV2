import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { CommentsSection } from './CommentsSection'
import { ProBadge } from '@/components/ui/ProBadge'

type Post = {
  id: string
  title: string
  content: string
  created_at: string
  user: { id: string; name: string; profile_picture_url: string | null }
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <UserAvatar name={post.user.name} profilePictureUrl={post.user.profile_picture_url} />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold">{post.user.name}</p>
              <ProBadge userId={post.user.id} variant="compact" />
            </div>
            <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
        </div>
        <CardTitle className="pt-4">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        <CommentsSection postId={post.id} />
      </CardContent>
    </Card>
  )
} 