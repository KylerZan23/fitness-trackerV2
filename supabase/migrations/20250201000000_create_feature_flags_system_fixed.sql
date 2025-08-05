-- Migration: Create Feature Flags System for Phoenix Pipeline Rollout (FIXED)
-- This migration creates the infrastructure for feature flagging to enable safe rollout
-- of the new Phoenix generation pipeline alongside the existing legacy system.
-- FIXED: Uses email-based admin detection instead of is_admin column

--------------------------------------------------
-- 1. Feature Flags Table
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag identification
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Flag configuration
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 
        CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Admin overrides (NULL means no override)
    admin_override_enabled BOOLEAN DEFAULT NULL,
    admin_override_disabled BOOLEAN DEFAULT NULL,
    
    -- Additional configuration
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add table comments
COMMENT ON TABLE public.feature_flags IS 'Stores feature flag configurations for gradual rollouts';
COMMENT ON COLUMN public.feature_flags.flag_name IS 'Unique identifier for the feature flag';
COMMENT ON COLUMN public.feature_flags.rollout_percentage IS 'Percentage of users who should see this feature (0-100)';
COMMENT ON COLUMN public.feature_flags.admin_override_enabled IS 'Admin override to force enable for all users';
COMMENT ON COLUMN public.feature_flags.admin_override_disabled IS 'Admin override to force disable for all users';
COMMENT ON COLUMN public.feature_flags.metadata IS 'Additional configuration data for the feature flag';

--------------------------------------------------
-- 2. User Feature Overrides Table
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_feature_overrides (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and flag identification
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_name VARCHAR(100) NOT NULL,
    
    -- Override configuration
    is_enabled BOOLEAN NOT NULL,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ensure one override per user per flag
    UNIQUE(user_id, flag_name)
);

-- Add table comments
COMMENT ON TABLE public.user_feature_overrides IS 'User-specific feature flag overrides';
COMMENT ON COLUMN public.user_feature_overrides.reason IS 'Reason for the override (e.g., beta tester, bug report)';
COMMENT ON COLUMN public.user_feature_overrides.expires_at IS 'When this override expires (NULL for permanent)';

--------------------------------------------------
-- 3. Indexes for Performance
--------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON public.feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_rollout_percentage ON public.feature_flags(rollout_percentage);

CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_user_flag ON public.user_feature_overrides(user_id, flag_name);
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_flag_name ON public.user_feature_overrides(flag_name);
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_expires_at ON public.user_feature_overrides(expires_at) WHERE expires_at IS NOT NULL;

--------------------------------------------------
-- 4. Update Trigger Function
--------------------------------------------------
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for feature_flags table
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

--------------------------------------------------
-- 5. Helper function to check if user is admin
--------------------------------------------------
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the user's email from profiles table
    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = user_id;
    
    -- Check if email ends with @neurallift.ai or is in admin list
    RETURN (
        user_email LIKE '%@neurallift.ai' OR
        user_email IN ('admin@example.com') -- Add specific admin emails here
    );
END;
$$;

COMMENT ON FUNCTION is_user_admin IS 'Determines if a user has admin privileges based on email domain';

--------------------------------------------------
-- 6. Row Level Security (RLS)
--------------------------------------------------
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Feature flags policies (read-only for authenticated users, admin-only write)
CREATE POLICY "Authenticated users can read feature flags"
    ON public.feature_flags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify feature flags"
    ON public.feature_flags FOR ALL
    TO authenticated
    USING (is_user_admin(auth.uid()));

-- User overrides policies (users can read their own, admins can read all)
CREATE POLICY "Users can read their own feature overrides"
    ON public.user_feature_overrides FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can read all feature overrides"
    ON public.user_feature_overrides FOR SELECT
    TO authenticated
    USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can manage all feature overrides"
    ON public.user_feature_overrides FOR ALL
    TO authenticated
    USING (is_user_admin(auth.uid()));

--------------------------------------------------
-- 7. Utility Functions
--------------------------------------------------

-- Function to check if a feature is enabled for a user
CREATE OR REPLACE FUNCTION is_feature_enabled_for_user(
    p_user_id UUID,
    p_flag_name VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    flag_config RECORD;
    user_override RECORD;
    user_hash INTEGER;
BEGIN
    -- First, check for user-specific override
    SELECT * INTO user_override
    FROM public.user_feature_overrides
    WHERE user_id = p_user_id 
    AND flag_name = p_flag_name
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF FOUND THEN
        RETURN user_override.is_enabled;
    END IF;
    
    -- Get the feature flag configuration
    SELECT * INTO flag_config
    FROM public.feature_flags
    WHERE flag_name = p_flag_name;
    
    IF NOT FOUND THEN
        -- Flag doesn't exist, default to disabled
        RETURN FALSE;
    END IF;
    
    -- Check admin overrides
    IF flag_config.admin_override_enabled = TRUE THEN
        RETURN TRUE;
    END IF;
    
    IF flag_config.admin_override_disabled = TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if flag is globally enabled
    IF NOT flag_config.is_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- Apply percentage rollout
    IF flag_config.rollout_percentage = 0 THEN
        RETURN FALSE;
    END IF;
    
    IF flag_config.rollout_percentage = 100 THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate user hash for consistent percentage rollout
    user_hash := (
        ('x' || RIGHT(MD5(p_user_id::TEXT || 'phoenix_pipeline_salt'), 8))::BIT(32)::INTEGER
    ) % 100;
    
    RETURN user_hash < flag_config.rollout_percentage;
END;
$$;

COMMENT ON FUNCTION is_feature_enabled_for_user IS 'Determines if a feature flag is enabled for a specific user';

--------------------------------------------------
-- 8. Initial Feature Flags
--------------------------------------------------

-- Insert the Phoenix pipeline feature flag
INSERT INTO public.feature_flags (
    flag_name,
    description,
    is_enabled,
    rollout_percentage,
    metadata
) VALUES (
    'phoenix_pipeline_enabled',
    'Enable the new Phoenix generation pipeline for AI program generation',
    FALSE,
    0,
    '{"created_for": "Phoenix pipeline rollout", "documentation": "docs/adr/ADR-074-phoenix-pipeline-feature-flagging.md"}'::jsonb
) ON CONFLICT (flag_name) DO NOTHING;

-- Insert additional development/testing flags
INSERT INTO public.feature_flags (
    flag_name,
    description,
    is_enabled,
    rollout_percentage,
    metadata
) VALUES (
    'phoenix_pipeline_internal_testing',
    'Enable Phoenix pipeline for internal team members only',
    FALSE,
    0,
    '{"internal_only": true, "team": "neurallift"}'::jsonb
) ON CONFLICT (flag_name) DO NOTHING;

--------------------------------------------------
-- 9. Grant Necessary Permissions
--------------------------------------------------

-- Grant execute permission on the utility functions to authenticated users
GRANT EXECUTE ON FUNCTION is_feature_enabled_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;

-- Ensure proper access to tables for authenticated users
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT SELECT ON public.user_feature_overrides TO authenticated;

--------------------------------------------------
-- 10. Log completion
--------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'Feature Flags system migration completed successfully!';
  RAISE NOTICE 'Created tables: feature_flags, user_feature_overrides';
  RAISE NOTICE 'Created functions: is_feature_enabled_for_user, is_user_admin';
  RAISE NOTICE 'Initial flags: phoenix_pipeline_enabled, phoenix_pipeline_internal_testing';
END $$;