-- Function to get a user's rank for a specific lift type
-- This allows users to quickly see their position without scrolling through the entire leaderboard
CREATE OR REPLACE FUNCTION get_user_rank_for_lift(
    p_user_id UUID,
    lift_type_pattern TEXT
)
RETURNS TABLE (
    rank BIGINT,
    best_e1rm NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT
            w.user_id,
            calculate_e1rm(w.weight, w.reps) as e1rm,
            ROW_NUMBER() OVER(PARTITION BY w.user_id ORDER BY calculate_e1rm(w.weight, w.reps) DESC, w.created_at DESC) as rn,
            RANK() OVER (ORDER BY calculate_e1rm(w.weight, w.reps) DESC) as overall_rank
        FROM
            workouts w
        WHERE
            w.exercise_name ILIKE lift_type_pattern
            AND is_valid_for_e1rm(w.weight, w.reps)
    )
    SELECT
        ru.overall_rank as rank,
        ru.e1rm as best_e1rm
    FROM
        ranked_users ru
    WHERE
        ru.user_id = p_user_id AND ru.rn = 1;
END;
$$;

-- Add a comment to document the function
COMMENT ON FUNCTION get_user_rank_for_lift(UUID, TEXT) IS 
'Gets a user''s rank and best e1RM for a specific lift type.
Parameters:
- p_user_id: The UUID of the user to get the rank for
- lift_type_pattern: SQL LIKE pattern for exercise name (e.g., ''%bench%'', ''%deadlift%'')
Returns the user''s rank and their best e1RM for the specified exercise pattern.
If the user has no valid lifts for the pattern, returns no rows.'; 