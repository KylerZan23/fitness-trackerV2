-- Migration: Create RPC function to handle new user profile creation
-- This function runs with elevated privileges to safely create a profile
-- immediately after user signup, bypassing potential RLS issues.

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the new profile with default values for nullable fields
  INSERT INTO public.profiles (
    id,
    email,
    name,
    age,
    fitness_goals,
    weight_unit,
    onboarding_completed,
    is_premium,
    trial_ends_at
  )
  VALUES (
    user_id,
    user_email,
    user_name,
    25, -- Default age
    'Get fit', -- Default goal
    'kg', -- Default weight unit
    FALSE, -- Onboarding not completed
    FALSE, -- Not premium
    NOW() + INTERVAL '7 days' -- 7-day trial
  );
END;
$$;

-- Grant execution rights to the 'authenticated' role
-- so that any logged-in user can call this function.
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user(UUID, TEXT, TEXT) TO authenticated; 