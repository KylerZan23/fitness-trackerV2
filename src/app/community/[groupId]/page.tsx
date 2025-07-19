import { getGroupDetailsAndPosts } from '@/app/_actions/communityActions'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GroupClientComponents } from './GroupClientComponents'

// Define types directly in the file for clarity
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

// The page is now an async Server Component
export default async function CommunityGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const result = await getGroupDetailsAndPosts(groupId)

  if (!result.success || !result.data) {
    notFound() // Use Next.js notFound for cleaner 404 handling
  }

  const group = {
    ...result.data,
    // Fix the potential array-in-object issue directly here
    posts: (result.data.posts || []).map(post => ({
        ...post,
        // The user object from Supabase can sometimes be an array with one element
        user: Array.isArray(post.user) ? post.user[0] : post.user
    }))
  } as GroupDetails

  return (
    <DashboardLayout sidebarProps={{
      // Note: Sidebar props would need to be fetched here too,
      // ideally within the layout itself if possible.
      // For simplicity, this is simplified but would need proper user data
      userName: 'User',
      userEmail: '',
      profilePictureUrl: null,
      onLogout: async () => { 
        'use server'
        // Server action for logout would be implemented here
      }
    }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/community" className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Communities
        </Link>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Pass server-fetched data to a client component for interaction */}
        <GroupClientComponents group={group} />
      </div>
    </DashboardLayout>
  )
} 