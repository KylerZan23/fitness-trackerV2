-- Manual fix for Personal Records unit conversion issue
-- This fixes the specific user who entered PRs in lbs but they were stored incorrectly
-- 
-- The user entered:
-- - Squat: 225 lbs → should be stored as 102.1 kg  
-- - Bench: 185 lbs → should be stored as 83.9 kg
-- - Deadlift: 275 lbs → should be stored as 124.7 kg

-- Find and update the user's onboarding responses
-- Replace 'user_email_here' with the actual user's email
UPDATE profiles 
SET onboarding_responses = jsonb_set(
  jsonb_set(
    jsonb_set(
      onboarding_responses,
      '{squat1RMEstimate}',
      '102.1'::jsonb
    ),
    '{benchPress1RMEstimate}',
    '83.9'::jsonb
  ),
  '{deadlift1RMEstimate}',
  '124.7'::jsonb
)
WHERE email = 'user_email_here' 
  AND weight_unit = 'lbs'
  AND onboarding_responses IS NOT NULL;

-- Verify the update
SELECT 
  email,
  name,
  weight_unit,
  onboarding_responses->>'squat1RMEstimate' as squat_kg,
  onboarding_responses->>'benchPress1RMEstimate' as bench_kg,
  onboarding_responses->>'deadlift1RMEstimate' as deadlift_kg
FROM profiles 
WHERE email = 'user_email_here';

-- Note: After running this SQL, the user should see:
-- - Squat: 225 lbs (102.1 kg converted back to lbs for display)
-- - Bench: 185 lbs (83.9 kg converted back to lbs for display)  
-- - Deadlift: 275 lbs (124.7 kg converted back to lbs for display) 