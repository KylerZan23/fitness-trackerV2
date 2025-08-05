-- Migration: Add Phoenix Schema support to training_programs table
-- File: 20250804222401_add_phoenix_schema_support.sql

-- Add generation metadata column for pipeline statistics
ALTER TABLE training_programs 
ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

-- Ensure program_details can handle Phoenix schema (should already be JSONB)
ALTER TABLE training_programs 
ALTER COLUMN program_details TYPE JSONB USING program_details::JSONB;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_generation_metadata 
ON training_programs USING GIN (generation_metadata);

CREATE INDEX IF NOT EXISTS idx_training_programs_active 
ON training_programs (user_id, is_active) 
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN training_programs.generation_metadata IS 'Stores Phoenix pipeline generation statistics and validation results';