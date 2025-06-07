-- Migration: Create AI feedback tables for training programs and coach recommendations
-- This allows users to provide feedback on AI-generated content for quality improvement

-- Create ai_program_feedback table
CREATE TABLE IF NOT EXISTS public.ai_program_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ai_program_feedback
CREATE INDEX IF NOT EXISTS idx_ai_program_feedback_user_id ON public.ai_program_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_program_feedback_program_id ON public.ai_program_feedback(program_id);
CREATE INDEX IF NOT EXISTS idx_ai_program_feedback_created_at ON public.ai_program_feedback(created_at);

-- Enable RLS for ai_program_feedback
ALTER TABLE public.ai_program_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_program_feedback
CREATE POLICY "Users can manage their own program feedback"
    ON public.ai_program_feedback
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add table comment
COMMENT ON TABLE public.ai_program_feedback IS 'Stores user feedback for specific AI-generated training programs.';

-- Create ai_coach_feedback table
CREATE TABLE IF NOT EXISTS public.ai_coach_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_cache_key TEXT REFERENCES public.ai_coach_cache(cache_key) ON DELETE SET NULL, -- Link to cached recommendation if possible
    recommendation_content_hash TEXT, -- Fallback: Hash of the recommendation content if not from cache or cache key changes
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ai_coach_feedback
CREATE INDEX IF NOT EXISTS idx_ai_coach_feedback_user_id ON public.ai_coach_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_feedback_recommendation_cache_key ON public.ai_coach_feedback(recommendation_cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_coach_feedback_created_at ON public.ai_coach_feedback(created_at);

-- Enable RLS for ai_coach_feedback
ALTER TABLE public.ai_coach_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_coach_feedback
CREATE POLICY "Users can manage their own coach feedback"
    ON public.ai_coach_feedback
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add table comment
COMMENT ON TABLE public.ai_coach_feedback IS 'Stores user feedback for AI Coach recommendations.';

-- Add constraint to ensure at least one of cache_key or content_hash is provided
ALTER TABLE public.ai_coach_feedback 
ADD CONSTRAINT chk_ai_coach_feedback_has_reference 
CHECK (
    recommendation_cache_key IS NOT NULL OR 
    recommendation_content_hash IS NOT NULL
);

-- Add column comments for documentation
COMMENT ON COLUMN public.ai_program_feedback.rating IS 'User rating from 1-5 stars for the AI-generated training program';
COMMENT ON COLUMN public.ai_program_feedback.comment IS 'Optional user comment providing detailed feedback';

COMMENT ON COLUMN public.ai_coach_feedback.recommendation_cache_key IS 'Reference to the cached AI Coach recommendation (if available)';
COMMENT ON COLUMN public.ai_coach_feedback.recommendation_content_hash IS 'Hash of recommendation content as fallback identifier';
COMMENT ON COLUMN public.ai_coach_feedback.rating IS 'User rating from 1-5 stars for the AI Coach recommendation';
COMMENT ON COLUMN public.ai_coach_feedback.comment IS 'Optional user comment providing detailed feedback'; 