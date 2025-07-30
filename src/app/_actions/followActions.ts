'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export interface FollowStatus {
  isFollowing: boolean
  isFollowedBy: boolean
  isMutual: boolean
}

export interface FollowerProfile {
  id: string
  name: string
  profile_picture_url: string | null
  professional_title: string | null
  followers_count: number
  following_count: number
  followed_at: string
}

/**
 * Follow a user
 */
export async function followUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    if (user.id === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' }
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()

    if (existingFollow) {
      return { success: false, error: 'Already following this user' }
    }

    // Create the follow relationship
    const { error: insertError } = await supabase
      .from('user_followers')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      })

    if (insertError) {
      console.error('Follow insert error:', insertError)
      return { success: false, error: 'Failed to follow user' }
    }

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath(`/p/${targetUserId}`)
    revalidatePath('/community')

    return { success: true }
  } catch (error) {
    console.error('ERROR in followUser:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Delete the follow relationship
    const { error: deleteError } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (deleteError) {
      console.error('Unfollow delete error:', deleteError)
      return { success: false, error: 'Failed to unfollow user' }
    }

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath(`/p/${targetUserId}`)
    revalidatePath('/community')

    return { success: true }
  } catch (error) {
    console.error('ERROR in unfollowUser:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get follow status between current user and target user
 */
export async function getFollowStatus(targetUserId: string): Promise<{ success: boolean; data?: FollowStatus; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    if (user.id === targetUserId) {
      return { 
        success: true, 
        data: { isFollowing: false, isFollowedBy: false, isMutual: false }
      }
    }

    // Check if current user follows target user
    const { data: followingData } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()

    // Check if target user follows current user
    const { data: followerData } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', targetUserId)
      .eq('following_id', user.id)
      .single()

    const isFollowing = !!followingData
    const isFollowedBy = !!followerData
    const isMutual = isFollowing && isFollowedBy

    return {
      success: true,
      data: { isFollowing, isFollowedBy, isMutual }
    }
  } catch (error) {
    console.error('ERROR in getFollowStatus:', error)
    return { success: false, error: 'Failed to get follow status' }
  }
}

/**
 * Get list of users that follow the target user
 */
export async function getFollowers(targetUserId: string, limit: number = 50): Promise<{ success: boolean; data?: FollowerProfile[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: followers, error: followersError } = await supabase
      .from('user_followers')
      .select(`
        created_at,
        follower_id,
        profiles!user_followers_follower_id_fkey (
          id,
          name,
          profile_picture_url,
          professional_title,
          followers_count,
          following_count
        )
      `)
      .eq('following_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (followersError) {
      console.error('Followers query error:', followersError)
      return { success: false, error: 'Failed to load followers' }
    }

    const followerProfiles: FollowerProfile[] = followers?.map((f: any) => ({
      id: f.profiles.id,
      name: f.profiles.name,
      profile_picture_url: f.profiles.profile_picture_url,
      professional_title: f.profiles.professional_title,
      followers_count: f.profiles.followers_count || 0,
      following_count: f.profiles.following_count || 0,
      followed_at: f.created_at
    })) || []

    return { success: true, data: followerProfiles }
  } catch (error) {
    console.error('ERROR in getFollowers:', error)
    return { success: false, error: 'Failed to load followers' }
  }
}

/**
 * Get list of users that the target user follows
 */
export async function getFollowing(targetUserId: string, limit: number = 50): Promise<{ success: boolean; data?: FollowerProfile[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: following, error: followingError } = await supabase
      .from('user_followers')
      .select(`
        created_at,
        following_id,
        profiles!user_followers_following_id_fkey (
          id,
          name,
          profile_picture_url,
          professional_title,
          followers_count,
          following_count
        )
      `)
      .eq('follower_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (followingError) {
      console.error('Following query error:', followingError)
      return { success: false, error: 'Failed to load following' }
    }

    const followingProfiles: FollowerProfile[] = following?.map((f: any) => ({
      id: f.profiles.id,
      name: f.profiles.name,
      profile_picture_url: f.profiles.profile_picture_url,
      professional_title: f.profiles.professional_title,
      followers_count: f.profiles.followers_count || 0,
      following_count: f.profiles.following_count || 0,
      followed_at: f.created_at
    })) || []

    return { success: true, data: followingProfiles }
  } catch (error) {
    console.error('ERROR in getFollowing:', error)
    return { success: false, error: 'Failed to load following' }
  }
}

/**
 * Get mutual followers between current user and target user
 */
export async function getMutualFollows(targetUserId: string, limit: number = 10): Promise<{ success: boolean; data?: FollowerProfile[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // First get users that current user follows
    const { data: currentUserFollowing } = await supabase
      .from('user_followers')
      .select('following_id')
      .eq('follower_id', user.id)

    if (!currentUserFollowing || currentUserFollowing.length === 0) {
      return { success: true, data: [] }
    }

    const followingIds = currentUserFollowing.map(f => f.following_id)

    // Then get users that target user also follows from the same list
    const { data: mutualFollows, error: mutualError } = await supabase
      .from('user_followers')
      .select(`
        following_id,
        created_at,
        profiles!user_followers_following_id_fkey (
          id,
          name,
          profile_picture_url,
          professional_title,
          followers_count,
          following_count
        )
      `)
      .eq('follower_id', targetUserId)
      .in('following_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (mutualError) {
      console.error('Mutual follows query error:', mutualError)
      return { success: false, error: 'Failed to load mutual follows' }
    }

    const mutualProfiles: FollowerProfile[] = mutualFollows?.map((f: any) => ({
      id: f.profiles.id,
      name: f.profiles.name,
      profile_picture_url: f.profiles.profile_picture_url,
      professional_title: f.profiles.professional_title,
      followers_count: f.profiles.followers_count || 0,
      following_count: f.profiles.following_count || 0,
      followed_at: f.created_at
    })) || []

    return { success: true, data: mutualProfiles }
  } catch (error) {
    console.error('ERROR in getMutualFollows:', error)
    return { success: false, error: 'Failed to load mutual follows' }
  }
}

/**
 * Search for users to follow
 */
export async function searchUsers(query: string, limit: number = 20): Promise<{ success: boolean; data?: FollowerProfile[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url, professional_title, followers_count, following_count')
      .neq('id', user.id) // Exclude current user
      .or(`name.ilike.%${query}%, professional_title.ilike.%${query}%`)
      .order('followers_count', { ascending: false })
      .limit(limit)

    if (searchError) {
      console.error('User search error:', searchError)
      return { success: false, error: 'Failed to search users' }
    }

    const userProfiles: FollowerProfile[] = users?.map((u: any) => ({
      id: u.id,
      name: u.name,
      profile_picture_url: u.profile_picture_url,
      professional_title: u.professional_title,
      followers_count: u.followers_count || 0,
      following_count: u.following_count || 0,
      followed_at: new Date().toISOString() // Not applicable for search
    })) || []

    return { success: true, data: userProfiles }
  } catch (error) {
    console.error('ERROR in searchUsers:', error)
    return { success: false, error: 'Failed to search users' }
  }
} 