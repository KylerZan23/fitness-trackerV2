-- Add free trial flag to training_programs table
ALTER TABLE public.training_programs
ADD COLUMN is_free_trial BOOLEAN DEFAULT FALSE NOT NULL;
