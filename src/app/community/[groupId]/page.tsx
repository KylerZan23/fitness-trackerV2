'use client'

import { useState, useEffect } from 'react'
import { getGroupDetailsAndPosts } from '@/app/_actions/communityActions'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreatePostForm, PostCard } from '@/components/community'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Define types for clarity
type Post = {
  id: string
  title: string
  content: string
  created_at: string
  user: { name: string; profile_picture_url: string | null }
}

type GroupDetails = {
  id: string
  name: string
  description: string | null
  posts: Post[]
}

export default function CommunityGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; profile_picture_url?: string } | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)

  useEffect(() => {
    // Handle async params
    const getParams = async () => {
      const { groupId: id } = await params
      setGroupId(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    // Fetch user profile for sidebar
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, profile_picture_url')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile({
            name: profile.name || 'User',
            email: profile.email || '',
            profile_picture_url: profile.profile_picture_url || null
          })
        }
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (!groupId) return
    
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await getGroupDetailsAndPosts(groupId)
        if (result.success && result.data) {
          // Transform the data to match our expected structure
          setGroup({
            id: result.data.id,
            name: result.data.name,
            description: result.data.description,
            posts: (result.data.posts || []).map(post => ({
              ...post,
              user: Array.isArray(post.user) ? post.user[0] : post.user
            }))
          })
        } else {
          setError(result.error || 'Failed to load community details')
        }
      } catch (err) {
        console.error('Error fetching group details:', err)
        setError('Unable to load community details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [groupId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleRetry = () => {
    if (!groupId) return
    
    const fetchGroup = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await getGroupDetailsAndPosts(groupId)
        if (result.success && result.data) {
          setGroup({
            id: result.data.id,
            name: result.data.name,
            description: result.data.description,
            posts: (result.data.posts || []).map(post => ({
              ...post,
              user: Array.isArray(post.user) ? post.user[0] : post.user
            }))
          })
        } else {
          setError(result.error || 'Failed to load community details')
        }
      } catch (err) {
        console.error('Error fetching group details:', err)
        setError('Unable to load community details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }

  const sidebarProps = {
    userName: userProfile?.name || 'User',
    userEmail: userProfile?.email || '',
    profilePictureUrl: userProfile?.profile_picture_url || null,
    onLogout: handleLogout
  }

  if (loading) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="max-w-4xl mx-auto">
          {/* Back link skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          
          {/* Group header skeleton */}
          <Card className="mb-6 animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>

          {/* New post section skeleton */}
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <Card className="mb-8 animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>

          {/* Posts section skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mt-4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-center mt-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading community details...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="max-w-4xl mx-auto">
          <Link href="/community?tab=communities" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Communities
          </Link>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Unable to load community</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!group) {
    return (
      <DashboardLayout sidebarProps={sidebarProps}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
            <p className="text-gray-600 mb-6">The community you're looking for doesn't exist or has been removed.</p>
            <Link href="/community?tab=communities">
              <Button>Back to Communities</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto">
        <Link href="/community?tab=communities" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Communities
        </Link>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
        </Card>

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
            group.posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 