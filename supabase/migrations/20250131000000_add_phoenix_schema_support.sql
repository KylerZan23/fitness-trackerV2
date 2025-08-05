-- Migration: Add Phoenix Schema support to training_programs table
-- File: 20250131000000_add_phoenix_schema_support.sql
-- This migration enhances the training_programs table to fully support the new Phoenix schema
-- and adds performance optimizations for the AI generation pipeline

-- Ensure program_details can handle Phoenix schema (should already be JSONB)
ALTER TABLE public.training_programs 
ALTER COLUMN program_details TYPE JSONB USING program_details::JSONB;

-- Add Phoenix-specific metadata fields to generation_metadata
-- These will be used by the new generation pipeline
DO $$
BEGIN
  -- Add phoenix_schema_version field if it doesn't exist in existing metadata
  UPDATE public.training_programs 
  SET generation_metadata = COALESCE(generation_metadata, '{}'::jsonb) || 
      '{"phoenix_schema_version": "1.0"}'::jsonb
  WHERE generation_metadata IS NULL 
     OR NOT (generation_metadata ? 'phoenix_schema_version');
END $$;

-- Add performance indexes for Phoenix schema queries
CREATE INDEX IF NOT EXISTS idx_training_programs_active 
ON public.training_programs (user_id, is_active) 
WHERE is_active = true;

-- Add index for program_details JSONB queries (for Phoenix schema)
CREATE INDEX IF NOT EXISTS idx_training_programs_program_details_gin 
ON public.training_programs USING GIN (program_details);

-- Add index for efficient program lookup by user and creation date
CREATE INDEX IF NOT EXISTS idx_training_programs_user_created 
ON public.training_programs (user_id, created_at DESC);

-- Add index for generation status queries
CREATE INDEX IF NOT EXISTS idx_training_programs_generation_status 
ON public.training_programs (generation_status) 
WHERE generation_status IS NOT NULL;

-- Add column comments for Phoenix schema documentation
COMMENT ON COLUMN public.training_programs.program_details IS 'Stores the complete Phoenix schema training program with hierarchical structure (phases, weeks, days, exercises)';
COMMENT ON COLUMN public.training_programs.generation_metadata IS 'Enhanced metadata including Phoenix pipeline statistics, validation results, and generation metrics';

-- Add a function to validate Phoenix schema structure
CREATE OR REPLACE FUNCTION validate_phoenix_schema(program_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for required top-level fields
  IF NOT (program_data ? 'programName' AND 
          program_data ? 'durationWeeksTotal' AND 
          program_data ? 'phases') THEN
    RETURN FALSE;
  END IF;
  
  -- Check that phases is an array
  IF jsonb_typeof(program_data->'phases') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check that phases array is not empty
  IF jsonb_array_length(program_data->'phases') = 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a trigger to validate Phoenix schema on insert/update
CREATE OR REPLACE FUNCTION validate_training_program_schema()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if program_details is not null
  IF NEW.program_details IS NOT NULL THEN
    IF NOT validate_phoenix_schema(NEW.program_details) THEN
      RAISE EXCEPTION 'Invalid Phoenix schema structure in program_details';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_validate_training_program_schema ON public.training_programs;
CREATE TRIGGER trigger_validate_training_program_schema
  BEFORE INSERT OR UPDATE ON public.training_programs
  FOR EACH ROW
  EXECUTE FUNCTION validate_training_program_schema();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration to add Phoenix Schema support to training_programs table completed successfully.';
  RAISE NOTICE 'Added performance indexes and schema validation for Phoenix generation pipeline.';
END $$; 