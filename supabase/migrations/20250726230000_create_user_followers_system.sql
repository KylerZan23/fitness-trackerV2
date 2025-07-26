-- Migration: Create user followers/following system
-- This migration creates the complete social following functionality

-- Create user_followers table for many-to-many following relationships
CREATE TABLE IF NOT EXISTS public.user_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique relationships and prevent self-following
  CONSTRAINT unique_follow_relationship UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_followers_follower_id ON public.user_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON public.user_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_created_at ON public.user_followers(created_at);

-- Add follower count columns to profiles table (for denormalized counts)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles  
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_followers table

-- Users can view all following relationships (for public follower lists)
CREATE POLICY "Users can view all follow relationships"
  ON public.user_followers FOR SELECT
  USING (true);

-- Users can only create follows where they are the follower
CREATE POLICY "Users can create follows for themselves"
  ON public.user_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete follows where they are the follower
CREATE POLICY "Users can delete their own follows"
  ON public.user_followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to update follower counts when relationships change
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an INSERT
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for the follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for the user being followed
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  END IF;
  
  -- If this is a DELETE
  IF TG_OP = 'DELETE' THEN
    -- Decrement following count for the follower
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for the user being unfollowed
    UPDATE public.profiles 
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update follower counts
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR DELETE ON public.user_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Function to get following status between two users
CREATE OR REPLACE FUNCTION get_follow_status(follower_user_id UUID, following_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_followers 
    WHERE follower_id = follower_user_id 
    AND following_id = following_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mutual follow status
CREATE OR REPLACE FUNCTION get_mutual_follow_status(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_followers f1
    INNER JOIN public.user_followers f2 ON f1.follower_id = f2.following_id 
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity feed entries for follow events
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

-- Create trigger for follow activity
CREATE TRIGGER create_follow_activity_trigger
  AFTER INSERT ON public.user_followers
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_activity();

-- Initialize follower counts for existing users
UPDATE public.profiles SET 
  followers_count = (
    SELECT COUNT(*) FROM public.user_followers 
    WHERE following_id = profiles.id
  ),
  following_count = (
    SELECT COUNT(*) FROM public.user_followers 
    WHERE follower_id = profiles.id
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'User followers system migration completed successfully.';
END $$; 