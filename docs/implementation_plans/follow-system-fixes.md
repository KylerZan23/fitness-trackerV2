# Follow System Database Fixes

## Issues Identified

### 1. Community Feed Events Constraint Error
**Problem**: Follow actions were failing because `USER_FOLLOWED` was not allowed in the `community_feed_events` table.

**Error**: 
```
new row for relation "community_feed_events" violates check constraint "community_feed_events_event_type_check"
```

**Fix**: Add `USER_FOLLOWED` to allowed event types.

### 2. Foreign Key Relationship Error
**Problem**: `getFollowers()` and `getFollowing()` queries were failing because the `user_followers` table references `auth.users(id)` but queries expect relationships with `profiles` table.

**Error**: 
```
Could not find a relationship between 'user_followers' and 'profiles' in the schema cache
```

**Fix**: Update foreign key constraints to point to `profiles(id)` instead of `auth.users(id)`.

## SQL Fixes to Run Manually

### Fix 1: Allow USER_FOLLOWED Events
```sql
-- Fix community_feed_events constraint to allow USER_FOLLOWED events
ALTER TABLE public.community_feed_events 
DROP CONSTRAINT IF EXISTS community_feed_events_event_type_check;

ALTER TABLE public.community_feed_events 
ADD CONSTRAINT community_feed_events_event_type_check 
CHECK (event_type IN ('WORKOUT_COMPLETED', 'NEW_PB', 'STREAK_MILESTONE', 'NEW_POST', 'USER_FOLLOWED'));

-- Update the column comment
COMMENT ON COLUMN public.community_feed_events.event_type IS 'Type of event: WORKOUT_COMPLETED, NEW_PB, STREAK_MILESTONE, NEW_POST, USER_FOLLOWED';
```

### Fix 2: Update Foreign Key Relationships
```sql
-- Fix user_followers foreign key relationships
-- Drop existing foreign key constraints
ALTER TABLE public.user_followers 
DROP CONSTRAINT IF EXISTS user_followers_follower_id_fkey;

ALTER TABLE public.user_followers 
DROP CONSTRAINT IF EXISTS user_followers_following_id_fkey;

-- Add new foreign key constraints pointing to profiles table
ALTER TABLE public.user_followers 
ADD CONSTRAINT user_followers_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_followers 
ADD CONSTRAINT user_followers_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the follow activity trigger function
CREATE OR REPLACE FUNCTION create_follow_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Create activity feed event for the follow action
  INSERT INTO public.community_feed_events (
    user_id,
    event_type,
    metadata,
    created_at
  ) VALUES (
    NEW.follower_id,
    'USER_FOLLOWED',
    json_build_object(
      'followed_user_id', NEW.following_id,
      'followed_user_name', (SELECT name FROM public.profiles WHERE id = NEW.following_id)
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Expected Results After Fixes

### ✅ Follow Actions
- Follow/unfollow buttons will work properly
- No more constraint violation errors
- Follow events will be created in community feed

### ✅ Profile Page
- "Following" section will load correctly
- "Followers" section will load correctly
- Mutual follows will display properly

### ✅ User Search
- Follow status will be checked correctly
- Follow/unfollow from search results will work

### ✅ Activities Feed
- Activities from followed users will display
- Follow events will appear in community feed

## Verification Steps

1. Follow a user from search results
2. Check that follow succeeds without errors
3. Go to profile page and click "Following"
4. Verify that followed users are displayed
5. Check that follower counts update correctly
6. Verify activities from followed users appear in Activities tab

## Root Cause Analysis

The original migration created `user_followers` table with foreign keys pointing to `auth.users(id)`:
```sql
follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

But the Supabase queries were expecting relationships with the `profiles` table:
```sql
profiles!user_followers_follower_id_fkey (...)
```

This mismatch caused the foreign key relationship errors. The fix aligns the database schema with the query expectations by pointing foreign keys to `profiles(id)` instead. 