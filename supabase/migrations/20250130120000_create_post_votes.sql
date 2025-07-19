-- Migration: Create post voting system
-- Date: 2025-01-30
-- Description: Adds ability for users to vote thumbs up/down on community posts

-- Create community_post_votes table
CREATE TABLE community_post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one vote per user per post
    UNIQUE(user_id, post_id)
);

-- Enable RLS for community_post_votes
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_post_votes
CREATE POLICY "Users can view all post votes" ON community_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" ON community_post_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON community_post_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON community_post_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX idx_community_post_votes_vote_type ON community_post_votes(vote_type);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON community_post_votes TO authenticated;

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_community_post_votes_updated_at 
    BEFORE UPDATE ON community_post_votes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table and column comments for documentation
COMMENT ON TABLE community_post_votes IS 'Stores user votes (thumbs up/down) on community posts';
COMMENT ON COLUMN community_post_votes.user_id IS 'References the user who cast the vote';
COMMENT ON COLUMN community_post_votes.post_id IS 'References the community post being voted on';
COMMENT ON COLUMN community_post_votes.vote_type IS 'Type of vote: up (thumbs up) or down (thumbs down)';
COMMENT ON COLUMN community_post_votes.created_at IS 'Timestamp when the vote was created';
COMMENT ON COLUMN community_post_votes.updated_at IS 'Timestamp when the vote was last updated';

-- Create a function to get vote counts for a post
CREATE OR REPLACE FUNCTION get_post_vote_counts(post_uuid UUID)
RETURNS TABLE(
    upvotes BIGINT,
    downvotes BIGINT,
    total_votes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
        COUNT(*) as total_votes
    FROM community_post_votes 
    WHERE post_id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_post_vote_counts(UUID) TO authenticated; 