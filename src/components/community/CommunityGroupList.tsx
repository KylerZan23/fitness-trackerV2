'use client'

import { useState, useEffect } from 'react'
import { getCommunityGroups, joinCommunityGroup, leaveCommunityGroup, checkGroupMembership } from '@/app/_actions/communityActions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Plus, MessageCircle, Calendar, MapPin, Loader2 } from 'lucide-react'

// Define the type based on the server action's return
type CommunityGroupWithMemberCount = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  created_at: string;
  members: { count: number }[];
  created_by_user: {
    name: string;
    profile_picture_url: string | null;
  } | null;
};

export function CommunityGroupList() {
  const [groups, setGroups] = useState<CommunityGroupWithMemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [membershipStatus, setMembershipStatus] = useState<Record<string, { isMember: boolean; role: string | null }>>({})
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchGroups = async () => {
      const result = await getCommunityGroups()
      if (result.success) {
        const typedData = result.data as unknown as CommunityGroupWithMemberCount[];
        setGroups(typedData)
        
        // Check membership status for each group
        const membershipChecks = await Promise.all(
          typedData.map(async (group) => {
            const membership = await checkGroupMembership(group.id)
            return { groupId: group.id, membership }
          })
        )
        
        const membershipMap: Record<string, { isMember: boolean; role: string | null }> = {}
        membershipChecks.forEach(({ groupId, membership }) => {
          membershipMap[groupId] = {
            isMember: membership.success ? membership.isMember : false,
            role: membership.success ? membership.role : null
          }
        })
        setMembershipStatus(membershipMap)
      }
      setLoading(false)
    }
    fetchGroups()
  }, [])

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId))
    const result = await joinCommunityGroup(groupId)
    if (result.success) {
      setMembershipStatus(prev => ({
        ...prev,
        [groupId]: { isMember: true, role: 'member' }
      }))
    } else {
      // You might want to show an error toast here
      console.error('Failed to join group:', result.error)
    }
    setJoiningGroups(prev => {
      const newSet = new Set(prev)
      newSet.delete(groupId)
      return newSet
    })
  }

  const handleLeaveGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId))
    const result = await leaveCommunityGroup(groupId)
    if (result.success) {
      setMembershipStatus(prev => ({
        ...prev,
        [groupId]: { isMember: false, role: null }
      }))
    } else {
      // You might want to show an error toast here
      console.error('Failed to leave group:', result.error)
    }
    setJoiningGroups(prev => {
      const newSet = new Set(prev)
      newSet.delete(groupId)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading communities...</p>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Be the first to create a community! Start a group for your favorite fitness activity.
          </p>
          <Button asChild>
            <Link href="/community/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Communities</h2>
          </div>
          <p className="text-gray-600">
            Join fitness communities and connect with like-minded people
          </p>
        </div>
        <Button asChild>
          <Link href="/community/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Link>
        </Button>
      </div>

      {/* Community Groups Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => {
          const isMember = membershipStatus[group.id]?.isMember || false
          const isJoining = joiningGroups.has(group.id)
          const memberCount = group.members[0]?.count || 0

          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Badge variant={isMember ? "default" : "outline"}>
                    {isMember ? "Member" : "Join"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {group.description || 'No description available.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{memberCount} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Type: {group.group_type}</span>
                  {group.created_by_user && (
                    <span>• Created by {group.created_by_user.name}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Link href={`/community/${group.id}`}>
                      View Group
                    </Link>
                  </Button>
                  
                  <Button
                    variant={isMember ? "destructive" : "default"}
                    size="sm"
                    onClick={() => isMember ? handleLeaveGroup(group.id) : handleJoinGroup(group.id)}
                    disabled={isJoining}
                    className="flex-1"
                  >
                    {isJoining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isMember ? (
                      "Leave"
                    ) : (
                      "Join"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Coming Soon Message */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            More Community Features Coming Soon
          </h3>
          <p className="text-gray-600 mb-4">
            We're building comprehensive community features including group chats, 
            event organization, and local meetups.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Group Chats</Badge>
            <Badge variant="outline">Event Organization</Badge>
            <Badge variant="outline">Local Meetups</Badge>
            <Badge variant="outline">Resource Sharing</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 