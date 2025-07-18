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

  // Create the group
  const { data: groupData, error: groupError } = await supabase
    .from('community_groups')
    .insert({
      name,
      description,
      group_type: groupType,
      created_by: user.id,
    })
    .select()
    .single()

  if (groupError) {
    console.error("Error creating community group:", groupError)
    return { success: false, error: "Failed to create group." }
  }

  // Add the creator as an admin member
  const { error: memberError } = await supabase
    .from('community_group_members')
    .insert({
      group_id: groupData.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) {
    console.error("Error adding creator to group:", memberError)
    // Don't fail the whole operation, just log the error
  }

  revalidatePath('/community')
  return { success: true, message: "Group created successfully!", data: groupData }
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

// Action to get posts for a specific group
export async function getGroupPosts(groupId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:profiles!community_posts_user_id_fkey(name, profile_picture_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching group posts:", error)
    return { success: false, error: "Failed to load posts." }
  }

  return { success: true, data }
}

// Action to get all posts (global feed)
export async function getAllPosts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:profiles!community_posts_user_id_fkey(name, profile_picture_url),
      group:community_groups(name)
    `)
    .is('group_id', null) // Only global posts
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return { success: false, error: "Failed to load posts." }
  }

  return { success: true, data }
} 