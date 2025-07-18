import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatDistanceToNow } from 'date-fns'

type Post = {
  id: string
  title: string
  content: string
  created_at: string
  user: { name: string; profile_picture_url: string | null }
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
            <p className="font-semibold">{post.user.name}</p>
            <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
        </div>
        <CardTitle className="pt-4">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  )
} 