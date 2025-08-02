'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserPlus, UserMinus } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProBadge } from '@/components/ui/ProBadge'
import { followUser, unfollowUser, getFollowStatus, type FollowerProfile } from '@/app/_actions/followActions'

interface UserSearchCardProps {
  user: FollowerProfile
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}

export function UserSearchCard({ user, onFollowChange }: UserSearchCardProps) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false)

  // Check follow status on first render
  useEffect(() => {
    if (!hasCheckedStatus) {
      checkFollowStatus()
    }
  }, [user.id, hasCheckedStatus])

  const checkFollowStatus = async () => {
    try {
      const result = await getFollowStatus(user.id)
      if (result.success && result.data) {
        setIsFollowing(result.data.isFollowing)
      }
      setHasCheckedStatus(true)
    } catch (error) {
      console.error('Error checking follow status:', error)
      setHasCheckedStatus(true)
    }
  }

  const handleFollowToggle = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        const result = await unfollowUser(user.id)
        if (result.success) {
          setIsFollowing(false)
          onFollowChange?.(user.id, false)
        }
      } else {
        const result = await followUser(user.id)
        if (result.success) {
          setIsFollowing(true)
          onFollowChange?.(user.id, true)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar
              name={user.name}
              email=""
              size={12}
              profilePictureUrl={user.profile_picture_url}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user.name}
                </h3>
                <ProBadge userId={user.id} variant="compact" />
              </div>
              
              {user.professional_title && (
                <p className="text-sm text-gray-600 truncate">
                  {user.professional_title}
                </p>
              )}
              
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{user.followers_count} followers</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span>{user.following_count} following</span>
                </div>
              </div>
            </div>
          </div>

          {/* Follow/Unfollow Button */}
          <div className="flex-shrink-0">
            {hasCheckedStatus && isFollowing !== null ? (
              <Button
                onClick={handleFollowToggle}
                disabled={isLoading}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className={`min-w-[100px] ${
                  isFollowing 
                    ? 'border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </>
                    )}
                  </>
                )}
              </Button>
            ) : (
              <div className="w-[100px] h-8 bg-gray-100 rounded animate-pulse" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 