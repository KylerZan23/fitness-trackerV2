-- Migration: Fix user_followers foreign key relationships
-- Issue: user_followers table references auth.users but queries expect relationships with profiles table

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

-- Update the follow activity trigger function to handle potential foreign key changes
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

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'User followers foreign key relationships updated to point to profiles table.';
END $$; 