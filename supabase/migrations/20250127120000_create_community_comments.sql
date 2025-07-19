-- Migration: Create community comments system
-- Description: Adds commenting functionality to community posts
-- Date: 2025-01-27

-- Create community_comments table
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for community_comments
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_comments
CREATE POLICY "Users can view all comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON community_comments FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_created_at ON community_comments(created_at DESC);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON community_comments TO authenticated;

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_comments_updated_at 
    BEFORE UPDATE ON community_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table and column comments for documentation
COMMENT ON TABLE community_comments IS 'Stores user comments on community posts';
COMMENT ON COLUMN community_comments.user_id IS 'References the user who wrote the comment';
COMMENT ON COLUMN community_comments.post_id IS 'References the community post being commented on';
COMMENT ON COLUMN community_comments.content IS 'The text content of the comment';
COMMENT ON COLUMN community_comments.created_at IS 'Timestamp when the comment was created';
COMMENT ON COLUMN community_comments.updated_at IS 'Timestamp when the comment was last updated'; 