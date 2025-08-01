-- Migration: Add generation status tracking to training_programs table
-- This enables background program generation with status tracking

ALTER TABLE public.training_programs
ADD COLUMN generation_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE public.training_programs
ADD COLUMN generation_error TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.training_programs.generation_status IS 'Status of program generation process: pending, processing, completed, or failed';
COMMENT ON COLUMN public.training_programs.generation_error IS 'Error message if generation failed, null otherwise';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_training_programs_generation_status 
ON public.training_programs(generation_status);

CREATE INDEX IF NOT EXISTS idx_training_programs_user_status 
ON public.training_programs(user_id, generation_status);

RAISE NOTICE 'Migration to add generation status columns to training_programs table completed successfully.';