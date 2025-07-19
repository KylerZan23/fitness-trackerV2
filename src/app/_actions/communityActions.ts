'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content must be at least 10 characters long."),
  groupId: z.string().uuid().optional(),
})

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  groupType: z.string().min(1, "Group type is required."),
})

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment must be less than 1000 characters."),
  postId: z.string().uuid("Invalid post ID."),
})

const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment must be less than 1000 characters."),
  commentId: z.string().uuid("Invalid comment ID."),
})

// Action to get all community groups
export async function getCommunityGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_groups')
    .select(`
      *,
      members:community_group_members(count),
      created_by_user:profiles!community_groups_created_by_fkey(name, profile_picture_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching community groups:", error)
    return { success: false, error: "Failed to load communities." }
  }

  return { success: true, data }
}

// Action to get a specific community group with posts
export async function getCommunityGroup(groupId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_groups')
    .select(`
      *,
      members:community_group_members(count),
      created_by_user:profiles!community_groups_created_by_fkey(name, profile_picture_url)
    `)
    .eq('id', groupId)
    .single()

  if (error) {
    console.error("Error fetching community group:", error)
    return { success: false, error: "Failed to load community." }
  }

  return { success: true, data }
}

// Action to create a new community group
export async function createCommunityGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to create a group." }
  }

  const validatedFields = createGroupSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    groupType: formData.get('groupType'),
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid group data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, description, groupType } = validatedFields.data

  // --- REFACTORED PART ---
  // Call the transactional RPC function instead of two separate inserts
  const { data: newGroupId, error } = await supabase.rpc('create_group_and_add_admin', {
    group_name: name,
    group_description: description,
    group_type_param: groupType,
    creator_id: user.id
  })

  if (error) {
    console.error("Error creating community group via RPC:", error)
    return { success: false, error: "Failed to create group." }
  }
  // --- END REFACTORED PART ---

  revalidatePath('/community')
  return { success: true, message: "Group created successfully!", data: { id: newGroupId } }
}

// Action to join a community group
export async function joinCommunityGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to join a group." }
  }

  const { error } = await supabase
    .from('community_group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    })

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: "You are already a member of this group." }
    }
    console.error("Error joining community group:", error)
    return { success: false, error: "Failed to join group." }
  }

  revalidatePath('/community')
  revalidatePath(`/community/${groupId}`)
  return { success: true, message: "Successfully joined the group!" }
}

// Action to leave a community group
export async function leaveCommunityGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to leave a group." }
  }

  const { error } = await supabase
    .from('community_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error leaving community group:", error)
    return { success: false, error: "Failed to leave group." }
  }

  revalidatePath('/community')
  revalidatePath(`/community/${groupId}`)
  return { success: true, message: "Successfully left the group." }
}

// Action to check if user is a member of a group
export async function checkGroupMembership(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, isMember: false }
  }

  const { data, error } = await supabase
    .from('community_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error("Error checking group membership:", error)
    return { success: false, isMember: false }
  }

  return { 
    success: true, 
    isMember: !!data,
    role: data?.role || null
  }
}

// Action to create a new post
export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to post." }
  }

  const validatedFields = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    groupId: formData.get('groupId') || undefined,
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid post data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { title, content, groupId } = validatedFields.data

  // If posting to a group, verify membership
  if (groupId) {
    const membershipCheck = await checkGroupMembership(groupId)
    if (!membershipCheck.success || !membershipCheck.isMember) {
      return { success: false, error: "You must be a member of the group to post there." }
    }
  }

  const { error } = await supabase.from('community_posts').insert({
    user_id: user.id,
    title,
    content,
    group_id: groupId,
  })

  if (error) {
    console.error("Error creating post:", error)
    return { success: false, error: "Failed to create post." }
  }

  revalidatePath('/community')
  if (groupId) {
    revalidatePath(`/community/${groupId}`)
  }
  return { success: true, message: "Post created successfully!" }
}

// Action to get posts for a specific group with pagination
export async function getGroupPosts(groupId: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:profiles!community_posts_user_id_fkey(name, profile_picture_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1) // Apply pagination

  if (error) {
    console.error("Error fetching group posts:", error)
    return { success: false, error: "Failed to load posts." }
  }

  return { success: true, data }
}

// Action to get all posts (global feed) with pagination
export async function getAllPosts(page: number = 1, limit: number = 20) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:profiles!community_posts_user_id_fkey(name, profile_picture_url),
      group:community_groups(name)
    `)
    .is('group_id', null) // Only global posts
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1) // Apply pagination

  if (error) {
    console.error("Error fetching posts:", error)
    return { success: false, error: "Failed to load posts." }
  }

  return { success: true, data }
}

// Action to get group details and posts with pagination
export async function getGroupDetailsAndPosts(groupId: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient()
  
  // First get the group details
  const { data: groupData, error: groupError } = await supabase
    .from('community_groups')
    .select(`
      id,
      name,
      description
    `)
    .eq('id', groupId)
    .single()

  if (groupError) {
    console.error("Error fetching group details:", groupError)
    return { success: false, error: "Community not found." }
  }

  // Then get paginated posts for the group
  const offset = (page - 1) * limit
  const { data: postsData, error: postsError } = await supabase
    .from('community_posts')
    .select(`
      id,
      title,
      content,
      created_at,
      user:profiles!community_posts_user_id_fkey(name, profile_picture_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (postsError) {
    console.error("Error fetching group posts:", postsError)
    return { success: false, error: "Failed to load posts." }
  }

  // Combine the data
  const combinedData = {
    ...groupData,
    posts: postsData || []
  }

  return { success: true, data: combinedData }
}

// Helper function to get total count of global posts
export async function getGlobalPostsCount() {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .is('group_id', null)

  if (error) {
    console.error("Error counting global posts:", error)
    return { success: false, error: "Failed to count posts." }
  }

  return { success: true, count: count || 0 }
}

// Helper function to get total count of posts in a group
export async function getGroupPostsCount(groupId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if (error) {
    console.error("Error counting group posts:", error)
    return { success: false, error: "Failed to count posts." }
  }

  return { success: true, count: count || 0 }
}

// Comment-related actions

// Action to create a new comment
export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to comment." }
  }

  const validatedFields = createCommentSchema.safeParse({
    content: formData.get('content'),
    postId: formData.get('postId'),
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid comment data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { content, postId } = validatedFields.data

  // Verify the post exists
  const { data: post, error: postError } = await supabase
    .from('community_posts')
    .select('id, group_id')
    .eq('id', postId)
    .single()

  if (postError || !post) {
    return { success: false, error: "Post not found." }
  }

  const { error } = await supabase.from('community_comments').insert({
    user_id: user.id,
    post_id: postId,
    content,
  })

  if (error) {
    console.error("Error creating comment:", error)
    return { success: false, error: "Failed to create comment." }
  }

  revalidatePath('/community')
  if (post.group_id) {
    revalidatePath(`/community/${post.group_id}`)
  }
  return { success: true, message: "Comment created successfully!" }
}

// Action to get comments for a specific post
export async function getPostComments(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('community_comments')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      user_id,
      user:profiles!community_comments_user_id_fkey(name, profile_picture_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return { success: false, error: "Failed to load comments." }
  }

  return { success: true, data: data || [] }
}

// Action to update a comment
export async function updateComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to update comments." }
  }

  const validatedFields = updateCommentSchema.safeParse({
    content: formData.get('content'),
    commentId: formData.get('commentId'),
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid comment data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { content, commentId } = validatedFields.data

  const { error } = await supabase
    .from('community_comments')
    .update({ content })
    .eq('id', commentId)
    .eq('user_id', user.id) // Ensure user can only update their own comments

  if (error) {
    console.error("Error updating comment:", error)
    return { success: false, error: "Failed to update comment." }
  }

  revalidatePath('/community')
  return { success: true, message: "Comment updated successfully!" }
}

// Action to delete a comment
export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to delete comments." }
  }

  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // Ensure user can only delete their own comments

  if (error) {
    console.error("Error deleting comment:", error)
    return { success: false, error: "Failed to delete comment." }
  }

  revalidatePath('/community')
  return { success: true, message: "Comment deleted successfully!" }
}

// Helper function to get comment count for a post
export async function getPostCommentsCount(postId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('community_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error("Error counting comments:", error)
    return { success: false, error: "Failed to count comments." }
  }

  return { success: true, count: count || 0 }
} 