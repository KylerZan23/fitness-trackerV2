-- Fix Community Feed Events RLS Policy
-- Run this SQL in your Supabase Dashboard SQL Editor

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Only system can create community feed events" ON community_feed_events;

-- Create a new policy that allows authenticated users to insert their own events
CREATE POLICY "Users can create their own community feed events" ON community_feed_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant INSERT permission to authenticated users
GRANT INSERT ON community_feed_events TO authenticated;

-- Verify the policy was created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'community_feed_events'; 