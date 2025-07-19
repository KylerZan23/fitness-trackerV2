-- Migration: Fix Leaderboard Functions Security Privileges
-- Issue: Leaderboard only shows current user's data due to RLS policies on workouts table
-- Solution: Add SECURITY DEFINER to functions so they can access all users' workout data

-- Fix the get_strength_leaderboard function
CREATE OR REPLACE FUNCTION get_strength_leaderboard(
    lift_type_pattern TEXT,
    result_limit INT DEFAULT 100
)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    name TEXT,
    profile_picture_url TEXT,
    best_e1rm NUMERIC,
    weight NUMERIC,
    reps INT,
    lift_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS policies
AS $$
BEGIN
    RETURN QUERY
    WITH user_best_lifts AS (
        -- For each user, find their best lift for the given exercise pattern based on e1RM
        SELECT
            w.user_id,
            calculate_e1rm(w.weight, w.reps) as e1rm,
            w.weight,
            w.reps,
            w.created_at,
            ROW_NUMBER() OVER(PARTITION BY w.user_id ORDER BY calculate_e1rm(w.weight, w.reps) DESC, w.created_at DESC) as rn
        FROM
            workouts w
        WHERE
            w.exercise_name ILIKE lift_type_pattern
            AND is_valid_for_e1rm(w.weight, w.reps) -- Use the existing helper function
    )
    -- Select the top lift for each user and join with their profile
    SELECT
        RANK() OVER (ORDER BY ubl.e1rm DESC) as "rank",
        ubl.user_id,
        p.name,
        p.profile_picture_url,
        ubl.e1rm as best_e1rm,
        ubl.weight,
        ubl.reps,
        ubl.created_at as lift_date
    FROM
        user_best_lifts ubl
    JOIN
        profiles p ON ubl.user_id = p.id
    WHERE
        ubl.rn = 1 -- Only the best lift per user
    ORDER BY
        "rank", p.name
    LIMIT result_limit;
END;
$$;

-- Fix the get_user_rank_for_lift function
CREATE OR REPLACE FUNCTION get_user_rank_for_lift(
    p_user_id UUID,
    lift_type_pattern TEXT
)
RETURNS TABLE (
    rank BIGINT,
    best_e1rm NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS policies
AS $$
BEGIN
    RETURN QUERY
    WITH user_best_lifts AS (
        -- For each user, find their best lift for the given exercise pattern based on e1RM
        SELECT
            w.user_id,
            calculate_e1rm(w.weight, w.reps) as e1rm,
            w.weight,
            w.reps,
            w.created_at,
            ROW_NUMBER() OVER(PARTITION BY w.user_id ORDER BY calculate_e1rm(w.weight, w.reps) DESC, w.created_at DESC) as rn
        FROM
            workouts w
        WHERE
            w.exercise_name ILIKE lift_type_pattern
            AND is_valid_for_e1rm(w.weight, w.reps)
    ),
    ranked_users AS (
        -- Rank users by their best e1RM (same logic as leaderboard)
        SELECT
            ubl.user_id,
            ubl.e1rm,
            RANK() OVER (ORDER BY ubl.e1rm DESC) as user_rank
        FROM
            user_best_lifts ubl
        WHERE
            ubl.rn = 1 -- Only the best lift per user
    )
    SELECT
        ru.user_rank as rank,
        ru.e1rm as best_e1rm
    FROM
        ranked_users ru
    WHERE
        ru.user_id = p_user_id;
END;
$$;

-- Create a policy to allow public access to basic profile data for leaderboard purposes
-- This allows the leaderboard functions to display user names and profile pictures
CREATE POLICY "Public read access for leaderboard display" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to read basic profile data

-- Grant execute permissions to authenticated users for both functions
GRANT EXECUTE ON FUNCTION get_strength_leaderboard(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank_for_lift(UUID, TEXT) TO authenticated;

-- Update function comments to reflect the security changes
COMMENT ON FUNCTION get_strength_leaderboard(TEXT, INT) IS 
'Calculates the top estimated 1-Rep Max (e1RM) for a given exercise pattern for all users.
Runs with SECURITY DEFINER to bypass RLS policies and access all users'' workout data for leaderboard purposes.
Parameters:
- lift_type_pattern: ILIKE pattern to match exercise names (e.g., ''%squat%'')
- result_limit: Maximum number of results to return (default 100)';

COMMENT ON FUNCTION get_user_rank_for_lift(UUID, TEXT) IS 
'Gets a user''s rank and best e1RM for a specific lift type.
Runs with SECURITY DEFINER to bypass RLS policies and calculate rank across all users.
Parameters:
- p_user_id: The user ID to get rank for
- lift_type_pattern: ILIKE pattern to match exercise names (e.g., ''%bench%'')';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Leaderboard functions updated with SECURITY DEFINER privileges to fix RLS policy restrictions';
END $$; 