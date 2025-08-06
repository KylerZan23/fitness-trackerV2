'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/utils/supabase/client'
  const supabase = await createClient()
import { Users, Trophy, Library, Crown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivitiesFeed, Leaderboard, CommunityGroupList, UserSearchBar } from '@/components/community'
import { ExpertQAManager } from '@/components/community/ExpertQAManager'

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feed">
              <Trophy className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Library className="w-4 h-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="expert-qa">
              <Crown className="w-4 h-4 mr-2" />
              Expert Q&A
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          {/* Search Bar */}
          <div className="mt-6 mb-6">
            <UserSearchBar placeholder="Search for people to follow..." />
          </div>
          
          <TabsContent value="feed" className="mt-6">
            <ActivitiesFeed />
          </TabsContent>
          
          <TabsContent value="groups" className="mt-6">
            <CommunityGroupList />
          </TabsContent>
          
          <TabsContent value="expert-qa" className="mt-6">
            <ExpertQAManager />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 