-- Migration: Create Activity Social Tables
-- Purpose: Add likes and comments functionality for workout activities

-- Create activity_likes table
CREATE TABLE IF NOT EXISTS public.activity_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL, -- References the activity ID from FollowedUserActivity
  activity_type TEXT NOT NULL DEFAULT 'workout_session',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one like per user per activity
  UNIQUE(user_id, activity_id)
);

-- Create activity_comments table
CREATE TABLE IF NOT EXISTS public.activity_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL, -- References the activity ID from FollowedUserActivity
  activity_type TEXT NOT NULL DEFAULT 'workout_session',
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON public.activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON public.activity_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_created_at ON public.activity_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON public.activity_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_likes
CREATE POLICY "Users can view all activity likes" ON public.activity_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own activity likes" ON public.activity_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity likes" ON public.activity_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for activity_comments
CREATE POLICY "Users can view all activity comments" ON public.activity_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own activity comments" ON public.activity_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity comments" ON public.activity_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity comments" ON public.activity_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp for comments
CREATE OR REPLACE FUNCTION update_activity_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_activity_comments_updated_at
  BEFORE UPDATE ON public.activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_comments_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.activity_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_comments TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.activity_likes IS 'Stores likes for workout activities in the community feed';
COMMENT ON TABLE public.activity_comments IS 'Stores comments for workout activities in the community feed';
COMMENT ON COLUMN public.activity_likes.activity_id IS 'References the activity ID from getFollowedUsersActivities (e.g., group-123, individual-456)';
COMMENT ON COLUMN public.activity_comments.activity_id IS 'References the activity ID from getFollowedUsersActivities (e.g., group-123, individual-456)'; 