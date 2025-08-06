-- Pre-Decommissioning Cleanup: Removing foreign key dependencies to training_programs
-- From ai_feedback_tables
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'ai_feedback_tables_program_id_fkey' AND table_name = 'ai_feedback_tables'
) THEN
ALTER TABLE public.ai_feedback_tables DROP CONSTRAINT ai_feedback_tables_program_id_fkey;
END IF;
END $$;

-- From workout_groups (this may have been handled elsewhere, but this ensures it's gone)
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'fk_workout_groups_linked_program' AND table_name = 'workout_groups'
) THEN
ALTER TABLE public.workout_groups DROP CONSTRAINT fk_workout_groups_linked_program;
END IF;
END $$;
