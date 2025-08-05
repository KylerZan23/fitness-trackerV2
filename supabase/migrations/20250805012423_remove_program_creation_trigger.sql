-- Remove the problematic trigger and function that reference the non-existent "secrets" schema
DROP TRIGGER IF EXISTS on_program_created_trigger ON public.training_programs;
DROP FUNCTION IF EXISTS public.log_program_creation();
