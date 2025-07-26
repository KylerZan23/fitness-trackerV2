'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { getFollowers, getFollowing, type FollowerProfile } from '@/app/_actions/followActions'
import { Icon } from '@/components/ui/Icon'

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  initialTab?: 'followers' | 'following'
}

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = 'followers'
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [followers, setFollowers] = useState<FollowerProfile[]>([])
  const [following, setFollowing] = useState<FollowerProfile[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadFollowers()
      loadFollowing()
    }
  }, [isOpen, userId])

  const loadFollowers = async () => {
    setIsLoadingFollowers(true)
    setError(null)
    try {
      const result = await getFollowers(userId)
      if (result.success && result.data) {
        setFollowers(result.data)
      } else {
        setError(result.error || 'Failed to load followers')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoadingFollowers(false)
    }
  }

  const loadFollowing = async () => {
    setIsLoadingFollowing(true)
    setError(null)
    try {
      const result = await getFollowing(userId)
      if (result.success && result.data) {
        setFollowing(result.data)
      } else {
        setError(result.error || 'Failed to load following')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoadingFollowing(false)
    }
  }

  const handleUserClick = (user: FollowerProfile) => {
    // Navigate to user profile
    window.location.href = `/p/${user.id}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {userName}'s Network
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followers' | 'following')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="text-sm">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-sm">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoadingFollowers ? (
                <div className="flex justify-center py-8">
                  <Icon name="loader" className="w-6 h-6 animate-spin" />
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="users" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No followers yet</p>
                </div>
              ) : (
                followers.map((follower) => (
                  <FollowerCard
                    key={follower.id}
                    user={follower}
                    onClick={() => handleUserClick(follower)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoadingFollowing ? (
                <div className="flex justify-center py-8">
                  <Icon name="loader" className="w-6 h-6 animate-spin" />
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="user-plus" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Not following anyone yet</p>
                </div>
              ) : (
                following.map((user) => (
                  <FollowerCard
                    key={user.id}
                    user={user}
                    onClick={() => handleUserClick(user)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface FollowerCardProps {
  user: FollowerProfile
  onClick: () => void
}

function FollowerCard({ user, onClick }: FollowerCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <UserAvatar
          name={user.name}
          profilePictureUrl={user.profile_picture_url}
          size={10}
        />
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {user.name}
          </p>
          {user.professional_title && (
            <p className="text-sm text-gray-500 truncate">
              {user.professional_title}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">
              {user.followers_count} followers
            </span>
            <span className="text-xs text-gray-400">
              {user.following_count} following
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <Icon name="arrow-right" className="w-4 h-4" />
      </Button>
    </div>
  )
} 