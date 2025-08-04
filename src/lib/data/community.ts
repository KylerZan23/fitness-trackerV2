// src/lib/data/community.ts
import { createClient } from '@/utils/supabase/server';

// ===== GROUPS =====

export async function getCommunityGroupsData() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('community_groups')
    .select(`
      *,
      members:community_group_members(count),
      created_by_user:profiles!community_groups_created_by_fkey(name, profile_picture_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching community groups:", error);
    return { success: false, error: "Failed to load communities." };
  }
  return { success: true, data };
}

export async function getCommunityGroupData(groupId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('community_groups')
    .select(`
      *,
      members:community_group_members(count),
      created_by_user:profiles!community_groups_created_by_fkey(name, profile_picture_url)
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    console.error("Error fetching community group:", error);
    return { success: false, error: "Failed to load community." };
  }
  return { success: true, data };
}

export async function createGroupAndAddAdmin(name: string, description: string, groupType: string, creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_group_and_add_admin', {
    group_name: name,
    group_description: description,
    group_type_param: groupType,
    creator_id: creatorId
  });

  if (error) {
    console.error("Error creating community group via RPC:", error);
    return { success: false, error: "Failed to create group." };
  }
  return { success: true, data };
}

export async function joinGroup(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('community_group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });
  
  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: "You are already a member of this group." };
    }
    console.error("Error joining community group:", error);
    return { success: false, error: "Failed to join group." };
  }
  return { success: true };
}

export async function leaveGroup(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('community_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error leaving community group:", error);
    return { success: false, error: "Failed to leave group." };
  }
  return { success: true };
}

export async function getGroupMembership(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('community_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error("Error checking group membership:", error);
    return { success: false, isMember: false };
  }

  return { 
    success: true, 
    isMember: !!data,
    role: data?.role || null
  };
}

// ===== POSTS =====

export async function createPostData(postData: { user_id: string; title: string; content: string; group_id?: string; content_type: string; tags?: string[] }) {
    const supabase = await createClient();
    const { error } = await supabase.from('community_posts').insert(postData);

    if (error) {
        console.error("Error creating post:", error);
        return { success: false, error: "Failed to create post." };
    }
    return { success: true };
}

export async function getGroupPostsData(groupId: string, page: number = 1, limit: number = 20) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            user:profiles!community_posts_user_id_fkey(name, profile_picture_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching group posts:", error);
        return { success: false, error: "Failed to load posts." };
    }
    return { success: true, data };
}

export async function getAllPostsData(page: number = 1, limit: number = 20) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            user:profiles!community_posts_user_id_fkey(name, profile_picture_url),
            group:community_groups(name)
        `)
        .is('group_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching posts:", error);
        return { success: false, error: "Failed to load posts." };
    }
    return { success: true, data };
}

export async function getGroupDetailsAndPostsData(groupId: string, page: number = 1, limit: number = 20) {
    const supabase = await createClient();
    const { data: groupData, error: groupError } = await supabase
        .from('community_groups')
        .select('id, name, description')
        .eq('id', groupId)
        .single();

    if (groupError) {
        console.error("Error fetching group details:", groupError);
        return { success: false, error: "Community not found." };
    }

    const offset = (page - 1) * limit;
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
        .range(offset, offset + limit - 1);

    if (postsError) {
        console.error("Error fetching group posts:", postsError);
        return { success: false, error: "Failed to load posts." };
    }

    return { success: true, data: { ...groupData, posts: postsData || [] } };
}

export async function getGlobalPostsCountData() {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .is('group_id', null);

    if (error) {
        console.error("Error counting global posts:", error);
        return { success: false, error: "Failed to count posts." };
    }
    return { success: true, count: count || 0 };
}

export async function getGroupPostsCountData(groupId: string) {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

    if (error) {
        console.error("Error counting group posts:", error);
        return { success: false, error: "Failed to count posts." };
    }
    return { success: true, count: count || 0 };
}

export async function getPostData(postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('community_posts')
        .select('id, group_id')
        .eq('id', postId)
        .single();

    if (error || !data) {
        return { success: false, error: "Post not found." };
    }
    return { success: true, data };
}

// ===== COMMENTS =====

export async function createCommentData(commentData: { user_id: string; post_id: string; content: string; }) {
    const supabase = await createClient();
    const { error } = await supabase.from('community_comments').insert(commentData);

    if (error) {
        console.error("Error creating comment:", error);
        return { success: false, error: "Failed to create comment." };
    }
    return { success: true };
}

export async function getPostCommentsData(postId: string) {
    const supabase = await createClient();
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
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return { success: false, error: "Failed to load comments." };
    }
    return { success: true, data: data || [] };
}

export async function updateCommentData(commentId: string, userId: string, content: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('community_comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error updating comment:", error);
        return { success: false, error: "Failed to update comment." };
    }
    return { success: true };
}

export async function deleteCommentData(commentId: string, userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error deleting comment:", error);
        return { success: false, error: "Failed to delete comment." };
    }
    return { success: true };
}

export async function getPostCommentsCountData(postId: string) {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    if (error) {
        console.error("Error counting comments:", error);
        return { success: false, error: "Failed to count comments." };
    }
    return { success: true, count: count || 0 };
}

// ===== VOTES =====

export async function getExistingVote(userId: string, postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('community_post_votes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error checking existing vote:", error);
        return { success: false, error: "Failed to check existing vote." };
    }
    return { success: true, data };
}

export async function deleteVote(voteId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('community_post_votes')
        .delete()
        .eq('id', voteId);

    if (error) {
        console.error("Error removing vote:", error);
        return { success: false, error: "Failed to remove vote." };
    }
    return { success: true };
}

export async function updateVote(voteId: string, voteType: 'up' | 'down') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('community_post_votes')
        .update({ vote_type: voteType })
        .eq('id', voteId);

    if (error) {
        console.error("Error updating vote:", error);
        return { success: false, error: "Failed to update vote." };
    }
    return { success: true };
}

export async function createVote(userId: string, postId: string, voteType: 'up' | 'down') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('community_post_votes')
        .insert({
            user_id: userId,
            post_id: postId,
            vote_type: voteType,
        });

    if (error) {
        console.error("Error creating vote:", error);
        return { success: false, error: "Failed to create vote." };
    }
    return { success: true };
}

export async function getPostVoteCountsData(postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_post_vote_counts', {
        post_uuid: postId
    });

    if (error) {
        console.error("Error getting vote counts:", error);
        return { success: false, error: "Failed to get vote counts." };
    }
    return { success: true, data };
}

export async function getUserVoteOnPostData(userId: string, postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('community_post_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error getting user vote:", error);
        return { success: false, error: "Failed to get user vote." };
    }
    return { success: true, data };
}

// ===== ACTIVITY FEED =====

export async function getFollowingIds(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('user_followers')
        .select('following_id')
        .eq('follower_id', userId);

    if (error) {
        console.error('Error fetching following list:', error);
        return { success: false, error: 'Failed to fetch following list' };
    }
    return { success: true, data: data.map(f => f.following_id) };
}

export async function getWorkoutGroupsData(userIds: string[], limit: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('workout_groups')
        .select('id, name, duration, created_at, user_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching workout groups:', error);
        return { success: false, error: 'Failed to fetch workout groups' };
    }
    return { success: true, data };
}

export async function getUserProfilesData(userIds: string[]) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, profile_picture_url')
        .in('id', userIds);

    if (error) {
        console.error('Error fetching user profiles:', error);
        return { success: false, error: 'Failed to fetch user profiles' };
    }
    return { success: true, data };
}

export async function getWorkoutsData(userIds: string[], limit: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('workouts')
        .select('id, exercise_name, sets, reps, weight, duration, workout_group_id, user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching workouts:', error);
        return { success: false, error: 'Failed to fetch activities' };
    }
    return { success: true, data };
}

export async function getPREventsData(userIds: string[], limit: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('community_feed_events')
        .select('user_id, event_type, metadata, created_at')
        .in('user_id', userIds)
        .eq('event_type', 'NEW_PB')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching PR events:', error);
    }
    return { success: true, data };
}

export async function getLikesData(activityIds: string[]) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('activity_likes')
        .select('activity_id, user_id')
        .in('activity_id', activityIds);

    if (error) {
        console.error('Error fetching likes data:', error);
    }
    return { success: true, data };
}

export async function getCommentsData(activityIds: string[]) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('activity_comments')
        .select('activity_id, id')
        .in('activity_id', activityIds);
        
    if (error) {
        console.error('Error fetching comments data:', error);
    }
    return { success: true, data };
}

// ===== EXPERT Q&A =====

export async function getExpertQAPostsData(page: number = 1, limit: number = 20, groupId?: string) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;
    let query = supabase
        .from('community_posts')
        .select(`
            id,
            title,
            content,
            created_at,
            content_type,
            tags,
            user:profiles!community_posts_user_id_fkey(id, name, profile_picture_url)
        `)
        .eq('content_type', 'expert_qa')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (groupId) {
        query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching Expert Q&A posts:", error);
        return { success: false, error: "Failed to load Expert Q&A content." };
    }
    return { success: true, data: data || [] };
}
