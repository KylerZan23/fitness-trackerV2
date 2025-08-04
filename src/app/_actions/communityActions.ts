'use server'

import { createClient } from '@/utils/supabase/server'
import {
  getCommunityGroupsData,
  getCommunityGroupData,
  createGroupAndAddAdmin,
  joinGroup,
  leaveGroup,
  getGroupMembership,
  createPostData,
  getGroupPostsData,
  getAllPostsData,
  getGroupDetailsAndPostsData,
  getGlobalPostsCountData,
  getGroupPostsCountData,
  getPostData,
  createCommentData,
  getPostCommentsData,
  updateCommentData,
  deleteCommentData,
  getPostCommentsCountData,
  getExistingVote,
  deleteVote,
  updateVote,
  createVote,
  getPostVoteCountsData,
  getUserVoteOnPostData,
  getFollowingIds,
  getWorkoutGroupsData,
  getUserProfilesData,
  getWorkoutsData,
  getPREventsData,
  getLikesData,
  getCommentsData,
  getExpertQAPostsData,
} from '@/lib/data/community';
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isReadOnlyMode, hasProAccess } from '@/lib/subscription'

const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content must be at least 10 characters long."),
  groupId: z.string().uuid().optional(),
  contentType: z.enum(['general', 'expert_qa']).default('general'),
})

const createExpertQASchema = z.object({
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
  return await getCommunityGroupsData();
}

// Action to get a specific community group with posts
export async function getCommunityGroup(groupId: string) {
  return await getCommunityGroupData(groupId);
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
  const result = await createGroupAndAddAdmin(name, description, groupType, user.id);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to create group." };
  }
  // --- END REFACTORED PART ---

  revalidatePath('/community')
  return { success: true, message: "Group created successfully!", data: { id: result.data } }
}

// Action to join a community group
export async function joinCommunityGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to join a group." }
  }

  const result = await joinGroup(groupId, user.id);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to join group." };
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

  const result = await leaveGroup(groupId, user.id);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to leave group." };
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

  return await getGroupMembership(groupId, user.id);
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
    contentType: formData.get('contentType') || 'general',
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid post data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { title, content, groupId, contentType } = validatedFields.data

  // Check if user has permission for Expert Q&A content
  if (contentType === 'expert_qa') {
    const hasProSubscription = await hasProAccess(user.id)
    if (!hasProSubscription) {
      return { success: false, error: "Expert Q&A content is only available to Pro subscribers." }
    }
  }

  // If posting to a group, verify membership
  if (groupId) {
    const membershipCheck = await checkGroupMembership(groupId)
    if (!membershipCheck.success || !membershipCheck.isMember) {
      return { success: false, error: "You must be a member of the group to post there." }
    }
  }

  const result = await createPostData({
    user_id: user.id,
    title,
    content,
    group_id: groupId,
    content_type: contentType,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Failed to create post." };
  }

  revalidatePath('/community')
  if (groupId) {
    revalidatePath(`/community/${groupId}`)
  }
  return { success: true, message: "Post created successfully!" }
}

// Action to get posts for a specific group with pagination
export async function getGroupPosts(groupId: string, page: number = 1, limit: number = 20) {
  return await getGroupPostsData(groupId, page, limit);
}

// Action to get all posts (global feed) with pagination
export async function getAllPosts(page: number = 1, limit: number = 20) {
  return await getAllPostsData(page, limit);
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
  
  return await getGroupDetailsAndPostsData(groupId, page, limit);
}

// Helper function to get total count of global posts
export async function getGlobalPostsCount() {
  return await getGlobalPostsCountData();
}

// Helper function to get total count of posts in a group
export async function getGroupPostsCount(groupId: string) {
  return await getGroupPostsCountData(groupId);
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
  const postResult = await getPostData(postId);

  if (!postResult.success || !postResult.data) {
    return { success: false, error: "Post not found." };
  }
  const post = postResult.data;

  const result = await createCommentData({
    user_id: user.id,
    post_id: postId,
    content,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Failed to create comment." };
  }

  revalidatePath('/community')
  if (post.group_id) {
    revalidatePath(`/community/${post.group_id}`)
  }
  return { success: true, message: "Comment created successfully!" }
}

// Action to get comments for a specific post
export async function getPostComments(postId: string) {
  return await getPostCommentsData(postId);
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

  const result = await updateCommentData(commentId, user.id, content);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to update comment." };
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

  const result = await deleteCommentData(commentId, user.id);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to delete comment." };
  }

  revalidatePath('/community')
  return { success: true, message: "Comment deleted successfully!" }
}

// Helper function to get comment count for a post
export async function getPostCommentsCount(postId: string) {
  return await getPostCommentsCountData(postId);
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
  const { success: fetchSuccess, data: existingVote, error: fetchError } = await getExistingVote(user.id, postId);

  if (!fetchSuccess) {
    return { success: false, error: fetchError || "Failed to check existing vote." };
  }

  if (existingVote) {
    // If user already voted the same way, remove the vote (toggle off)
    if (existingVote.vote_type === voteType) {
      const { success, error } = await deleteVote(existingVote.id);
      if (!success) {
        return { success: false, error: error || "Failed to remove vote." };
      }
      return { success: true, message: "Vote removed successfully!" };
    } else {
      // If user voted differently, update the vote
      const { success, error } = await updateVote(existingVote.id, voteType);
      if (!success) {
        return { success: false, error: error || "Failed to update vote." };
      }
      return { success: true, message: "Vote updated successfully!" };
    }
  } else {
    // Create new vote
    const { success, error } = await createVote(user.id, postId, voteType);
    if (!success) {
        return { success: false, error: error || "Failed to create vote." };
    }
    return { success: true, message: "Vote created successfully!" };
  }
}

// Action to get vote counts for a post
export async function getPostVoteCounts(postId: string) {
  const { success, data, error } = await getPostVoteCountsData(postId);

  if (!success) {
    return { success: false, error: error || "Failed to get vote counts." };
  }

  const counts = data?.[0] || { upvotes: 0, downvotes: 0, total_votes: 0 };
  
  return { 
    success: true, 
    data: {
      upvotes: Number(counts.upvotes),
      downvotes: Number(counts.downvotes),
      totalVotes: Number(counts.total_votes)
    }
  };
}

// Action to get user's vote on a specific post
export async function getUserVoteOnPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: true, data: null } // Not logged in, no vote
  }

  const { success, data, error } = await getUserVoteOnPostData(user.id, postId);

  if (!success) {
    return { success: false, error: error || "Failed to get user vote." };
  }

  return { success: true, data: data?.vote_type || null };
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
    const { success: followingSuccess, data: followingIds, error: followingError } = await getFollowingIds(user.id);

    if (!followingSuccess || !followingIds) {
      return { success: false, error: followingError || 'Failed to fetch following list' };
    }

    if (followingIds.length === 0) {
      return { success: true, data: [] };
    }

    const [
      workoutGroupsResult,
      userProfilesResult,
      workoutsResult,
      prEventsResult
    ] = await Promise.all([
      getWorkoutGroupsData(followingIds, limit),
      getUserProfilesData(followingIds),
      getWorkoutsData(followingIds, limit * 5),
      getPREventsData(followingIds, limit * 10)
    ]);

    if (!workoutGroupsResult.success || !userProfilesResult.success || !workoutsResult.success || !prEventsResult.success) {
      return { success: false, error: 'Failed to fetch activity data.' };
    }

    const workoutGroups = workoutGroupsResult.data;
    const userProfiles = userProfilesResult.data;
    const workouts = workoutsResult.data;
    const prEvents = prEventsResult.data;

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
      const [likesResult, commentsResult] = await Promise.all([
        getLikesData(activityIds),
        getCommentsData(activityIds)
      ]);

      const likesData = likesResult.data;
      const commentsData = commentsResult.data;

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

// ===== EXPERT Q&A ACTIONS =====

// Action to create Expert Q&A post (Pro subscribers only)
export async function createExpertQAPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to create Expert Q&A posts." }
  }

  // Check if user has Pro access
  const hasProSubscription = await hasProAccess(user.id)
  if (!hasProSubscription) {
    return { success: false, error: "Expert Q&A content is only available to Pro subscribers." }
  }

  // Check if user is in read-only mode
  const isInReadOnlyMode = await isReadOnlyMode(user.id)
  if (isInReadOnlyMode) {
    return { 
      success: false, 
      error: 'Your subscription has expired. Please renew to create Expert Q&A posts.' 
    }
  }

  const validatedFields = createExpertQASchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    groupId: formData.get('groupId') || undefined,
  })

  if (!validatedFields.success) {
    return { success: false, error: "Invalid Expert Q&A data.", errors: validatedFields.error.flatten().fieldErrors }
  }

  const { title, content, groupId } = validatedFields.data

  // If posting to a group, verify membership
  if (groupId) {
    const membershipCheck = await checkGroupMembership(groupId)
    if (!membershipCheck.success || !membershipCheck.isMember) {
      return { success: false, error: "You must be a member of the group to post there." }
    }
  }

  const result = await createPostData({
    user_id: user.id,
    title,
    content,
    group_id: groupId,
    content_type: 'expert_qa',
    tags: ['expert-qa'],
  });

  if (!result.success) {
    return { success: false, error: result.error || "Failed to create Expert Q&A post." };
  }

  // Revalidate the community pages
  revalidatePath('/community')
  if (groupId) {
    revalidatePath(`/community/${groupId}`)
  }

  return { success: true, message: "Expert Q&A post created successfully!" }
}

// Action to get Expert Q&A posts (Pro subscribers only)
export async function getExpertQAPosts(page: number = 1, limit: number = 20, groupId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Please log in to view Expert Q&A content." }
  }

  // Check if user has Pro access
  const hasProSubscription = await hasProAccess(user.id)
  if (!hasProSubscription) {
    return { success: false, error: "Expert Q&A content is only available to Pro subscribers.", data: [] }
  }

  return await getExpertQAPostsData(page, limit, groupId);
}

// Action to check if user can view Expert Q&A content
export async function canViewExpertQA() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, canView: false, error: "Please log in to access Expert Q&A." }
  }

  const hasProSubscription = await hasProAccess(user.id)
  return { success: true, canView: hasProSubscription }
}

// ===== TYPE DEFINITIONS =====

export interface ExpertQAPost {
  id: string
  title: string
  content: string
  created_at: string
  content_type: 'expert_qa'
  tags: string[]
  user: {
    id: string
    name: string
    profile_picture_url: string | null
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