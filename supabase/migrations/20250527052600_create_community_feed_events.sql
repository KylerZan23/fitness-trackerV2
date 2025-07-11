-- Create community_feed_events table for in-app community feed
CREATE TABLE IF NOT EXISTS community_feed_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('WORKOUT_COMPLETED', 'NEW_PB', 'STREAK_MILESTONE', 'NEW_POST')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_community_feed_events_created_at ON community_feed_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_events_user_id ON community_feed_events(user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_events_event_type ON community_feed_events(event_type);

-- Enable RLS
ALTER TABLE community_feed_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read community feed events
CREATE POLICY "Users can read all community feed events" ON community_feed_events
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policy: Authenticated users can insert their own community feed events
CREATE POLICY "Users can create their own community feed events" ON community_feed_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON community_feed_events TO authenticated;
GRANT INSERT ON community_feed_events TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE community_feed_events IS 'Stores community feed events for the in-app social feed';
COMMENT ON COLUMN community_feed_events.event_type IS 'Type of event: WORKOUT_COMPLETED, NEW_PB, STREAK_MILESTONE, NEW_POST';
COMMENT ON COLUMN community_feed_events.metadata IS 'JSON data containing event-specific details like workout name, PB values, etc.'; 