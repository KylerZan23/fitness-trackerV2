-- Migration: Fix community_feed_events constraint to allow USER_FOLLOWED events
-- Issue: Follow actions are failing because USER_FOLLOWED is not in the allowed event_type constraint

-- Drop the existing constraint
ALTER TABLE public.community_feed_events 
DROP CONSTRAINT IF EXISTS community_feed_events_event_type_check;

-- Add the updated constraint that includes USER_FOLLOWED
ALTER TABLE public.community_feed_events 
ADD CONSTRAINT community_feed_events_event_type_check 
CHECK (event_type IN ('WORKOUT_COMPLETED', 'NEW_PB', 'STREAK_MILESTONE', 'NEW_POST', 'USER_FOLLOWED'));

-- Update the column comment to reflect the new allowed event type
COMMENT ON COLUMN public.community_feed_events.event_type IS 'Type of event: WORKOUT_COMPLETED, NEW_PB, STREAK_MILESTONE, NEW_POST, USER_FOLLOWED';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Community feed events constraint updated to allow USER_FOLLOWED events.';
END $$; 