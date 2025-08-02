-- Migration: Add Expert Q&A Content Type to Community Posts
-- This migration adds content type classification to support Pro-exclusive Expert Q&A content

--------------------------------------------------
-- 1. Add content_type column to community_posts table
--------------------------------------------------
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'general' 
CHECK (content_type IN ('general', 'expert_qa'));

-- Add comment for documentation
COMMENT ON COLUMN public.community_posts.content_type IS 'Content type: general (accessible to all), expert_qa (Pro subscribers only)';

--------------------------------------------------
-- 2. Update existing posts to have 'general' content type
--------------------------------------------------
UPDATE public.community_posts 
SET content_type = 'general' 
WHERE content_type IS NULL;

--------------------------------------------------
-- 3. Create index for efficient content type filtering
--------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_community_posts_content_type 
ON public.community_posts(content_type);

--------------------------------------------------
-- 4. Update RLS Policies for Expert Q&A Access Control
--------------------------------------------------
-- Drop the existing general policy
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON community_posts;

-- Create new policy that restricts Expert Q&A content to Pro users
CREATE POLICY "Content access based on subscription tier" ON community_posts
FOR SELECT USING (
  content_type = 'general' OR 
  (content_type = 'expert_qa' AND has_pro_access(auth.uid()))
);

-- Keep the existing policy for post management unchanged
-- "Users can manage their own posts" policy remains the same

--------------------------------------------------
-- 5. Grant necessary permissions (already granted, but ensuring consistency)
--------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;

--------------------------------------------------
-- 6. Add helper function to check if user can create Expert Q&A content
--------------------------------------------------
CREATE OR REPLACE FUNCTION can_create_expert_qa(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only Pro users can create Expert Q&A content
    RETURN has_pro_access(user_id);
END;
$$ LANGUAGE plpgsql;

-- Add comment for the helper function
COMMENT ON FUNCTION can_create_expert_qa(UUID) IS 'Check if user has permission to create Expert Q&A content (Pro tier required)';

--------------------------------------------------
-- 7. Create policy for Expert Q&A content creation
--------------------------------------------------
-- Add additional check for Expert Q&A content creation
CREATE POLICY "Pro users can create Expert Q&A content" ON community_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  (content_type = 'general' OR (content_type = 'expert_qa' AND has_pro_access(auth.uid())))
);

-- Grant permission to use the helper function
GRANT EXECUTE ON FUNCTION can_create_expert_qa(UUID) TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Expert Q&A content type successfully added to community posts system.';
  RAISE NOTICE 'Pro users can now create and view Expert Q&A content exclusively.';
END $$;