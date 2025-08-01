-- Create ai_coach_cache table for caching AI recommendations
CREATE TABLE IF NOT EXISTS public.ai_coach_cache (
    cache_key TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation JSONB NOT NULL,
    hashed_data_input TEXT, -- Hash of the input data used to generate the recommendation
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL -- Timestamp for when the cache entry should be considered stale
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_coach_cache_user_id_expires_at ON public.ai_coach_cache (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_coach_cache_hashed_data_input ON public.ai_coach_cache (hashed_data_input);

-- Enable RLS
ALTER TABLE public.ai_coach_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to access only their own cache entries
CREATE POLICY "Users can access their own cache entries" ON public.ai_coach_cache
    FOR ALL USING (auth.uid() = user_id); 