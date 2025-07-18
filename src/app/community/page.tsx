'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Users, Trophy, Flame, Library } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommunityFeed, Leaderboard, CommunityGroupList } from '@/components/community'

export default function CommunityPage() {
  const [userProfile, setUserProfile] = useState<{
    name: string
    email: string
    profile_picture_url?: string
  } | null>(null)

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email, profile_picture_url')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    fetchUserProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const sidebarProps = {
    userName: userProfile?.name || 'User',
    userEmail: userProfile?.email || '',
    profilePictureUrl: userProfile?.profile_picture_url || null,
    onLogout: handleLogout
  }

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
          </div>
          <p className="text-gray-600">
            Connect, share, and compete with the community.
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">
              <Flame className="w-4 h-4 mr-2" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Library className="w-4 h-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed" className="mt-6">
            <CommunityFeed />
          </TabsContent>
          
          <TabsContent value="groups" className="mt-6">
            <CommunityGroupList />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 