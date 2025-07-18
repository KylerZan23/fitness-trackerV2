'use client'

import { useState, useEffect } from 'react'
import { getCommunityGroups, joinCommunityGroup, leaveCommunityGroup, checkGroupMembership } from '@/app/_actions/communityActions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, Plus, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<Record<string, { isMember: boolean; role: string | null }>>({})
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        setError(null)
        
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
        } else {
          setError(result.error || 'Failed to load communities')
        }
      } catch (err) {
        console.error('Error fetching communities:', err)
        setError('Unable to load communities. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId))
    try {
      const result = await joinCommunityGroup(groupId)
      if (result.success) {
        setMembershipStatus(prev => ({
          ...prev,
          [groupId]: { isMember: true, role: 'member' }
        }))
      } else {
        console.error('Failed to join group:', result.error)
        // Could add toast notification here
      }
    } catch (err) {
      console.error('Error joining group:', err)
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    setJoiningGroups(prev => new Set(prev).add(groupId))
    try {
      const result = await leaveCommunityGroup(groupId)
      if (result.success) {
        setMembershipStatus(prev => ({
          ...prev,
          [groupId]: { isMember: false, role: null }
        }))
      } else {
        console.error('Failed to leave group:', result.error)
        // Could add toast notification here
      }
    } catch (err) {
      console.error('Error leaving group:', err)
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    // Re-fetch data
    const fetchGroups = async () => {
      try {
        const result = await getCommunityGroups()
        if (result.success) {
          const typedData = result.data as unknown as CommunityGroupWithMemberCount[];
          setGroups(typedData)
          
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
        } else {
          setError(result.error || 'Failed to load communities')
        }
      } catch (err) {
        console.error('Error fetching communities:', err)
        setError('Unable to load communities. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
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
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="flex space-x-2">
                  <div className="h-9 bg-gray-200 rounded flex-1"></div>
                  <div className="h-9 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading communities...
        </div>
      </div>
    )
  }

  if (error) {
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

        {/* Error state */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Unable to load communities</h3>
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