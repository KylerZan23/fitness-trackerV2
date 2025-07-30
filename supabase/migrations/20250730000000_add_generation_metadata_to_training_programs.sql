-- Migration: Add generation_metadata column to training_programs table
-- This column stores enhanced metadata about the AI program generation process

-- Add the generation_metadata column
ALTER TABLE public.training_programs
ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

-- Add the volume_landmarks column (also referenced in the code)
ALTER TABLE public.training_programs
ADD COLUMN IF NOT EXISTS volume_landmarks JSONB;

-- Add the weak_point_analysis column (also referenced in the code)
ALTER TABLE public.training_programs
ADD COLUMN IF NOT EXISTS weak_point_analysis JSONB;

-- Add the periodization_model column (also referenced in the code)
ALTER TABLE public.training_programs
ADD COLUMN IF NOT EXISTS periodization_model TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN public.training_programs.generation_metadata IS 'Enhanced metadata about the AI program generation process including attempts, complexity, validation notes, and processing details';
COMMENT ON COLUMN public.training_programs.volume_landmarks IS 'Array of muscle groups with calculated volume landmarks for scientific programming';
COMMENT ON COLUMN public.training_programs.weak_point_analysis IS 'JSON object containing analysis of user weak points for targeted programming';
COMMENT ON COLUMN public.training_programs.periodization_model IS 'The specific periodization model selected for this program (e.g., "Hypertrophy-Focused Block Periodization")';

-- Create GIN index on generation_metadata for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_training_programs_generation_metadata_gin 
ON public.training_programs USING GIN(generation_metadata);

-- Create GIN index on weak_point_analysis for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_training_programs_weak_point_analysis_gin 
ON public.training_programs USING GIN(weak_point_analysis);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to add generation metadata columns to training_programs table completed successfully.';
END $$; 