-- Community Groups Migration
-- This migration creates tables for community groups and posts functionality

-- Community Groups Table
CREATE TABLE community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    group_type TEXT NOT NULL,
    cover_image_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for community_groups
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_groups
CREATE POLICY "Authenticated users can view groups" ON community_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create groups" ON community_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Group Members Junction Table
CREATE TABLE community_group_members (
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Enable RLS for community_group_members
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_group_members
CREATE POLICY "Users can see group members" ON community_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join/leave groups" ON community_group_members FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Community Posts Table (for blog-like posts)
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES community_groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Enable RLS for community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Public posts are viewable by everyone" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can manage their own posts" ON community_posts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_community_groups_created_by ON community_groups(created_by);
CREATE INDEX idx_community_groups_group_type ON community_groups(group_type);
CREATE INDEX idx_community_group_members_group_id ON community_group_members(group_id);
CREATE INDEX idx_community_group_members_user_id ON community_group_members(user_id);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_group_id ON community_posts(group_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON community_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_posts TO authenticated;

-- Add helpful comments for documentation
COMMENT ON TABLE community_groups IS 'Stores community groups for specialized fitness communities';
COMMENT ON TABLE community_group_members IS 'Junction table for group membership and roles';
COMMENT ON TABLE community_posts IS 'Stores user-generated blog-style posts within groups or globally';
COMMENT ON COLUMN community_groups.group_type IS 'Type of group: Powerlifting, Bodybuilding, etc.';
COMMENT ON COLUMN community_group_members.role IS 'User role within the group: member or admin';
COMMENT ON COLUMN community_posts.group_id IS 'NULL for global posts, UUID for group-specific posts';
COMMENT ON COLUMN community_posts.tags IS 'Array of tags for categorizing posts'; 