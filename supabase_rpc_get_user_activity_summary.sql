CREATE OR REPLACE FUNCTION get_user_activity_summary(
    user_id_param UUID,
    period_days_param INT
)
RETURNS jsonb AS $$
DECLARE
    result_summary jsonb;
    v_muscle_summary_data jsonb;

    v_total_workout_sessions INT := 0;
    v_total_run_sessions INT := 0;
    v_avg_workout_duration_minutes NUMERIC;
    v_avg_run_distance_meters NUMERIC;
    v_avg_run_duration_seconds NUMERIC;
    v_dynamic_exercise_progression jsonb := '[]'::jsonb;
    v_last_3_runs jsonb := '[]'::jsonb;
    v_recent_run_pace_trend TEXT;
    v_workout_days_this_week INT := 0;
    v_workout_days_last_week INT := 0;
    v_user_weight_unit TEXT := 'kg'; -- Default to kg

    TOP_N_EXERCISES CONSTANT INT := 3;
    SESSIONS_FOR_PROGRESSION CONSTANT INT := 3;
    NUM_RECENT_RUNS_FOR_LIST CONSTANT INT := 3;

    current_week_start DATE;
    last_week_start DATE;
    period_start_date TIMESTAMPTZ;
    mid_period_date TIMESTAMPTZ;

BEGIN
    period_start_date := NOW() - (period_days_param || ' days')::INTERVAL;
    mid_period_date := period_start_date + (period_days_param / 2.0 || ' days')::INTERVAL;

    current_week_start := (NOW()::DATE - (EXTRACT(ISODOW FROM NOW()) - 1 || ' days')::INTERVAL)::DATE;
    last_week_start := current_week_start - INTERVAL '7 days';

    SELECT COALESCE(p.weight_unit, 'kg')
    INTO v_user_weight_unit
    FROM profiles p
    WHERE p.id = user_id_param
    LIMIT 1;

    -- Start: Calculate enhanced muscle group summary (Chunk 1.2 logic)
    WITH filtered_workouts_mg AS (
        SELECT
            w.muscle_group,
            w.exercise_name,
            w.sets,
            w.reps,
            COALESCE(w.weight, 0) AS weight,
            (w.sets * w.reps * COALESCE(w.weight, 0)) AS entry_volume,
            w.created_at
        FROM workouts w
        WHERE w.user_id = user_id_param
          AND w.created_at >= period_start_date
          AND w.muscle_group IS NOT NULL
    ),
    exercise_volumes_by_muscle_group AS (
        SELECT
            muscle_group,
            exercise_name,
            SUM(entry_volume) AS total_exercise_volume
        FROM filtered_workouts_mg
        GROUP BY muscle_group, exercise_name
    ),
    ranked_exercises_by_muscle_group AS (
        SELECT
            muscle_group,
            exercise_name,
            total_exercise_volume,
            ROW_NUMBER() OVER (PARTITION BY muscle_group ORDER BY total_exercise_volume DESC, exercise_name ASC) as rn
        FROM exercise_volumes_by_muscle_group
        WHERE total_exercise_volume > 0
    ),
    top_3_exercises_per_muscle_group_json AS (
        SELECT
            muscle_group,
            jsonb_agg(
                jsonb_build_object(
                    'exercise_name', exercise_name,
                    'exercise_volume', ROUND(total_exercise_volume, 2)
                ) ORDER BY total_exercise_volume DESC, exercise_name ASC
            ) AS top_3_array
        FROM ranked_exercises_by_muscle_group
        WHERE rn <= 3
        GROUP BY muscle_group
    ),
    aggregated_muscle_group_stats AS (
        SELECT
            fw.muscle_group,
            COALESCE(SUM(fw.sets), 0) AS total_sets,
            MAX(fw.created_at::date) AS last_trained_date,
            COALESCE(SUM(fw.entry_volume), 0) AS total_muscle_volume,
            COUNT(DISTINCT fw.exercise_name) AS distinct_exercises_count
        FROM filtered_workouts_mg fw
        GROUP BY fw.muscle_group
    ),
    final_muscle_data_for_agg AS (
       SELECT
           ags.muscle_group,
           ags.total_sets,
           ags.last_trained_date,
           ROUND(ags.total_muscle_volume, 2) as total_muscle_volume,
           ags.distinct_exercises_count,
           COALESCE(t3.top_3_array, '[]'::jsonb) AS top_3_exercises_by_volume
       FROM aggregated_muscle_group_stats ags
       LEFT JOIN top_3_exercises_per_muscle_group_json t3 ON ags.muscle_group = t3.muscle_group
    )
    SELECT COALESCE(
        jsonb_object_agg(
            fmda.muscle_group,
            jsonb_build_object(
                'total_sets', fmda.total_sets,
                'last_trained_date', TO_CHAR(fmda.last_trained_date, 'YYYY-MM-DD'),
                'total_volume', fmda.total_muscle_volume,
                'distinct_exercises_count', fmda.distinct_exercises_count,
                'top_3_exercises_by_volume', fmda.top_3_exercises_by_volume
            )
        ),
        '{}'::jsonb
    )
    INTO v_muscle_summary_data
    FROM final_muscle_data_for_agg fmda;
    -- End: Calculate enhanced muscle group summary

    -- Start: Calculate Dynamic Exercise Progression (Chunk 1.3 logic)
    WITH user_strength_workout_entries AS (
        SELECT
            w.exercise_name,
            w.created_at,
            w.sets,
            w.reps,
            COALESCE(w.weight, 0) as weight,
            (w.sets * COALESCE(w.reps, 1) * COALESCE(w.weight, 0)) as entry_volume,
            w.notes
        FROM workouts w
        WHERE w.user_id = user_id_param
          AND w.created_at >= period_start_date
          AND w.muscle_group IS NOT NULL AND w.muscle_group NOT ILIKE 'Cardio'
          AND w.exercise_name IS NOT NULL
          AND w.sets > 0 AND COALESCE(w.reps,0) > 0
    ),
    exercise_frequency AS (
        SELECT
            exercise_name,
            COUNT(DISTINCT created_at::date) as distinct_session_days,
            SUM(entry_volume) as total_volume_for_exercise_in_period,
            ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT created_at::date) DESC, SUM(entry_volume) DESC, exercise_name ASC) as frequency_rank
        FROM user_strength_workout_entries
        GROUP BY exercise_name
        HAVING COUNT(DISTINCT created_at::date) > 0
    ),
    top_n_exercises_cte AS ( 
        SELECT exercise_name, frequency_rank
        FROM exercise_frequency
        WHERE frequency_rank <= TOP_N_EXERCISES
    ),
    daily_exercise_sessions_intermediate AS (
        SELECT
            swe.exercise_name,
            swe.created_at::date AS session_date,
            swe.sets, swe.reps, swe.weight, swe.notes, swe.entry_volume,
            ROW_NUMBER() OVER (PARTITION BY swe.exercise_name, swe.created_at::date ORDER BY swe.entry_volume DESC, swe.created_at DESC) as rn_in_day
        FROM user_strength_workout_entries swe
        WHERE swe.exercise_name IN (SELECT exercise_name FROM top_n_exercises_cte)
    ),
    daily_exercise_sessions AS (
        SELECT
            dei.exercise_name,
            dei.session_date,
            SUM(dei.entry_volume) AS total_daily_volume,
            (SELECT di.sets || 'x' || di.reps || '@' || di.weight || v_user_weight_unit FROM daily_exercise_sessions_intermediate di
             WHERE di.exercise_name = dei.exercise_name AND di.session_date = dei.session_date AND di.rn_in_day = 1 LIMIT 1) as performance_string,
            (SELECT di.notes FROM daily_exercise_sessions_intermediate di
             WHERE di.exercise_name = dei.exercise_name AND di.session_date = dei.session_date AND di.rn_in_day = 1 LIMIT 1) as notes_string
        FROM daily_exercise_sessions_intermediate dei
        GROUP BY dei.exercise_name, dei.session_date
    ),
    ranked_daily_sessions AS (
        SELECT
            des.*,
            ROW_NUMBER() OVER (PARTITION BY exercise_name ORDER BY session_date DESC) as session_rank_desc,
            LAG(total_daily_volume, 1, NULL) OVER (PARTITION BY exercise_name ORDER BY session_date ASC) as prev_session_daily_volume
        FROM daily_exercise_sessions des
    ),
    last_sessions_for_exercises_json AS (
        SELECT
            exercise_name,
            jsonb_agg(
                jsonb_build_object(
                    'date', TO_CHAR(session_date, 'YYYY-MM-DD'),
                    'performance', performance_string,
                    'notes', notes_string
                ) ORDER BY session_date DESC
            ) AS last_sessions_array
        FROM ranked_daily_sessions
        WHERE session_rank_desc <= SESSIONS_FOR_PROGRESSION
        GROUP BY exercise_name
    ),
    exercise_trends AS (
        SELECT
            rs.exercise_name,
            CASE
                WHEN rs.total_daily_volume IS NULL THEN 'N/A' 
                WHEN rs.prev_session_daily_volume IS NULL THEN 'First Session' 
                WHEN rs.total_daily_volume > rs.prev_session_daily_volume THEN 'Increasing'
                WHEN rs.total_daily_volume < rs.prev_session_daily_volume THEN 'Decreasing'
                ELSE 'Stagnant'
            END AS trend
        FROM ranked_daily_sessions rs
        WHERE rs.session_rank_desc = 1 
          AND rs.exercise_name IN (SELECT exercise_name FROM top_n_exercises_cte)
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'exercise_name', tne.exercise_name,
            'frequency_rank', tne.frequency_rank,
            'last_sessions', COALESCE(lsfej.last_sessions_array, '[]'::jsonb),
            'trend', COALESCE(et.trend, 'N/A')
        ) ORDER BY tne.frequency_rank ASC
    ), '[]'::jsonb)
    INTO v_dynamic_exercise_progression
    FROM top_n_exercises_cte tne
    LEFT JOIN last_sessions_for_exercises_json lsfej ON tne.exercise_name = lsfej.exercise_name
    LEFT JOIN exercise_trends et ON tne.exercise_name = et.exercise_name;
    -- End: Calculate Dynamic Exercise Progression

    -- Start: Calculate Run Data and Workout Consistency (Chunk 1.4 logic - REFACTORED)
    WITH all_user_runs_in_period AS (
        SELECT
            usa.start_date,
            usa.name as run_name,
            usa.distance, -- in meters
            usa.moving_time, -- in seconds
            usa.total_elevation_gain,
            COALESCE(usa.type, 'Run') as type,
            (CASE WHEN usa.distance > 0 AND usa.moving_time > 0 THEN (usa.moving_time / 60.0) / (usa.distance / 1000.0) ELSE NULL END) as pace_min_per_km
        FROM user_strava_activities usa
        WHERE usa.user_id = user_id_param
          AND usa.start_date >= period_start_date
          AND COALESCE(usa.type, 'Run') = 'Run'
    ),
    overall_run_stats AS (
        SELECT
            COUNT(*) as calculated_total_run_sessions,
            AVG(distance) as calculated_avg_run_distance_meters,
            AVG(moving_time) as calculated_avg_run_duration_seconds
        FROM all_user_runs_in_period
    ),
    recent_runs_details_json AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'run_date', TO_CHAR(ar.start_date::date, 'YYYY-MM-DD'),
                    'name', ar.run_name,
                    'distance_km', ROUND((COALESCE(ar.distance,0) / 1000.0)::numeric, 2),
                    'duration_min', ROUND((COALESCE(ar.moving_time,0) / 60.0)::numeric, 1),
                    'avg_pace_min_km',
                        CASE
                            WHEN ar.pace_min_per_km IS NOT NULL THEN
                               TRIM(TO_CHAR(FLOOR(ar.pace_min_per_km), '00')) || ':' || TRIM(TO_CHAR(FLOOR(MOD((ar.pace_min_per_km * 60)::numeric, 60)), '00'))
                            ELSE 'N/A'
                        END,
                    'elevation_gain_m', ROUND(COALESCE(ar.total_elevation_gain,0)::numeric, 0),
                    'run_type', ar.type
                ) ORDER BY ar.start_date DESC
            ),
            '[]'::jsonb
        ) as calculated_last_3_runs
        FROM (
            SELECT * FROM all_user_runs_in_period ORDER BY start_date DESC LIMIT NUM_RECENT_RUNS_FOR_LIST
        ) ar
    ),
    run_pace_trend_parts AS (
        SELECT
            AVG(CASE WHEN aurip.start_date >= mid_period_date THEN aurip.pace_min_per_km ELSE NULL END) as avg_pace_recent_half,
            AVG(CASE WHEN aurip.start_date < mid_period_date THEN aurip.pace_min_per_km ELSE NULL END) as avg_pace_older_half
        FROM all_user_runs_in_period aurip
        WHERE aurip.pace_min_per_km IS NOT NULL
    )
    SELECT
        COALESCE(ors.calculated_total_run_sessions, 0),
        ors.calculated_avg_run_distance_meters,
        ors.calculated_avg_run_duration_seconds,
        rrdj.calculated_last_3_runs,
        CASE
            WHEN rptp.avg_pace_recent_half IS NULL AND rptp.avg_pace_older_half IS NULL THEN 'No Pace Data'
            WHEN rptp.avg_pace_recent_half IS NULL THEN 'No Recent Pace Data'
            WHEN rptp.avg_pace_older_half IS NULL THEN 'No Older Pace Data for Comparison'
            WHEN rptp.avg_pace_recent_half < rptp.avg_pace_older_half THEN 'Faster'
            WHEN rptp.avg_pace_recent_half > rptp.avg_pace_older_half THEN 'Slower'
            ELSE 'Consistent'
        END as calculated_recent_run_pace_trend
    INTO
        v_total_run_sessions,
        v_avg_run_distance_meters,
        v_avg_run_duration_seconds,
        v_last_3_runs,
        v_recent_run_pace_trend
    FROM
        overall_run_stats ors,
        recent_runs_details_json rrdj,
        run_pace_trend_parts rptp;

    -- Workout consistency logic (remains unchanged from user's version)
    SELECT COUNT(DISTINCT w.created_at::date)
    INTO v_workout_days_this_week
    FROM workouts w
    WHERE w.user_id = user_id_param
      AND w.created_at >= current_week_start
      AND w.created_at < (current_week_start + INTERVAL '1 week');

    SELECT COUNT(DISTINCT w.created_at::date)
    INTO v_workout_days_last_week
    FROM workouts w
    WHERE w.user_id = user_id_param
      AND w.created_at >= last_week_start
      AND w.created_at < current_week_start;
    -- End: Calculate Run Data and Workout Consistency

    SELECT COUNT(DISTINCT DATE(w.created_at))
    INTO v_total_workout_sessions
    FROM workouts w
    WHERE w.user_id = user_id_param
      AND w.created_at >= period_start_date;

    SELECT ROUND(AVG(daily_duration.total_duration_per_day)::numeric, 1)
    INTO v_avg_workout_duration_minutes
    FROM (
        SELECT SUM(w.duration) as total_duration_per_day
        FROM workouts w
        WHERE w.user_id = user_id_param
          AND w.created_at >= period_start_date
        GROUP BY DATE(w.created_at)
    ) daily_duration;

    result_summary := jsonb_build_object(
        'total_workout_sessions', v_total_workout_sessions,
        'total_run_sessions', COALESCE(v_total_run_sessions, 0),
        'avg_workout_duration_minutes', v_avg_workout_duration_minutes,
        'avg_run_distance_meters', ROUND(COALESCE(v_avg_run_distance_meters, 0)::numeric, 0),
        'avg_run_duration_seconds', ROUND(COALESCE(v_avg_run_duration_seconds, 0)::numeric, 0),
        'muscle_group_summary', v_muscle_summary_data,
        'dynamic_exercise_progression', v_dynamic_exercise_progression,
        'last_3_runs', v_last_3_runs,
        'recent_run_pace_trend', COALESCE(v_recent_run_pace_trend, 'N/A'),
        'workout_days_this_week', v_workout_days_this_week,
        'workout_days_last_week', v_workout_days_last_week
    );

    RETURN result_summary;

END;
$$ LANGUAGE plpgsql STABLE;

-- To deploy this to Supabase, you would run this SQL in the Supabase SQL Editor. 