-- Migration: Fix Trial Timezone Issues and Ensure Proper Trial Data
-- This migration addresses timezone inconsistencies in trial calculations
-- and ensures all users have proper trial end dates

--------------------------------------------------
-- 1. Fix existing users with incorrect trial data
--------------------------------------------------

-- Update users who have NULL trial_ends_at to get a proper 7-day trial
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days',
    is_premium = COALESCE(is_premium, FALSE)
WHERE trial_ends_at IS NULL 
  AND (is_premium IS NULL OR is_premium = FALSE);

-- Fix users who have trial_ends_at in the past but should still have access
-- (This handles cases where timezone issues caused premature expiration)
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE trial_ends_at < NOW() 
  AND is_premium = FALSE 
  AND created_at > NOW() - INTERVAL '14 days'; -- Only fix recent signups

--------------------------------------------------
-- 2. Improve the has_active_access function for better timezone handling
--------------------------------------------------

CREATE OR REPLACE FUNCTION has_active_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user's subscription status
    SELECT is_premium, trial_ends_at 
    INTO user_record 
    FROM profiles 
    WHERE id = user_id;
    
    -- Return true if user has premium subscription OR trial hasn't expired
    -- Use UTC comparison to avoid timezone issues
    RETURN (
        user_record.is_premium = TRUE OR 
        (user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() AT TIME ZONE 'UTC')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION has_active_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_access(UUID) TO anon;

--------------------------------------------------
-- 3. Improve the start_user_trial function for consistent timezone handling
--------------------------------------------------

CREATE OR REPLACE FUNCTION start_user_trial(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Set trial end date to 7 days from now using UTC
    -- This ensures consistent timezone handling across all environments
    UPDATE profiles 
    SET trial_ends_at = (NOW() AT TIME ZONE 'UTC') + INTERVAL '7 days'
    WHERE id = user_id 
      AND trial_ends_at IS NULL 
      AND is_premium = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION start_user_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_trial(UUID) TO anon;

--------------------------------------------------
-- 4. Add validation constraint to ensure trial_ends_at is always in the future when set
--------------------------------------------------

-- Add a check constraint to prevent setting trial_ends_at in the past
ALTER TABLE profiles 
ADD CONSTRAINT check_trial_ends_at_future 
CHECK (trial_ends_at IS NULL OR trial_ends_at > NOW() AT TIME ZONE 'UTC');

--------------------------------------------------
-- 5. Create a function to get trial status with detailed information
--------------------------------------------------

CREATE OR REPLACE FUNCTION get_trial_status(user_id UUID)
RETURNS TABLE(
    is_premium BOOLEAN,
    trial_ends_at TIMESTAMPTZ,
    is_trial_active BOOLEAN,
    days_remaining INTEGER,
    has_access BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
    days_remaining_val INTEGER;
BEGIN
    -- Get user's subscription status
    SELECT is_premium, trial_ends_at 
    INTO user_record 
    FROM profiles 
    WHERE id = user_id;
    
    -- Calculate days remaining
    IF user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() AT TIME ZONE 'UTC' THEN
        days_remaining_val := EXTRACT(DAY FROM (user_record.trial_ends_at - (NOW() AT TIME ZONE 'UTC')))::INTEGER;
    ELSE
        days_remaining_val := 0;
    END IF;
    
    -- Return detailed trial status
    RETURN QUERY SELECT
        user_record.is_premium,
        user_record.trial_ends_at,
        (user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() AT TIME ZONE 'UTC') as is_trial_active,
        days_remaining_val,
        (user_record.is_premium = TRUE OR (user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() AT TIME ZONE 'UTC')) as has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_status(UUID) TO anon;

--------------------------------------------------
-- 6. Log migration completion
--------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Fixed trial timezone issues and improved trial management';
    RAISE NOTICE 'Updated has_active_access() and start_user_trial() functions for UTC consistency';
    RAISE NOTICE 'Added validation constraint to prevent past trial end dates';
    RAISE NOTICE 'Created get_trial_status() function for detailed trial information';
END $$; 