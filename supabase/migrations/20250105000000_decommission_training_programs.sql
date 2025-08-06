-- Resilient Decommissioning Migration for AI Training Program Feature

-- Step 1: Drop the main training_programs table if it exists.
-- All dependent objects like triggers, constraints, and indexes will be dropped automatically.
DROP TABLE IF EXISTS public.training_programs CASCADE;

-- Step 2: Drop the ai_program_feedback table if it exists.
DROP TABLE IF EXISTS public.ai_program_feedback CASCADE;

-- Step 3: Clean up potentially orphaned functions.
-- These functions would be dropped by the CASCADE above, but we clean them up explicitly
-- in case they were created but the table was not.
DROP FUNCTION IF EXISTS public.update_training_programs_updated_at();
DROP FUNCTION IF EXISTS public.extract_training_program_fields();

-- Step 4: Clean up columns from workout_groups if they exist.
ALTER TABLE public.workout_groups
DROP COLUMN IF EXISTS linked_program_id,
DROP COLUMN IF EXISTS linked_program_phase_index,
DROP COLUMN IF EXISTS linked_program_week_index,
DROP COLUMN IF EXISTS linked_program_day_of_week;