-- Migration: Add Premium Status and Trial Management to Profiles Table
-- This migration adds subscription status tracking to support free trials and premium subscriptions

--------------------------------------------------
-- 1. Add is_premium column to profiles table
--------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN profiles.is_premium IS 'Indicates if the user has a premium (paid) subscription.';

--------------------------------------------------
-- 2. Add trial_ends_at column for free trial management
--------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN profiles.trial_ends_at IS 'Timestamp when the user''s free trial ends.';

--------------------------------------------------
-- 3. Create index for efficient trial status queries
--------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

--------------------------------------------------
-- 4. Update existing users to start 7-day trial
--------------------------------------------------
-- Set trial_ends_at to 7 days from now for all existing users who don't have it set
-- This ensures existing users get the benefit of the trial period
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE trial_ends_at IS NULL AND is_premium = FALSE;

--------------------------------------------------
-- 5. Create helper function to check if user has active access
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
    RETURN (
        user_record.is_premium = TRUE OR 
        (user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION has_active_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_access(UUID) TO anon;

--------------------------------------------------
-- 6. Create function to start trial for new users
--------------------------------------------------
CREATE OR REPLACE FUNCTION start_user_trial(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Set trial end date to 7 days from now if not already set
    UPDATE profiles 
    SET trial_ends_at = NOW() + INTERVAL '7 days'
    WHERE id = user_id 
      AND trial_ends_at IS NULL 
      AND is_premium = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION start_user_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_trial(UUID) TO anon;

--------------------------------------------------
-- 7. Log migration completion
--------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added premium status and trial management columns to profiles table';
    RAISE NOTICE 'All existing users have been granted a 7-day trial period';
    RAISE NOTICE 'Helper functions created: has_active_access() and start_user_trial()';
END $$; 