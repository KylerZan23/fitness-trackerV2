/**
 * Social Profile Header Component
 * ------------------------------------------------
 * Modern gradient header for profile pages with social metrics
 */

import { useState } from 'react'
import { UserIcon, UsersIcon, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload'
import { updateProfilePicture } from '@/app/_actions/profileActions'
import Image from 'next/image'

interface SocialProfileHeaderProps {
  profile: {
    id: string
    name: string
    professional_title?: string
    bio?: string
    profile_picture_url?: string
    followers_count?: number
    following_count?: number
  }
  isOwnProfile?: boolean
  isFollowing?: boolean
  onFollow?: () => void
  onMessage?: () => void
  onFollowersClick?: (tab: 'followers' | 'following') => void
  onProfileUpdate?: () => void
}

export function SocialProfileHeader({
  profile,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onFollowersClick,
  onProfileUpdate
}: SocialProfileHeaderProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isEditingProfilePicture, setIsEditingProfilePicture] = useState(false)
  const [currentProfilePicture, setCurrentProfilePicture] = useState(profile.profile_picture_url)

  const handleFollow = async () => {
    if (!onFollow) return
    setIsFollowLoading(true)
    try {
      await onFollow()
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleProfilePictureUpdate = async (newUrl: string) => {
    try {
      const result = await updateProfilePicture(newUrl)
      if (result.success) {
        setCurrentProfilePicture(newUrl)
        onProfileUpdate?.()
        setIsEditingProfilePicture(false)
      } else {
        console.error('Failed to update profile picture:', result.error)
      }
    } catch (error) {
      console.error('Error updating profile picture:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-4">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-6 py-6 text-white relative overflow-hidden rounded-xl shadow-sm">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-white/20"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-2 border-white/20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/10"></div>
        </div>
        
        <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 border-white/20 bg-white/10 relative">
              {currentProfilePicture ? (
                <Image
                  src={currentProfilePicture}
                  alt={profile.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 md:w-10 md:h-10 text-white/70" />
                </div>
              )}
              
              {/* Edit Overlay for Own Profile */}
              {isOwnProfile && !isEditingProfilePicture && (
                <button
                  onClick={() => setIsEditingProfilePicture(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group"
                >
                  <Edit3 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-grow min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {profile.name}
            </h1>
            {profile.professional_title && (
              <p className="text-base md:text-lg text-blue-100 mb-3">
                {profile.professional_title}
              </p>
            )}
            
            {/* Social Metrics */}
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => onFollowersClick?.('followers')}
                className="flex items-center gap-1 hover:bg-white/10 rounded-md px-2 py-1 transition-colors"
              >
                <UsersIcon className="w-4 h-4 text-blue-200" />
                <span className="text-base font-semibold">
                  {(profile.followers_count || 0).toLocaleString()}
                </span>
                <span className="text-blue-200 text-sm">Followers</span>
              </button>
              <button
                onClick={() => onFollowersClick?.('following')}
                className="flex items-center gap-1 hover:bg-white/10 rounded-md px-2 py-1 transition-colors"
              >
                <UsersIcon className="w-4 h-4 text-blue-200" />
                <span className="text-base font-semibold">
                  {(profile.following_count || 0).toLocaleString()}
                </span>
                <span className="text-blue-200 text-sm">Following</span>
              </button>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  variant={isFollowing ? "secondary" : "default"}
                  className={`
                    px-4 py-1.5 text-sm font-semibold transition-all duration-200
                    ${isFollowing 
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30' 
                      : 'bg-white text-blue-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {isFollowLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
                </Button>
                <Button
                  onClick={onMessage}
                  variant="secondary"
                  className="px-4 py-1.5 text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold"
                >
                  Message
                </Button>
              </div>
            )}
          </div>
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-blue-100 leading-relaxed max-w-2xl text-sm">
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Picture Edit Modal */}
      {isEditingProfilePicture && isOwnProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Profile Picture</h3>
            
            <ProfilePictureUpload
              userId={profile.id}
              existingUrl={currentProfilePicture || null}
              onUploadComplete={handleProfilePictureUpdate}
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setIsEditingProfilePicture(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 