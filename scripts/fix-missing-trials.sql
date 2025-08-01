-- Fix for users who signed up without trial_ends_at being set
-- This updates any users who have NULL trial_ends_at and are not premium
-- to get a 7-day trial starting from now

UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days',
    is_premium = COALESCE(is_premium, FALSE)
WHERE trial_ends_at IS NULL 
  AND (is_premium IS NULL OR is_premium = FALSE);

-- Show the affected users (for verification)
SELECT id, email, name, is_premium, trial_ends_at, created_at 
FROM profiles 
WHERE trial_ends_at > NOW() - INTERVAL '1 minute'  -- Recently updated trials
ORDER BY trial_ends_at DESC;