-- Migration: Add Pro Tier to Subscription System
-- This migration expands the binary subscription system to include Standard and Pro tiers

--------------------------------------------------
-- 1. Add subscription_tier column to profiles table
--------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'trial' 
CHECK (subscription_tier IN ('trial', 'standard', 'pro'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_tier IS 'Subscription tier: trial (7-day free trial), standard (basic premium), pro (advanced features)';

--------------------------------------------------
-- 2. Update existing users based on current premium status
--------------------------------------------------
-- Map existing premium users to standard tier
-- Trial users remain as trial
-- Only run if the required columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
        UPDATE public.profiles 
        SET subscription_tier = CASE 
          WHEN is_premium = true THEN 'standard'
          WHEN trial_ends_at IS NOT NULL AND trial_ends_at > NOW() THEN 'trial'
          ELSE 'trial'
        END
        WHERE subscription_tier = 'trial'; -- Only update if not already set
    END IF;
END $$;

--------------------------------------------------
-- 3. Create index for efficient subscription tier queries
--------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

--------------------------------------------------
-- 4. Update helper functions for multi-tier support
--------------------------------------------------
-- Update existing function to support Pro tier
-- Only create if the required columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
        EXECUTE 'CREATE OR REPLACE FUNCTION has_active_access(user_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_record RECORD;
        BEGIN
            -- Get user''s subscription status
            SELECT is_premium, trial_ends_at, subscription_tier
            INTO user_record
            FROM profiles
            WHERE id = user_id;

            -- Return true if:
            -- 1. User has premium subscription (standard or pro)
            -- 2. User has active trial
            RETURN (
                user_record.is_premium = true OR 
                user_record.subscription_tier IN (''standard'', ''pro'') OR
                (user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW())
            );
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER';
    END IF;
END $$;

-- Create new function to check Pro tier access specifically
CREATE OR REPLACE FUNCTION has_pro_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR(20);
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier
    INTO user_tier
    FROM profiles
    WHERE id = user_id;

    -- Return true only if user has Pro tier
    RETURN (user_tier = 'pro');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    user_tier VARCHAR(20);
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier
    INTO user_tier
    FROM profiles
    WHERE id = user_id;

    -- Return tier or 'trial' as default
    RETURN COALESCE(user_tier, 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------
-- 5. Create materialized view for advanced analytics (Pro feature)
--------------------------------------------------
-- This view aggregates workout data for advanced analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_advanced_analytics AS
SELECT 
  w.user_id,
  DATE_TRUNC('week', w.created_at) as week_start,
  w.muscle_group,
  -- Volume metrics by muscle group per week
  SUM(w.sets * w.reps * COALESCE(w.weight, 0)) as weekly_volume,
  AVG(COALESCE(w.weight, 0)) as avg_weight,
  MAX(COALESCE(w.weight, 0)) as max_weight,
  COUNT(*) as exercise_count,
  COUNT(DISTINCT w.exercise_name) as unique_exercises,
  -- Training frequency
  COUNT(DISTINCT w.created_at::date) as training_days_in_week,
  -- PR tracking data (focus on strength training)
  MAX(CASE WHEN w.sets <= 5 AND w.reps <= 5 AND w.weight > 0 THEN w.weight END) as max_strength_weight,
  -- Volume progression data
  SUM(w.sets) as total_sets,
  SUM(w.sets * w.reps) as total_reps
FROM public.workouts w
WHERE w.created_at >= NOW() - INTERVAL '1 year'
  AND w.muscle_group IS NOT NULL
  AND w.muscle_group NOT ILIKE 'Cardio'
GROUP BY w.user_id, DATE_TRUNC('week', w.created_at), w.muscle_group;

-- Create indexes for efficient Pro analytics queries
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_user_week 
ON public.user_advanced_analytics(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_advanced_analytics_user_muscle_week 
ON public.user_advanced_analytics(user_id, muscle_group, week_start);

-- Note: RLS is not supported on materialized views, so we skip this
-- ALTER TABLE public.user_advanced_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own analytics data
CREATE POLICY "Users can view own advanced analytics"
  ON public.user_advanced_analytics FOR SELECT
  USING (auth.uid() = user_id);

--------------------------------------------------
-- 6. Create function to refresh advanced analytics
--------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_advanced_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.user_advanced_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_advanced_analytics() TO authenticated;

--------------------------------------------------
-- 7. Add comments for documentation
--------------------------------------------------
COMMENT ON MATERIALIZED VIEW public.user_advanced_analytics IS 'Pre-computed analytics data for Pro tier users - refreshed weekly';
COMMENT ON FUNCTION has_pro_access(UUID) IS 'Check if user has Pro tier subscription access';
COMMENT ON FUNCTION get_user_subscription_tier(UUID) IS 'Get user subscription tier (trial, standard, pro)';
COMMENT ON FUNCTION refresh_advanced_analytics() IS 'Refresh materialized view for advanced analytics (Pro feature)';

--------------------------------------------------
-- 8. Set up automatic refresh of analytics (optional - for production)
--------------------------------------------------
-- Note: This would typically be set up as a cron job or scheduled task
-- For now, we'll refresh manually or via application logic