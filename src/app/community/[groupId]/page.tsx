import { getGroupDetailsAndPosts } from '@/app/_actions/communityActions'
import { createClient } from '@/utils/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CreatePostForm } from '@/components/community/CreatePostForm'
import { VoteButtons } from '@/components/community/VoteButtons'

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

export default async function CommunityGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  
  // Get current user for sidebar
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile for sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, profile_picture_url')
    .eq('id', user.id)
    .single()

  // Get group details and posts
  const result = await getGroupDetailsAndPosts(groupId)

  if (!result.success || !result.data) {
    notFound()
  }

  const group = {
    ...result.data,
    posts: (result.data.posts || []).map(post => ({
      ...post,
      user: Array.isArray(post.user) ? post.user[0] : post.user
    }))
  } as GroupDetails

  // Get group type for welcome banner customization
  const { data: groupData } = await supabase
    .from('community_groups')
    .select('group_type')
    .eq('id', groupId)
    .single()

  const groupType = groupData?.group_type || 'General'

  // Customize welcome banner based on group type
  const getWelcomeBanner = (type: string, name: string) => {
    switch (type) {
      case 'Bodybuilding':
        return {
          title: `Welcome to ${name}! 💪`,
          subtitle: 'Build muscle, share progress, and connect with fellow bodybuilders',
          gradient: 'from-red-500 to-orange-500'
        }
      case 'Powerlifting':
        return {
          title: `Welcome to ${name}! 🏋️`,
          subtitle: 'Share your lifts, discuss technique, and chase those PRs together',
          gradient: 'from-blue-500 to-purple-500'
        }
      case 'CrossFit':
        return {
          title: `Welcome to ${name}! 🔥`,
          subtitle: 'Share WODs, celebrate achievements, and push your limits',
          gradient: 'from-green-500 to-teal-500'
        }
      case 'Running':
        return {
          title: `Welcome to ${name}! 🏃‍♂️`,
          subtitle: 'Track your runs, share routes, and motivate each other',
          gradient: 'from-cyan-500 to-blue-500'
        }
      case 'Yoga':
        return {
          title: `Welcome to ${name}! 🧘‍♀️`,
          subtitle: 'Find your zen, share poses, and grow together',
          gradient: 'from-purple-500 to-pink-500'
        }
      default:
        return {
          title: `Welcome to ${name}! 🌟`,
          subtitle: 'Connect, share, and achieve your fitness goals together',
          gradient: 'from-gray-500 to-gray-700'
        }
    }
  }

  const banner = getWelcomeBanner(groupType, group.name)

  return (
    <DashboardLayout sidebarProps={{
      userName: profile?.name || 'User',
      userEmail: profile?.email || '',
      profilePictureUrl: profile?.profile_picture_url || null,
      onLogout: async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
      }
    }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Navigation */}
        <Link href="/community" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Communities
        </Link>

        {/* Welcome Banner */}
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${banner.gradient} p-8 mb-8 text-white`}>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">{banner.title}</h1>
            <p className="text-xl opacity-90 mb-4">{banner.subtitle}</p>
            {group.description && (
              <p className="text-lg opacity-80">{group.description}</p>
            )}
            <div className="flex items-center mt-6 space-x-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span className="text-sm">Community</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                <span className="text-sm">{group.posts.length} posts</span>
              </div>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
            <div className="w-full h-full bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
          </div>
        </div>

        {/* Create Post Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Share with the community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePostForm groupId={groupId} />
          </CardContent>
        </Card>

        {/* Posts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
          
          {group.posts.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
            </Card>
          ) : (
            group.posts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {post.user?.profile_picture_url ? (
                        <img
                          src={post.user.profile_picture_url}
                          alt={post.user.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {(post.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-2">{post.title}</h3>
                        <span className="text-sm text-gray-500">
                          by {post.user?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <VoteButtons postId={post.id} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 