'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isReadOnlyMode } from '@/lib/subscription'

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

const voteSchema = z.object({
  postId: z.string().uuid("Invalid post ID."),
  voteType: z.enum(['up', 'down'], { errorMap: () => ({ message: "Vote type must be 'up' or 'down'" }) }),
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

  // Check if user is in read-only mode (trial expired and no premium subscription)
  const isInReadOnlyMode = await isReadOnlyMode(user.id)
  if (isInReadOnlyMode) {
    return { 
      success: false, 
      error: 'Your free trial has expired. Please upgrade to premium to create community groups.' 
    }
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

  // Check if user is in read-only mode (trial expired and no premium subscription)
  const isInReadOnlyMode = await isReadOnlyMode(user.id)
  if (isInReadOnlyMode) {
    return { 
      success: false, 
      error: 'Your free trial has expired. Please upgrade to premium to create posts.' 
    }
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
  
  // First ensure we have a user session for RLS policies
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error("No authenticated user for community access")
    return { success: false, error: "Please log in to view communities." }
  }
  
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

// Vote-related actions

// Action to vote on a post (thumbs up/down)
export async function voteOnPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to vote." }
  }

  const validatedFields = voteSchema.safeParse({
    postId: formData.get('postId'),
    voteType: formData.get('voteType'),
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid vote data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { postId, voteType } = validatedFields.data

  // Check if user has already voted on this post
  const { data: existingVote, error: fetchError } = await supabase
    .from('community_post_votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error("Error checking existing vote:", fetchError)
    return { success: false, error: "Failed to check existing vote." }
  }

  if (existingVote) {
    // If user already voted the same way, remove the vote (toggle off)
    if (existingVote.vote_type === voteType) {
      const { error: deleteError } = await supabase
        .from('community_post_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error("Error removing vote:", deleteError)
        return { success: false, error: "Failed to remove vote." }
      }

      return { success: true, message: "Vote removed successfully!" }
    } else {
      // If user voted differently, update the vote
      const { error: updateError } = await supabase
        .from('community_post_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id)

      if (updateError) {
        console.error("Error updating vote:", updateError)
        return { success: false, error: "Failed to update vote." }
      }

      return { success: true, message: "Vote updated successfully!" }
    }
  } else {
    // Create new vote
    const { error: insertError } = await supabase
      .from('community_post_votes')
      .insert({
        user_id: user.id,
        post_id: postId,
        vote_type: voteType,
      })

    if (insertError) {
      console.error("Error creating vote:", insertError)
      return { success: false, error: "Failed to create vote." }
    }

    return { success: true, message: "Vote created successfully!" }
  }
}

// Action to get vote counts for a post
export async function getPostVoteCounts(postId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_post_vote_counts', {
    post_uuid: postId
  })

  if (error) {
    console.error("Error getting vote counts:", error)
    return { success: false, error: "Failed to get vote counts." }
  }

  const counts = data?.[0] || { upvotes: 0, downvotes: 0, total_votes: 0 }
  
  return { 
    success: true, 
    data: {
      upvotes: Number(counts.upvotes),
      downvotes: Number(counts.downvotes),
      totalVotes: Number(counts.total_votes)
    }
  }
}

// Action to get user's vote on a specific post
export async function getUserVoteOnPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: true, data: null } // Not logged in, no vote
  }

  const { data, error } = await supabase
    .from('community_post_votes')
    .select('vote_type')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error("Error getting user vote:", error)
    return { success: false, error: "Failed to get user vote." }
  }

  return { success: true, data: data?.vote_type || null }
} 

/**
 * Get activities from users that the current user follows
 */
export async function getFollowedUsersActivities(limit: number = 20): Promise<{
  success: boolean
  data?: FollowedUserActivity[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get the list of users that the current user follows
    const { data: following, error: followingError } = await supabase
      .from('user_followers')
      .select('following_id')
      .eq('follower_id', user.id)

    if (followingError) {
      console.error('Error fetching following list:', followingError)
      return { success: false, error: 'Failed to fetch following list' }
    }

    if (!following || following.length === 0) {
      return { success: true, data: [] }
    }

    const followingIds = following.map(f => f.following_id)

    // Get workout groups with user profiles
    const { data: workoutGroups, error: groupsError } = await supabase
      .from('workout_groups')
      .select(`
        id,
        name,
        duration,
        created_at,
        user_id
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (groupsError) {
      console.error('Error fetching workout groups:', groupsError)
      return { success: false, error: 'Failed to fetch workout groups' }
    }

    // Get user profiles for the workout groups
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url')
      .in('id', followingIds)

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return { success: false, error: 'Failed to fetch user profiles' }
    }

    // Get workouts for these groups to calculate stats
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, exercise_name, sets, reps, weight, duration, workout_group_id, user_id, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit * 5) // Get more to account for grouping

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError)
      return { success: false, error: 'Failed to fetch activities' }
    }

    // Get community feed events for PRs from the same time period
    const { data: prEvents, error: prEventsError } = await supabase
      .from('community_feed_events')
      .select('user_id, event_type, metadata, created_at')
      .in('user_id', followingIds)
      .eq('event_type', 'NEW_PB')
      .order('created_at', { ascending: false })
      .limit(limit * 10) // Get more PR events to match with workouts

    if (prEventsError) {
      console.error('Error fetching PR events:', prEventsError)
    }

    // Create lookup maps
    const profilesMap = new Map(userProfiles?.map(p => [p.id, p]) || [])
    
    // Create PR lookup map by user and exercise name for recent PRs
    const prMap = new Map<string, any>()
    if (prEvents) {
      prEvents.forEach(event => {
        const key = `${event.user_id}-${event.metadata?.exerciseName}`
        const eventDate = new Date(event.created_at)
        
        // Only include PRs from the last 7 days to match with recent workouts
        const daysDiff = Math.abs(new Date().getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff <= 7) {
          prMap.set(key, event.metadata)
        }
      })
    }

    // Process and combine activities
    const activities: FollowedUserActivity[] = []

    // Process workout groups (sessions)
    if (workoutGroups) {
      for (const group of workoutGroups) {
        const userProfile = profilesMap.get(group.user_id)
        if (!userProfile) continue

        // Get exercises for this group
        const groupExercises = workouts?.filter(w => w.workout_group_id === group.id) || []
        
        if (groupExercises.length > 0) {
          const totalVolume = groupExercises.reduce((sum, exercise) => 
            sum + (exercise.weight * exercise.sets * exercise.reps), 0
          )
          
          const totalSets = groupExercises.reduce((sum, exercise) => sum + exercise.sets, 0)
          
          // Check for PRs and build exercise details
          const exerciseDetails: ExerciseDetail[] = []
          const prExercises: string[] = []
          let prCount = 0
          
          groupExercises.forEach(exercise => {
            const prKey = `${exercise.user_id}-${exercise.exercise_name}`
            const prData = prMap.get(prKey)
            const isPR = !!prData
            
            if (isPR) {
              prCount++
              prExercises.push(exercise.exercise_name)
            }
            
            exerciseDetails.push({
              id: exercise.id,
              exercise_name: exercise.exercise_name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              duration: exercise.duration,
              isPR,
              prType: prData?.pbType
            })
          })
          
          activities.push({
            id: `group-${group.id}`,
            type: 'workout_session',
            user: {
              id: userProfile.id,
              name: userProfile.name,
              profile_picture_url: userProfile.profile_picture_url
            },
            workout: {
              name: group.name,
              duration: group.duration,
              sets: totalSets,
              volume: Math.round(totalVolume),
              exercises: groupExercises.length,
              prCount,
              exerciseDetails,
              prExercises
            },
            created_at: group.created_at
          })
        }
      }
    }

    // Process individual workouts (for users who don't use groups)
    if (workouts) {
      const individualWorkouts = workouts.filter(w => !w.workout_group_id)
      
      // Group individual workouts by user and day to create sessions
      const workoutsByUserAndDay = new Map<string, typeof workouts>()
      
      individualWorkouts.forEach(workout => {
        const dateKey = new Date(workout.created_at).toDateString()
        const userDateKey = `${workout.user_id}-${dateKey}`
        
        if (!workoutsByUserAndDay.has(userDateKey)) {
          workoutsByUserAndDay.set(userDateKey, [])
        }
        workoutsByUserAndDay.get(userDateKey)!.push(workout)
      })

      // Convert grouped workouts to activities
      workoutsByUserAndDay.forEach((dayWorkouts, userDateKey) => {
        if (activities.length >= limit) return
        
        const firstWorkout = dayWorkouts[0]
        const userProfile = profilesMap.get(firstWorkout.user_id)
        if (!userProfile) return

        const totalVolume = dayWorkouts.reduce((sum, w) => sum + (w.weight * w.sets * w.reps), 0)
        const totalSets = dayWorkouts.reduce((sum, w) => sum + w.sets, 0)
        const totalDuration = dayWorkouts.reduce((sum, w) => sum + w.duration, 0)

        // Check for PRs in individual workouts
        const exerciseDetails: ExerciseDetail[] = []
        const prExercises: string[] = []
        let prCount = 0
        
        dayWorkouts.forEach(workout => {
          const prKey = `${workout.user_id}-${workout.exercise_name}`
          const prData = prMap.get(prKey)
          const isPR = !!prData
          
          if (isPR) {
            prCount++
            prExercises.push(workout.exercise_name)
          }
          
          exerciseDetails.push({
            id: workout.id,
            exercise_name: workout.exercise_name,
            sets: workout.sets,
            reps: workout.reps,
            weight: workout.weight,
            duration: workout.duration,
            isPR,
            prType: prData?.pbType
          })
        })

        activities.push({
          id: `individual-${userDateKey}`,
          type: 'workout_session',
          user: {
            id: userProfile.id,
            name: userProfile.name,
            profile_picture_url: userProfile.profile_picture_url
          },
          workout: {
            name: dayWorkouts.length > 1 ? 'Mixed Training' : firstWorkout.exercise_name,
            duration: totalDuration,
            sets: totalSets,
            volume: Math.round(totalVolume),
            exercises: dayWorkouts.length,
            prCount,
            exerciseDetails,
            prExercises
          },
          created_at: firstWorkout.created_at
        })
      })
    }

    // Sort activities by date and limit
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const limitedActivities = activities.slice(0, limit)

    // Get social data for activities
    if (limitedActivities.length > 0) {
      const activityIds = limitedActivities.map(activity => activity.id)
      
      // Get likes data
      const { data: likesData } = await supabase
        .from('activity_likes')
        .select('activity_id, user_id')
        .in('activity_id', activityIds)

      // Get comments count
      const { data: commentsData } = await supabase
        .from('activity_comments')
        .select('activity_id, id')
        .in('activity_id', activityIds)

      // Add social data to activities
      limitedActivities.forEach(activity => {
        // Count likes for this activity
        const activityLikes = likesData?.filter(like => like.activity_id === activity.id) || []
        activity.likes_count = activityLikes.length
        activity.user_has_liked = activityLikes.some(like => like.user_id === user.id)
        
        // Count comments for this activity
        const activityComments = commentsData?.filter(comment => comment.activity_id === activity.id) || []
        activity.comments_count = activityComments.length
      })
    }

    return { success: true, data: limitedActivities }
  } catch (error) {
    console.error('ERROR in getFollowedUsersActivities:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface ExerciseDetail {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight: number
  duration: number
  isPR?: boolean // Added to track if this exercise achieved a PR
  prType?: string // Type of PR (weight, reps, etc.)
}

export interface FollowedUserActivity {
  id: string
  type: 'workout_session'
  user: {
    id: string
    name: string
    profile_picture_url?: string
  }
  workout: {
    name: string
    duration: number // in minutes
    sets: number
    volume: number // total weight lifted in lbs/kg
    exercises: number
    prCount: number
    exerciseDetails?: ExerciseDetail[] // Added exercise details
    prExercises?: string[] // List of exercises that achieved PRs
  }
  created_at: string
  // Social interaction data
  likes_count?: number
  comments_count?: number
  user_has_liked?: boolean
} 