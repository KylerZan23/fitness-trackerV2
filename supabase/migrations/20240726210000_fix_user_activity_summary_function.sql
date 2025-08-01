-- Fix user activity summary function to remove Strava references
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id_param UUID, period_start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'))
RETURNS JSON AS $$
DECLARE
    summary_data JSON;
BEGIN
    -- Calculate activity summary without Strava data
    WITH workout_stats AS (
        SELECT
            COUNT(*) as total_workout_sessions,
            AVG(duration) as avg_workout_duration_minutes,
            COALESCE(COUNT(DISTINCT DATE(created_at)), 0) as workout_days_this_week,
            COALESCE(COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at >= (period_start_date - INTERVAL '7 days') AND created_at < period_start_date), 0) as workout_days_last_week
        FROM workouts
        WHERE user_id = user_id_param
          AND created_at >= period_start_date
    ),
    muscle_group_summary AS (
        SELECT
            jsonb_object_agg(
                COALESCE(muscle_group, 'Unknown'),
                jsonb_build_object(
                    'total_sets', COALESCE(SUM(sets), 0),
                    'total_reps', COALESCE(SUM(sets * reps), 0),
                    'avg_weight', COALESCE(AVG(weight), 0)
                )
            ) as muscle_groups
        FROM workouts
        WHERE user_id = user_id_param
          AND created_at >= period_start_date
          AND muscle_group IS NOT NULL
        GROUP BY muscle_group
    ),
    exercise_progression AS (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'exercise_name', exercise_name,
                    'trend', 'stable',
                    'recent_weight', recent_weight,
                    'weight_change', 0
                )
            ) as dynamic_exercise_progression
        FROM (
            SELECT DISTINCT 
                exercise_name,
                AVG(weight) as recent_weight
            FROM workouts
            WHERE user_id = user_id_param
              AND created_at >= period_start_date
            GROUP BY exercise_name
            LIMIT 5
        ) exercises
    )
    SELECT jsonb_build_object(
        'total_workout_sessions', COALESCE(ws.total_workout_sessions, 0),
        'total_run_sessions', 0, -- No Strava data
        'avg_workout_duration_minutes', COALESCE(ws.avg_workout_duration_minutes, 0),
        'avg_run_distance_meters', 0, -- No Strava data
        'avg_run_duration_seconds', 0, -- No Strava data
        'muscle_group_summary', COALESCE(mgs.muscle_groups, '{}'::jsonb),
        'dynamic_exercise_progression', COALESCE(ep.dynamic_exercise_progression, '[]'::jsonb),
        'last_3_runs', '[]'::jsonb, -- No Strava data
        'recent_run_pace_trend', 'no_data',
        'workout_days_this_week', COALESCE(ws.workout_days_this_week, 0),
        'workout_days_last_week', COALESCE(ws.workout_days_last_week, 0)
    ) INTO summary_data
    FROM workout_stats ws
    CROSS JOIN muscle_group_summary mgs
    CROSS JOIN exercise_progression ep;

    RETURN summary_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;