-- Migration: Add program linking columns to workout_groups table
-- This allows linking logged workout groups back to specific parts of AI-generated training programs

-- Add the new columns to workout_groups table
ALTER TABLE public.workout_groups 
ADD COLUMN IF NOT EXISTS linked_program_id UUID,
ADD COLUMN IF NOT EXISTS linked_program_phase_index INTEGER,
ADD COLUMN IF NOT EXISTS linked_program_week_index INTEGER,
ADD COLUMN IF NOT EXISTS linked_program_day_of_week INTEGER;

-- Add foreign key constraint for linked_program_id
ALTER TABLE public.workout_groups 
ADD CONSTRAINT fk_workout_groups_linked_program 
FOREIGN KEY (linked_program_id) 
REFERENCES public.training_programs(id) 
ON DELETE SET NULL;

-- Add check constraints for the index fields to ensure valid values
ALTER TABLE public.workout_groups 
ADD CONSTRAINT chk_workout_groups_phase_index 
CHECK (linked_program_phase_index IS NULL OR linked_program_phase_index >= 0);

ALTER TABLE public.workout_groups 
ADD CONSTRAINT chk_workout_groups_week_index 
CHECK (linked_program_week_index IS NULL OR linked_program_week_index >= 0);

ALTER TABLE public.workout_groups 
ADD CONSTRAINT chk_workout_groups_day_of_week 
CHECK (linked_program_day_of_week IS NULL OR (linked_program_day_of_week >= 1 AND linked_program_day_of_week <= 7));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workout_groups_linked_program_id 
ON public.workout_groups(linked_program_id);

CREATE INDEX IF NOT EXISTS idx_workout_groups_program_context 
ON public.workout_groups(linked_program_id, linked_program_phase_index, linked_program_week_index, linked_program_day_of_week);

-- Add column comments for documentation
COMMENT ON COLUMN public.workout_groups.linked_program_id IS 'Optional link to the AI-generated training program this workout group was logged against';
COMMENT ON COLUMN public.workout_groups.linked_program_phase_index IS 'Zero-based index of the program phase this workout corresponds to (if linked to a program)';
COMMENT ON COLUMN public.workout_groups.linked_program_week_index IS 'Zero-based index of the week within the phase this workout corresponds to (if linked to a program)';
COMMENT ON COLUMN public.workout_groups.linked_program_day_of_week IS 'Day of week (1-7, Monday=1, Sunday=7) matching DayOfWeek enum for the planned workout day (if linked to a program)';

-- Add table comment to document the linking feature
COMMENT ON TABLE public.workout_groups IS 'Stores logged workout groups with optional linking to specific days in AI-generated training programs for adherence tracking'; 