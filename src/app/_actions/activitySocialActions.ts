'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const likeActivitySchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
  activityType: z.string().default('workout_session')
})

const commentActivitySchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
  activityType: z.string().default('workout_session'),
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be less than 500 characters")
})

const updateCommentSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID"),
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be less than 500 characters")
})

const deleteCommentSchema = z.object({
  commentId: z.string().uuid("Invalid comment ID")
})

// Types
export interface ActivityComment {
  id: string
  user: {
    id: string
    name: string
    profile_picture_url?: string
  }
  content: string
  created_at: string
  updated_at: string
  can_edit: boolean
}

export interface ActivitySocialData {
  likes_count: number
  comments_count: number
  user_has_liked: boolean
  comments?: ActivityComment[]
}

/**
 * Toggle like on an activity (like if not liked, unlike if already liked)
 */
export async function toggleActivityLike(
  activityId: string, 
  activityType: string = 'workout_session'
): Promise<{ success: boolean; liked: boolean; likes_count: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, liked: false, likes_count: 0, error: 'Authentication required' }
    }

    const validatedData = likeActivitySchema.safeParse({ activityId, activityType })
    if (!validatedData.success) {
      return { success: false, liked: false, likes_count: 0, error: 'Invalid data provided' }
    }

    // Check if user already liked this activity
    const { data: existingLike, error: checkError } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError)
      return { success: false, liked: false, likes_count: 0, error: 'Failed to check like status' }
    }

    let liked = false
    
    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('activity_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return { success: false, liked: false, likes_count: 0, error: 'Failed to remove like' }
      }
      
      liked = false
    } else {
      // Like - add new like
      const { error: insertError } = await supabase
        .from('activity_likes')
        .insert({
          user_id: user.id,
          activity_id: activityId,
          activity_type: activityType
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return { success: false, liked: false, likes_count: 0, error: 'Failed to add like' }
      }
      
      liked = true
    }

    // Get updated likes count
    const { data: likesCount, error: countError } = await supabase
      .from('activity_likes')
      .select('id', { count: 'exact' })
      .eq('activity_id', activityId)

    if (countError) {
      console.error('Error getting likes count:', countError)
      return { success: false, liked, likes_count: 0, error: 'Failed to get updated count' }
    }

    revalidatePath('/community')
    
    return { 
      success: true, 
      liked, 
      likes_count: likesCount?.length || 0 
    }
  } catch (error) {
    console.error('ERROR in toggleActivityLike:', error)
    return { success: false, liked: false, likes_count: 0, error: 'An unexpected error occurred' }
  }
}

/**
 * Add a comment to an activity
 */
export async function addActivityComment(
  activityId: string,
  content: string,
  activityType: string = 'workout_session'
): Promise<{ success: boolean; comment?: ActivityComment; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const validatedData = commentActivitySchema.safeParse({ activityId, content, activityType })
    if (!validatedData.success) {
      return { success: false, error: validatedData.error.errors[0]?.message || 'Invalid data provided' }
    }

    // Get user profile for the comment response
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, profile_picture_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { success: false, error: 'Failed to fetch user profile' }
    }

    // Insert the comment
    const { data: newComment, error: insertError } = await supabase
      .from('activity_comments')
      .insert({
        user_id: user.id,
        activity_id: activityId,
        activity_type: activityType,
        content: content.trim()
      })
      .select('id, content, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('Error adding comment:', insertError)
      return { success: false, error: 'Failed to add comment' }
    }

    revalidatePath('/community')

    const comment: ActivityComment = {
      id: newComment.id,
      user: {
        id: user.id,
        name: profile?.name || 'Unknown User',
        profile_picture_url: profile?.profile_picture_url
      },
      content: newComment.content,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      can_edit: true
    }

    return { success: true, comment }
  } catch (error) {
    console.error('ERROR in addActivityComment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get comments for an activity
 */
export async function getActivityComments(
  activityId: string
): Promise<{ success: boolean; comments?: ActivityComment[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: commentsData, error: commentsError } = await supabase
      .from('activity_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return { success: false, error: 'Failed to fetch comments' }
    }

    if (!commentsData || commentsData.length === 0) {
      return { success: true, comments: [] }
    }

    // Get unique user IDs from comments
    const userIds = Array.from(new Set(commentsData.map((comment: any) => comment.user_id)))
    
    // Fetch user profiles separately
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return { success: false, error: 'Failed to fetch user profiles' }
    }

    // Create profiles lookup map
    const profilesMap = new Map((profilesData || []).map(profile => [profile.id, profile]))

    const comments: ActivityComment[] = (commentsData || []).map((comment: any) => {
      const userProfile = profilesMap.get(comment.user_id)
      return {
        id: comment.id,
        user: {
          id: comment.user_id,
          name: userProfile?.name || 'Unknown User',
          profile_picture_url: userProfile?.profile_picture_url
        },
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        can_edit: comment.user_id === user.id
      }
    })

    return { success: true, comments }
  } catch (error) {
    console.error('ERROR in getActivityComments:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a comment (only by the comment author)
 */
export async function updateActivityComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; comment?: ActivityComment; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const validatedData = updateCommentSchema.safeParse({ commentId, content })
    if (!validatedData.success) {
      return { success: false, error: validatedData.error.errors[0]?.message || 'Invalid data provided' }
    }

    // Get user profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, profile_picture_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { success: false, error: 'Failed to fetch user profile' }
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('activity_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .eq('user_id', user.id) // Ensure user can only update their own comments
      .select('id, content, created_at, updated_at, user_id')
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return { success: false, error: 'Failed to update comment' }
    }

    revalidatePath('/community')

    const comment: ActivityComment = {
      id: updatedComment.id,
      user: {
        id: updatedComment.user_id,
        name: profile?.name || 'Unknown User',
        profile_picture_url: profile?.profile_picture_url
      },
      content: updatedComment.content,
      created_at: updatedComment.created_at,
      updated_at: updatedComment.updated_at,
      can_edit: true
    }

    return { success: true, comment }
  } catch (error) {
    console.error('ERROR in updateActivityComment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a comment (only by the comment author)
 */
export async function deleteActivityComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const validatedData = deleteCommentSchema.safeParse({ commentId })
    if (!validatedData.success) {
      return { success: false, error: 'Invalid comment ID' }
    }

    const { error: deleteError } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id) // Ensure user can only delete their own comments

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return { success: false, error: 'Failed to delete comment' }
    }

    revalidatePath('/community')
    return { success: true }
  } catch (error) {
    console.error('ERROR in deleteActivityComment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get social data (likes count, comments count, user's like status) for activities
 */
export async function getActivitiesSocialData(
  activityIds: string[]
): Promise<{ success: boolean; data?: Record<string, ActivitySocialData>; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    if (activityIds.length === 0) {
      return { success: true, data: {} }
    }

    // Get likes data
    const { data: likesData, error: likesError } = await supabase
      .from('activity_likes')
      .select('activity_id, user_id')
      .in('activity_id', activityIds)

    if (likesError) {
      console.error('Error fetching likes data:', likesError)
      return { success: false, error: 'Failed to fetch likes data' }
    }

    // Get comments count
    const { data: commentsData, error: commentsError } = await supabase
      .from('activity_comments')
      .select('activity_id, id')
      .in('activity_id', activityIds)

    if (commentsError) {
      console.error('Error fetching comments data:', commentsError)
      return { success: false, error: 'Failed to fetch comments data' }
    }

    // Process the data
    const socialData: Record<string, ActivitySocialData> = {}
    
    // Initialize data for all activities
    activityIds.forEach(activityId => {
      socialData[activityId] = {
        likes_count: 0,
        comments_count: 0,
        user_has_liked: false
      }
    })

    // Count likes and check if user has liked
    if (likesData) {
      likesData.forEach(like => {
        if (!socialData[like.activity_id]) {
          socialData[like.activity_id] = {
            likes_count: 0,
            comments_count: 0,
            user_has_liked: false
          }
        }
        
        socialData[like.activity_id].likes_count++
        
        if (like.user_id === user.id) {
          socialData[like.activity_id].user_has_liked = true
        }
      })
    }

    // Count comments
    if (commentsData) {
      commentsData.forEach(comment => {
        if (socialData[comment.activity_id]) {
          socialData[comment.activity_id].comments_count++
        }
      })
    }

    return { success: true, data: socialData }
  } catch (error) {
    console.error('ERROR in getActivitiesSocialData:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 