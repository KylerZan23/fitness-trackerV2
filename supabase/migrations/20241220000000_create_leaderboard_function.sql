-- This function calculates the top estimated 1-Rep Max (e1RM) for a given exercise pattern for all users.
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

-- Create indexes to optimize the leaderboard function performance
CREATE INDEX IF NOT EXISTS idx_workouts_exercise_name_user_id 
ON workouts(exercise_name, user_id);

CREATE INDEX IF NOT EXISTS idx_workouts_created_at 
ON workouts(created_at DESC);

-- Add a comment to document the function
COMMENT ON FUNCTION get_strength_leaderboard(TEXT, INT) IS 
'Calculates strength leaderboard for a given exercise pattern based on estimated 1-Rep Max (e1RM). 
Parameters:
- lift_type_pattern: SQL LIKE pattern for exercise name (e.g., ''%bench%'', ''%deadlift%'')
- result_limit: Maximum number of results to return (default 100)
Returns ranked list of users with their best lifts for the specified exercise pattern.'; 