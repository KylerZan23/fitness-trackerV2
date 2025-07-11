-- Migration: Add missing profile columns for AI program generation
-- This migration adds `primary_training_focus` and `experience_level` to the profiles table,
-- which are critical for the AI program generation and were missed in previous migrations.

-- Add primary_training_focus column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_training_focus TEXT;

COMMENT ON COLUMN public.profiles.primary_training_focus
IS 'The user''s primary training focus, derived from their main fitness goal (e.g., "Strength Training", "Hypertrophy", "General Fitness").';

-- Add experience_level column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT;

COMMENT ON COLUMN public.profiles.experience_level
IS 'The user''s self-reported training experience level (e.g., "Beginner", "Intermediate", "Advanced").';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_primary_training_focus ON public.profiles(primary_training_focus);
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON public.profiles(experience_level);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to add missing profile columns completed successfully.';
END $$; 