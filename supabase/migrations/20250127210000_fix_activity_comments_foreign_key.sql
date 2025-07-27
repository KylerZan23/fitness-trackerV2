-- Migration: Fix Activity Comments Foreign Key Relationship
-- Issue: Missing foreign key relationship between activity_comments and profiles
-- Solution: Add proper foreign key constraint to enable joins

-- Add foreign key constraint from activity_comments.user_id to profiles.id
ALTER TABLE public.activity_comments 
ADD CONSTRAINT activity_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT activity_comments_user_id_fkey ON public.activity_comments IS 
'Foreign key relationship to profiles table for user information in comments'; 