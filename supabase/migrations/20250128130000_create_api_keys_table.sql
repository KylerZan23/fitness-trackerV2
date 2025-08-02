-- Migration: Create api_keys table for trainer API authentication
-- This table manages API keys for external trainer integrations

CREATE TABLE IF NOT EXISTS public.api_keys (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- API key identifier (hashed for security)
    key_hash TEXT UNIQUE NOT NULL,
    
    -- Human-readable name for the API key
    name TEXT NOT NULL,
    
    -- Optional description/purpose of the key
    description TEXT,
    
    -- Key prefix for identification (first 8 characters of the key)
    key_prefix TEXT NOT NULL,
    
    -- Scopes/permissions for this API key
    scopes JSONB NOT NULL DEFAULT '["program:generate"]'::jsonb,
    
    -- Rate limiting configuration
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
    rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
    
    -- Usage tracking
    total_requests INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status management
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_info JSONB, -- Store client application info
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.api_keys IS 'Manages API keys for external trainer integrations';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 8 characters of the API key for identification';
COMMENT ON COLUMN public.api_keys.scopes IS 'Array of permissions/scopes for this API key';
COMMENT ON COLUMN public.api_keys.rate_limit_per_hour IS 'Maximum requests allowed per hour';
COMMENT ON COLUMN public.api_keys.rate_limit_per_day IS 'Maximum requests allowed per day';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON public.api_keys(created_by);

-- Create rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    response_status INTEGER,
    response_time_ms INTEGER,
    request_ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for usage tracking
COMMENT ON TABLE public.api_key_usage IS 'Tracks API key usage for rate limiting and analytics';

-- Create indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON public.api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_request_timestamp ON public.api_key_usage(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_endpoint ON public.api_key_usage(endpoint);

-- Create function to clean up old usage records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_api_key_usage()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.api_key_usage 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Enable Row Level Security (RLS) 
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admin users can manage API keys
-- Note: This assumes a future admin role system. For now, restrict to service role only.
CREATE POLICY "Service role can manage API keys"
    ON public.api_keys
    FOR ALL
    TO service_role;

-- RLS Policy: Service role can access usage data
CREATE POLICY "Service role can manage API key usage"
    ON public.api_key_usage
    FOR ALL
    TO service_role;

-- Create a view for API key statistics (without exposing sensitive data)
CREATE OR REPLACE VIEW public.api_key_stats AS
SELECT 
    ak.id,
    ak.name,
    ak.description,
    ak.key_prefix,
    ak.scopes,
    ak.is_active,
    ak.total_requests,
    ak.last_used_at,
    ak.created_at,
    COUNT(aku.id) FILTER (WHERE aku.request_timestamp >= NOW() - INTERVAL '1 hour') as requests_last_hour,
    COUNT(aku.id) FILTER (WHERE aku.request_timestamp >= NOW() - INTERVAL '24 hours') as requests_last_24h,
    COUNT(aku.id) FILTER (WHERE aku.request_timestamp >= NOW() - INTERVAL '7 days') as requests_last_7d
FROM public.api_keys ak
LEFT JOIN public.api_key_usage aku ON ak.id = aku.api_key_id
GROUP BY ak.id, ak.name, ak.description, ak.key_prefix, ak.scopes, ak.is_active, 
         ak.total_requests, ak.last_used_at, ak.created_at;

COMMENT ON VIEW public.api_key_stats IS 'Provides API key usage statistics without exposing sensitive key data';